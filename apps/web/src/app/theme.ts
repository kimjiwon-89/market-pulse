export const theme = {
  color: {
    bg: "#111111",
    panel: "#1f1f1f",
    softPanel: "#262626",
    hover: "#2b2b2b",
    input: "#171717",
    text: "#fcfcfc",
    textMuted: "#d8d8d8",
    textSubtle: "#a8a8a8",
    textFaint: "#737373",
    border: "#333333",
    borderStrong: "#454545",
    softBorder: "#3a3a3a",
    divider: "#2f2f2f",
    accent: "#0169cc",
    accentSoft: "#06233f",
    accentBorder: "#064f98",
    up: "#ff5b5b",
    down: "#6ea2ff",
    warning: "#f59e0b",
  },
  font: {
    sans: '"Pretendard Variable", Pretendard, "Noto Sans KR", -apple-system, sans-serif',
    mono: '"IBM Plex Mono", "SF Mono", ui-monospace, monospace',
  },
  spacing: {
    page: "32px",
    card: "24px",
    sectionGap: "20px",
    rowGap: "8px",
  },
  radius: {
    card: "12px",
    control: "8px",
    small: "6px",
    pill: "999px",
    circle: "50%",
  },
  layout: {
    headerHeight: "60px",
    sidebarWidth: "224px",
    rightRailWidth: "420px",
    bottomNavHeight: "56px",
  },
  breakpoint: {
    mobile: "767px",
    tablet: "900px",
    desktop: "1199px",
  },
} as const;

export type AppTheme = typeof theme;
