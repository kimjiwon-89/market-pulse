import { Link, useParams } from "react-router-dom";
import { quantDecisions, quantModels } from "@/features/quant/quantMockData";

export function QuantModels() {
  const { modelCode } = useParams();
  const selected = modelCode ? quantModels.find((model) => model.code === modelCode) : null;

  if (modelCode && !selected) {
    return (
      <div className="error-block">
        <div className="error-title">모델을 찾을 수 없습니다</div>
        <Link className="btn" to="/quant">모델 목록으로</Link>
      </div>
    );
  }

  if (selected) {
    const decisions = quantDecisions.filter((item) => item.modelNames.some((name) => selected.name.includes(name.replace(" 모델", "")) || name === selected.name));
    return (
      <div className="stack max-w-[1100px] mx-auto">
        <div className="card">
          <Link className="card-link" to="/quant">← 모델 목록</Link>
          <h1 style={{ margin: "14px 0 0", fontSize: 24, fontWeight: 800 }}>{selected.name}</h1>
          <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>{selected.plainName}</p>
        </div>
        <div className="grid-3">
          <div className="card"><div className="card-title">상태</div><div className="num-md" style={{ marginTop: 12 }}>{selected.status}</div></div>
          <div className="card"><div className="card-title">신호 강도</div><div className="num-md" style={{ marginTop: 12 }}>{selected.signalStrength}</div></div>
          <div className="card"><div className="card-title">오늘 종목</div><div className="num-md" style={{ marginTop: 12 }}>{selected.todayCount}개</div></div>
        </div>
        <div className="card">
          <div className="card-title">모델이 보는 것</div>
          <p style={{ margin: "12px 0 0", color: "var(--text-2)", lineHeight: 1.7 }}>{selected.description}</p>
          <div className="chips" style={{ marginTop: 16 }}>
            {selected.focus.map((item) => <span key={item} className="chip">{item}</span>)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">이 모델이 포함된 오늘의 종목</div>
          <div className="stack" style={{ marginTop: 14, gap: 10 }}>
            {(decisions.length ? decisions : quantDecisions.slice(0, 2)).map((item) => (
              <div key={item.assetCode} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--divider)", paddingBottom: 10 }}>
                <span>{item.assetName}</span>
                <span className="tag">{item.decisionLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack max-w-[1100px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>모델 목록</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>
          퀀트 모델이 어떤 데이터를 보고 어떤 상황에 강한지 쉽게 정리했습니다.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quantModels.map((model) => (
          <Link key={model.code} to={`/quant/${model.code}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card-head">
              <div className="card-title" style={{ fontSize: 16 }}>{model.name}</div>
              <span className="tag">{model.status}</span>
            </div>
            <p style={{ margin: 0, color: "var(--text-2)", minHeight: 44 }}>{model.plainName}</p>
            <div className="divider" />
            <div className="chips">
              {model.focus.map((item) => <span key={item} className="chip">{item}</span>)}
            </div>
            <div className="card-sub" style={{ marginTop: 18 }}>오늘 종목 {model.todayCount}개 · {model.marketMode}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
