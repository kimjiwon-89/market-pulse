import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient, getRole } from "@/services/apiClient";
import type { QuantExperimentRun, QuantExperimentRunList, QuantExperimentVariant, QuantStrategy } from "@/types";
import { DrawdownChart } from "./DrawdownChart";
import { MonthlyReturnHeatmap } from "./MonthlyReturnHeatmap";
import { VariantTable } from "./VariantTable";

type Props = {
  strategies: QuantStrategy[];
  activeStrategyId: number | null;
  from: string;
  to: string;
};

const DEFAULT_INITIAL_CASH = 100_000_000;

function extractRuns(data: unknown): QuantExperimentRun[] {
  const payload = data as QuantExperimentRunList | QuantExperimentRun[] | null | undefined;
  if (Array.isArray(payload)) return payload;
  return payload?.runs ?? [];
}

function statusClass(status: QuantExperimentRun["status"]) {
  if (status === "DONE") return "tag up";
  if (status === "FAILED") return "tag down";
  return "tag";
}

function pct(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}

function formatPeriod(run: QuantExperimentRun) {
  return `${run.from} - ${run.to}`;
}

function variantsOf(run: QuantExperimentRun | null) {
  return run?.variants ?? [];
}

export function ExperimentPanel({ strategies, activeStrategyId, from, to }: Props) {
  const activeStrategy = useMemo(
    () => strategies.find(strategy => strategy.id === activeStrategyId) ?? null,
    [activeStrategyId, strategies],
  );
  const strategyNameEn = activeStrategy?.nameEn;
  const [runs, setRuns] = useState<QuantExperimentRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = getRole() === "ADMIN";

  const loadRuns = useCallback(() => {
    setLoading(true);
    setError(null);
    return apiClient.get("/quant/experiments", { params: { strategyNameEn, from, to } })
      .then(res => {
        const nextRuns = extractRuns(res.data.data);
        setRuns(nextRuns);
        setSelectedRunId(current => current ?? nextRuns[0]?.id ?? null);
      })
      .catch(() => setError("Experiment data could not be loaded."))
      .finally(() => setLoading(false));
  }, [from, strategyNameEn, to]);

  useEffect(() => {
    setSelectedRunId(null);
    setSelectedVariantId(null);
    void loadRuns();
  }, [loadRuns]);

  const selectedRun = useMemo(
    () => runs.find(run => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId],
  );

  useEffect(() => {
    setSelectedVariantId(current => {
      const variants = variantsOf(selectedRun);
      if (variants.some(variant => variant.id === current)) return current;
      return variants[0]?.id ?? null;
    });
  }, [selectedRun]);

  const selectedVariant = useMemo(
    () => variantsOf(selectedRun).find(variant => variant.id === selectedVariantId) ?? null,
    [selectedRun, selectedVariantId],
  );

  useEffect(() => {
    const runningIds = runs.filter(run => run.status === "RUNNING").map(run => run.id);
    if (runningIds.length === 0) return;
    const intervalId = window.setInterval(() => {
      runningIds.forEach(runId => {
        apiClient.get(`/quant/experiments/${runId}`)
          .then(res => {
            const nextRun: QuantExperimentRun = res.data.data;
            setRuns(current => current.map(run => (run.id === nextRun.id ? nextRun : run)));
          })
          .catch(() => undefined);
      });
    }, 5_000);
    return () => window.clearInterval(intervalId);
  }, [runs]);

  const startExperiment = () => {
    if (!strategyNameEn) return;
    setStarting(true);
    setError(null);
    apiClient.post("/quant/experiments", {
      strategyNameEn,
      from,
      to,
      initialCash: DEFAULT_INITIAL_CASH,
      objective: "MONTHLY_RETURN_GTE_10_AFTER_COST",
      validationMode: "WALK_FORWARD",
      maxVariants: 50,
    })
      .then(res => {
        const nextRun: QuantExperimentRun = res.data.data;
        setRuns(current => [nextRun, ...current.filter(run => run.id !== nextRun.id)]);
        setSelectedRunId(nextRun.id);
      })
      .catch(() => setError("Experiment could not be started."))
      .finally(() => setStarting(false));
  };

  const selectVariant = (variant: QuantExperimentVariant) => setSelectedVariantId(variant.id);
  const runTitle = activeStrategy ? `${activeStrategy.name} experiments` : "All experiments";

  return (
    <section className="stack">
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">{runTitle}</div>
            <div className="card-sub">Walk-forward variants, cost-aware returns, bias checks</div>
          </div>
          {isAdmin && activeStrategy && (
            <button className="btn primary" onClick={startExperiment} disabled={starting}>
              {starting ? "Starting..." : "Run experiment"}
            </button>
          )}
        </div>

        {error && <div className="text-sm text-[var(--up)] mb-3">{error}</div>}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {loading && runs.length === 0 ? (
            <div className="sk w-full" />
          ) : runs.length === 0 ? (
            <span className="text-sm text-[var(--text-3)]">No experiment runs for the selected filters.</span>
          ) : runs.map(run => (
            <button
              key={run.id}
              className="chip"
              aria-pressed={selectedRun?.id === run.id}
              onClick={() => setSelectedRunId(run.id)}
            >
              #{run.id} {run.strategyNameEn} <span className={statusClass(run.status)}>{run.status}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedRun && (
        <>
          <div className="card grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-cell">
              <div className="stat-label">Period</div>
              <div className="stat-value text-base">{formatPeriod(selectedRun)}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Target threshold</div>
              <div className="stat-value text-base">{pct(selectedRun.targetMonthlyReturn)}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Status</div>
              <div><span className={statusClass(selectedRun.status)}>{selectedRun.status}</span></div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Variants</div>
              <div className="stat-value text-base">{variantsOf(selectedRun).length.toLocaleString()}</div>
            </div>
          </div>

          {selectedRun.message && <div className="card text-sm text-[var(--text-3)]">{selectedRun.message}</div>}

          <div className="card">
            <VariantTable variants={variantsOf(selectedRun)} selectedVariantId={selectedVariantId} onSelect={selectVariant} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <div className="card-head">
                <div className="card-title">Drawdown</div>
              </div>
              <DrawdownChart variant={selectedVariant} />
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Monthly returns</div>
              </div>
              <MonthlyReturnHeatmap variant={selectedVariant} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
