# RDS shared database runbook

## Goal

Use Git for source code and AWS RDS PostgreSQL for shared market data.

```
source code: GitHub
shared data: RDS PostgreSQL
local PCs: run the API with the rds profile when they need the shared DB
```

RDS stays private. Local PCs should not open PostgreSQL to the internet. Bulk data moves through EC2 because the EC2 security group is allowed to reach RDS.

## One-time local DB upload

Create a dump from the local PostgreSQL database:

```powershell
.\scripts\db\export-local-db.ps1 `
  -HostName localhost `
  -Port 5432 `
  -Database marketpulse `
  -User postgres `
  -OutputPath .\tmp\marketpulse.dump
```

Upload the dump to EC2 and restore it into RDS:

```powershell
.\scripts\db\restore-rds-via-ec2.ps1 `
  -Ec2Host <ec2-public-ip-or-dns> `
  -Ec2User ec2-user `
  -KeyPath .\secrets\<key>.pem `
  -RdsEndpoint <rds-endpoint> `
  -RdsDatabase marketpulse `
  -RdsUser <rds-user> `
  -LocalDumpPath .\tmp\marketpulse.dump
```

The EC2 instance must have PostgreSQL client tools installed. Configure `~/.pgpass` on EC2 before restore so the command does not expose the RDS password:

```text
<rds-endpoint>:5432:marketpulse:<rds-user>:<rds-password>
```

Then lock its permissions:

```bash
chmod 600 ~/.pgpass
```

## Run a local API against shared RDS

Use the `rds` Spring profile. Each PC sets its own local environment variables:

```powershell
$env:SPRING_PROFILES_ACTIVE="rds"
$env:DB_HOST="<rds-endpoint>"
$env:DB_PORT="5432"
$env:DB_NAME="marketpulse"
$env:DB_USERNAME="<rds-user>"
$env:DB_PASSWORD="<rds-password>"
$env:APP_SCHEDULER_ENABLED="false"
```

Then run:

```powershell
cd market-pulse-api
.\mvnw.cmd spring-boot:run
```

`APP_SCHEDULER_ENABLED=false` is intentional for local PCs. Only the main EC2 server should run scheduled KRX/KIS collection jobs against the shared RDS DB.

## Main EC2 server

The EC2 server may use `prod` or `rds` profile, but it should point at the same RDS endpoint. If the EC2 server is responsible for scheduled collection, set:

```bash
APP_SCHEDULER_ENABLED=true
```

## Safety rules

- Do not add the RDS password to Git.
- Do not open RDS inbound PostgreSQL `5432` to `0.0.0.0/0`.
- Allow RDS inbound `5432` only from the EC2 app security group.
- Use EC2 as the jump host for dump/restore.
- Keep local PCs on `APP_SCHEDULER_ENABLED=false` to avoid duplicate collection and API limit waste.

