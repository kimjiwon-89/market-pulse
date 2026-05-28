import { FavoriteFolderPicker } from "@/features/quant/FavoriteFolderPicker";
import { StockInitialBadge } from "@/features/quant/StockInitialBadge";
import { quantAsOf, quantDecisions } from "@/features/quant/quantMockData";
import type { QuantDecision } from "@/features/quant/quantTypes";

function DecisionCodeBadge({ code }: { code: QuantDecision["decisionCode"] }) {
  return <span className={`decision-code ${code.toLowerCase()}`}>{code}</span>;
}

function ModelNameList({ names }: { names: string[] }) {
  return (
    <span className="model-name-list">{names.join(", ")}</span>
  );
}

export function QuantToday() {
  return (
    <div className="stack max-w-[1100px] mx-auto">
      <div className="card">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>오늘의 종목</h1>
            <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>
              퀀트 모델이 오늘 살펴볼 종목, 기다릴 종목, 조심할 종목을 나눠 정리했습니다.
            </p>
          </div>
          <span className="card-sub mono">기준 {quantAsOf}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "visible" }}>
        <table className="t">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>종목</th>
              <th>신호 모델</th>
              <th>이유</th>
              <th>조심할 점</th>
              <th className="favorite-cell" aria-label="관심" />
            </tr>
          </thead>
          <tbody>
            {quantDecisions.map((item) => (
              <tr key={item.assetCode}>
                <td style={{ paddingLeft: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StockInitialBadge text={item.badgeText} tone={item.badgeTone} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--text)" }}>
                        <span>{item.assetName}</span>
                        <DecisionCodeBadge code={item.decisionCode} />
                      </div>
                      <div className="mono" style={{ color: "var(--text-3)", fontSize: 12 }}>{item.assetCode} · {item.market}</div>
                    </div>
                  </div>
                </td>
                <td><ModelNameList names={item.modelNames} /></td>
                <td>{item.reasonBullets.join(", ")}</td>
                <td>{item.cautionBullets.join(", ")}</td>
                <td className="favorite-cell">
                  <FavoriteFolderPicker assetName={item.assetName} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
