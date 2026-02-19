#!/usr/bin/env python3
"""Entrena un clasificador sin depender de pandas.
Uso:
  python ml_pipeline/train_classifier_no_pandas.py --embeddings ml_pipeline/text_embeddings.npz --labels ml_pipeline/processed/labels.csv --model-out ml_pipeline/model_text_no_pandas.joblib
"""
import argparse
import numpy as np
import csv
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import joblib
from pathlib import Path


def train(emb_path: Path, labels_csv: Path, model_out: Path):
    data = np.load(emb_path, allow_pickle=True)
    embeddings = data['embeddings']
    filenames = [x.decode('utf-8') if hasattr(x, 'decode') else x for x in data['filenames']]

    # load labels.csv
    label_map = {}
    with labels_csv.open('r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            label_map[row['filename']] = row['label']

    labels = []
    for fn in filenames:
        if fn not in label_map:
            raise RuntimeError(f'Missing label for filename: {fn}')
        labels.append(label_map[fn])

    y = np.array(labels)
    X = embeddings

    # Only stratify if every class has at least 2 samples
    from collections import Counter
    counts = Counter(y)
    stratify_arg = y if min(counts.values()) >= 2 else None
    if stratify_arg is None:
        print('Not enough samples per class for stratified split; using random split instead')

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=stratify_arg, random_state=42)

    clf = LogisticRegression(max_iter=1000)
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    print(classification_report(y_test, preds))

    joblib.dump(clf, model_out)
    print(f"Saved model -> {model_out}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--embeddings', required=True)
    parser.add_argument('--labels', required=True)
    parser.add_argument('--model-out', required=True)
    args = parser.parse_args()

    train(Path(args.embeddings), Path(args.labels), Path(args.model_out))
