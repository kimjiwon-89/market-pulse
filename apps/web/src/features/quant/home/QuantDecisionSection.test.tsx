import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import type { QuantDecision } from "@/features/quant/types";
import { QuantDecisionSection } from "./QuantDecisionSection";

const decision: QuantDecision = {
  assetCode: "005930",
  assetName: "삼성전자",
  badgeText: "삼",
  badgeTone: "blue",
  modelNames: ["KOSPI Bull v1"],
  modelLabel: "상승장 모델",
  decisionLabel: "살펴볼 종목",
  decisionCode: "BUY",
  reasonBullets: ["모델 후보"],
  cautionBullets: ["리플레이 기반 후보"],
};

function renderSection(decisions: QuantDecision[]) {
  return render(
    <AppProviders>
      <MemoryRouter>
        <QuantDecisionSection decisions={decisions} />
      </MemoryRouter>
    </AppProviders>,
  );
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

describe("QuantDecisionSection", () => {
  it("shows a padded empty state instead of an empty table when candidates are unavailable", () => {
    renderSection([]);

    expect(screen.getByText("표시할 추천 후보가 없습니다. 과거 검증 후보는 각 모델 상세에서 확인해주세요.")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "종목" })).not.toBeInTheDocument();
  });

  it("shows the candidate list when candidates are available", () => {
    renderSection([decision]);

    expect(screen.getByRole("columnheader", { name: "종목" })).toBeInTheDocument();
    expect(screen.getAllByText("삼성전자").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /삼성전자/ })[0]).toHaveAttribute("href", "/stock/005930");
    expect(screen.queryByText("표시할 추천 후보가 없습니다. 과거 검증 후보는 각 모델 상세에서 확인해주세요.")).not.toBeInTheDocument();
  });

  it("opens the all-model candidate list from the full list button", async () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <QuantDecisionSection decisions={[]} />
          <LocationProbe />
        </MemoryRouter>
      </AppProviders>,
    );

    await userEvent.click(screen.getByRole("button", { name: "전체 목록 보기" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/quant/today");
  });
});
