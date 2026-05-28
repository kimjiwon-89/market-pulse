import type { StockBadgeTone } from "./quantTypes";

const toneMap: Record<StockBadgeTone, string> = {
  red: "#dc2f45",
  blue: "#2f77df",
  navy: "#315f93",
  purple: "#6548c7",
  black: "#18181b",
};

interface StockInitialBadgeProps {
  text: string;
  tone: StockBadgeTone;
  size?: number;
}

export function StockInitialBadge({ text, tone, size = 32 }: StockInitialBadgeProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: toneMap[tone],
        color: "#fff",
        fontSize: size <= 32 ? 11 : 12,
        fontWeight: 800,
        letterSpacing: 0,
      }}
    >
      {text}
    </span>
  );
}
