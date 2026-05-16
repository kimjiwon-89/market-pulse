# Market Pulse 프로젝트

주식 시장 데이터를 시각화하는 풀스택 웹 애플리케이션.
한국투자증권 Open API(KIS)에서 데이터를 받아 대시보드로 보여준다.

## Claude Code 서브에이전트 (cavecrew)

긴 세션에서 컨텍스트 절감을 위해 cavecrew 에이전트를 사용한다.  
`~/.claude/agents/`에 설치되어 있으며 Claude Code 재시작 없이 자동 인식됨.

| 에이전트 | 용도 | 사용 시점 |
|----------|------|-----------|
| `cavecrew-investigator` | 코드 탐색 (읽기 전용) | "X가 어디 정의됐나", "Y 호출부 찾아줘" |
| `cavecrew-builder` | 수술적 수정 (1-2파일) | 범위 명확한 소규모 편집 |
| `cavecrew-reviewer` | diff·파일 리뷰 | 버그·문제 탐지, 심각도별 정리 |

> 새 환경 설치 시: `.claude/.logs/2026-05-16-log.md` → "cavecrew 서브에이전트 설치" 섹션 참조

---

## ⚠️ Git 브랜치 전략 (중요)

**main 브랜치에 직접 커밋 금지** — main은 배포 브랜치.  
작업 시 반드시 feature 브랜치를 따서 작업 후 PR로 머지.

```bash
git checkout -b feature/작업명   # 브랜치 생성
git push -u origin feature/작업명
# 작업 완료 후 PR → main 머지
```

---

## 작업 전 필독 규칙

**프론트엔드 작업 시** → 반드시 아래 두 파일 먼저 읽고 시작
- `.claude/.front/front.md` — 컨벤션, 디렉터리 구조, 라우팅, API 패턴
- `.claude/.front/design-guide.md` — CSS 토큰, 타이포그래피, 컴포넌트 패턴, 페이지별 UI 스펙

**백엔드 작업 시** → 반드시 `.claude/.back/back.md` 먼저 읽고 시작

**KRX API 사용 시** → `.claude/.krx/krx.md` 참조 (인증키·엔드포인트 전체 목록)
- `.claude/.krx/krx-data-guide-summary.md` — 유료 히스토리컬 데이터 상품 목록 (추후 필요 시 참조)

각 파일에는 해당 영역의 컨벤션, 디렉터리 구조, 구현 스펙, 주의사항이 정리되어 있다.
작업 후 변경사항이 생기면 해당 md 파일도 함께 업데이트한다.

---

## 프로젝트 구조

```
market-pulse/
├── market-pulse-api/   # Spring Boot 백엔드
├── market-pulse-web/   # React 프론트엔드 (메인, 개발 여기서)
└── .claude/
    ├── .front/front.md         # 프론트엔드 작업 가이드
    ├── .front/design-guide.md  # 디자인 시스템 (CSS 토큰, 컴포넌트, 페이지 스펙)
    ├── .back/back.md           # 백엔드 작업 가이드
    └── .logs/          # 날짜별 작업 로그 (YYYY-MM-DD-log.md)
```

## 백엔드 (market-pulse-api)

**스택:** Java 17 · Spring Boot 3.2 · MyBatis · PostgreSQL · Redis · Swagger

**실행**
```bash
cd market-pulse-api
./mvnw spring-boot:run
# http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui/index.html
```

**DB 설정 (application-local.yml)**
```
DB:    jdbc:postgresql://localhost:5432/marketpulse (username: won)
Redis: localhost:6379
```

**KIS API 설정 (application.yml)**
```yaml
external.api:
  base-url: https://openapi.koreainvestment.com:9443
  app-key:    # 발급 필요
  app-secret: # 발급 필요
```

**도메인 구조**

| 도메인 | 경로 | 설명 |
|--------|------|------|
| stock-master | `GET /api/stock/search` | 전종목 검색 (stock_master 테이블 기반) |
| stock-detail | `GET /api/stock/detail` `GET /api/stock/chart` `GET /api/stock/investor` | 종목 상세 (현재가·차트·투자자) |

