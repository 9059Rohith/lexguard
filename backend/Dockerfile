FROM python:3.11-slim-bookworm

# System deps for PyMuPDF, Pillow, faiss-cpu
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libglib2.0-0 libsm6 libxrender1 libxext6 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (layer caching)
COPY requirements.txt .

# Install PyTorch CPU-only FIRST (much smaller — ~300MB vs 2GB GPU build)
RUN pip install --no-cache-dir torch==2.3.1 --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the sentence-transformers model so cold start is instant
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Render injects PORT env var; fall back to 8000 for local Docker
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
