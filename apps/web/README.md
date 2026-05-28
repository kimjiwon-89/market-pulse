# Prod Web

Production frontend application.

Responsibilities:

- quant-model-first home
- public model list, today's stock decisions, and report screens
- market dashboard UI under `/market`
- auth/login screens
- market data views
- investor-flow views
- quant/lottery/tarot serving views

Current page structure:

```text
src/features/mock/    shared market/news/lotto mock data
src/features/quant/   typed mock data and shared quant UI primitives
src/pages/QuantHome/  public home dashboard
src/pages/QuantToday/ public today-stock decision list
src/pages/QuantModels/ public model list and model detail
src/pages/Reports/    public mock report list/detail
src/pages/Services/   lotto/tarot service entry
src/pages/LottoAnalysis/ mock lotto analysis
src/pages/MyPage/     login-gated personal surface
src/pages/Dashboard/  existing market dashboard, routed at /market
src/pages/Admin/      admin-only operations and validation/backtest area
```

Route direction:

```text
/              QuantHome
/quant         model list
/quant/today   today decisions
/quant/:code   model detail
/reports       reports
/market        existing market dashboard
/services      lotto/tarot entry
/lotto         lotto analysis
/tarot         tarot mock page
/my            personal account surface
/admin         admin-only operations
```

Stack target:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

Run:

```text
npm run dev
npm run build
```
