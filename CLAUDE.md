# Market Pulse 프로젝트

주식 시장 데이터를 시각화하는 풀스택 웹 애플리케이션.
한국투자증권 Open API(KIS)에서 데이터를 받아 대시보드로 보여준다.

## 작업 전 필독 규칙

**프론트엔드 작업 시** → 반드시 `.claude/.front/front.md` 먼저 읽고 시작
**백엔드 작업 시** → 반드시 `.claude/.back/back.md` 먼저 읽고 시작

각 파일에는 해당 영역의 컨벤션, 디렉터리 구조, 구현 스펙, 주의사항이 정리되어 있다.
작업 후 변경사항이 생기면 해당 md 파일도 함께 업데이트한다.

---

## 프로젝트 구조

```
market-pulse/
├── market-pulse-api/   # Spring Boot 백엔드
├── market-pulse-web/   # React 프론트엔드 (메인, 개발 여기서)
└── .claude/
    ├── .front/front.md # 프론트엔드 작업 가이드
    ├── .back/back.md   # 백엔드 작업 가이드
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
| index | `GET /api/index/inquire-daily-indexchartprice` | 국내 업종 기간별 시세 |
| stock | `GET /api/stock/foreign-trade` | 외국인 순매수 순위 |
| news | `GET /api/news/inquire-daily-news` | 국내 뉴스 |
| investor | `GET /api/investor/trade-top` `GET /api/investor/memo` | 투자자 매매동향 + 메모 |

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
│   └── stock/
├── external/        # KIS API 직접 호출 클라이언트
├── infrastructure/  # 토큰 발급/저장 인프라
└── global/          # 공통 응답(ApiResponse), CORS, Swagger, 예외 처리
```

**공통 응답 형식**
```java
ApiResponse<T>  // success() / error() 팩토리 메서드 사용
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

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | Dashboard | 메인 대시보드 |
| `/index/:id` | IndexDetail | 업종 상세 시세 |
| `/investor` | InvestorTrend | 투자자 매매동향 + 날짜별 메모 입력 |
| `/net-buy` | NetBuyingList | 외국인 순매수 목록 |
| `/memo` | MemoList | 메모 모아보기 |

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
| 국내기관_외국인 매매종목가집계 | `FHKST01010900` | 외국인/기관 순매수·순매도 상위 종목 |
| 시장별 투자자매매동향(일별) | `FHKST01010800` | 코스피/코스닥 시장 구분 |

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
- MyBatis XML 매퍼 위치: `src/main/resources/mapper/**/*.xml`
- `market-pulse-react`는 레거시 폴더. `market-pulse-web`으로 마이그레이션 완료 (styled-components → Tailwind, JSX → TSX)
