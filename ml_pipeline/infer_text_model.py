#!/usr/bin/env python3
"""Inferencia sobre una entrada JSON o texto usando el modelo entrenado.
Uso:
  python ml_pipeline/infer_text_model.py --id AT-EUR-1CENT-001
  python ml_pipeline/infer_text_model.py --text "1 céntimo España, cobre" 
"""
import argparse
import json
from pathlib import Path
import joblib
import numpy as np

def make_text_from_entry(entry: dict) -> str:
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


def load_dataset(dataset_path: Path):
    data = json.loads(dataset_path.read_text(encoding='utf-8'))
    # collect entries similar to generate_text_embeddings
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
        if not entries and any((x in data) for x in ('id', 'pais', 'denominacion')):
            entries.append(data)
    id_map = { (e.get('id') or str(e.get('indice'))): e for e in entries }
    return id_map


def embed_text(text: str, model_dir: Path):
    # try to load TF-IDF vectorizer first
    vec_path = model_dir / 'vectorizer.joblib'
    if vec_path.exists():
        vec = joblib.load(vec_path)
        emb = vec.transform([text]).toarray()
        return emb
    # otherwise use transformers if available
    try:
        import torch
        from transformers import AutoTokenizer, AutoModel
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')
        model = AutoModel.from_pretrained('sentence-transformers/all-MiniLM-L6-v2').to(device)
        inputs = tokenizer([text], padding=True, truncation=True, return_tensors='pt')
        inputs = {k: v.to(device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = model(**inputs)
            last = outputs.last_hidden_state
            mask = inputs['attention_mask'].unsqueeze(-1)
            summed = (last * mask).sum(1)
            counts = mask.sum(1).clamp(min=1)
            emb = (summed / counts).cpu().numpy()
            return emb
    except Exception:
        raise RuntimeError('No vectorizer saved and transformers/torch not available for embedding')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset', default='ml_pipeline/dataset.json')
    parser.add_argument('--model', default='ml_pipeline/model_text_no_pandas.joblib')
    parser.add_argument('--id', help='Entry id to predict from dataset')
    parser.add_argument('--text', help='Raw text to predict')
    args = parser.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        raise SystemExit(f'Model not found: {model_path}')
    model = joblib.load(model_path)
    model_dir = model_path.parent

    if args.id:
        id_map = load_dataset(Path(args.dataset))
        entry = id_map.get(args.id)
        if not entry:
            raise SystemExit(f'ID not found in dataset: {args.id}')
        text = make_text_from_entry(entry)
    elif args.text:
        text = args.text
    else:
        raise SystemExit('Provide --id or --text')

    emb = embed_text(text, model_dir)
    preds = model.predict(emb)
    proba = None
    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(emb)[0]
    print('Input text:', text)
    print('Prediction:', preds[0])
    if proba is not None:
        # show top-3 probabilities
        idx = np.argsort(proba)[-3:][::-1]
        classes = model.classes_
        print('Top probabilities:')
        for i in idx:
            print(f'  {classes[i]}: {proba[i]:.3f}')
