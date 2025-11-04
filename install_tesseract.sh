#!/bin/bash

echo "🔧 Instalando Tesseract OCR en el contenedor backend..."

docker-compose exec backend sh -c "
    apt-get update && \
    apt-get install -y tesseract-ocr tesseract-ocr-spa && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
"

echo "✅ Tesseract OCR instalado correctamente"
echo "📝 El OCR ahora funcionará con mayor precisión"

