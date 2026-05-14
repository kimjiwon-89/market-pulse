import { useState } from "react";
import type { RankingItem } from "@/types";

const TABS = ["전체", "개인", "기관", "외국인"] as const;

interface Props {
  data?: RankingItem[];
}

export function RankingTable({ data = [] }: Props) {
  const [activeTab, setActiveTab] = useState<string>("전체");
  const [activeMarket, setActiveMarket] = useState<"KOSPI" | "KOSDAQ">("KOSPI");

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden font-sans w-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <div className="flex gap-4">
          {/* 시장 선택 */}
          <div className="bg-slate-100 p-1 rounded-xl flex">
            {(["KOSPI", "KOSDAQ"] as const).map((market) => (
              <button
                key={market}
                onClick={() => setActiveMarket(market)}
                className={`px-4 py-2 text-sm rounded-lg border-none cursor-pointer transition-all ${
                  activeMarket === market
                    ? "bg-white font-bold text-slate-900 shadow-sm"
                    : "bg-transparent font-medium text-slate-500"
                }`}
              >
                {market}
              </button>
            ))}
          </div>

          {/* 탭 */}
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-all ${
                  activeTab === tab
                    ? "bg-blue-50 text-blue-600"
                    : "bg-transparent text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">단위: 억 원, 천 주</span>
          <button className="p-2 border-none bg-transparent cursor-pointer rounded-lg text-slate-500 hover:bg-slate-50">
            ↓
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-t-2 border-blue-600">
        <table className="w-full border-collapse text-xs" style={{ minWidth: "1000px" }}>
          <thead>
            <tr className="border-b border-slate-100">
              <th className="p-3 px-4 text-slate-500 font-bold text-left w-[60px]">RANK</th>
              <th colSpan={3} className="p-3 px-4 text-slate-500 font-bold text-left">2026.03.28 (Sat)</th>
              <th colSpan={3} className="p-3 px-4 text-slate-500 font-bold text-left">2026.03.29 (Sun)</th>
              <th colSpan={3} className="p-3 px-4 font-bold text-left bg-blue-50 text-blue-600">금주 합계 분석</th>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-3 px-4 text-slate-500 font-bold text-left">#</th>
              {[0, 1, 2].map((i) => (
                <>
                  <th key={`name-${i}`} className="p-3 px-4 text-slate-500 font-bold text-left">종목명</th>
                  <th key={`amount-${i}`} className="p-3 px-4 text-slate-500 font-bold text-right">순매수대금</th>
                  <th key={`volume-${i}`} className="p-3 px-4 text-slate-500 font-bold text-right">순매수량</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.rank}
                className="border-b border-slate-50 transition-colors hover:bg-slate-50/50"
              >
                <td className="p-3 px-4 text-blue-600 font-bold">{item.rank}</td>

                {/* 당일 */}
                <td className="p-3 px-4 text-slate-800">{item.name}</td>
                <td className="p-3 px-4 text-right text-red-500 font-bold">{item.todayAmount}억</td>
                <td className="p-3 px-4 text-right text-slate-400">{item.todayVolume}주</td>

                {/* 전일 */}
                <td className="p-3 px-4 text-slate-700">{item.name}</td>
                <td className="p-3 px-4 text-right text-red-400">{item.yesterdayAmount}억</td>
                <td className="p-3 px-4 text-right text-slate-400">{item.yesterdayVolume}주</td>

                {/* 금주 합계 */}
                <td className="p-3 px-4 bg-blue-50/40 font-bold text-slate-800">{item.name}</td>
                <td className="p-3 px-4 bg-blue-50/40 text-right text-red-600 font-bold">{item.weekAmount}억</td>
                <td className="p-3 px-4 bg-blue-50/40 text-right text-slate-400">{item.weekVolume ?? "0"}주</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
