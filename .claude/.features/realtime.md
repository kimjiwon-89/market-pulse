# 실시간 데이터 갱신

**상태**: 구현 완료 (일부)  
**방식**: 프론트 폴링 (`setInterval`) — 추가 인프라 없이 단순·안정적

---

## 구현 완료

### `useIsMarketOpen` 훅

```ts
// src/hooks/index.ts
export function useIsMarketOpen(): boolean
// 평일 09:00~15:30 KST 기준, 1분마다 갱신
```

### `LiveBadge` 컴포넌트

```tsx
import { LiveBadge } from "@/components/common/LiveBadge";
// 장중: 초록 펄스 점 + "실시간"
// 장 마감: "종가" (흐린 회색)
<LiveBadge size={11} />
```

적용 위치: Header, Dashboard 시장지수, InvestorTrend 열 헤더, NetBuyingList 오늘 컬럼

---

## 폴링 계획

| 데이터 | 위치 | 간격 | 조건 |
|--------|------|------|------|
| 시장 지수 (KOSPI/KOSDAQ/KOSPI200) | Dashboard | 10초 | 장중에만 |
| 종목 현재가 | StockDetail | 10초 | 장중에만 |
| 투자자 동향 | Dashboard, InvestorTrend | 30초 | 장중에만 |

### 패턴

```ts
useEffect(() => {
  if (!isMarketOpen()) return;
  const id = setInterval(fetchData, 10_000);
  return () => clearInterval(id);
}, [fetchData]);
```

- 장 외 시간에는 interval 등록 자체 안 함 (불필요 KIS API 호출 방지)
- cleanup으로 언마운트 시 자동 해제
- 요청 실패해도 다음 tick에 자동 재시도

---

## 확장 고려

- **WebSocket / SSE** — 서버 푸시 방식 (KIS API가 웹소켓 지원하면 전환 검토)
- **브라우저 푸시 알림** — 특정 종목 등락률 임계치 도달 시 알림
