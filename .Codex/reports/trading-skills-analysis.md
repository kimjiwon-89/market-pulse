# Trading Skills -> Market Pulse 적용 분석

date: 2026-05-22
scope: skills.sh search + current MP_CORE docs/code mapping
status: APPLY_AS_ROADMAP

## 1. 분류 기준

| 등급 | 의미 | 기본 처리 |
|---|---|---|
| `MP_CORE_NOW` | 현재 데이터/구조로 바로 반영 가능 | planner 승인 후 구현 |
| `MP_CORE_NEXT` | 데이터/스키마 보강 후 반영 | 다음 버전 후보 |
| `LIVE_TRADING_LATER` | 실시간 주문/체결/리스크 엔진 필요 | 별도 안전 설계 후 |
| `RESEARCH_ONLY` | 개념 참고 또는 보조 분석 | 설치/참고 가능 |
| `REJECT_OR_DEFER` | 도메인 불일치/설치수 낮음/위험 큼 | 지금 미사용 |

## 2. 검색 결과 요약

| Skill | Installs | 성격 | 등급 | Market Pulse 적용 |
|---|---:|---|---|---|
| `wshobson/agents@backtesting-frameworks` | 10.7K | 백테스트 프레임워크/편향 방지 | `MP_CORE_NOW` | look-ahead, 비용, 회전율, 재현성 체크리스트 |
| `jeremylongshore/...@backtesting-trading-strategies` | 3.7K | 전략 백테스트 | `MP_CORE_NOW` | MP_CORE 실험/전략 비교 기준 |
| `marketcalls/vectorbt-backtesting-skills@backtest` | 1.4K | vectorbt 백테스트 | `MP_CORE_NEXT` | Python 리서치 엔진 후보 |
| `marketcalls/...@vectorbt-expert` | 1.3K | vectorbt 워크플로우 | `MP_CORE_NEXT` | 대량 파라미터 실험 후보 |
| `marketcalls/...@optimize` | 996 | 최적화 | `MP_CORE_NEXT` | 과최적화 방지 조건 포함해 제한 사용 |
| `marketcalls/...@strategy-compare` | 950 | 전략 비교 | `MP_CORE_NOW` | MP_CORE vs baseline/variant 비교 |
| `binance/...@trading-signal` | 5.9K | 트레이딩 시그널 | `RESEARCH_ONLY` | 신호 구조 참고. 국내주식 직접 적용 X |
| `gracefullight/stock-checker@trading-analysis` | 1.8K | 주식 분석 | `RESEARCH_ONLY` | 종목 분석 UI/체크리스트 참고 |
| `gracefullight/...@backtesting-trading-strategies` | 1.3K | 주식 전략 백테스트 | `MP_CORE_NOW` | 국내 KRX/KIS 데이터로 개념 변환 |
| `tradermonty/...@us-stock-analysis` | 2.3K | 미국주식 분석 | `RESEARCH_ONLY` | 종목 분석 프레임만 참고 |
| `affaan-m/...@llm-trading-agent-security` | 2.5K | LLM trading 보안 | `LIVE_TRADING_LATER` | 실시간 주문 전 필수 안전 감사 기준 |
| `0xhubed/...@risk-management` | 1.5K | 트레이딩 리스크 | `MP_CORE_NOW` | 포지션 cap, 손실 제한, drawdown guard |
| `omer-metin/...@risk-management-trading` | 295 | 리스크 관리 | `MP_CORE_NEXT` | 보조 체크리스트 |
| `ruvnet/ruflo@trader-risk` | 219 | 트레이더 리스크 | `MP_CORE_NEXT` | 보조 체크리스트 |
| `letta-ai/skills@portfolio-optimization` | 101 | 포트폴리오 최적화 | `MP_CORE_NEXT` | HRP/min-var 후보. 지금은 cap 규칙 우선 |
| `hypier/...@tradingview-quantitative` | 879 | TradingView/퀀트 | `RESEARCH_ONLY` | 지표/차트 표현 참고 |
| `lanyasheng/trading-quant@trading-quant` | 602 | 퀀트 트레이딩 | `RESEARCH_ONLY` | 설치 후 SKILL 감사 후보 |
| `sickn33/...@quant-analyst` | 506 | 퀀트/리스크/포트폴리오 | `MP_CORE_NEXT` | diagnostics/성과평가 보강 |
| `personamanagmentlayer/pcl@trading-expert` | 770 | 일반 트레이딩 전문가 | `RESEARCH_ONLY` | 개념 참고. 코드 의존 X |
| `meo9rhsan3492-cell/...@stock-trading` | 376 | 중국 주식 시뮬레이션 | `REJECT_OR_DEFER` | 국내장과 불일치 |
| `skills.volces.com@sim-trade` | 94 | 모의거래 | `LIVE_TRADING_LATER` | 낮은 설치수. paper trading 개념만 참고 |
| `storyclaw-official/...@alpaca-trading` | 100 | Alpaca paper/live | `LIVE_TRADING_LATER` | 해외 broker. 국내 실거래 직접 적용 X |
| `crypto-com/...@crypto-com-app` | 463 | Crypto.com | `REJECT_OR_DEFER` | 크립토/계정 연동 위험 |
| `crypto-com/...@crypto-agent-trading` | 339 | 크립토 agent trading | `REJECT_OR_DEFER` | 주문 기능 위험 |
| `binance/...@derivatives-trading-usds-futures` | 2.3K | Binance 선물 | `REJECT_OR_DEFER` | 레버리지/청산 위험. 국내주식 X |
| `binance/...@margin-trading` | 1.9K | Binance 마진 | `REJECT_OR_DEFER` | 차입/청산 위험 |
| `kukapay/...@trading-strategist` | 696 | 크립토 전략 | `RESEARCH_ONLY` | 시장구조 달라 직접 적용 X |
| `omer-metin/...@crypto-trading-bots` | 660 | 크립토 봇 | `REJECT_OR_DEFER` | 자동매매 위험 |
| `0xrikt/...@crypto-trading-advisor` | 242 | 크립토 조언 | `REJECT_OR_DEFER` | 도메인 불일치 |
| `nansen-ai/nansen-cli@nansen-trading` | 288 | 온체인/크립토 | `REJECT_OR_DEFER` | 국내주식 X |
| `alsk1992/cloddsbot@crypto-hft` | 117 | 크립토 HFT | `REJECT_OR_DEFER` | HFT/실거래 위험 |
| `mjunaidca/...@polymarket-live-executor` | 98 | Polymarket live executor | `REJECT_OR_DEFER` | 예측시장 live 실행 |
| `mjunaidca/...@polymarket-paper-trader` | 104 | Polymarket paper | `REJECT_OR_DEFER` | 도메인 불일치 |
| `alphaonedev/...@algo-trading` | 101 | 알고리즘 트레이딩 | `RESEARCH_ONLY` | 설치수 낮아 참고만 |
| `agiprolabs/...@rl-execution` | 70 | RL 실행 | `REJECT_OR_DEFER` | 설치수 낮고 위험 큼 |
| `agiprolabs/...@dex-execution` | 68 | DEX 실행 | `REJECT_OR_DEFER` | 크립토 실거래 |
| `omer-metin/...@execution-algorithms` | 46 | 실행 알고리즘 | `LIVE_TRADING_LATER` | 개념만. 낮은 신뢰도 |
| `kirkluokun/...@stock-trade-journal` | 145 | 매매 일지 | `MP_CORE_NEXT` | trade log/복기 화면 후보 |
| `agiprolabs/...@trade-journal` | 87 | 매매 일지 | `REJECT_OR_DEFER` | 낮은 설치수 |

