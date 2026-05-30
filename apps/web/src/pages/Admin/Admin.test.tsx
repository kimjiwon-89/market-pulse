import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { Admin } from ".";
import { listQuantModelPackages, scanQuantModelPackages, updateQuantModelPackageVisibility } from "./api";

vi.mock("./api", () => ({
  listQuantModelPackages: vi.fn(),
  scanQuantModelPackages: vi.fn(),
  updateQuantModelPackageVisibility: vi.fn(),
}));

const packageRow = {
  modelCode: "KOSDAQ_BULL",
  modelName: "KOSDAQ Bull v1",
  modelVersion: "1.0.0",
  category: "상승장",
  packageStatus: "DETECTED",
  publicVisible: false,
  runtimeReady: false,
  packagePath: "domains/quant-serving/packages/KOSDAQ_BULL",
  adminNote: "검토 전",
  updatedAt: "2026-05-30T10:30:00",
};

function renderAdmin() {
  return render(
    <AppProviders>
      <Admin />
    </AppProviders>,
  );
}

describe("Admin quant package registry", () => {
  beforeEach(() => {
    vi.mocked(listQuantModelPackages).mockResolvedValue([packageRow]);
    vi.mocked(scanQuantModelPackages).mockResolvedValue([packageRow]);
    vi.mocked(updateQuantModelPackageVisibility).mockResolvedValue({
      ...packageRow,
      packageStatus: "APPROVED",
      publicVisible: true,
      adminNote: "공개 승인",
    });
  });

  it("shows scanned model packages and lets admins expose them", async () => {
    renderAdmin();

    expect(screen.getByRole("tab", { name: "모델" })).toBeInTheDocument();
    expect(await screen.findByText("KOSDAQ Bull v1")).toBeInTheDocument();
    expect(screen.getAllByText("비공개").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "패키지 스캔" }));
    expect(scanQuantModelPackages).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getAllByRole("button", { name: "공개" })[0]);

    expect(updateQuantModelPackageVisibility).toHaveBeenCalledWith("KOSDAQ_BULL", {
      publicVisible: true,
      packageStatus: "APPROVED",
      adminNote: "공개 승인",
    });
    expect((await screen.findAllByText("공개")).length).toBeGreaterThan(0);
  });

  it("replaces placeholder operations with admin work tabs", async () => {
    renderAdmin();

    expect(screen.getByRole("heading", { name: "관리자 처리할 일" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "계정" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "모델" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "운영" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "매출" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "버그" })).toBeInTheDocument();

    expect(screen.queryByText("데이터 수집")).not.toBeInTheDocument();
    expect(screen.queryByText("모델 실행")).not.toBeInTheDocument();
    expect(screen.queryByText("운영 체크리스트")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "버그" }));

    expect(screen.getByText("버그 신고함")).toBeInTheDocument();
    expect(screen.getAllByText("report/bugs/inbox").length).toBeGreaterThan(0);
  });
});
