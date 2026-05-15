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

## 사용자 관리 (Admin)

### DB 테이블

```sql
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,  -- BCrypt
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',  -- 'ADMIN' | 'USER'
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> `data.sql`은 참고용. 실제 테이블은 psql로 직접 생성 필요.

### 초기 관리자 계정

앱 시작 시 `InitialDataRunner`가 `users` 테이블에 없으면 자동 생성.
`application-local.yml`의 `app.auth.username/password` 값 사용.

```
기본값: admin / market2026
```

### API 엔드포인트 (ADMIN 전용)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/users` | 목록 |
| POST | `/api/admin/users` | 추가 `{ username, password, role }` |
| DELETE | `/api/admin/users/{id}` | 삭제 (자신 삭제 불가) |
| PATCH | `/api/admin/users/{id}/password` | 비밀번호 변경 `{ newPassword }` |

### 주요 파일

```
domain/user/
├── controller/UserController.java
├── service/UserService.java
├── dto/UserCreateRequest.java
├── dto/UserChangePasswordRequest.java
├── dto/UserResponseDto.java
├── mapper/UserMapper.java
└── vo/UserVo.java
resources/mapper/user/UserMapper.xml
global/auth/InitialDataRunner.java
```

### 회원가입 정책

공개 회원가입 없음 — 관리자가 `/admin` 페이지에서 직접 추가.

---

## API 엔드포인트 현황

| 도메인 | 메서드 | 경로 | 상태 |
|--------|--------|------|------|
| index | GET | `/api/index/inquire-daily-indexchartprice` | 완료 |
| stock | GET | `/api/stock/foreign-trade` | 완료 — 필터 3종 조합 + 날짜별 시계열 |
| news | GET | `/api/news/inquire-daily-news` | 완료 |
| investor | GET | `/api/investor/trade-top` | 완료 |
| investor | GET | `/api/investor/snapshot/dates` | 완료 |
| investor | POST | `/api/investor/snapshot` | 완료 (수동 트리거) |
| investor | GET/POST/DELETE | `/api/investor/memo` | 완료 |
| investor | GET | `/api/investor/memo/list` | 완료 |
| lotto | GET | `/api/lotto/latest` | 완료 |
| lotto | GET | `/api/lotto/rounds` | 완료 |
| lotto | GET | `/api/lotto/analysis?round=` | 완료 |
| lotto | GET | `/api/lotto/stats` | 완료 |
| lotto | POST/GET/DELETE | `/api/lotto/combo` | 완료 |
| lotto | POST | `/api/lotto/collect?from=&to=` | 완료 (관리자용 일괄 수집) |

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

## stock 도메인 구현 스펙 (NetBuyingList)

> 참고 레퍼런스: `.claude/연합뉴스 순매수도 상위 20위.xlsx`

### 기능 개요

3가지 필터를 자유롭게 조합해 순위 1~20위를 조회하고, 날짜별 시계열로 볼 수 있어야 한다.

| 필터 | 선택지 |
|------|--------|
| 투자자 | 외국인 / 기관 / 전체 |
| 거래유형 | 순매수 / 순매도 |
| 시장 | 코스피 / 코스닥 / 전체 |

### 엑셀 기반 데이터 구조

날짜별로 (종목명 / 순매수대금(억) / 순매수량(만주)) 3컬럼이 가로 확장되며,
**5영업일마다 주간 합계 컬럼**이 자동 삽입된다.

```
행: 순위 1~20
열: [날짜1] 종목명·대금·수량 | [날짜2] ... | [주간합계] ... | [날짜6] ...
```

### REST API

```
GET /api/stock/foreign-trade
  ?investorType=FOREIGN|INSTITUTION|ALL   # 투자자 구분 (기본값: ALL)
  &tradeType=BUY|SELL                     # 순매수/순매도
  &market=KOSPI|KOSDAQ|ALL               # 시장 구분 (기본값: ALL)
  &date=20260514                          # 단일 날짜 (기본값: 오늘)
  &dates=20260512,20260513,20260514       # 날짜 복수 선택 (시계열 뷰용)
```

### 응답 구조 (날짜 복수 요청 시)

```json
{
  "dates": ["20260512", "20260513", "20260514"],
  "weeklyGroups": [["20260512", "20260513"]],  // 5일 묶음 (주간합계 표시용)
  "data": [
    {
      "rank": 1,
      "byDate": {
        "20260512": { "name": "삼성전자", "amount": 7789.7, "volume": 412.1 },
        "20260513": { "name": "SK하이닉스", "amount": 5323.5, "volume": 58.5 },
        "20260514": { "name": "SK하이닉스", "amount": 6898.7, "volume": 59.1 }
      }
    }
  ]
}
```

