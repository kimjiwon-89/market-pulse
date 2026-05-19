# 투자자 매매동향 + 메모 기능

**상태**: 구현 완료  
**페이지**: `/investor` (InvestorTrend), `/memo` (MemoList)

---

## 기능 요약

외국인·기관의 일별 순매수·순매도 상위 20위를 시장별로 조회.  
날짜 + 시장 조합으로 메모를 남기고, 메모 모아보기 페이지에서 히스토리 관리.

---

## 데이터 소스

KIS API `FHKST01010900` — 국내기관·외국인 매매종목 가집계

---

## API

```
GET  /api/investor/trade-top?market=KOSPI|KOSDAQ&investorType=FOREIGN|INSTITUTION&tradeType=BUY|SELL&date=YYYYMMDD
GET  /api/investor/memo?date=YYYYMMDD&market=KOSPI|KOSDAQ
POST /api/investor/memo         { date, market, content }   ← upsert
DELETE /api/investor/memo/{id}
GET  /api/investor/memo/list?market=KOSPI|KOSDAQ&page=0&size=20
```

---

## UI 구성

### InvestorTrend (`/investor`)
- 날짜 선택기 (기본: 오늘)
- 탭: 코스피 / 코스닥 → 외국인 / 기관 → 순매수 / 순매도
- 순위 테이블 (순위 / 종목명 / 순매수대금 / 순매수량)
- 하단 메모 입력창 (날짜·시장 전환 시 해당 메모 자동 로드)

### MemoList (`/memo`)
- 코스피 / 코스닥 탭
- 날짜 내림차순 리스트
- 항목 클릭 → `/investor?date=YYYYMMDD&market=...` 이동

---

## DB

```sql
CREATE TABLE investor_memo (
    id         BIGSERIAL    PRIMARY KEY,
    memo_date  DATE         NOT NULL,
    market     VARCHAR(10)  NOT NULL,
    content    TEXT         NOT NULL,
    created_at TIMESTAMP    DEFAULT NOW(),
    updated_at TIMESTAMP    DEFAULT NOW(),
    UNIQUE (memo_date, market)
);
```

---

## 확장 예정: @종목 태그

> 상세 스펙 → `stock.md` — "@mention 태그" 섹션

- 메모 작성 중 `@` 입력 → stock_master 검색 드롭다운
- 종목 선택 시 현재가 스냅샷 함께 저장
- 메모 카드에 태그 뱃지 표시 (기준가 → 현재가 등락률 포함)
- stock_master 구현 완료 후 추가
