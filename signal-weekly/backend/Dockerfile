FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SIGNAL_HOST=0.0.0.0 \
    SIGNAL_STATE_DIR=/data

WORKDIR /app
COPY . /app
RUN mkdir -p /data

EXPOSE 8080
CMD ["python3", "scripts/server.py"]
