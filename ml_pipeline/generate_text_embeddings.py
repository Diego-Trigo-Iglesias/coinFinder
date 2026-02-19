#!/usr/bin/env python3
"""Genera embeddings de texto a partir de ml_pipeline/dataset.json usando un modelo de sentence-transformers.
Guarda: un .npz con `embeddings` y `filenames`, y un `labels.csv` con columnas filename,label.
Uso:
  python ml_pipeline/generate_text_embeddings.py --dataset ml_pipeline/dataset.json --out ml_pipeline/text_embeddings.npz
"""
import argparse
import json
from pathlib import Path
from typing import List
import numpy as np
import csv

try:
    import torch
    from transformers import AutoTokenizer, AutoModel
    _HAS_TORCH = True
except Exception:
    _HAS_TORCH = False
    from sklearn.feature_extraction.text import TfidfVectorizer


def collect_entries(data) -> List[dict]:
    entries = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                for k in ('monedas', 'entradas', 'items', 'data'):
                    if k in item and isinstance(item[k], list):
                        entries.extend(item[k])
                if any((x in item) for x in ('id', 'pais', 'denominacion')) and not any(k in item for k in ('monedas','entradas')):
                    entries.append(item)
    elif isinstance(data, dict):
        for k in ('monedas', 'entradas', 'items', 'data'):
            if k in data and isinstance(data[k], list):
                entries.extend(data[k])
        if not entries and isinstance(data, dict):
            if any((x in data) for x in ('id', 'pais', 'denominacion')):
                entries.append(data)
    return entries


def make_text(entry: dict) -> str:
    parts = []
    for key in ('denominacion', 'pais', 'anio_emision', 'anio_inicio', 'anio_fin', 'anverso', 'reverso', 'descripcion', 'curiosidad'):
        v = entry.get(key)
        if isinstance(v, (list, tuple)):
            parts.append(' '.join(map(str, v)))
        elif v:
            parts.append(str(v))
    tags = entry.get('tags') or []
    if isinstance(tags, list):
        parts.append(' '.join(tags))
    return ' '.join(parts).strip()


def generate(dataset_path: Path, out_path: Path, labels_out: Path, model_name: str = 'sentence-transformers/all-MiniLM-L6-v2', batch_size: int = 64):
    dataset = json.loads(dataset_path.read_text(encoding='utf-8'))
    entries = collect_entries(dataset)
    if not entries:
        raise RuntimeError('No entries found in dataset; check the JSON structure')

    texts = []
    ids = []
    labels = []
    for e in entries:
        eid = e.get('id') or e.get('indice') or f"entry_{len(ids):06d}"
        ids.append(str(eid))
        texts.append(make_text(e) or eid)
        # default label: try denominacion then pais then id
        label = e.get('denominacion') or e.get('pais') or eid
        labels.append(str(label))

    if _HAS_TORCH:
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModel.from_pretrained(model_name).to(device)

        all_emb = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            inputs = tokenizer(batch_texts, padding=True, truncation=True, return_tensors='pt')
            inputs = {k: v.to(device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = model(**inputs)
                last = outputs.last_hidden_state
                mask = inputs['attention_mask'].unsqueeze(-1)
                summed = (last * mask).sum(1)
                counts = mask.sum(1).clamp(min=1)
                emb = (summed / counts).cpu().numpy()
                all_emb.append(emb)

        embeddings = np.vstack(all_emb)
    else:
        # fallback: TF-IDF vectorizer (no torch required)
        print('Torch not available — using TF-IDF fallback for text embeddings')
        vectorizer = TfidfVectorizer(max_features=2048)
        embeddings = vectorizer.fit_transform(texts).toarray()
        # persist the vectorizer for later inference
        try:
            import joblib
            vec_out = out_path.parent / 'vectorizer.joblib'
            joblib.dump(vectorizer, vec_out)
            print(f"Saved TF-IDF vectorizer -> {vec_out}")
        except Exception:
            print('Could not save vectorizer (joblib missing)')
    out_path.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(out_path, embeddings=embeddings, filenames=np.array(ids, dtype=object))

    labels_out = Path(labels_out)
    labels_out.parent.mkdir(parents=True, exist_ok=True)
    with labels_out.open('w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['filename', 'label'])
        for fn, lb in zip(ids, labels):
            writer.writerow([fn, lb])

    print(f"Saved {embeddings.shape} embeddings -> {out_path}")
    print(f"Saved labels -> {labels_out}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--labels-out', default='ml_pipeline/processed/labels.csv')
    parser.add_argument('--model', default='sentence-transformers/all-MiniLM-L6-v2')
    parser.add_argument('--batch-size', type=int, default=64)
    args = parser.parse_args()

    generate(Path(args.dataset), Path(args.out), args.labels_out, args.model, args.batch_size)
