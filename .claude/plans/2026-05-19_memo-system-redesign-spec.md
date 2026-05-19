# 범용 메모 시스템 개편 Spec

## 메타
- 상태: PLANNING
- 작성일: 2026-05-19
- 브랜치: `feature/memo-system-redesign`
- 대상 영역: backend + frontend
- 우선순위: 메모 구조 개편 후 `@종목 태그`/가격 스냅샷 확장

## 배경
현재 메모는 `investor_memo` 테이블에서 `memo_date + market` 조합당 1개만 저장된다.
이 구조는 날짜별 시장 코멘트에는 적합하지만, 아래 요구에는 맞지 않는다.

- 사용자가 언제든 여러 메모를 작성
- 순매수도/투자자 동향/종목 상세 등 기능별 메모 조회
- 특정 날짜, 시장, 종목, 화면 맥락에 연결된 메모 조회
- 전체 메모 리스트에서 기능/날짜/시장/종목/키워드 필터
- 향후 `@종목 태그`와 저장 시점 가격 스냅샷 연결

## 목표
1. 메모를 날짜+시장 1개 upsert 구조에서 독립 레코드 생성 구조로 확장한다.
2. 메모가 어느 화면/기능에서 작성됐는지 `sourceType`으로 기록한다.
3. 메모가 날짜, 시장, 종목 코드/종목명에 선택적으로 연결될 수 있게 한다.
4. `/memo` 전체 리스트에서 source/date/market/stock/keyword 필터를 지원한다.
5. 기존 `investor_memo` 기반 기능을 신규 범용 메모로 완전히 전환한다.

## 비목표
- 이번 1차 작업에서 가격 스냅샷까지 저장하지 않는다.
- 이번 1차 작업에서 자연어 `@mention` 파싱 자동완성까지 구현하지 않는다.
- 기존 `investor_memo` 데이터 마이그레이션은 하지 않는다.
- 로또 댓글 시스템과 통합하지 않는다.

## 용어
- sourceType: 메모가 작성된 기능/화면 맥락
- context: 날짜, 시장, 종목 등 메모가 붙는 대상 정보
- manual memo: 특정 화면 맥락 없이 사용자가 직접 만든 일반 메모

## Source Type
1차 지원:
- `INVESTOR_TREND`: 투자자 매매동향 화면
- `NET_BUY`: 순매수도 화면
- `STOCK_DETAIL`: 종목 상세 화면
- `MANUAL`: 전체 메모 화면에서 직접 작성

후속 후보:
- `LOTTO`
- `NEWS`
- `INDEX_DETAIL`

## DB 설계

### 신규 테이블: `memo`
```sql
CREATE TABLE IF NOT EXISTS memo (
    id          BIGSERIAL PRIMARY KEY,
    memo_date   DATE,
    source_type VARCHAR(30) NOT NULL,
    market      VARCHAR(10),
    stock_code  VARCHAR(10),
    stock_name  VARCHAR(100),
    title       VARCHAR(200),
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memo_date ON memo (memo_date DESC);
CREATE INDEX IF NOT EXISTS idx_memo_source ON memo (source_type);
CREATE INDEX IF NOT EXISTS idx_memo_market ON memo (market);
CREATE INDEX IF NOT EXISTS idx_memo_stock_code ON memo (stock_code);
```

### 후속 테이블: `memo_stock_snapshot`
이번 작업에서는 만들지 않거나 nullable placeholder 없이 다음 단계에서 별도 추가한다.

```sql
CREATE TABLE memo_stock_snapshot (
    id                  BIGSERIAL PRIMARY KEY,
    memo_id             BIGINT NOT NULL REFERENCES memo(id) ON DELETE CASCADE,
    stock_code          VARCHAR(10) NOT NULL,
    stock_name          VARCHAR(100) NOT NULL,
    price_at_memo       BIGINT NOT NULL,
    change_rate_at_memo DECIMAL(8,2),
    captured_at         TIMESTAMP DEFAULT NOW()
);
```

## API 설계

