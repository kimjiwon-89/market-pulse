import { useIsMarketOpen } from "@/hooks";

interface LiveBadgeProps {
  size?: number;
}

export function LiveBadge({ size = 11 }: LiveBadgeProps) {
  const open = useIsMarketOpen();

  if (open) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: size }}>
        <span
          className="animate-pulse"
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--up)", flexShrink: 0, display: "inline-block",
          }}
        />
        <span style={{ color: "var(--up)", fontWeight: 500 }}>실시간</span>
      </span>
    );
  }

  return <span style={{ fontSize: size, color: "var(--text-4)" }}>종가</span>;
}
