FROM python:3.11-slim

ARG DEV=false
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    libpng-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY ml_pipeline/requirements.txt ./

RUN python -m pip install --upgrade pip setuptools
RUN --mount=type=cache,id=pip-cache,target=/root/.cache/pip \
    /bin/sh -c "if [ \"$DEV\" = \"true\" ]; then \
        python -m pip install --no-cache-dir fastapi uvicorn joblib Pillow numpy scikit-learn; \
    else \
        python -m pip install -r requirements.txt; \
    fi"

COPY ml_pipeline /app/ml_pipeline
WORKDIR /app/ml_pipeline

EXPOSE 8000

CMD ["uvicorn", "inference_server:app", "--host", "0.0.0.0", "--port", "8000"]
