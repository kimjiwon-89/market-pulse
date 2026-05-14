# Backend 작업 가이드 (market-pulse-api)

## 스택

Java 17 · Spring Boot 3.2 · MyBatis · PostgreSQL · Redis · Swagger (springdoc 2.5)

## 실행

```bash
cd market-pulse-api
./mvnw spring-boot:run
# http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui/index.html
```

## 환경 설정

| 파일 | 용도 |
|------|------|
| `src/main/resources/application.yml` | 공통 설정 (포트, MyBatis, CORS, KIS API base-url) |
| `src/main/resources/application-local.yml` | 로컬 DB 접속 정보 |
| `src/assembly/conf/application-prod.yml` | 운영 설정 |

```
DB:    jdbc:postgresql://localhost:5432/marketpulse (username: won)
Redis: localhost:6379
KIS:   https://openapi.koreainvestment.com:9443
```

**app-key / app-secret은 application.yml에 직접 입력 금지 — 환경변수 또는 별도 설정파일 사용**

## 패키지 구조

```
com.marketpulse/
├── domain/                  # 비즈니스 도메인
│   ├── index/               # 업종 기간별 시세
│   │   ├── controller/
│   │   ├── service/
│   │   ├── dto/
│   │   ├── mapper/
│   │   └── vo/
│   ├── investor/            # 투자자 매매동향 + 메모
│   ├── news/                # 뉴스
│   └── stock/               # 외국인 순매수
├── external/                # KIS API 직접 호출 클라이언트
├── infrastructure/
│   └── token/               # 토큰 발급·캐싱 (Redis + DB)
└── global/
    ├── config/              # RedisConfig, SwaggerConfig, WebConfig(CORS)
    ├── exception/           # GlobalExceptionHandler
    └── response/            # ApiResponse<T>, KisResponse
```

## API 엔드포인트 현황

| 도메인 | 메서드 | 경로 | 상태 |
|--------|--------|------|------|
| index | GET | `/api/index/inquire-daily-indexchartprice` | 완료 |
| stock | GET | `/api/stock/foreign-trade` | 완료 |
| news | GET | `/api/news/inquire-daily-news` | 완료 |
| investor | GET | `/api/investor/trade-top` | 구현 예정 |
| investor | GET/POST/DELETE | `/api/investor/memo` | 구현 예정 |
| investor | GET | `/api/investor/memo/list` | 구현 예정 |

## 공통 응답 형식

```java
// 성공
ApiResponse.success(data);

// 실패
ApiResponse.error(message);
```

## 토큰 관리 (TokenService)

KIS API 호출 전 반드시 `TokenService.getValidToken()` 사용.
직접 토큰 발급 로직 작성 금지.

```
1. Redis 조회 → 유효하면 반환
2. DB 조회 → 유효하면 Redis 저장 후 반환
3. 신규 발급 → DB + Redis 동시 저장
```

## MyBatis 규칙

- XML 매퍼 위치: `src/main/resources/mapper/<도메인>/<도메인>Mapper.xml`
- Mapper 인터페이스: `domain/<도메인>/mapper/<도메인>Mapper.java`
- VO: KIS API 응답 매핑용, DTO: 클라이언트 송수신용으로 구분

## 새 도메인 추가 절차

1. `domain/<name>/` 하위에 controller / service / dto / mapper / vo 생성
2. `resources/mapper/<name>/<name>Mapper.xml` 생성
3. `application.yml` → `type-aliases-package`에 패키지 추가 여부 확인
4. Controller에 `@Tag`, `@Operation` Swagger 어노테이션 추가
5. 이 파일 엔드포인트 현황 테이블 업데이트

## investor 도메인 구현 스펙

### KIS API

| 엔드포인트 | TR ID | 용도 |
|---|---|---|
| 국내기관_외국인 매매종목가집계 | `FHKST01010900` | 외국인/기관 순매수·순매도 상위 종목 |
| 시장별 투자자매매동향(일별) | `FHKST01010800` | 코스피/코스닥 시장 구분 |

### REST API

```
GET /api/investor/trade-top
  ?market=KOSPI|KOSDAQ
  &investorType=FOREIGN|INSTITUTION
  &tradeType=BUY|SELL
  &date=20260514          # 기본값: 오늘

GET    /api/investor/memo?date=20260514&market=KOSPI|KOSDAQ
POST   /api/investor/memo   body: { date, market, content }  # upsert
DELETE /api/investor/memo/{id}
GET    /api/investor/memo/list?market=KOSPI|KOSDAQ&page=0&size=20
```

### DB 테이블

```sql
CREATE TABLE investor_memo (
    id         BIGSERIAL    PRIMARY KEY,
    memo_date  DATE         NOT NULL,
    market     VARCHAR(10)  NOT NULL,  -- 'KOSPI' | 'KOSDAQ'
    content    TEXT         NOT NULL,
    created_at TIMESTAMP    DEFAULT NOW(),
    updated_at TIMESTAMP    DEFAULT NOW(),
    UNIQUE (memo_date, market)
);
```

POST는 upsert 처리 (memo_date + market 중복 시 content 업데이트).

### 구현 파일 위치

```
domain/investor/
├── controller/InvestorController.java
├── service/InvestorService.java
├── dto/TradeTopRequestDto.java
├── dto/TradeTopResponseDto.java
├── dto/MemoRequestDto.java
├── dto/MemoResponseDto.java
├── mapper/MemoMapper.java
└── vo/MemoVo.java
```

## CORS 설정

`application.yml` → `app.cors.allowed-origins` 에서 관리.
현재 허용: `localhost:3000`, `localhost:8080`.
운영 배포 시 실제 도메인으로 교체 필요. `"*"` 사용 금지.
