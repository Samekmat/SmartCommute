# ==============================================================================
# Multi-stage Dockerfile for SmartCommute FastAPI Backend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency resolution and packaging with uv
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS builder

# Install uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:0.6.5 /uv /bin/uv

# Configure uv environment
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Copy dependency specifications first for layer caching
COPY pyproject.toml uv.lock ./

# Install external dependencies into /app/.venv
RUN uv sync --frozen --no-dev --no-install-project

# Copy backend source code and package metadata
COPY README.md ./
COPY app ./app

# Install project package into virtualenv
RUN uv sync --frozen --no-dev

# ------------------------------------------------------------------------------
# Stage 2: Minimal runtime image running as non-root appuser
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

# Configure Python runtime settings
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH" \
    PORT=8000 \
    DATABASE_URL="sqlite:////app/data/smart_commute.db"

WORKDIR /app

# Create unprivileged system group and user, and persistent data directory
RUN groupadd -r -g 10001 appuser && \
    useradd -r -u 10001 -g appuser -d /app -s /sbin/nologin appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app

# Copy prepared virtual environment and source code from builder
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv
COPY --from=builder --chown=appuser:appuser /app/app /app/app

# Run as non-root user for container security compliance
USER appuser

# Expose default HTTP service port
EXPOSE 8000

# Container healthcheck using standard library urllib
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python3 -c "import urllib.request, os; urllib.request.urlopen(f'http://localhost:{os.getenv(\"PORT\", 8000)}/health')" || exit 1

# Launch ASGI server with dynamic PORT evaluation
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