**기존 도메인 구조**

| 도메인 | 경로 | 설명 |
|--------|------|------|
| index | `GET /api/index/inquire-daily-indexchartprice` | 국내 업종 기간별 시세 |
| stock | `GET /api/stock/foreign-trade` | 투자자×거래유형×시장 필터 조합, 날짜별 시계열 |
| news | `GET /api/news/inquire-daily-news` | 국내 뉴스 |
| investor | `GET /api/investor/trade-top` `GET/POST/DELETE /api/investor/memo` | 투자자 매매동향 + 메모 |
| auth | `POST /api/auth/login` `GET /api/auth/me` | JWT 인증 |
| admin | `GET/POST/DELETE/PATCH /api/admin/users` | 사용자 관리 (ADMIN 전용) |

**인증 (JWT)**

- `POST /api/auth/login` — `{ username, password }` → `{ token, username, role }`
- 보호 경로: `/api/investor/memo/**` (인증 필요), `/api/admin/**` (ADMIN 전용)
- 나머지 조회 API는 공개
- 기본 계정: `admin / market2026` (앱 시작 시 자동 생성, `application-local.yml`에서 변경)

**토큰 관리 (TokenService)**

KIS API 인증 토큰을 3단계 캐싱으로 관리한다.
1. Redis 조회 → 유효하면 반환
2. DB 조회 → 유효하면 Redis에 저장 후 반환
3. 신규 발급 → DB + Redis 모두 저장

**패키지 구성**
```
com.marketpulse/
├── domain/          # 비즈니스 도메인 (controller / service / dto / mapper / vo)
│   ├── index/
│   ├── investor/
│   ├── news/
│   ├── stock/       # foreign-trade + stock_master 검색 + 종목 상세
│   └── user/        # 사용자 관리 (ADMIN API)
├── external/        # KIS API 직접 호출 클라이언트
├── infrastructure/  # 토큰 발급/저장 인프라
└── global/
    ├── auth/        # JwtUtil, JwtAuthenticationFilter, AuthController, InitialDataRunner
    ├── config/      # SecurityConfig, AuthConfig, WebConfig, SwaggerConfig, SchedulerConfig
    ├── exception/   # GlobalExceptionHandler
    └── response/    # ApiResponse<T>
```

**공통 응답 형식**
```java
ApiResponse.success(data)       // 성공
ApiResponse.failure("message")  // 실패  ← error() 아님 주의
```

---

## 프론트엔드 (market-pulse-web)

**스택:** React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router 7 · Recharts · Zustand · Axios

**실행**
```bash
cd market-pulse-web
npm install
npm run dev
# http://localhost:3000
```

**API 연결**
```ts
// src/services/apiClient.ts
baseURL: 'http://localhost:8080/api'
```

**페이지 라우팅**

| 경로 | 컴포넌트 | 인증 | 설명 |
|------|----------|------|------|
| `/login` | Login | 공개 | 로그인 |
| `/` | Dashboard | 공개 | 메인 대시보드 |
| `/index/:id` | IndexDetail | 공개 | 업종 상세 시세 |
| `/investor` | InvestorTrend | 공개 (메모만 인증) | 투자자 매매동향 + 메모 |
| `/net-buy` | NetBuyingList | 공개 | 순매수/순매도 순위 |
| `/memo` | MemoList | 공개 (메모만 인증) | 메모 모아보기 |
| `/news` | NewsList | 공개 | 뉴스 |
| `/stock/:code` | StockDetail | 공개 | 종목 상세 (현재가·차트·투자자동향) |
| `/lotto` | LottoAnalysis | 공개 (조합 저장만 인증) | 로또 분석 연구소 |
| `/admin` | Admin | ADMIN | 사용자 관리 |

