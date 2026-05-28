import { useNavigate } from "react-router-dom";
import { mockNews } from "@/features/mock/marketMockData";
import { FavoriteFolderPicker } from "@/features/quant/FavoriteFolderPicker";
import { StockInitialBadge } from "@/features/quant/StockInitialBadge";
import { quantDecisions, quantKpis } from "@/features/quant/quantMockData";
import type { QuantDecision } from "@/features/quant/quantTypes";

function DecisionCodeBadge({ code }: { code: QuantDecision["decisionCode"] }) {
  const className = `decision-code ${code.toLowerCase()}`;
  return (
    <span className={className}>
      {code}
    </span>
  );
}

function ModelNameList({ names }: { names: string[] }) {
  return (
    <span className="model-name-list">{names.join(", ")}</span>
  );
}

function KpiGrid({ ids }: { ids?: string[] }) {
  const kpis = ids ? quantKpis.filter((kpi) => ids.includes(kpi.id)) : quantKpis;

  return (
    <div className="quant-kpi-grid">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="card compact-metric-card">
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>{kpi.label}</span>
            <span className="info-dot">i</span>
          </div>
          <div
            className={kpi.direction === "up" ? "num-lg up" : kpi.direction === "down" ? "num-lg down" : "num-lg"}
            style={{ marginTop: 10, color: kpi.id === "look" || kpi.id === "reports" ? "var(--accent)" : undefined }}
          >
            {kpi.value}
          </div>
          <div className="card-sub" style={{ marginTop: 6 }}>
            {kpi.hint} {kpi.delta && <span className={kpi.direction === "up" ? "up" : kpi.direction === "down" ? "down" : ""}>{kpi.delta}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function DecisionTable() {
  const navigate = useNavigate();

  return (
    <div className="card" style={{ padding: 0, overflow: "visible" }}>
      <div className="card-head" style={{ padding: "18px 20px", marginBottom: 0 }}>
        <div className="card-title" style={{ fontSize: 16 }}>오늘의 종목 판단</div>
        <button className="btn sm" type="button" onClick={() => navigate("/quant/today")}>전체 목록 보기</button>
      </div>
      <div className="quant-desktop-table">
        <table className="t" style={{ minWidth: 760 }}>
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
                      <div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{item.assetCode}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <ModelNameList names={item.modelNames} />
                </td>
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
      <div className="quant-mobile-list" style={{ padding: 16 }}>
        {quantDecisions.map((item) => (
          <div key={item.assetCode} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StockInitialBadge text={item.badgeText} tone={item.badgeTone} size={36} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                    <span>{item.assetName}</span>
                    <DecisionCodeBadge code={item.decisionCode} />
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{item.assetCode}</div>
                </div>
              </div>
              <FavoriteFolderPicker assetName={item.assetName} />
            </div>
            <div style={{ marginTop: 12, color: "var(--text-3)", fontSize: 12 }}>{item.reasonBullets.join(" · ")}</div>
            <div style={{ marginTop: 10 }}>
              <ModelNameList names={item.modelNames} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeUtilityRail() {
  const navigate = useNavigate();
  const favoriteFolders = [
    { name: "메인 관심", count: 12 },
    { name: "반도체", count: 6 },
    { name: "리스크 체크", count: 3 },
  ];

  return (
    <aside className="home-utility-rail">
      <section className="card">
        <div className="card-head">
          <div className="card-title">뉴스</div>
          <button className="btn sm" type="button" onClick={() => navigate("/news")}>더보기</button>
        </div>
        <div className="utility-list utility-news-scroll">
          {mockNews.map((news) => (
            <button key={news.id} className="utility-report news-title-only" type="button" onClick={() => navigate("/news")}>
              <strong>{news.title}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="card ad-slot-card">
        <div className="ad-slot-label">AD</div>
        <div>
          <div className="card-title">광고 영역</div>
          <p className="ad-slot-copy">추후 배너, 제휴 콘텐츠, 프로모션을 연결할 자리입니다.</p>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div className="card-title">관심 폴더</div>
          <button className="btn sm" type="button" onClick={() => navigate("/my")}>관리</button>
        </div>
        <div className="utility-list utility-folder-scroll">
          {favoriteFolders.map((folder) => (
            <button key={folder.name} className="utility-row" type="button" onClick={() => navigate("/my")}>
              <span>{folder.name}</span>
              <strong>{folder.count}</strong>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

export function QuantHome() {
  const navigate = useNavigate();

  return (
    <div className="quant-home-shell">
      <div className="stack">
        <section className="card soft-section">
          <div className="quant-hero-split">
            <div className="quant-hero-panel">
              <div className="quant-hero-copy">
                <h1 style={{ fontSize: 19, fontWeight: 600, margin: 0, color: "var(--text)", letterSpacing: 0 }}>
                  퀀트 모델이 고른 오늘의 종목
                </h1>
                <p style={{ margin: "10px 0 0", color: "var(--text-2)", fontSize: 15 }}>
                  매일 시장 데이터를 계산해 살펴볼 종목, 기다릴 종목, 조심할 종목을 쉽게 정리합니다.
                </p>
              </div>
              <KpiGrid ids={["look", "caution", "performance", "reports"]} />
            </div>
            <div className="quant-hero-panel market">
              <div className="quant-hero-copy">
                <div>
                  <h2 className="market-panel-title">오늘의 시장 현황</h2>
                  <p className="market-panel-copy">
                    지수는 약세지만 급락 신호는 제한적이고, 반도체 쪽 수급은 개선 흐름입니다.
                  </p>
                </div>
              </div>
              <div className="market-status-grid">
                <div className="market-status-item">
                  <span>지수</span>
                  <strong>약세 관찰</strong>
                  <small>KOSPI·KOSDAQ 모두 변동성 확대</small>
                </div>
                <div className="market-status-item">
                  <span>수급</span>
                  <strong>반도체 개선</strong>
                  <small>기관·외국인 흐름 동시 확인</small>
                </div>
                <div className="market-status-item">
                  <span>체크</span>
                  <strong>환율·금리</strong>
                  <small>단기 변동성은 계속 관찰</small>
                </div>
                <div className="market-status-item">
                  <span>분위기</span>
                  <strong>선별 장세</strong>
                  <small>강한 업종 중심으로 압축</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <DecisionTable />

        <section className="card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="card-title" style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span className="brand-mark" style={{ width: 24, height: 24 }}>◇</span>
                <span>퀀트 모델이란?</span>
              </div>
              <p style={{ margin: "8px 0 0", color: "var(--text-2)", lineHeight: 1.7 }}>
                수많은 시장 데이터를 수학과 통계로 분석해 종목의 매력도를 점수로 계산하는 도구입니다.
                감정이 아닌 데이터로 판단해 더 일관된 투자를 도와줍니다.
              </p>
            </div>
            <button className="btn" type="button" onClick={() => navigate("/quant")} style={{ color: "var(--accent)", borderColor: "var(--accent-border)" }}>더 알아보기</button>
          </div>
        </section>
      </div>
      <HomeUtilityRail />
    </div>
  );
}
