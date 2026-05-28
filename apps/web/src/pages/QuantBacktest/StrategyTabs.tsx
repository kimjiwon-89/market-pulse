import type { QuantStrategy } from "@/types";

type Props = {
  strategies: QuantStrategy[];
  activeId: number | null;
  onSelect: (id: number | null) => void;
};

export function StrategyTabs({ strategies, activeId, onSelect }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="seg-tabs min-w-max" role="tablist">
        <button aria-selected={activeId === null} onClick={() => onSelect(null)}>전략 비교</button>
        {strategies.map(strategy => (
          <button
            key={strategy.id}
            aria-selected={activeId === strategy.id}
            onClick={() => onSelect(strategy.id)}
          >
            {strategy.name}
          </button>
        ))}
      </div>
    </div>
  );
}