**디렉터리 구조**
```
src/
├── app/router.tsx              # 라우터 정의
├── pages/                      # 페이지 컴포넌트
├── components/
│   ├── chart/RankingTable.tsx  # 순매수 순위 테이블
│   └── common/                 # DefaultLayout, Header, Nav, Footer
├── services/apiClient.ts
├── hooks/index.ts
└── types/index.ts              # RankingItem 등 공통 타입
```

---

## 투자자 매매동향 기능 (investor 도메인)

외국인/기관의 일별 순매수·순매도 상위 20위를 시장별로 조회하고,
날짜+시장별로 메모를 남기고 모아볼 수 있는 기능.

### 데이터 소스

KIS API — `[국내주식] 시세분석` 카테고리 사용.
KIS 데이터는 KRX(한국거래소) 기반이므로 객관성 확보됨.

| KIS 엔드포인트 | TR ID | 용도 |
|---|---|---|
| 국내기관_외국인 매매종목가집계 | `FHKST01010900` | 외국인/기관 순매수·순매도 상위 종목 + 시장별 투자자 흐름 |

> ⚠️ `FHKST01010800`은 KIS에 존재하지 않음. `FHKST01010900`으로 통일.

### API 설계

```
# 순매수·순매도 상위 종목 조회
GET /api/investor/trade-top
  ?market=KOSPI|KOSDAQ               # 시장 구분
  &investorType=FOREIGN|INSTITUTION  # 외국인/기관
  &tradeType=BUY|SELL                # 순매수/순매도
  &date=20260514                     # 조회 날짜 (기본값: 오늘)

# 메모 — 날짜+시장별 1개, upsert
GET    /api/investor/memo?date=20260514&market=KOSPI|KOSDAQ
POST   /api/investor/memo
  body: { date: "20260514", market: "KOSPI", content: "..." }
DELETE /api/investor/memo/{id}

# 메모 모아보기 (최신순)
GET    /api/investor/memo/list?market=KOSPI|KOSDAQ&page=0&size=20
```

### 백엔드 구현 위치

```
com.marketpulse/
└── domain/investor/
    ├── controller/InvestorController.java
    ├── service/InvestorService.java
    ├── dto/TradeTopRequestDto.java
    ├── dto/TradeTopResponseDto.java
    ├── dto/MemoRequestDto.java
    ├── dto/MemoResponseDto.java
    ├── mapper/MemoMapper.java
    └── vo/MemoVo.java
```

### DB 테이블

메모는 PostgreSQL에 저장. `memo_date + market` 조합에 unique 제약.

```sql
CREATE TABLE investor_memo (
    id         BIGSERIAL    PRIMARY KEY,
    memo_date  DATE         NOT NULL,
    market     VARCHAR(10)  NOT NULL,  -- 'KOSPI' | 'KOSDAQ'
    content    TEXT         NOT NULL,
    created_at TIMESTAMP    DEFAULT NOW(),
    updated_at TIMESTAMP    DEFAULT NOW(),
    UNIQUE (memo_date, market)          -- 날짜+시장 조합당 1개
);
```

POST는 upsert로 처리 (날짜+시장 중복이면 content 업데이트).

### 프론트엔드 UI

**InvestorTrend (`/investor`)**
- 날짜 선택기 (기본값: 오늘)
- 탭: 코스피 / 코스닥
- 탭: 외국인 / 기관
- 탭: 순매수 / 순매도
- 순위 테이블 (순위 / 종목명 / 순매수대금 / 순매수량)
- 하단 메모 입력창 + 저장 버튼 (날짜·시장 탭 전환 시 해당 메모 자동 로드)
- 메모 삭제 버튼

**MemoList (`/memo`)**
- 코스피 / 코스닥 탭 구분
- 날짜 내림차순 리스트
- 각 항목: 날짜 + 시장 + 메모 내용 미리보기
- 항목 클릭 시 `/investor?date=YYYYMMDD&market=KOSPI|KOSDAQ` 로 이동

---

## 종목 마스터 + 종목 상세 + 메모 @태그 기능 (구현 예정)

> 상세 스펙은 `.claude/.back/back.md`, `.claude/.front/front.md` 참고

### 개요

