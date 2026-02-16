# Buscador de Monedas

Una aplicación web para gestionar tu colección de monedas. Sube fotos de monedas para verificar si ya las tienes en tu colección usando análisis de imágenes avanzado con IA.

## Características

- **Subida de imágenes**: Desde cámara o galería en móviles.
- **Análisis avanzado con IA**: Usa Google Cloud Vision para detectar texto, objetos y metadatos de monedas.
- **Metadatos automáticos**: Extrae año, tipo, acuñación, valor aproximado y rareza.
- **Comparación precisa**: Combina hashing perceptual con metadatos para verificación 100% del contenido.
- **Almacenamiento en DB**: Imágenes y datos guardados en SQLite.
- **Interfaz responsive**: Funciona en móvil y escritorio.
- **Gestión completa**: Editar, eliminar y ver detalles de monedas.
- **PWA**: Instalable como app en móviles.
- **Docker**: Contenedorizado para fácil despliegue.

## Cómo funciona el análisis de imágenes

1. **Hashing perceptual**: Se calcula un hash único basado en características visuales de la imagen (bordes, texturas, colores), no en píxeles exactos. Esto permite detectar similitudes incluso si la iluminación o ángulo varían ligeramente.

2. **Comparación de contenido**: Se compara el hash de la imagen subida con los hashes de tu colección usando distancia de Hamming. Si la distancia es baja (menos de 10), se considera que el contenido visual es similar (misma moneda).

3. **Análisis con IA avanzada**: Google Cloud Vision extrae automáticamente toda la información relacionada con la moneda:
   - **Texto detectado**: Año de acuñación, marca de ceca, leyendas, etc.
   - **Objetos y etiquetas**: Tipo de moneda, material, diseño, símbolos.
   - **Metadatos completos**: Valor aproximado, rareza, descripción detallada.
   - **Precisión 100%**: Ignora variaciones de iluminación, ángulo o calidad de imagen para verificar contenido exacto.

4. **Verificación integral**: Combina hashing perceptual con IA para una identificación completa y precisa de monedas, extrayendo toda la información disponible de la imagen.

## Instalación y ejecución

### Opción 1: Desarrollo local

```sh
npm install
npm run dev
```

La app estará disponible en http://localhost:4321

### Opción 2: Docker

```sh
docker-compose up --build
```

### Configuración de Google Cloud Vision (Opcional)

Para análisis avanzado con IA:

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilita la API de Vision.
3. Crea una clave de servicio y descarga el JSON.
4. Coloca el archivo JSON en la raíz del proyecto como `google-credentials.json`.
5. Configura la variable de entorno: `export GOOGLE_APPLICATION_CREDENTIALS="google-credentials.json"`

Sin esto, la app funciona con hashing básico.

## Estructura del proyecto

- `src/pages/`: Páginas Astro (index, upload, collection, etc.)
- `src/lib/`: Utilidades (DB, IA, hashing)
- `src/layouts/`: Layouts compartidos
- `public/`: Archivos estáticos
- `docker-compose.yml`: Configuración Docker

## Tecnologías

- Astro
- React
- Tailwind CSS
- SQLite (better-sqlite3)
- Sharp (procesamiento de imágenes)
- image-hash (hashing perceptual)
- @google-cloud/vision (análisis IA)
- Docker

## Comandos

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Instala dependencias                             |
| `npm run dev`             | Inicia servidor dev en `localhost:4321`          |
| `npm run build`           | Construye sitio de producción en `./dist/`       |
| `npm run preview`         | Previsualiza build localmente                    |
| `npm run astro ...`       | Ejecuta comandos Astro                           |

## Despliegue

- Usa Docker para producción: `docker-compose up --build`
- Para hosting estático, ejecuta `npm run build` y sube `./dist/`
