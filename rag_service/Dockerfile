FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
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

# Expose port for FastAPI
EXPOSE 8000

# Run the application with auto-initialization
CMD ["uv", "run", "--project", "/app/rag_service", "python", "/app/rag_service/main.py", "--host", "0.0.0.0", "--port", "8000", "--initialize"]
