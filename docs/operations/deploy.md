# Production Deploy

Production deploy runs when a pull request into `main` is closed as merged.

## Flow

1. GitHub Actions checks out the repo.
2. API tests run with Java 17.
3. Web dependencies install, then web tests and production build run.
4. API image is built from the repository root with `apps/api/Dockerfile`, so accepted quant package artifacts under `domains/quant-serving/packages/` are included in the API image.
5. Web image is built from `apps/web`.
6. Images are pushed to Docker Hub.
7. `infra/docker-compose.yml` is uploaded to EC2 as `/app/docker-compose.yml`.
8. `scripts/deploy.sh` is uploaded to EC2 as `/app/deploy.sh`.
9. `scripts/apply-migrations.sh` is uploaded to EC2 as `/app/apply-migrations.sh`.
10. `db/migrations/*.sql` is uploaded to EC2 under `/app/migrations/`.
11. EC2 runs `/app/deploy.sh`.

During `/app/deploy.sh`:

1. Docker pulls API and web images.
2. `docker compose run --rm -T migrator` applies un-applied SQL files from `/app/migrations` and records them in `schema_migrations`.
3. Containers restart with `docker compose up -d --no-build`.
4. The API health check calls `http://localhost:8080/actuator/health` inside the API container.
5. Deployment status is printed.

## EC2 Requirements

EC2 must have:

- Docker and Docker Compose plugin installed
- `/app/.env` present
- `/etc/letsencrypt/live/marketp.duckdns.org/fullchain.pem`
- `/etc/letsencrypt/live/marketp.duckdns.org/privkey.pem`

Required `/app/.env` keys:

```env
DOCKER_USERNAME=
DB_HOST=
DB_PORT=5432
DB_NAME=marketPulse
DB_USERNAME=
DB_PASSWORD=
APP_SCHEDULER_ENABLED=false
QUANT_LIVE_PAPER_SCHEDULER_ENABLED=true
JWT_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
KIS_APP_KEY=
KIS_APP_SECRET=
KRX_AUTH_KEY=
OPENDART_API_KEY=
QUANT_MODEL_PACKAGE_ROOT=/app/domains/quant-serving/packages
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
AWS_S3_REGION=ap-northeast-2
AWS_S3_BUCKET=
```

## GitHub Secrets

Required GitHub Actions secrets:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `EC2_HOST`
- `EC2_SSH_KEY`

## Safety

Do not run this deploy flow manually or mutate EC2 `/app` without explicit user approval in the current request.

Production HTTP health can also be checked through the web container at:

```text
https://marketp.duckdns.org/api/actuator/health
```