## 3. MP_CORE_NOW 적용 항목

| 적용 항목 | 현재 연결점 | 구현 방향 |
|---|---|---|
| look-ahead guard | `QuantBacktestService`, `MpCoreSignalStrategy`, `findMonthlyMpCoreSignalPicks` | `signalDate`, `rebalanceDate`, `executionDate`, `returnStartDate` 분리 검증 |
| 비용/회전율 강화 | `quant_trade_log`, `QuantCostSummaryDto`, `BacktestEvidencePanel` | 매수/매도 수수료, 세금, turnover 산식 명시 |
| 전략 비교 | `quant_experiment_variant`, `QuantExperimentService` | baseline, market-regime, momentum-filter variant 비교 |
| 리스크 guard | `riskFlags`, candidate blockers | 고변동/고베타/유동성 부족/하락장 신규매수 제한 |
| 시장 국면 필터 | `market_daily_price` INDEX rows 필요 | KOSPI 120/200MA, risk-on/off, cash floor |
| 모멘텀/위험조정 모멘텀 | feature JSON | `ret_20d/60d/120d/252d`, `ret/vol`, sector rank |
| 포지션 cap | `QuantPortfolioTargetDto`, trade generation | 종목 max, 섹터 max, KOSDAQ max, cash min |
| 결과 평가 | `QuantBacktestEvidenceDto` | MDD, Calmar, 월별 승률, 벤치마크 대비 초과수익 |

