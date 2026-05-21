# Codex Trading Skills 조사

작성일: 2026-05-21
목적: Codex에 설치 가능한 트레이딩/퀀트/백테스팅/실거래 관련 agent skill 후보를 정리하고, 2026-05-22에 설치 후 분석할 작업을 예약한다.

## 현재 설치 상태

- 현재 로컬에서 확인된 사용자 설치 스킬: `find-skills`, `cavecrew`
- 현재 세션 기본 스킬에는 트레이딩 전용 스킬 없음
- 검색 도구: `npx --yes skills find ...`
- 검색 키워드:
  - `trading`
  - `crypto trading`
  - `stock trading`
  - `backtesting`
  - `quant trading`

## 우선 설치 후보

Market Pulse의 퀀트/백테스트/국내 주식 분석 흐름과 맞는 후보다. 내일 먼저 받아서 `SKILL.md`와 포함 스크립트/참조 파일을 읽어볼 것.

| 우선순위 | Skill | 설치수 | 성격 | 설치 명령 |
|---:|---|---:|---|---|
| 1 | `wshobson/agents@backtesting-frameworks` | 10.6K | 백테스트 프레임워크, 편향 방지, 검증 프로세스 | `npx skills add wshobson/agents@backtesting-frameworks -g -y` |
| 2 | `binance/binance-skills-hub@trading-signal` | 5.9K | 트레이딩 시그널 | `npx skills add binance/binance-skills-hub@trading-signal -g -y` |
| 3 | `jeremylongshore/claude-code-plugins-plus-skills@backtesting-trading-strategies` | 3.7K | 매매 전략 백테스팅 | `npx skills add jeremylongshore/claude-code-plugins-plus-skills@backtesting-trading-strategies -g -y` |
| 4 | `tradermonty/claude-trading-skills@us-stock-analysis` | 2.3K | 미국 주식 분석 | `npx skills add tradermonty/claude-trading-skills@us-stock-analysis -g -y` |
| 5 | `gracefullight/stock-checker@trading-analysis` | 1.8K | 주식 트레이딩 분석 | `npx skills add gracefullight/stock-checker@trading-analysis -g -y` |
| 6 | `marketcalls/vectorbt-backtesting-skills@backtest` | 1.4K | vectorbt 기반 백테스트 | `npx skills add marketcalls/vectorbt-backtesting-skills@backtest -g -y` |
| 7 | `marketcalls/vectorbt-backtesting-skills@vectorbt-expert` | 1.3K | vectorbt 전문 워크플로우 | `npx skills add marketcalls/vectorbt-backtesting-skills@vectorbt-expert -g -y` |
| 8 | `gracefullight/stock-checker@backtesting-trading-strategies` | 1.3K | 주식 전략 백테스트 | `npx skills add gracefullight/stock-checker@backtesting-trading-strategies -g -y` |

## 추가 분석 후보

설치수는 낮거나 도메인이 좁지만, MP_CORE 확장 또는 실거래 검토에 참고할 수 있다.

