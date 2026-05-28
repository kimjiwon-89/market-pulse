# Production Deploy

Production deploy runs when a pull request into `main` is closed as merged.

## Flow

1. GitHub Actions checks out the repo.
2. API image is built from `apps/api`.
3. Web image is built from `apps/web`.
4. Images are pushed to Docker Hub.
5. `infra/docker-compose.yml` is uploaded to EC2 as `/app/docker-compose.yml`.
6. `scripts/deploy.sh` is uploaded to EC2 as `/app/deploy.sh`.
7. EC2 runs `/app/deploy.sh`.

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
JWT_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
KIS_APP_KEY=
KIS_APP_SECRET=
KRX_AUTH_KEY=
OPENDART_API_KEY=
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
