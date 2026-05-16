#!/bin/bash
# EC2 초기 셋업 스크립트 (Ubuntu 22.04 기준)
# 사용법: bash setup-ec2.sh

set -e

echo "=== Docker 설치 ==="
apt-get update -y
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

echo "=== 프로젝트 디렉터리 생성 ==="
mkdir -p /app
chown ubuntu:ubuntu /app

echo "=== 완료 ==="
echo "이제 /app 디렉터리에 docker-compose.yml과 .env 파일을 업로드하세요."
echo "그 다음: cd /app && docker compose up -d"