| Skill | 설치수 | 성격 | 설치 명령 |
|---|---:|---|---|
| `marketcalls/vectorbt-backtesting-skills@optimize` | 989 | vectorbt 최적화 | `npx skills add marketcalls/vectorbt-backtesting-skills@optimize -g -y` |
| `marketcalls/vectorbt-backtesting-skills@strategy-compare` | 945 | 전략 비교 | `npx skills add marketcalls/vectorbt-backtesting-skills@strategy-compare -g -y` |
| `hypier/tradingview-quantitative-skills@tradingview-quantitative` | 873 | TradingView/퀀트 분석 | `npx skills add hypier/tradingview-quantitative-skills@tradingview-quantitative -g -y` |
| `personamanagmentlayer/pcl@trading-expert` | 768 | 일반 트레이딩 전문가 | `npx skills add personamanagmentlayer/pcl@trading-expert -g -y` |
| `kukapay/crypto-skills@trading-strategist` | 694 | 크립토 전략 | `npx skills add kukapay/crypto-skills@trading-strategist -g -y` |
| `omer-metin/skills-for-antigravity@crypto-trading-bots` | 659 | 크립토 트레이딩 봇 | `npx skills add omer-metin/skills-for-antigravity@crypto-trading-bots -g -y` |
| `lanyasheng/trading-quant@trading-quant` | 601 | 퀀트 트레이딩 | `npx skills add lanyasheng/trading-quant@trading-quant -g -y` |
| `sickn33/antigravity-awesome-skills@quant-analyst` | 503 | 퀀트 분석, 리스크 지표, 포트폴리오 | `npx skills add sickn33/antigravity-awesome-skills@quant-analyst -g -y` |
| `crypto-com/crypto-agent-trading@crypto-com-app` | 456 | Crypto.com 앱 연동 | `npx skills add crypto-com/crypto-agent-trading@crypto-com-app -g -y` |
| `meo9rhsan3492-cell/cn-stock-sim@stock-trading` | 376 | 중국 주식 시뮬레이션 | `npx skills add meo9rhsan3492-cell/cn-stock-sim@stock-trading -g -y` |
| `crypto-com/crypto-agent-trading@crypto-agent-trading` | 339 | 크립토 agent trading | `npx skills add crypto-com/crypto-agent-trading@crypto-agent-trading -g -y` |
| `omer-metin/skills-for-antigravity@algorithmic-trading` | 337 | 알고리즘 트레이딩 | `npx skills add omer-metin/skills-for-antigravity@algorithmic-trading -g -y` |
| `0xrikt/crypto-skills@crypto-trading-advisor` | 242 | 크립토 트레이딩 조언 | `npx skills add 0xrikt/crypto-skills@crypto-trading-advisor -g -y` |
| `skills.volces.com@quant-trading-cn` | 159 | 중국어권 퀀트 트레이딩 | `npx skills add skills.volces.com@quant-trading-cn -g -y` |
| `kirkluokun/awesome-a-stock-openclawskills@stock-trade-journal` | 143 | 주식 매매 일지 | `npx skills add kirkluokun/awesome-a-stock-openclawskills@stock-trade-journal -g -y` |
| `alsk1992/cloddsbot@crypto-hft` | 117 | 크립토 HFT | `npx skills add alsk1992/cloddsbot@crypto-hft -g -y` |
| `storyclaw-official/talenthub@storyclaw-alpaca-trading` | 100 | Alpaca 실거래/페이퍼 트레이딩 가능성 | `npx skills add storyclaw-official/talenthub@storyclaw-alpaca-trading -g -y` |

## 실거래 연동 후보

아래 후보는 실제 주문, 계좌, 지갑, API 키, 거래소 권한과 연결될 수 있다. 설치 전후에 반드시 `SKILL.md`와 스크립트를 확인하고, 기본 분석은 read-only 또는 paper trading 기준으로 제한한다.

| Skill | 설치수 | 주의점 |
|---|---:|---|
| `binance/binance-skills-hub@derivatives-trading-usds-futures` | 2.3K | Binance USD-S 선물. 레버리지/주문 권한 가능성 확인 필요 |
| `binance/binance-skills-hub@margin-trading` | 1.9K | Binance 마진. 차입/청산 리스크와 API 권한 확인 필요 |
| `crypto-com/crypto-agent-trading@crypto-com-app` | 456 | Crypto.com 계정/API 연동 가능성 확인 필요 |
| `crypto-com/crypto-agent-trading@crypto-agent-trading` | 339 | 실거래 실행 API 여부 확인 필요 |
| `storyclaw-official/talenthub@storyclaw-alpaca-trading` | 100 | Alpaca paper/live 구분 확인 필요 |

## 참고로 검색된 관련 스킬

웹 검색에서 추가로 발견된 후보. 내일 `npx skills find` 또는 skills.sh 페이지로 재확인한다.

