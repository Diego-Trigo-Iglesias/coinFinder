# Despliegue del servicio de ML (Cloud Run)

Este documento explica cómo habilitar el flujo de CI/CD que construye la imagen Docker, la publica en GitHub Container Registry (GHCR) y la despliega en Cloud Run.

## Requisitos previos

- Un proyecto de Google Cloud con facturación habilitada.
- `gcloud` instalado localmente para pruebas manuales (opcional).
- Un repositorio de GitHub con este código.

## Secrets requeridos en GitHub

- `GCP_SA_KEY` — contenido JSON de una cuenta de servicio con roles: `roles/run.admin`, `roles/iam.serviceAccountUser`, `roles/storage.admin` (o más restringidos si lo prefieres). Guarda el valor como JSON crudo.
- `GCP_PROJECT_ID` — ID de tu proyecto en GCP.
- `GCP_REGION` — por ejemplo, `us-central1`.
- `ML_API_KEY` — secreto opaco usado por el frontend para llamar al servicio de ML.

## Pasos principales

1. Crear una cuenta de servicio en GCP:

   - En Cloud Console → IAM & Admin → Service Accounts → Create Service Account.
   - Asigna `Cloud Run Admin` y `Service Account User` a la cuenta de servicio.
   - Crea y descarga una clave JSON; copia su contenido en el secret `GCP_SA_KEY` en GitHub.

2. Habilitar APIs en GCP:

   ```bash
   gcloud services enable run.googleapis.com iam.googleapis.com
   ```

3. Añadir secrets del repositorio en GitHub:

   - En tu repo de GitHub → Settings → Secrets and variables → Actions, agrega `GCP_SA_KEY`, `GCP_PROJECT_ID`, `GCP_REGION` y `ML_API_KEY`.

4. Detalles del workflow

- El workflow en `.github/workflows/deploy-ml.yml` construye la imagen Docker usando `ml_pipeline/Dockerfile` y la etiqueta como `ghcr.io/<owner>/coinfinder-ml:<sha>` y `:latest`.
- Después del push, el workflow usa la acción `google-github-actions/deploy-cloudrun` para desplegar en Cloud Run.

## Pruebas y despliegue manual

- Para ejecutar localmente (construir imagen):

  ```bash
  docker build -f ml_pipeline/Dockerfile -t coinfinder-ml:local .
  docker run --rm -p 8000:8000 -v ${PWD}:/app -w /app/ml_pipeline coinfinder-ml:local uvicorn inference_server:app --host 0.0.0.0 --port 8000
  ```

- Para activar el workflow manualmente: pestaña **Actions** → seleccionar `CI/CD — Build & Deploy ML service` → **Run workflow**.

## Después del despliegue

- Cloud Run proporcionará una URL del servicio (HTTPS). Configura `ML_API_URL` en las variables de entorno de Vercel con esa URL y asigna `ML_API_KEY` con el mismo valor que añadiste en los secrets de GitHub.
- El frontend debe enviar `ML_API_KEY` en la cabecera `Authorization` (o `x-api-key`) — actualiza `src/` para leer `ML_API_URL` y `ML_API_KEY` desde las variables de entorno.

## Notas de seguridad

- Mantén el secret `GCP_SA_KEY` protegido y rótalo periódicamente.
- Usa IAM de Cloud Run para restringir quién puede invocar el servicio y considera añadir un API Gateway si necesitas limitación de tasa (rate-limiting) o WAF.