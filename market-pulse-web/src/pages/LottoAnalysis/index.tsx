import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/services/apiClient";
import type {
  LottoAnalysisDto,
  LottoResultDto,
  LottoStatsDto,
  LottoStrategyDto,
  LottoUserCombo,
  LottoStrategy,
} from "@/types";
import { LottoDiscussion } from "./LottoDiscussion";

const STRATEGY_COLOR: Record<LottoStrategy, string> = {
  MOMENTUM:  "#d62828",
  SUBMARINE: "#1e5edb",
  NETWORK:   "#0f766e",
  PATTERN:   "#a16207",
  AI_PICK:   "#18181b",
};

const STRATEGY_DESC: Record<LottoStrategy, string> = {
  MOMENTUM:  "최근 빈도 높고 상승 추세인 번호",
  SUBMARINE: "장기 미출현 + 최근 더 줄어드는 번호",
  NETWORK:   "같이 자주 나오는 번호 네트워크",
  PATTERN:   "강세 번호대 · 끝자리 흐름 분석",
  AI_PICK:   "다중 분석 가중합 종합 추천",
};

export function LottoAnalysis() {
  const [analysis, setAnalysis] = useState<LottoAnalysisDto | null>(null);
  const [rounds, setRounds] = useState<LottoResultDto[]>([]);
  const [stats, setStats] = useState<LottoStatsDto[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [tab, setTab] = useState<"analysis" | "stats" | "mycombo" | "discussion">("analysis");
  const [myComboNums, setMyComboNums] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRounds = useCallback(async () => {
    try {
      const res = await apiClient.get("/lotto/rounds");
      setRounds(res.data.data ?? []);
    } catch {}
  }, []);

  const fetchAnalysis = useCallback(async (round?: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = round
        ? await apiClient.get("/lotto/analysis", { params: { round } })
        : await apiClient.get("/lotto/latest");
      setAnalysis(res.data.data);
      setSelectedRound(res.data.data?.drawNo ?? null);
    } catch (e: any) {
      setError("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get("/lotto/stats");
      setStats(res.data.data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRounds();
    fetchAnalysis();
    fetchStats();
  }, [fetchRounds, fetchAnalysis, fetchStats]);

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setSelectedRound(val);
    fetchAnalysis(val);
  };

  const saveMyCombo = async () => {
    if (myComboNums.length !== 6 || !selectedRound) return;
    try {
      await apiClient.post("/lotto/combo", {
        drawNo: selectedRound,
        numbers: [...myComboNums].sort((a, b) => a - b),
      });
      setMyComboNums([]);
      fetchAnalysis(selectedRound);
    } catch {}
  };

  const deleteMyCombo = async (id: number) => {
    try {
      await apiClient.delete(`/lotto/combo/${id}`);
      fetchAnalysis(selectedRound ?? undefined);
    } catch {}
  };

  const toggleMyNum = (n: number) => {
    setMyComboNums(prev =>
      prev.includes(n)
        ? prev.filter(x => x !== n)
        : prev.length < 6 ? [...prev, n] : prev
    );
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0 }}>
            로또 분석 연구소
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: "4px 0 0" }}>
            5가지 통계 전략 기반 번호 분석 · 전략별 누적 성적 추적
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Prev 버튼 — rounds는 DESC 정렬이므로 idx+1이 이전 회차 */}
          {(() => {
            const idx = rounds.findIndex(r => r.drawNo === selectedRound);
            const prevRound = idx < rounds.length - 1 ? rounds[idx + 1].drawNo : null;
            const nextRound = idx > 0 ? rounds[idx - 1].drawNo : null;
            return (
              <>
                <button
                  disabled={prevRound === null}
                  onClick={() => prevRound && fetchAnalysis(prevRound)}
                  style={{
                    padding: "6px 10px", borderRadius: "var(--radius)",
                    border: "1px solid var(--border)", background: "var(--bg-alt)",
                    color: prevRound === null ? "var(--text-4)" : "var(--text)",
                    fontSize: 12, cursor: prevRound === null ? "default" : "pointer",
                  }}
                >
                  ◀ Prev
                </button>
                <select
                  value={selectedRound ?? ""}
                  onChange={handleRoundChange}
                  style={{
                    padding: "6px 12px", borderRadius: "var(--radius)",
                    border: "1px solid var(--border)", background: "var(--bg-input)",
                    color: "var(--text)", fontSize: 13, cursor: "pointer",
                  }}
                >
                  <option value="" disabled>회차 선택</option>
                  {rounds.map(r => (
                    <option key={r.drawNo} value={r.drawNo}>
                      {r.drawNo}회 ({r.drawDate})
                    </option>
                  ))}
                </select>
                <button
                  disabled={nextRound === null}
                  onClick={() => nextRound && fetchAnalysis(nextRound)}
                  style={{
                    padding: "6px 10px", borderRadius: "var(--radius)",
                    border: "1px solid var(--border)", background: "var(--bg-alt)",
                    color: nextRound === null ? "var(--text-4)" : "var(--text)",
                    fontSize: 12, cursor: nextRound === null ? "default" : "pointer",
                  }}
                >
                  Next ▶
                </button>
              </>
            );
          })()}
        </div>
      </div>

      {/* 당첨번호 카드 */}
      {analysis?.winningNumbers && (
        <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>
              {analysis.drawNo}회 당첨번호
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {analysis.winningNumbers.map(n => (
                <LottoBall key={n} num={n} size={36} />
              ))}
              <span style={{ color: "var(--text-3)", alignSelf: "center", fontSize: 13 }}>+</span>
              <LottoBall num={analysis.bonusNo!} size={36} bonus />
            </div>
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="seg-tabs" role="tablist" style={{ marginBottom: 20 }}>
        {(["analysis", "stats", "mycombo", "discussion"] as const).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t === "analysis" ? "전략 분석" : t === "stats" ? "성적 통계" : t === "mycombo" ? "내 조합" : "토론장"}
          </button>
        ))}
      </div>

      {loading && <div className="sk" style={{ height: 200, borderRadius: "var(--radius)" }} />}
      {error && <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>{error}</div>}

      {/* 전략 분석 탭 */}
      {!loading && !error && tab === "analysis" && analysis && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {analysis.strategies.map(s => (
            <StrategyCard
              key={s.strategy}
              strategy={s}
              winningNumbers={analysis.winningNumbers}
              myComboNums={myComboNums}
              onToggleNum={toggleMyNum}
            />
          ))}

          {/* 내 조합 입력 */}
          <div className="card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                내 조합 만들기
              </span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                위 번호 클릭하거나 직접 선택 ({myComboNums.length}/6)
              </span>
            </div>
            <NumberPicker
              selected={myComboNums}
              onToggle={toggleMyNum}
              winningNumbers={analysis.winningNumbers}
            />
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                onClick={saveMyCombo}
                disabled={myComboNums.length !== 6}
                style={{
                  padding: "7px 16px", borderRadius: "var(--radius)",
                  background: myComboNums.length === 6 ? "var(--accent)" : "var(--bg-alt)",
                  color: myComboNums.length === 6 ? "var(--accent-fg)" : "var(--text-3)",
                  border: "none", fontSize: 13, cursor: myComboNums.length === 6 ? "pointer" : "default",
                }}
              >
                저장
              </button>
              <button
                onClick={() => setMyComboNums([])}
                style={{
                  padding: "7px 16px", borderRadius: "var(--radius)",
                  background: "var(--bg-alt)", color: "var(--text-3)",
                  border: "1px solid var(--border)", fontSize: 13, cursor: "pointer",
                }}
              >
                초기화
              </button>
            </div>
          </div>

          {/* 저장된 내 조합 */}
          {analysis.myCombs.length > 0 && (
            <div className="card" style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 12px" }}>
                저장한 조합
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {analysis.myCombs.map((c: LottoUserCombo) => (
                  <UserComboRow
                    key={c.id}
                    combo={c}
                    winningNumbers={analysis.winningNumbers}
                    onDelete={() => deleteMyCombo(c.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 성적 통계 탭 */}
      {!loading && tab === "stats" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stats.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>
              아직 분석 데이터가 없습니다.
            </div>
          ) : (
            stats.map(s => <StatsCard key={s.strategy} stat={s} />)
          )}
        </div>
      )}

      {/* 내 조합 탭 */}
      {!loading && tab === "mycombo" && (
        <MyComboTab
          rounds={rounds}
          onDeleteCombo={async (id) => {
            await apiClient.delete(`/lotto/combo/${id}`);
            fetchAnalysis(selectedRound ?? undefined);
          }}
        />
      )}

      {/* 토론장 탭 */}
      {tab === "discussion" && selectedRound && (
        <LottoDiscussion drawNo={selectedRound} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 전략 카드
// ──────────────────────────────────────────────

function StrategyCard({
  strategy,
  winningNumbers,
  myComboNums,
  onToggleNum,
}: {
  strategy: LottoStrategyDto;
  winningNumbers: number[] | null;
  myComboNums: number[];
  onToggleNum: (n: number) => void;
}) {
  const color = STRATEGY_COLOR[strategy.strategy];
  const won = winningNumbers != null;

  return (
    <div className="card" style={{ padding: "16px 20px" }}>
      {/* 전략 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            display: "inline-block", width: 10, height: 10,
            borderRadius: "50%", background: color, flexShrink: 0,
          }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            {strategy.strategyName}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
            {STRATEGY_DESC[strategy.strategy]}
          </span>
        </div>
        {won && strategy.poolHitCount != null && (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: "3px 10px",
            borderRadius: 20, background: hitBg(strategy.poolHitCount),
            color: hitColor(strategy.poolHitCount),
          }}>
            풀 {strategy.poolHitCount}/6 적중
          </span>
        )}
      </div>

      {/* 풀 번호 */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: "var(--text-4)", margin: "0 0 8px", fontWeight: 500 }}>
          번호 풀 (10개) — 클릭하면 내 조합에 추가
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {strategy.pool.map(n => {
            const isWin = winningNumbers?.includes(n);
            const isMine = myComboNums.includes(n);
            return (
              <button
                key={n}
                onClick={() => onToggleNum(n)}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: isMine ? `2px solid ${color}` : isWin ? "2px solid var(--up)" : "1px solid var(--border)",
                  background: isWin ? "var(--up-soft)" : isMine ? "var(--accent-soft)" : "var(--bg-alt)",
                  color: isWin ? "var(--up)" : "var(--text)",
                  fontSize: 13, fontWeight: isWin ? 700 : 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* 추천 조합 */}
      <div>
        <p style={{ fontSize: 11, color: "var(--text-4)", margin: "0 0 8px", fontWeight: 500 }}>
          추천 조합 (3개)
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {strategy.combos.map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 10px", borderRadius: "var(--radius)",
              background: "var(--bg-alt)", border: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 11, color: "var(--text-4)", width: 16 }}>#{i+1}</span>
              <div style={{ display: "flex", gap: 5 }}>
                {c.combo.map(n => {
                  const isWin = winningNumbers?.includes(n);
                  return (
                    <span key={n} style={{
                      width: 30, height: 30, borderRadius: "50%",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: isWin ? 700 : 500,
                      background: isWin ? "var(--up-soft)" : "var(--bg)",
                      border: isWin ? "1.5px solid var(--up)" : "1px solid var(--border)",
                      color: isWin ? "var(--up)" : "var(--text)",
                    }}>
                      {n}
                    </span>
                  );
                })}
              </div>
              {won && c.hitCount != null && (
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: hitColor(c.hitCount) }}>
                  {c.hitCount}개 일치
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 번호 전체 선택기 (1~45)
// ──────────────────────────────────────────────

function NumberPicker({
  selected, onToggle, winningNumbers,
}: {
  selected: number[];
  onToggle: (n: number) => void;
  winningNumbers: number[] | null;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {Array.from({ length: 45 }, (_, i) => i + 1).map(n => {
        const isSelected = selected.includes(n);
        const isWin = winningNumbers?.includes(n);
        return (
          <button
            key={n}
            onClick={() => onToggle(n)}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: isSelected ? "2px solid var(--accent)" : isWin ? "1.5px solid var(--up)" : "1px solid var(--border)",
              background: isSelected ? "var(--accent)" : isWin ? "var(--up-soft)" : "var(--bg-alt)",
              color: isSelected ? "var(--accent-fg)" : isWin ? "var(--up)" : "var(--text-2)",
              fontSize: 11, fontWeight: isSelected ? 700 : 400,
              cursor: selected.length >= 6 && !isSelected ? "default" : "pointer",
              opacity: selected.length >= 6 && !isSelected ? 0.4 : 1,
              transition: "all 0.12s",
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// 내 조합 행
// ──────────────────────────────────────────────

function UserComboRow({
  combo, winningNumbers, onDelete,
}: {
  combo: LottoUserCombo;
  winningNumbers: number[] | null;
  onDelete: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "6px 10px", borderRadius: "var(--radius)",
      border: "1px solid var(--border)", background: "var(--bg-alt)",
    }}>
      <div style={{ display: "flex", gap: 5, flex: 1 }}>
        {combo.numbers.map(n => {
          const isWin = winningNumbers?.includes(n);
          return (
            <span key={n} style={{
              width: 30, height: 30, borderRadius: "50%",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: isWin ? 700 : 500,
              background: isWin ? "var(--up-soft)" : "var(--bg)",
              border: isWin ? "1.5px solid var(--up)" : "1px solid var(--border)",
              color: isWin ? "var(--up)" : "var(--text)",
            }}>
              {n}
            </span>
          );
        })}
      </div>
      {combo.hitCount != null && (
        <span style={{ fontSize: 12, fontWeight: 600, color: hitColor(combo.hitCount), whiteSpace: "nowrap" }}>
          {combo.hitCount}개 일치
        </span>
      )}
      <button
        onClick={onDelete}
        style={{
          padding: "2px 8px", borderRadius: "var(--radius)",
          background: "transparent", border: "1px solid var(--border)",
          color: "var(--text-3)", fontSize: 11, cursor: "pointer",
        }}
      >
        삭제
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// 성적 카드
// ──────────────────────────────────────────────

function StatsCard({ stat }: { stat: LottoStatsDto }) {
  const color = STRATEGY_COLOR[stat.strategy];
  return (
    <div className="card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{stat.strategyName}</span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>{stat.totalDraws}회 분석</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <StatBadge label="풀 평균 적중" value={`${stat.avgPoolHit.toFixed(1)}개`} />
          <StatBadge label="조합 평균 적중" value={`${stat.avgComboHit.toFixed(1)}개`} />
        </div>
      </div>
      {/* 히스토리 미니 바 차트 */}
      {stat.history.length > 0 && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 32 }}>
          {stat.history.slice(0, 30).reverse().map(h => (
            <div
              key={h.drawNo}
              title={`${h.drawNo}회: 풀 ${h.poolHitCount}개`}
              style={{
                flex: 1, minWidth: 4,
                height: `${Math.max(4, (h.poolHitCount / 6) * 100)}%`,
                background: color, borderRadius: 2, opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 11, color: "var(--text-4)" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 내 조합 탭 (전체 회차)
// ──────────────────────────────────────────────

function MyComboTab({
  rounds,
  onDeleteCombo,
}: {
  rounds: LottoResultDto[];
  onDeleteCombo: (id: number) => Promise<void>;
}) {
  const [combos, setCombos] = useState<LottoUserCombo[]>([]);

  useEffect(() => {
    apiClient.get("/lotto/combo").then(res => setCombos(res.data.data ?? []));
  }, []);

  if (combos.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>
        저장한 조합이 없습니다. 전략 분석 탭에서 번호를 선택해 저장해보세요.
      </div>
    );
  }

  const roundMap = Object.fromEntries(rounds.map(r => [r.drawNo, r]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {combos.map(c => {
        const r = roundMap[c.drawNo];
        return (
          <div key={c.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>
              {c.drawNo}회
              {r && <span style={{ marginLeft: 4 }}>({r.drawDate})</span>}
            </span>
            <div style={{ display: "flex", gap: 5, flex: 1 }}>
              {c.numbers.map(n => {
                const isWin = r?.numbers?.includes(n);
                return (
                  <span key={n} style={{
                    width: 30, height: 30, borderRadius: "50%",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: isWin ? 700 : 400,
                    background: isWin ? "var(--up-soft)" : "var(--bg-alt)",
                    border: isWin ? "1.5px solid var(--up)" : "1px solid var(--border)",
                    color: isWin ? "var(--up)" : "var(--text-2)",
                  }}>
                    {n}
                  </span>
                );
              })}
            </div>
            {c.hitCount != null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: hitColor(c.hitCount) }}>
                {c.hitCount}개 일치
              </span>
            )}
            <button
              onClick={async () => {
                await onDeleteCombo(c.id);
                setCombos(prev => prev.filter(x => x.id !== c.id));
              }}
              style={{
                padding: "3px 8px", borderRadius: "var(--radius)",
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--text-3)", fontSize: 11, cursor: "pointer",
              }}
            >
              삭제
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// 로또 볼
// ──────────────────────────────────────────────

function LottoBall({ num, size = 32, bonus = false }: { num: number; size?: number; bonus?: boolean }) {
  const bg = bonus ? "#78716c" : ballColor(num);
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: bg, color: "#fff",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {num}
    </span>
  );
}

function ballColor(n: number) {
  if (n <= 10)  return "#fbbf24";
  if (n <= 20)  return "#60a5fa";
  if (n <= 30)  return "#f87171";
  if (n <= 40)  return "#a3a3a3";
  return "#34d399";
}

// ──────────────────────────────────────────────
// 적중 색상 헬퍼
// ──────────────────────────────────────────────

function hitColor(count: number) {
  if (count >= 5) return "var(--up)";
  if (count >= 3) return "#a16207";
  return "var(--text-3)";
}

function hitBg(count: number) {
  if (count >= 5) return "var(--up-soft)";
  if (count >= 3) return "#fef9c3";
  return "var(--bg-alt)";
}