1. **stock_master 테이블** — KRX 전종목(코드·이름·시장·업종) DB 저장, 매일 자정 자동 업데이트
2. **종목 상세 페이지** (`/stock/:code`) — KIS API로 현재가·일자별 차트·투자자동향 조회
3. **메모 @mention 태그** — 메모 작성 시 `@종목명` 입력 → 자동완성 드롭다운 → 저장 시 가격 스냅샷 기록

### DB 테이블 (신규 — psql 직접 생성 필요)

```sql
-- 전종목 마스터
CREATE TABLE stock_master (
    code       VARCHAR(10)  PRIMARY KEY,   -- 종목코드 (6자리)
    name       VARCHAR(100) NOT NULL,       -- 종목명
    market     VARCHAR(10)  NOT NULL,       -- 'KOSPI' | 'KOSDAQ'
    sector     VARCHAR(100),               -- 업종명
    updated_at TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX idx_stock_master_name ON stock_master(name);

-- 메모 종목 태그 (저장 시점 스냅샷 포함)
CREATE TABLE memo_stock_tag (
    id                  BIGSERIAL PRIMARY KEY,
    memo_id             BIGINT       NOT NULL REFERENCES investor_memo(id) ON DELETE CASCADE,
    stock_code          VARCHAR(10)  NOT NULL,
    stock_name          VARCHAR(100) NOT NULL,
    price_at_tag        BIGINT       NOT NULL,    -- 태그 시점 현재가
    change_rate_at_tag  DECIMAL(8,2),             -- 태그 시점 등락률
    tagged_at           TIMESTAMP    DEFAULT NOW()
);
```

### API (신규)

```
# 종목 검색 (stock_master 기반)
GET /api/stock/search?q=삼성&limit=10
  → [{ code, name, market, sector }]

# 종목 상세
GET /api/stock/detail?code=005930         # 현재가·기본정보 (KIS FHKST01010100)
GET /api/stock/chart?code=005930&period=1M|3M|1Y  # 일자별 차트 (KIS FHKST01010400)
GET /api/stock/investor?code=005930       # 투자자 동향 (KIS FHKST01010900)

# 메모 태그
POST   /api/investor/memo/{memoId}/tag
  body: { stockCode, stockName, priceAtTag, changeRateAtTag }
DELETE /api/investor/memo/tag/{tagId}
```

### 스케줄러

`@Scheduled(cron = "0 0 0 * * *")` — 매일 자정 stock_master 전체 갱신.
데이터 소스: KRX Open API — 아래 3개 엔드포인트 순서대로 호출 후 upsert.

### KIS API (종목 상세용)

| TR ID | 용도 |
|-------|------|
| `FHKST01010100` | 주식현재가시세 (현재가·등락률·거래량·시가총액 등) |
| `FHKST01010400` | 주식현재가 일자별 (차트 데이터) |
| `FHKST01010900` | 기관·외국인 매매동향 (종목 단위) |

---

## 로또 분석 연구소 기능 (구현 예정)

> 상세 기획: `.claude/.lotto/lotto-final-plan.md` / 수식 레퍼런스: `.claude/.lotto/lotto_machine_learning_analysis_overview_md.md`

### 컨셉

매 회차마다 5가지 통계 전략이 번호 풀(10개)을 생성하고 추천 조합 3개를 뽑는다.
당첨 결과가 나오면 전략별 적중률을 자동 계산·누적 → **전략 성적 대시보드** 제공.
사용자는 내 조합을 저장하고 회차 결과와 직접 비교할 수 있다.

### 5가지 분석 전략

| 전략 | 통합 원소 | 컨셉 |
|------|-----------|------|
| 모멘텀 | HOT + RISING | 최근 빈도 높고 상승 추세인 번호 |
| 잠수함 | COLD + FALLING | 장기 미출현 + 최근 더 줄어드는 번호 |
| 관계망 | 동반번호 + 연속번호 | 같이 나오는 번호 네트워크 |
| 위치 패턴 | 끝수 + 구간 | 강세 번호대·끝자리 흐름 |
| AI 스마트픽 | 밸런스 + 역배 + CORE + AI종합 | 다중 분석 가중합 종합 추천 |

