# AWS RDS PostgreSQL 전환 메모

작성일: 2026-05-20

## 목적

현재는 각 PC의 Spring Boot가 각자 로컬 PostgreSQL에 접속한다.
AWS RDS PostgreSQL로 전환하면 여러 PC가 하나의 DB를 공유하므로, 한 PC에서 수집한 KRX/KIS 데이터와 메모/퀀트 데이터 등을 다른 PC에서도 바로 조회할 수 있다.

```
현재:
각 PC Spring Boot -> 각 PC 로컬 PostgreSQL

전환 후:
여러 PC Spring Boot -> AWS RDS PostgreSQL 하나
```

## 기대 효과

- 다른 PC에서 수집한 2020-2025년 KRX 데이터도 같은 RDS에 저장된다.
- 이 PC에서 앱을 실행해도 동일한 데이터를 조회할 수 있다.
- 로컬 DB별 데이터 불일치 문제를 줄일 수 있다.
- `api_token` 테이블도 RDS에 저장되므로 DB 기준 KIS 토큰 캐시를 여러 PC가 공유할 수 있다.

## 설정 변경 포인트

`market-pulse-api/src/main/resources/application-local.yml` 또는 별도 RDS profile의 datasource를 RDS endpoint로 변경한다.

```yaml
spring:
  datasource:
    url: jdbc:postgresql://<rds-endpoint>:5432/marketpulse
    username: <rds-user>
    password: <rds-password>
```

운영/공유 환경에서는 DB 접속 정보와 KIS app-key/app-secret을 git tracked yml에 직접 넣지 말고 환경변수나 별도 로컬 설정으로 관리한다.

## AWS/RDS 체크리스트

- RDS PostgreSQL 인스턴스 생성
- DB 이름: `marketpulse`
- 보안 그룹 inbound에서 필요한 IP만 `5432` 허용
- 가능하면 public access는 최소화하고, 고정 IP/VPN/배스천 등 접속 경로를 제한
- 자동 백업 활성화
- 스토리지 자동 확장 여부 확인
- 비용 확인: 인스턴스 타입, 스토리지, 백업 보관 기간
- SSL 접속 여부 검토

## 애플리케이션 주의사항

- 여러 PC에서 동시에 스케줄러를 켜면 같은 데이터를 중복 수집하거나 API limit을 더 빨리 소모할 수 있다.
- KRX/KIS 수집 스케줄러는 원칙적으로 한 곳에서만 실행하는 것이 안전하다.
- `api_token`은 RDS DB 기준으로 공유되지만 Redis는 각 PC 로컬이면 Redis 캐시는 공유되지 않는다.
- Redis까지 공유하려면 ElastiCache 또는 공용 Redis가 필요하다. 다만 현재 TokenService는 Redis miss 후 DB를 조회하므로 RDS만 공유해도 반복 발급 위험은 크게 줄어든다.
- 장기 데이터 수집은 upsert/unique key가 정확히 잡혀 있어야 중복 insert를 방지할 수 있다.

## 전환 작업 순서 초안

1. RDS PostgreSQL 생성 및 접속 테스트
2. 로컬 DB schema/data dump 생성
3. RDS에 schema/data restore
4. `application-local.yml` 또는 새 profile에 RDS datasource 추가
5. API 서버 기동 후 주요 조회 API 검증
6. KRX/KIS 수집 스케줄러가 여러 PC에서 동시에 돌지 않도록 설정 정리
7. RDS 백업/보안 그룹/비용 모니터링 확인

## 검증할 API

- `GET /api/stock/search`
- `GET /api/stock/detail`
- `GET /api/quant/strategies`
- `GET /api/quant/backtest`
- `GET /api/memo`
- `GET /api/lotto/latest`

