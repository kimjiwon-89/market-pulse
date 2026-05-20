import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AllocationItem } from "@/types";

const COLORS = ["#1e5edb", "#0f766e", "#a16207", "#d62828", "#7c3aed"];

type Props = {
  allocation: AllocationItem[];
};

export function AllocationChart({ allocation }: Props) {
  if (allocation.length === 0) {
    return (
      <div className="card" style={{ minWidth: 280 }}>
        <div className="card-title">현재 비중</div>
        <p style={{ color: "var(--text-3)", marginTop: 24 }}>전략 비교에서는 비중 없음</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ minWidth: 280 }}>
      <div className="card-title">현재 비중</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={allocation} dataKey="weight" nameKey="assetName" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {allocation.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(value: number | undefined) => `${((value ?? 0) * 100).toFixed(1)}%`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="stack" style={{ gap: 8 }}>
        {allocation.map((item, index) => (
          <div key={`${item.assetName}-${index}`} className="flex items-center justify-between gap-4">
            <span style={{ color: "var(--text-2)" }}>{item.assetName}</span>
            <span className="num" style={{ color: COLORS[index % COLORS.length] }}>{(item.weight * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