### 핵심 흐름

```
매 회차 (토요일 밤 동행복권 API 수집 후)
├── 전략 5개 × 풀 10개 번호 계산
├── 각 풀에서 추천 조합 3개 생성 (필터: 합계 80~170, 홀짝 편차 ≤ 2, 구간 ≥ 3)
└── 당첨 번호 수집 → 풀·조합 적중률 자동 비교 저장

적중률 계산
├── 풀 적중률: 당첨 6개 중 Pool 10개에 포함된 수 / 6 * 100%
└── 조합 적중률: 조합 6개 중 당첨번호 일치 수 / 6 * 100%
```

### 데이터 소스

동행복권 공개 API (인증 불필요):
```
https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={회차}
```

### DB 테이블 (신규 — psql 직접 생성 필요)

```sql
CREATE TABLE lotto_result (
    draw_no    INTEGER PRIMARY KEY,
    draw_date  DATE NOT NULL,
    no1 INTEGER NOT NULL, no2 INTEGER NOT NULL, no3 INTEGER NOT NULL,
    no4 INTEGER NOT NULL, no5 INTEGER NOT NULL, no6 INTEGER NOT NULL,
    bonus_no   INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lotto_analysis_pool (
    id           BIGSERIAL PRIMARY KEY,
    draw_no      INTEGER NOT NULL,
    strategy     VARCHAR(20) NOT NULL,  -- MOMENTUM|SUBMARINE|NETWORK|PATTERN|AI_PICK
    pool_numbers INTEGER[] NOT NULL,    -- 10개
    combos       JSONB,                 -- 추천 조합 3개
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

CREATE TABLE lotto_analysis_result (
    id             BIGSERIAL PRIMARY KEY,
    draw_no        INTEGER NOT NULL,
    strategy       VARCHAR(20) NOT NULL,
    pool_hit_count INTEGER NOT NULL,
    combo_results  JSONB,
    created_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

CREATE TABLE lotto_user_combo (
    id         BIGSERIAL PRIMARY KEY,
    draw_no    INTEGER NOT NULL,
    numbers    INTEGER[] NOT NULL,  -- 6개
    hit_count  INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API

```
GET  /api/lotto/latest               -- 최신 회차 분석
GET  /api/lotto/rounds               -- 전체 회차 목록
GET  /api/lotto/analysis?round=1157  -- 특정 회차 5개 전략 풀 + 조합 + 적중률
GET  /api/lotto/stats                -- 전략별 누적 성적 (그래프용)

POST   /api/lotto/combo             -- 내 조합 저장 { drawNo, numbers[] }
GET    /api/lotto/combo             -- 내 저장 조합 목록
DELETE /api/lotto/combo/{id}        -- 삭제

POST   /api/lotto/analyze?round=N   -- DB 기존 데이터로 분석만 실행 (동행복권 수집 없이)
POST   /api/lotto/collect?from=N&to=M -- 역대 데이터 일괄 수집 (관리자용, 동행복권 API 봇차단 이슈 있음)
```

> ⚠️ 동행복권 API(`www.dhlottery.co.kr`)는 서버 측 HTTP 요청 시 봇 차단 (HTML 리다이렉트 반환).
> 초기 데이터는 psql로 직접 INSERT 후 `POST /api/lotto/analyze?round=N` 으로 분석 실행할 것.

### 페이지 라우팅

| 경로 | 컴포넌트 | 인증 | 설명 |
|------|----------|------|------|
| `/lotto` | LottoAnalysis | 공개 (조합 저장만 인증) | 로또 분석 연구소 |

### 화면 구성

| 화면 | 내용 |
|------|------|
| 최신 회차 | 5개 전략 풀(10개) + 추천 조합 3개씩 |
| 과거 회차 조회 | 해당 회차 풀/조합 + 실제 당첨번호 비교 + 적중률 |
| 성적 대시보드 | 전략별 누적 적중률 그래프 |
| 내 조합함 | 저장한 조합 + 회차별 적중 결과 |

### 스케줄러

`@Scheduled(cron = "0 30 21 * * SAT")` — 매주 토요일 21:30 동행복권 API 호출 → lotto_result 저장 → 분석 실행 → lotto_analysis_pool/result 저장

---

## 작업 로그

작업 기록은 `.claude/.logs/` 폴더에 날짜별 파일로 남긴다.

**파일 네이밍**: `YYYY-MM-DD-log.md`
예) `.claude/.logs/2026-05-14-log.md`

**작성 형식**
```markdown
## YYYY-MM-DD

