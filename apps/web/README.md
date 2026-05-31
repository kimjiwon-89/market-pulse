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

Current source structure:

```text
src/app/                app router/provider/theme/global reset setup
src/components/         shared UI primitives only
src/layout/             app shell, header, sidebar, bottom nav
src/hooks/              shared hooks
src/features/
  quant/
    api.ts              quant endpoint functions
    store.ts            quant feature state
    types.ts            quant feature types
    mock.ts             quant mock-data exports
    home/               quant home feature UI and styled-components
    today/              target folder for today-stock feature UI
    models/             target folder for model-list/detail feature UI
  market/               target market feature API/store/types/UI
  auth/                 target auth feature API/store/types/UI
  reports/              target reports feature API/store/types/UI
  services/             target lotto/tarot service API/store/types/UI
src/pages/              route wrappers only
src/store/              shared store composition only
```

Implementation rules:

- Product UI styling uses `styled-components`.
- CSS files are not used for screen or component styles.
- Global style is reset/base only, preferably through `src/app/GlobalStyle.ts`.
- Feature API/store/type files live beside the feature under `src/features/<domain>/`.
- `src/api` and `src/store` are for shared client/setup composition only.
- Responsive UI stays in the same feature folder. If markup differs, split components such as `DesktopDecisionTable.tsx` and `MobileDecisionList.tsx`; do not create separate `mobile/` and `desktop/` folders.

Migration status:

```text
src/features/quant/home/  migrated to feature-first styled-components
src/pages/QuantHome.tsx   route wrapper for QuantHomePage
src/index.css             legacy styles for not-yet-migrated screens/layout
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
- React Router
- styled-components

Run:

```text
npm run dev
npm run build
```
