#!/usr/bin/env python3
"""Preprocesado simple: normaliza tamaño de imágenes y genera labels.csv
Uso:
  python ml_pipeline/preprocess.py --input dataset/raw --output dataset/processed --size 384
"""
import argparse
from pathlib import Path
from PIL import Image
import csv


def process(input_dir: Path, output_dir: Path, size: int):
    images_out = output_dir / 'images'
    images_out.mkdir(parents=True, exist_ok=True)

    rows = []
    idx = 0
    for label_dir in sorted(input_dir.iterdir()):
        if not label_dir.is_dir():
            continue
        label = label_dir.name
        for img_path in sorted(label_dir.glob('*')):
            if not img_path.is_file():
                continue
            try:
                with Image.open(img_path) as im:
                    im = im.convert('RGB')
                    im = im.resize((size, size), Image.LANCZOS)
                    out_name = f"img_{idx:06d}.jpg"
                    out_path = images_out / out_name
                    im.save(out_path, quality=90)
                    rows.append((out_name, label))
                    idx += 1
            except Exception as e:
                print(f"Skipping {img_path}: {e}")

    # escribir labels.csv
    labels_csv = output_dir / 'labels.csv'
    with labels_csv.open('w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['filename', 'label'])
        writer.writerows(rows)

    print(f"Processed {idx} images -> {images_out} and labels -> {labels_csv}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--size', type=int, default=384)
    args = parser.parse_args()

    process(Path(args.input), Path(args.output), args.size)
