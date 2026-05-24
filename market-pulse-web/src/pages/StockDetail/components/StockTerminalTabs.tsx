export type StockTerminalTab = "chart" | "info" | "disclosure" | "trading";

interface StockTerminalTabsProps {
  activeTab: StockTerminalTab;
  onChange: (tab: StockTerminalTab) => void;
}

const TABS: { value: StockTerminalTab; label: string }[] = [
  { value: "chart", label: "차트·호가" },
  { value: "info", label: "종목정보" },
  { value: "disclosure", label: "뉴스·공시" },
  { value: "trading", label: "거래현황" },
];

export function StockTerminalTabs({ activeTab, onChange }: StockTerminalTabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="종목 상세 탭">
      {TABS.map(tab => (
        <button
          key={tab.value}
          className="tab"
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
