import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { Nav } from "./Nav";

describe("Nav active state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not mark model list active on today's stock route", () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/quant/today"]}>
          <Nav />
        </MemoryRouter>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: "오늘의 종목" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "오늘의 종목" })).toHaveAttribute("href", "/quant/today");
    expect(screen.getByRole("link", { name: "모델 목록" })).not.toHaveClass("active");
  });
});
