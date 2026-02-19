from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
import joblib
import json
import numpy as np

app = FastAPI(title='CoinFinder Text Inference')


class PredictRequest(BaseModel):
    text: str = None
    id: str = None


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


MODEL_PATH = Path('model_text_no_pandas.joblib')
DATASET_PATH = Path('dataset.json')
VECT_PATH = Path('vectorizer.joblib')


@app.on_event('startup')
def startup_event():
    if not MODEL_PATH.exists():
        raise RuntimeError(f'Model not found: {MODEL_PATH}')
    app.state.model = joblib.load(MODEL_PATH)
    app.state.dataset = load_dataset(DATASET_PATH) if DATASET_PATH.exists() else {}
    if VECT_PATH.exists():
        app.state.vectorizer = joblib.load(VECT_PATH)
    else:
        app.state.vectorizer = None


def embed_text(text: str):
    if app.state.vectorizer is not None:
        return app.state.vectorizer.transform([text]).toarray()
    # try transformers fallback
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


@app.get('/health')
def health():
    return {'status': 'ok', 'model_loaded': MODEL_PATH.exists()}


@app.post('/predict')
def predict(req: PredictRequest):
    if req.id:
        entry = app.state.dataset.get(req.id)
        if not entry:
            raise HTTPException(status_code=404, detail='id not found')
        text = make_text_from_entry(entry)
    elif req.text:
        text = req.text
    else:
        raise HTTPException(status_code=400, detail='provide text or id')

    emb = embed_text(text)
    pred = app.state.model.predict(emb)[0]
    proba = None
    if hasattr(app.state.model, 'predict_proba'):
        proba = app.state.model.predict_proba(emb)[0]
        idx = np.argsort(proba)[-5:][::-1]
        top = [{ 'label': app.state.model.classes_[i], 'p': float(proba[i]) } for i in idx]
    else:
        top = [{ 'label': pred, 'p': 1.0 }]

    return { 'prediction': str(pred), 'top': top, 'text': text }
