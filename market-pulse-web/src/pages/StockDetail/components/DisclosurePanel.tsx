import type { StockDisclosure } from "@/types";

interface DisclosurePanelProps {
  disclosures: StockDisclosure[];
  loading: boolean;
}

export function DisclosurePanel({ disclosures, loading }: DisclosurePanelProps) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">OpenDART 공시</div>
        <span className="tag">공식 링크</span>
      </div>
      {loading ? (
        <div className="sk tall" />
      ) : disclosures.length === 0 ? (
        <p style={{ color: "var(--text-3)", fontSize: 13 }}>
          OpenDART API 키가 없거나 조회된 공시가 없습니다.
        </p>
      ) : (
        <table className="t">
          <tbody>
            {disclosures.map(item => (
              <tr key={`${item.filedAt}-${item.title}`}>
                <td>
                  <a href={item.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--text)" }}>
                    {item.title}
                  </a>
                  <div style={{ color: "var(--text-3)", fontSize: 12 }}>{item.source}</div>
                </td>
                <td className="num">{item.filedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