### 신규 범용 메모 API
경로는 `/api/memo`를 사용한다. 기존 `/api/investor/memo` endpoint는 제거한다.

```http
GET /api/memo
  ?sourceType=NET_BUY
  &from=20260501
  &to=20260519
  &market=KOSPI
  &stockCode=005930
  &keyword=외국인
  &page=0
  &size=20
```

```http
GET /api/memo/context
  ?sourceType=NET_BUY
  &date=20260519
  &market=KOSPI
  &stockCode=005930
```

```http
POST /api/memo
{
  "memoDate": "20260519",
  "sourceType": "NET_BUY",
  "market": "KOSPI",
  "stockCode": "005930",
  "stockName": "삼성전자",
  "title": "순매수도 1위 관찰",
  "content": "외국인 순매수 1위. 반도체 수급 계속 확인."
}
```

```http
PATCH /api/memo/{id}
{
  "title": "수정 제목",
  "content": "수정 내용"
}
```

```http
DELETE /api/memo/{id}
```

## 인증 정책
- `GET /api/memo/**`: 공개 또는 로그인 전용 중 결정 필요
- `POST/PATCH/DELETE /api/memo/**`: 로그인 필요 권장
- 사용자별 개인 메모라면 `username` 컬럼 추가 필요

## 결정 필요 사항
1. 메모 공개 범위
   - A안: 전체 사용자 공유 메모
   - B안: 로그인 사용자 개인 메모
   - 권장: B안. 투자 관찰 기록 성격상 개인 메모가 자연스럽다.

2. 기존 `investor_memo` 처리
   - 기존 API와 코드 제거
   - 기존 DB 테이블은 운영 DB에서 별도 정리 가능
   - 신규 작성/조회는 모두 `memo` 테이블만 사용

3. 화면별 메모 표시 방식
   - NET_BUY: 종목 행 단위 메모 버튼/아이콘
   - INVESTOR_TREND: 날짜+시장 전체 메모
   - STOCK_DETAIL: 종목 기준 메모 타임라인

## 1차 구현 범위 제안
1. Backend
   - `domain/memo` 신규 도메인 추가
   - `memo` 테이블 DDL 추가
   - `/api/memo` CRUD + 필터 조회
   - 로그인 사용자 개인 메모를 위한 `username` 컬럼 포함

2. Frontend
   - `/memo` 페이지를 새 API 기반 리스트/필터 구조로 전환
   - `/net-buy` 종목 행에서 메모 추가 버튼 제공
   - 작성 모달 또는 인라인 폼으로 `sourceType=NET_BUY`, 날짜, 시장, 종목 정보 포함 저장

3. Compatibility
   - 기존 InvestorTrend/NetBuyingList 메모 UI는 신규 `/api/memo`로 전환
   - legacy `/api/investor/memo`는 사용하지 않음

## Acceptance Criteria
- [ ] 로그인 사용자는 `/net-buy` 특정 날짜/시장/종목에 메모를 여러 개 작성할 수 있다.
- [ ] 같은 날짜+시장+종목에 여러 메모가 생성되어야 하며 upsert로 덮어쓰지 않는다.
- [ ] `/memo`에서 sourceType, 날짜 범위, 시장, 종목 코드, 키워드 필터가 동작한다.
- [ ] `/memo` 리스트 항목 클릭 시 원본 맥락으로 이동할 수 있다.
- [ ] 비로그인 사용자는 메모 작성/수정/삭제가 차단된다.
- [ ] 기존 `/api/investor/memo` 사용처가 제거된다.
- [ ] 백엔드 `mvn test` PASS
- [ ] 프론트 `npm run build` PASS

## 리스크
- 기존 화면에 날짜+시장 메모와 신규 메모가 병존하면 UX가 잠시 복잡해질 수 있다.
- 개인 메모로 갈 경우 기존 공유 메모와 정책 차이를 명확히 해야 한다.
- `memo`라는 일반 테이블명은 DB에 따라 예약어 충돌 가능성은 낮지만, 필요하면 `user_memo`로 변경할 수 있다.