| Skill | 성격 | 설치 명령 |
|---|---|---|
| `tradermonty/claude-trading-skills@backtest-expert` | 보수적 백테스트 방법론 | `npx skills add tradermonty/claude-trading-skills@backtest-expert -g -y` |
| `tradermonty/claude-trading-skills@institutional-flow-tracker` | 13F 기반 기관 수급 추적 | `npx skills add tradermonty/claude-trading-skills@institutional-flow-tracker -g -y` |
| `rmyndharis/antigravity-skills@backtesting-frameworks` | 백테스트 프레임워크 | `npx skills add rmyndharis/antigravity-skills@backtesting-frameworks -g -y` |
| `kasyap1234/delta-go@hft-quant-expert` | DeFi/크립토 파생 퀀트 | `npx skills add kasyap1234/delta-go@hft-quant-expert -g -y` |
| `koreal6803/finlab-ai@finlab` | FinLab 퀀트 패키지 | `npx skills add koreal6803/finlab-ai@finlab -g -y` |
| `sendaifun/skills@dflow` | Solana spot/prediction market trading infra | `npx skills add sendaifun/skills@dflow -g -y` |
| `sendaifun/skills@ranger-finance` | Solana perpetual futures aggregator | `npx skills add sendaifun/skills@ranger-finance -g -y` |
| `bankrbot/openclaw-skills@bankr` | 멀티체인 크립토 실거래 agent | `npx skills add https://github.com/bankrbot/openclaw-skills --skill bankr -g -y` |

## 2026-05-22 내일 할 일

### 1. 스킬 다운로드

- 우선 설치 후보 8개를 먼저 설치한다.
- 설치 위치는 전역(`-g`)으로 하되, 설치 전 현재 `~/.agents/skills`와 `~/.codex/skills` 상태를 기록한다.
- 설치 실패가 있으면 실패 원인과 재시도 명령을 이 파일에 업데이트한다.

### 2. 스킬별 안전 감사

- 각 스킬의 `SKILL.md`를 읽고 다음 항목을 표로 정리한다.
  - 목적과 trigger 조건
  - 실거래/주문 실행 가능 여부
  - API key, wallet, exchange credential 요구 여부
  - 외부 네트워크 호출/스크립트 실행 여부
  - Market Pulse의 MP_CORE/백테스트/대시보드에 바로 적용 가능한 지침
- 실거래 후보는 별도 등급을 매긴다.
  - `SAFE_RESEARCH`: 문서/분석만 수행
  - `READ_ONLY`: 조회 API 또는 paper trading 중심
  - `TRADE_CAPABLE`: 주문 실행 가능성 있음. 기본 비활성 취급

### 3. Market Pulse 적용성 분석

- 백테스팅 계열 스킬이 현재 `market-pulse-api`의 `quant_backtest_result`, `quant_trade_log`, MP_CORE feature/signal 구조와 맞는지 비교한다.
- `vectorbt` 계열 스킬은 Python 기반 분석 워크플로우로 분리 가능한지 검토한다.
- 주식 분석 스킬은 국내장(KRX/KIS) 데이터에 맞게 변환 가능한 개념만 추린다.
- 크립토/해외주식 실거래 스킬은 당장 구현하지 않고 위험/권한 모델만 정리한다.

### 4. 산출물

- `.Codex/reports/trading-skills-analysis.md`
  - 설치 결과
  - 스킬별 요약
  - 안전 등급
  - Market Pulse 적용 후보
  - 버릴 후보와 이유
- 필요하면 유저용 요약은 별도 HTML로 만든다.

## 메모

- 이 문서는 투자 조언이 아니라 개발/도구 조사 문서다.
- 실거래 스킬은 설치만으로도 스크립트와 의존성 신뢰 문제가 생길 수 있으므로, 내일 분석 전 `SKILL.md`와 repository 출처를 먼저 확인한다.
- 주문 실행 기능은 사용자가 명시적으로 승인하기 전까지 연결하지 않는다.
