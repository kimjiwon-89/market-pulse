# Market Pulse 프로젝트

주식 시장 데이터를 시각화하는 풀스택 웹 애플리케이션.
한국투자증권 Open API(KIS)에서 데이터를 받아 대시보드로 보여준다.

## 프로젝트 구조

```
market-pulse/
├── market-pulse-api/   # Spring Boot 백엔드
├── market-pulse-web/   # React 프론트엔드 (메인, 개발 여기서)
└── .claude/
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
| investor | `GET /api/investor` | 투자자 동향 (미구현) |

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
| `/investor` | InvestorTrend | 투자자 동향 |
| `/net-buy` | NetBuyingList | 외국인 순매수 목록 |

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
