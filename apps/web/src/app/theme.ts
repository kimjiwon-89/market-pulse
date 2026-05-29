export const theme = {
  color: {
    bg: "#ffffff",
    panel: "#ffffff",
    softPanel: "#f1f3f6",
    hover: "#f5f5f4",
    input: "#ffffff",
    text: "#18181b",
    textMuted: "#44403c",
    textSubtle: "#78716c",
    textFaint: "#a8a29e",
    border: "#e7e5e4",
    borderStrong: "#d6d3d1",
    softBorder: "#d9dde5",
    divider: "#efeeec",
    accent: "#2f77df",
    accentSoft: "#eef5ff",
    accentBorder: "#cfe0ff",
    up: "#d62828",
    down: "#1e5edb",
    warning: "#f97316",
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
