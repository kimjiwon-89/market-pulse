import {
  quantDecisions,
  quantKpis,
  quantModels,
  quantReports,
} from "./mock";

export async function getQuantHomeSummary() {
  return {
    decisions: quantDecisions,
    kpis: quantKpis,
    models: quantModels,
    reports: quantReports,
  };
}
