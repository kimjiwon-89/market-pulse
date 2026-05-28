import type { QuantExperimentVariant } from "@/types";

type Props = {
  variants: QuantExperimentVariant[];
  selectedVariantId: number | null;
  onSelect: (variant: QuantExperimentVariant) => void;
};

function pct(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}

function money(value: number) {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}e`;
  if (Math.abs(value) >= 10_000) return `${Math.round(value / 10_000).toLocaleString()}m`;
  return value.toLocaleString();
}

function cls(value: number) {
  return value > 0 ? "up" : value < 0 ? "down" : "flat";
}

function sortedVariants(variants: QuantExperimentVariant[]) {
  return [...variants].sort((a, b) => {
    if (a.targetAchieved !== b.targetAchieved) return a.targetAchieved ? -1 : 1;
    if (a.overfitScore !== b.overfitScore) return a.overfitScore - b.overfitScore;
    return b.monthlyReturn - a.monthlyReturn;
  });
}

export function VariantTable({ variants, selectedVariantId, onSelect }: Props) {
  const rows = sortedVariants(variants);

  return (
    <div className="overflow-x-auto">
      <table className="t">
        <thead>
          <tr>
            <th>Variant</th>
            <th className="num">Monthly</th>
            <th className="num">Total</th>
            <th className="num">MDD</th>
            <th className="num">Sharpe</th>
            <th className="num">Turnover</th>
            <th className="num">Cost</th>
            <th>Bias</th>
            <th className="num">Overfit</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(variant => (
            <tr
              key={variant.id}
              className="clickable"
              aria-selected={selectedVariantId === variant.id}
              onClick={() => onSelect(variant)}
            >
              <td className="ticker">
                <div className="flex items-center gap-2">
                  <span>{variant.variantCode}</span>
                  {variant.promoted && <span className="tag">Promoted</span>}
                </div>
              </td>
              <td className={`num ${cls(variant.monthlyReturn)}`}>{pct(variant.monthlyReturn)}</td>
              <td className={`num ${cls(variant.totalReturn)}`}>{pct(variant.totalReturn)}</td>
              <td className={`num ${cls(variant.mdd)}`}>{pct(variant.mdd)}</td>
              <td className="num">{variant.sharpeRatio.toFixed(2)}</td>
              <td className="num">{pct(variant.turnover)}</td>
              <td className="num">{money(variant.totalCost)}</td>
              <td>
                <span className={`tag ${variant.biasCheckStatus === "FAIL" ? "down" : ""}`}>
                  {variant.biasCheckStatus}
                </span>
              </td>
              <td className="num">{variant.overfitScore.toFixed(3)}</td>
              <td>{variant.targetAchieved && <span className="tag up">Target met</span>}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="text-center text-[var(--text-3)] py-8">
                No variants yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
