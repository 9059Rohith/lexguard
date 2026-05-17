FROM python:3.11-slim-bookworm

# System deps for PyMuPDF, Pillow, faiss-cpu
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libglib2.0-0 libsm6 libxrender1 libxext6 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (layer caching)
COPY requirements.txt .

# Install Python deps (no torch for lighter build — sentence-transformers uses torch)
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the sentence-transformers model so it doesn't download at runtime
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8000

# Non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
