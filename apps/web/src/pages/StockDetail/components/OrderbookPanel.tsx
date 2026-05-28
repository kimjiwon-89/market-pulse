import type { StockOrderbook, StockOrderbookLevel } from "@/types";
import { fmtNum } from "@/utils/format";

interface OrderbookPanelProps {
  orderbook: StockOrderbook | null;
  loading: boolean;
}

function depthTotal(levels: StockOrderbookLevel[]): number {
  return levels.reduce((sum, level) => sum + level.volume, 0);
}

function DepthRows({ levels, side }: { levels: StockOrderbookLevel[]; side: "ask" | "bid" }) {
  const max = Math.max(1, ...levels.map(level => level.volume));
  const sorted = side === "ask" ? [...levels].reverse() : levels;

  return (
    <div className="stack" style={{ gap: 4 }}>
      {sorted.map(level => (
        <div
          key={`${side}-${level.level}`}
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "32px 1fr 1fr",
            alignItems: "center",
            minHeight: 30,
            padding: "0 8px",
            borderRadius: 6,
            overflow: "hidden",
            background: "var(--bg-alt)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${Math.max(4, (level.volume / max) * 100)}%`,
              background: side === "ask" ? "var(--up-soft)" : "var(--down-soft)",
              opacity: 0.75,
            }}
          />
          <span className="num" style={{ zIndex: 1, color: "var(--text-3)", fontSize: 12 }}>{level.level}</span>
          <span className={`num ${side === "ask" ? "up" : "down"}`} style={{ zIndex: 1 }}>{fmtNum(level.price)}</span>
          <span className="num" style={{ zIndex: 1, textAlign: "right", color: "var(--text-2)" }}>{fmtNum(level.volume)}</span>
        </div>
      ))}
    </div>
  );
}

export function OrderbookPanel({ orderbook, loading }: OrderbookPanelProps) {
  if (loading) return <div className="sk tall" style={{ height: 260 }} />;

  if (!orderbook) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="card-title">호가·예상체결</div>
          <span className="tag">읽기 전용</span>
        </div>
        <p style={{ color: "var(--text-3)" }}>호가 데이터 없음</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">호가·예상체결</div>
        <span className="tag">읽기 전용</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>매도호가</div>
            <DepthRows levels={orderbook.asks} side="ask" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>매수호가</div>
            <DepthRows levels={orderbook.bids} side="bid" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="stat-cell">
            <div className="stat-label">예상체결가</div>
            <div className="stat-value" style={{ fontSize: "var(--num-md)" }}>{fmtNum(orderbook.expectedPrice)}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">예상체결량</div>
            <div className="stat-value" style={{ fontSize: "var(--num-md)" }}>{fmtNum(orderbook.expectedVolume)}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">잔량 합계</div>
            <div className="stat-delta">매도 {fmtNum(depthTotal(orderbook.asks))}</div>
            <div className="stat-delta">매수 {fmtNum(depthTotal(orderbook.bids))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