---

## investor 도메인 구현 스펙

### KIS API

| 엔드포인트 | TR ID | 용도 |
|---|---|---|
| 국내기관_외국인 매매종목가집계 | `FHKST01010900` | 외국인/기관 순매수·순매도 상위 종목 |
| 시장별 투자자 흐름 (market-flow) | `FHKST01010900` | 동일 TR ID, fid_input_iscd=0001(KOSPI)/1001(KOSDAQ) |

> ⚠️ `FHKST01010800`은 KIS API에 존재하지 않음 (개발자포털 검색 0건). `FHKST01010900`으로 통일.
> ⚠️ `FHKST01010900`은 실시간 전용 — 장 마감(15:30) 후엔 `output:[]` 반환. 과거 날짜 지원 여부는 미확인 (2026-05-15 장중 테스트 예정).

### REST API

```
GET /api/investor/trade-top
  ?market=KOSPI|KOSDAQ
  &investorType=FOREIGN|INSTITUTION
  &tradeType=BUY|SELL
  &date=20260514          # 기본값: 오늘
  → 오늘 날짜면 KIS API 실시간, 과거 날짜면 ranking_snapshot DB 조회

GET /api/investor/snapshot/dates
  ?investorType=FOREIGN&tradeType=BUY&market=KOSPI
  → 저장된 날짜 목록 (YYYYMMDD 문자열 배열, 최신순)

POST /api/investor/snapshot?date=20260514
  → 해당 날짜 스냅샷 즉시 저장 (수동 트리거)
  → 생략 시 오늘 날짜

GET    /api/investor/memo?date=20260514&market=KOSPI|KOSDAQ
POST   /api/investor/memo   body: { date, market, content }  # upsert
DELETE /api/investor/memo/{id}
GET    /api/investor/memo/list?market=KOSPI|KOSDAQ&page=0&size=20
```

### TradeTopResponseDto 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| rank | int | 순위 |
| stockCode | String | 종목코드 |
| stockName | String | 종목명 |
| netBuyAmount | long | 순매수대금 (원 단위) |
| netBuyVolume | long | 순매수량 (주) |
| currentPrice | long | 현재가 (실시간만 제공, 스냅샷은 0) |
| changeRate | double | 등락률 (실시간만 제공, 스냅샷은 0.0) |
| foreignShareRatio | double | 외국인 지분률 (실시간만 제공, 스냅샷은 0.0) |

> `foreignShareRatio`: KIS API 필드 `frgn_hldn_qty_rt` — 실시간 API에서만 반환, 스냅샷에는 저장하지 않음.

### ranking_snapshot 테이블

```sql
CREATE TABLE IF NOT EXISTS ranking_snapshot (
    id             BIGSERIAL    PRIMARY KEY,
    snap_date      DATE         NOT NULL,
    investor_type  VARCHAR(20)  NOT NULL,  -- FOREIGN
    trade_type     VARCHAR(10)  NOT NULL,  -- BUY | SELL
    market         VARCHAR(10)  NOT NULL,  -- KOSPI | KOSDAQ | ALL
    rank           INTEGER      NOT NULL,
    stock_code     VARCHAR(10)  NOT NULL,
    stock_name     VARCHAR(100) NOT NULL,
    net_buy_amount BIGINT       NOT NULL DEFAULT 0,
    net_buy_volume BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT uq_ranking_snapshot UNIQUE (snap_date, investor_type, trade_type, market, rank)
);
```

스케줄러: 매 평일 15:35 자동 저장 (`RankingSnapshotScheduler.java`)

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

## 인증 (JWT)

### 방식

`spring-boot-starter-security` + `jjwt 0.11.5`. Stateless — 세션 없음.

### 흐름

```
POST /api/auth/login  { username, password }
→ 서버 검증 → JWT 발급 (24시간)
→ 클라이언트 localStorage 저장 (키: mp_token)
→ 이후 모든 요청 헤더: Authorization: Bearer <token>
→ 401 시 토큰 삭제 + /login 리다이렉트
```

### 보호 경로

`/api/investor/memo/**` 만 인증 필요. 나머지는 공개.

### 계정 관리

`application-local.yml` 에서 설정:

```yaml
app:
  auth:
    username: admin
    password: market2026
  jwt:
    secret: marketpulse-jwt-secret-key-local-dev  # 운영 시 반드시 교체
```

> 운영 배포 시 `jwt.secret`은 환경변수로 주입. 32자 이상 무작위 문자열 권장.

### 주요 파일

