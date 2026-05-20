import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import type { TradeLog, TradeLogPage } from "@/types";
import { fmtNum } from "@/utils/format";

type Props = {
  strategyId: number | null;
  from: string;
  to: string;
};

type Filter = "" | "BUY" | "SELL";

export function TradeTimeline({ strategyId, from, to }: Props) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("");
  const [items, setItems] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (strategyId === null) return;
    setLoading(true);
    apiClient.get("/quant/trades", { params: { strategyId, from, to, tradeType: filter || undefined, page: 0, size: 50 } })
      .then(res => {
        const data: TradeLogPage = res.data.data;
        setItems(data.items ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [strategyId, from, to, filter]);

  if (strategyId === null) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">매매 시그널</div>
        <div className="chips">
          {[
            ["", "전체"],
            ["BUY", "BUY"],
            ["SELL", "SELL"],
          ].map(([value, label]) => (
            <button key={value} className="chip" aria-pressed={filter === value} onClick={() => setFilter(value as Filter)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="stack">{[0, 1, 2].map(i => <div key={i} className="sk" style={{ height: 36 }} />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="t">
            <thead>
              <tr>
                <th>날짜</th>
                <th>종목명</th>
                <th>신호</th>
                <th className="num">가격</th>
                <th className="num">비중</th>
                <th>이유</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="num">{item.tradeDate}</td>
                  <td>
                    <button
                      className="linklike"
                      onClick={() => item.assetType === "STOCK" && navigate(`/stock/${item.assetCode}`)}
                      style={{ color: item.assetType === "STOCK" ? "var(--text)" : "var(--text-2)" }}
                    >
                      {item.assetName}
                    </button>
                  </td>
                  <td><TradeBadge type={item.tradeType} /></td>
                  <td className="num">{fmtNum(item.price)}</td>
                  <td className="num">{(item.weight * 100).toFixed(1)}%</td>
                  <td style={{ color: "var(--text-3)" }}>{item.reason}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-3)", padding: 32 }}>매매 이력 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TradeBadge({ type }: { type: "BUY" | "SELL" }) {
  const isBuy = type === "BUY";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 8px",
        borderRadius: "var(--radius-sm)",
        fontSize: 11,
        fontWeight: 700,
        color: isBuy ? "var(--down)" : "var(--up)",
        background: isBuy ? "var(--down-soft)" : "var(--up-soft)",
      }}
    >
      {type}
    </span>
  );
}