## 4. MP_CORE_NEXT 적용 항목

| 항목 | 선행 조건 | 이유 |
|---|---|---|
| vectorbt 리서치 엔진 | Python 분석 workspace, DB export/import | 빠른 파라미터 탐색/전략 비교 |
| 포트폴리오 최적화 | 충분한 가격 history, 섹터 매핑 | 지금은 cap 규칙이 더 안전 |
| factor attribution | 벤치마크/팩터 수익률 | 수익 원인 해부 |
| trade journal | `quant_trade_log` 고도화 | 왜 샀고 왜 팔았는지 복기 |
| value/quality factor | point-in-time 재무 데이터 | 현재 데이터로 백테스트하면 미래정보 위험 |
| microstructure pressure | 공매도/대차/시간외/선물 데이터 | 다음날 압력/위험 플래그 |

## 5. 실시간 트레이딩 적용 방향

실시간 트레이딩은 `MP_CORE`와 분리된 `Execution Gateway`로 설계한다. 모델이 직접 주문하면 안 된다.

```text
MP_CORE signal
-> paper portfolio
-> order proposal
-> risk gate
-> user approval or policy approval
-> broker adapter
-> execution report
-> reconciliation
-> trade journal
```

필수 안전장치:

- 기본값은 `PAPER_ONLY`.
- live 주문은 별도 env flag + 사용자 승인 + 계좌 권한 확인 필요.
- 주문 전 pre-trade risk: 현금, 종목 cap, 일 손실 한도, 주문 수량, 호가/가격 괴리.
- 주문 후 post-trade risk: 체결/미체결/부분체결, 포지션 reconciliation.
- LLM은 주문 수량/계좌 권한 직접 결정 금지. 계산된 proposal만 설명.
- emergency kill switch 필요.

국내주식 live 후보:

- KIS Open API trading adapter는 최종 후보.
- 처음은 paper trading table만 구현.
- 이후 read-only 계좌 조회.
- 마지막에 소액 live 주문.

## 6. 설치 우선순위

설치/감사 1차:

```bash
npx skills add wshobson/agents@backtesting-frameworks -g -y
npx skills add jeremylongshore/claude-code-plugins-plus-skills@backtesting-trading-strategies -g -y
npx skills add gracefullight/stock-checker@backtesting-trading-strategies -g -y
npx skills add 0xhubed/agent-trading-arena@risk-management -g -y
npx skills add affaan-m/everything-claude-code@llm-trading-agent-security -g -y
```

설치/감사 2차:

```bash
npx skills add marketcalls/vectorbt-backtesting-skills@backtest -g -y
npx skills add marketcalls/vectorbt-backtesting-skills@strategy-compare -g -y
npx skills add marketcalls/vectorbt-backtesting-skills@vectorbt-expert -g -y
npx skills add sickn33/antigravity-awesome-skills@quant-analyst -g -y
```

실거래/크립토 계열은 설치 전 별도 승인 필요.

## 7. 다음 작업 순서

1. 1차 스킬 설치 후 `SKILL.md` 안전 감사.
2. `MP_CORE_NOW` 항목으로 workation-planner spec 작성.
3. 구현 1차: look-ahead guard + 시장 국면 필터 + 리스크 cap + 전략 비교.
4. 구현 2차: vectorbt 리서치 엔진 + trade journal.
5. 구현 3차: paper trading execution gateway.
6. 구현 4차: KIS read-only 계좌 조회.
7. 구현 5차: live trading 소액/수동승인.
