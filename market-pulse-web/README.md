# 📂 Zenith Finance: React Project Structure Guide

금융 대시보드와 같이 데이터 집약적이고 복잡한 UI를 가진 프로젝트를 위한 권장 리액트 폴더 구조입니다. **Atomic Design** 패턴과 **Feature-based** 구조를 절충하여 설계되었습니다.

```text
src/
├── assets/              # 정적 자원 (이미지, 로고, 아이콘 등)
│   ├── icons/
│   └── images/
│
├── components/          # 재사용 가능한 공용 UI 컴포넌트 (Shared)
│   ├── common/          # 버튼, 입력창, 모달 등 기초 컴포넌트
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Badge/
│   ├── layout/          # 앱의 뼈대 구성
│   │   ├── TopNavBar/
│   │   ├── SideNavBar/
│   │   └── Footer/
│   └── data-display/    # 데이터 시각화 관련 (차트, 테이블)
│       ├── Chart/
│       └── DataTable/
│
├── features/            # 주요 기능 단위 폴더 (도메인별 분리)
│   ├── dashboard/       # 대시보드 관련 로직 및 컴포넌트
│   │   ├── components/  # 대시보드 전용 컴포넌트 (StatCard 등)
│   │   ├── hooks/       # 대시보드 전용 커스텀 훅
│   │   ├── services/    # 대시보드 관련 API 호출 함수
│   │   └── types.ts     # 대시보드 데이터 타입 정의
│   └── market/          # 시장 분석 관련 기능
│
├── hooks/               # 전역에서 사용하는 커스텀 훅
│   ├── useAuth.ts
│   └── useMarketData.ts
│
├── pages/               # 라우팅 경로에 매칭되는 페이지 컴포넌트
│   ├── DashboardPage.tsx
│   ├── AnalysisPage.tsx
│   └── SettingsPage.tsx
│
├── services/            # 전역 API 서비스 로직
│   ├── api.ts           # axios 설정 및 공통 fetcher
│   └── endpoints.ts     # API 주소 관리
│
├── store/               # 전역 상태 관리 (Zustand, Redux, Context API 등)
│   ├── useUserStore.ts
│   └── useMarketStore.ts
│
├── styles/              # 글로벌 스타일 (Tailwind config, CSS variables)
│   ├── globals.css
│   └── theme.ts
│
├── utils/               # 유틸리티 함수 (날짜 포맷팅, 숫자 계산 등)
│   ├── formatCurrency.ts
│   └── calculateYield.ts
│
├── App.tsx              # 메인 엔트리 및 라우터 설정
└── main.tsx             # 렌더링 시작점
```

---

## 💡 주요 구조 설계 원칙

### 1. Features 중심의 폴더 구성
대부분의 코드를 `features/` 폴더에 모읍니다. 예를 들어, `dashboard` 기능에만 쓰이는 컴포넌트나 로직은 `components/`가 아닌 `features/dashboard/` 안에 두어 응집도를 높이고 영향 범위를 최소화합니다.

### 2. Components의 분리
- **`components/common`**: 어떤 프로젝트에서도 가져다 쓸 수 있는 범용적인 UI 조각들입니다.
- **`features/*/components`**: 특정 비즈니스 로직(예: 주식 종목 데이터 연동)이 포함된 특수 목적 컴포넌트들입니다.

### 3. Services & Hooks 분리
API 호출 로직은 컴포넌트 내부가 아닌 `services/`에 따로 정의하고, 이를 컴포넌트에서 사용할 때는 `hooks/`를 통해 한 번 더 추상화하는 것이 좋습니다. 이를 통해 UI와 데이터 로직을 완벽히 분리할 수 있습니다.

### 4. Utils의 중요성
금융 앱에서는 숫자 콤마 표시(`1,000`), 등락률 계산 등 반복되는 로직이 많습니다. 이를 `utils/`에 모아두면 코드 중복을 획기적으로 줄일 수 있습니다.

---

**이 구조가 사용자님의 현재 고민을 해결하는 데 도움이 되었나요? 더 구체적인 파일 내용이나 특정 라이브러리(Zustand, React Query 등) 기반의 구조가 궁금하시면 말씀해 주세요!**
