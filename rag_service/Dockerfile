FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install --no-cache-dir uv

# Copy project metadata and lock file first for better layer caching
COPY rag_service/pyproject.toml rag_service/uv.lock /app/rag_service/

# Install Python dependencies from lock file
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --project /app/rag_service --frozen --no-dev --no-install-project

# Copy Python code
COPY rag_service/main.py /app/rag_service/main.py

# Create necessary directories
RUN mkdir -p /app/data /app/data/chromadb

ENV RAG_SERVICE_PORT=8000

# Expose default FastAPI port (runtime configurable via RAG_SERVICE_PORT)
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
  CMD curl -fsS "http://localhost:${RAG_SERVICE_PORT:-8000}/status" || exit 1

# Run the application with auto-initialization and env-configurable port
CMD ["sh", "-c", "uv run --project /app/rag_service python /app/rag_service/main.py --host 0.0.0.0 --port ${RAG_SERVICE_PORT:-8000} --initialize"]
