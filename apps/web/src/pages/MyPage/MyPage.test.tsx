import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { MyPage } from ".";

function renderMyPage(path = "/my") {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/my" element={<MyPage />} />
          <Route path="/my/:section" element={<MyPage />} />
          <Route path="/memo" element={<h1>내 메모 페이지</h1>} />
          <Route path="/admin" element={<h1>관리자 페이지</h1>} />
          <Route path="/stock/:code" element={<h1>종목 상세 페이지</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe("MyPage navigation and favorite stocks", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("mp_token", "token");
    localStorage.setItem("mp_username", "admin");
    localStorage.setItem("mp_role", "ADMIN");
  });

  it("opens cards as standalone pages and opens admin from the admin card", async () => {
    let view = renderMyPage();

    await userEvent.click(screen.getByRole("link", { name: "관심 종목 홈에서 저장한 종목이 여기에 표시됩니다." }));
    expect(screen.getByRole("heading", { name: "관심 종목", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "내 메모 종목과 리포트에 연결된 메모를 모아봅니다." })).not.toBeInTheDocument();
    expect(screen.queryByText("관심 폴더")).not.toBeInTheDocument();

    view.unmount();
    view = renderMyPage();
    await userEvent.click(screen.getByRole("link", { name: "내 메모 종목과 리포트에 연결된 메모를 모아봅니다." }));
    expect(screen.getByRole("heading", { name: "내 메모 페이지" })).toBeInTheDocument();

    view.unmount();
    view = renderMyPage();
    await userEvent.click(screen.getByRole("link", { name: "관리자 검증 기록, 백테스트, 데이터 수집, 캐시 관리는 관리자 전용입니다. ADMIN" }));
    expect(screen.getByRole("heading", { name: "관리자 페이지" })).toBeInTheDocument();
  });

  it("switches favorite folders and adds folders from the folder rail", async () => {
    renderMyPage("/my/favorites");

    expect(screen.queryByText("관심 폴더")).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "관심 종목" })).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "민고민", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "2022년 월드컵" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "2022년 월드컵" }));
    expect(screen.getByText("현대코퍼레이션")).toBeInTheDocument();
    expect(screen.queryByText("케이뱅크")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "그룹 추가" }));
    await userEvent.type(screen.getByLabelText("새 그룹 이름"), "기본");
    await userEvent.click(screen.getByRole("button", { name: "그룹 생성" }));
    expect(screen.getByRole("tab", { name: "기본", selected: true })).toBeInTheDocument();
    expect(screen.getByText("이 그룹에 관심 종목이 없습니다.")).toBeInTheDocument();
  });

  it("uses the stored stock logo path before falling back to initials", () => {
    renderMyPage("/my/favorites");

    expect(screen.queryByText("프로 자세히보기")).not.toBeInTheDocument();
    expect(screen.queryByText("시간외")).not.toBeInTheDocument();
    expect(screen.queryByText("편집")).not.toBeInTheDocument();
    expect(screen.getByLabelText("케이뱅크 로고")).toHaveAttribute("src", "/stock-logos/089590.svg");
    expect(screen.getByLabelText("NAVER 로고")).toHaveAttribute("src", "/stock-logos/035420.svg");
    expect(screen.getByRole("link", { name: /NAVER/ })).toHaveAttribute("href", "/stock/035420");
  });

  it("opens stock detail when a favorite stock row is clicked", async () => {
    renderMyPage("/my/favorites");

    await userEvent.click(screen.getByRole("link", { name: /NAVER/ }));

    expect(screen.getByRole("heading", { name: "종목 상세 페이지" })).toBeInTheDocument();
  });

  it("adds favorite stocks at the bottom of the selected folder list", async () => {
    renderMyPage("/my/favorites");

    expect(screen.queryByRole("button", { name: "관심 종목 추가" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "종목 추가" }));
    await userEvent.type(screen.getByLabelText("관심 종목 이름"), "현대차");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("현대차")).toBeInTheDocument();
    expect(screen.getByText("10개")).toBeInTheDocument();
  });
});
