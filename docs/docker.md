# Docker

The root `docker-compose.yml` starts Claude-Mem Server beta with a persistent Valkey sidecar.

```sh
docker compose up --build
curl http://127.0.0.1:37777/healthz
```

The server container uses:

- `OPENCODE_MEM_WORKER_HOST=0.0.0.0`
- `OPENCODE_MEM_DATA_DIR=/data/opencode-mem`
- `OPENCODE_MEM_QUEUE_ENGINE=bullmq`
- `OPENCODE_MEM_REDIS_URL=redis://valkey:6379`
- `OPENCODE_MEM_AUTH_MODE=api-key`

Create an API key inside the container before using protected V1 write routes.
