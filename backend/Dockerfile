FROM python:3.12-slim AS backend-builder

WORKDIR /app

COPY requirements.txt ./

RUN python -m venv /app/.venv && \
    /app/.venv/bin/pip install --upgrade pip && \
    /app/.venv/bin/pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim AS backend

WORKDIR /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    DB_PATH=/app/data/app.db \
    APP_ENV=production

COPY --from=backend-builder /app/.venv /app/.venv

COPY . .

RUN useradd -m backuser && \
    mkdir -p /app/data && \
    chown -R backuser:backuser /app

USER backuser

EXPOSE 5059

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5059", "--proxy-headers", "--forwarded-allow-ips=*"]