| 파일 | 역할 |
|------|------|
| `global/auth/JwtUtil.java` | 토큰 생성·검증 |
| `global/auth/JwtAuthenticationFilter.java` | 요청마다 Authorization 헤더 파싱 |
| `global/auth/AuthController.java` | `POST /api/auth/login`, `GET /api/auth/me` |
| `global/config/SecurityConfig.java` | 필터 체인 구성 |
| `global/config/AuthConfig.java` | `UserDetailsService` + `AuthenticationManager` 빈 |

---

## stock_master + 종목 상세 + 메모 태그 스펙 (구현 예정)

### stock_master 도메인

#### DB
```sql
CREATE TABLE stock_master (
    code       VARCHAR(10)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    market     VARCHAR(10)  NOT NULL,   -- 'KOSPI' | 'KOSDAQ'
    sector     VARCHAR(100),
    updated_at TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX idx_stock_master_name ON stock_master(name);
```

#### 파일 구조
```
domain/stock/
├── controller/StockController.java      # 기존 foreign-trade + 신규 검색·상세
├── service/StockMasterService.java      # 검색, 업데이트 로직
├── service/StockDetailService.java      # KIS API 연동 (현재가·차트·투자자)
├── dto/StockSearchResultDto.java
├── dto/StockDetailDto.java
├── dto/StockChartDto.java
├── mapper/StockMasterMapper.java
├── vo/StockMasterVo.java
└── scheduler/StockMasterScheduler.java  # 매일 자정 갱신
resources/mapper/stock/StockMasterMapper.xml
```

#### REST API
```
GET /api/stock/search?q=삼성&limit=10
  → [{ code, name, market, sector }]

GET /api/stock/detail?code=005930
  → { code, name, market, currentPrice, changeRate, volume, ... }

GET /api/stock/chart?code=005930&period=1M|3M|1Y
  → [{ date, open, high, low, close, volume }]

GET /api/stock/investor?code=005930
  → { foreign: { buy, sell, net }, institution: { buy, sell, net } }
```

#### 스케줄러
```java
// StockMasterScheduler.java
@Component
@RequiredArgsConstructor
public class StockMasterScheduler {

    @Scheduled(cron = "0 0 0 * * *")  // 매일 자정
    public void updateStockMaster() {
        // 데이터 소스 형식에 따라 구현 (KRX CSV 파싱 또는 API 호출)
        // ⚠️ 데이터 소스 미정 — 전달받은 형식 기준으로 구현
    }
}
```

> `@EnableScheduling`은 `global/config/SchedulerConfig.java`에 추가.

#### KIS API (종목 상세)
| TR ID | 경로 | 용도 |
|-------|------|------|
| `FHKST01010100` | `/uapi/domestic-stock/v1/quotations/inquire-price` | 주식현재가시세 |
| `FHKST01010400` | `/uapi/domestic-stock/v1/quotations/inquire-daily-price` | 일자별 가격 |
| `FHKST01010900` | 기존 경로 동일 | 투자자 동향 (종목 단위) |

---

### memo_stock_tag 스펙

#### DB
```sql
CREATE TABLE memo_stock_tag (
    id                 BIGSERIAL   PRIMARY KEY,
    memo_id            BIGINT      NOT NULL REFERENCES investor_memo(id) ON DELETE CASCADE,
    stock_code         VARCHAR(10) NOT NULL,
    stock_name         VARCHAR(100) NOT NULL,
    price_at_tag       BIGINT      NOT NULL,
    change_rate_at_tag DECIMAL(8,2),
    tagged_at          TIMESTAMP   DEFAULT NOW()
);
```

#### 파일 구조
```
domain/investor/
├── dto/MemoStockTagDto.java
├── dto/MemoTagRequestDto.java    # { stockCode, stockName, priceAtTag, changeRateAtTag }
├── mapper/MemoStockTagMapper.java
└── vo/MemoStockTagVo.java
resources/mapper/investor/MemoStockTagMapper.xml
```

#### REST API
```
POST   /api/investor/memo/{memoId}/tag
  body: { stockCode, stockName, priceAtTag, changeRateAtTag }
DELETE /api/investor/memo/tag/{tagId}
```

`GET /api/investor/memo` 응답의 `MemoResponseDto`에 `List<MemoStockTagDto> tags` 필드 포함.

#### 보호 경로
`/api/investor/memo/**` 전체가 인증 필요이므로 태그 API도 자동으로 보호됨.

---

## CORS 설정

`application.yml` → `app.cors.allowed-origins` 에서 관리.
현재 허용: `localhost:3000`, `localhost:8080`.
운영 배포 시 실제 도메인으로 교체 필요. `"*"` 사용 금지.