### 작업 제목
- 변경 내용 요약
- 생성/수정/삭제한 파일
```

**규칙**
- 세션이 끝날 때, 또는 기능 단위 작업이 완료될 때마다 기록
- 같은 날 여러 작업이 있으면 `###` 섹션을 추가
- 파일 경로는 프로젝트 루트 기준 상대경로로 작성
- 날짜가 바뀌면 새 파일 생성

---

## 개발 시 주의사항

- CORS: 백엔드는 `localhost:3000`, `localhost:8080`만 허용. 운영 배포 시 `allowed-origins` 수정 필요
- KIS API app-key / app-secret은 `application.yml`에 직접 입력하지 말고 환경변수나 별도 설정파일로 관리
- JWT secret(`app.jwt.secret`)도 운영 시 환경변수로 주입. 32자 이상 무작위 문자열 권장
- MyBatis XML 매퍼 위치: `src/main/resources/mapper/**/*.xml`
- `ApiResponse.failure()` 사용 — `error()` 없음
- DB 테이블(`users`, `investor_memo`, `api_token`)은 `data.sql` 참고용, 실제 생성은 psql 직접 실행 필요
- Maven 실행 시 Java 17 명시 필요: `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn ...`

---

## KRX Open API

> 상세 스펙 전체: `.claude/.krx/krx.md`

**인증키**: `CE1A080A2E5A480B8BB511D1386FFD0E33A33D83`
**Base URL**: `https://data-dbg.krx.co.kr/svc/apis`

**인증 방법** — 모든 API 공통

```
POST {endpoint}
Headers:  AUTH_KEY: CE1A080A2E5A480B8BB511D1386FFD0E33A33D83
Body:     {"basDd":"YYYYMMDD"}
Response: {"OutBlock_1":[...]}
```

### 카테고리별 경로 요약

| 카테고리 | 경로 prefix | 대표 API |
|---------|------------|---------|
| 지수 | `/idx/` | `krx_dd_trd`, `kosdaq_dd_trd`, `bon_dd_trd`, `drvprod_dd_trd` |
| 주식 | `/sto/` | `stk_bydd_trd`(유가), `ksq_bydd_trd`(코스닥), `stk_isu_base_info`(기본정보) |
| ETP | `/etp/` | `etf_bydd_trd`, `etn_bydd_trd`, `elw_bydd_trd` |
| 채권 | `/bon/` | `kts_bydd_trd`(국채), `bnd_bydd_trd`(일반채권) |
| 파생 | `/drv/` | `fut_bydd_trd`(선물), `opt_bydd_trd`(옵션) |
| 일반상품 | `/gen/` | `gold_bydd_trd`(금), `oil_bydd_trd`(석유), `ets_bydd_trd`(배출권) |
| ESG | `/esg/` | `esg_index_info`, `esg_etp_info` |

### stock_master 갱신에 사용하는 API

| 시장 | 엔드포인트 |
|-----|-----------|
| 유가증권(KOSPI) | `POST /sto/stk_isu_base_info` |
| 코스닥 | `POST /sto/ksq_isu_base_info` |
| 코넥스 | `POST /sto/knx_isu_base_info` |

**필드 매핑**: `ISU_SRT_CD` → code(6자리), `ISU_ABBRV`(없으면 `ISU_NM`) → name, `MKT_TP_NM` → market, `SECT_TP_NM` → sector
