import React, { useState } from "react";
import { Download } from "lucide-react";
import styled from "styled-components";

const RankingTable = ({ data = [] }) => {
  const [activeTab, setActiveTab] = useState("전체");

  return (
    <Container>
      {/* Header 섹션 */}
      <Header>
        <HeaderLeft>
          <MarketSelector>
            <MarketButton active>KOSPI</MarketButton>
            <MarketButton>KOSDAQ</MarketButton>
          </MarketSelector>

          <TabGroup>
            {["전체", "개인", "기관", "외국인"].map((tab) => (
              <TabButton
                key={tab}
                isActive={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </TabButton>
            ))}
          </TabGroup>
        </HeaderLeft>

        <HeaderRight>
          <UnitText>단위: 억 원, 천 주</UnitText>
          <IconButton>
            <Download size={16} />
          </IconButton>
        </HeaderRight>
      </Header>

      {/* Table 섹션 */}
      <TableContainer>
        <Table>
          <thead>
            <HeaderRow>
              <Th width="60px">RANK</Th>
              <Th colSpan={3}>2026.03.28 (Sat)</Th>
              <Th colSpan={3}>2026.03.29 (Sun)</Th>
              <Th colSpan={3} isBlue>
                금주 합계 분석
              </Th>
            </HeaderRow>
            <SubHeaderRow>
              <Th>#</Th>
              {[1, 2, 3].map((_, i) => (
                <React.Fragment key={i}>
                  <Th>종목명</Th>
                  <Th align="right">순매수대금</Th>
                  <Th align="right">순매수량</Th>
                </React.Fragment>
              ))}
            </SubHeaderRow>
          </thead>
          <tbody>
            {data.map((item) => (
              <Tr key={item.rank}>
                <RankTd>{item.rank}</RankTd>

                {/* 2026.03.28 데이터 */}
                <Td>{item.name}</Td>
                <Td align="right" color="#ef4444" bold>
                  {item.todayAmount}억
                </Td>
                <Td align="right" color="#94a3b8">
                  {item.todayVolume}주
                </Td>

                {/* 2026.03.29 데이터 */}
                <Td color="#334155">{item.name}</Td>
                <Td align="right" color="#f87171">
                  {item.yesterdayAmount}억
                </Td>
                <Td align="right" color="#94a3b8">
                  {item.yesterdayVolume}주
                </Td>

                {/* 금주 합계 분석 데이터 (강조 배경) */}
                <BlueTd bold>{item.name}</BlueTd>
                <BlueTd align="right" color="#dc2626" bold>
                  {item.weekAmount}억
                </BlueTd>
                <BlueTd align="right" color="#94a3b8">
                  {item.weekVolume || "0"}주
                </BlueTd>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default RankingTable;

// --- Styled Components ---

const Container = styled.div`
  background-color: white;
  border-radius: 1.5rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  font-family: sans-serif;
  width: 100%;
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderLeft = styled.div`
  display: flex;
  gap: 1rem;
`;

const MarketSelector = styled.div`
  background-color: #f1f5f9;
  padding: 0.25rem;
  border-radius: 0.75rem;
  display: flex;
`;

const MarketButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: ${(props) => (props.active ? "700" : "500")};
  background-color: ${(props) => (props.active ? "white" : "transparent")};
  color: ${(props) => (props.active ? "#0f172a" : "#64748b")};
  box-shadow: ${(props) =>
    props.active ? "0 1px 2px 0 rgb(0 0 0 / 0.05)" : "none"};
`;

const TabGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TabButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${(props) => (props.isActive ? "#eff6ff" : "transparent")};
  color: ${(props) => (props.isActive ? "#2563eb" : "#64748b")};
  &:hover {
    background-color: #f8fafc;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UnitText = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
`;

const IconButton = styled.button`
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 0.5rem;
  color: #475569;
  &:hover {
    background-color: #f8fafc;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-top: 2px solid #2563eb;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 1000px;
`;

const HeaderRow = styled.tr`
  border-bottom: 1px solid #f1f5f9;
`;

const SubHeaderRow = styled.tr`
  background-color: #fafafa;
  border-bottom: 1px solid #f1f5f9;
`;

const Th = styled.th`
  padding: 12px 15px;
  color: #64748b;
  font-weight: 700;
  text-align: ${(props) => props.align || "left"};
  width: ${(props) => props.width || "auto"};
  ${(props) =>
    props.isBlue &&
    `
    background-color: #eff6ff;
    color: #2563eb;
  `}
`;

const Tr = styled.tr`
  border-bottom: 1px solid #f8fafc;
  transition: background-color 0.2s;
  &:hover {
    background-color: rgba(248, 250, 252, 0.5);
  }
`;

const Td = styled.td`
  padding: 12px 15px;
  text-align: ${(props) => props.align || "left"};
  color: ${(props) => props.color || "#1e293b"};
  font-weight: ${(props) => (props.bold ? "700" : "400")};
`;

const RankTd = styled(Td)`
  color: #2563eb;
  font-weight: 700;
`;

const BlueTd = styled(Td)`
  background-color: rgba(239, 246, 255, 0.4);
`;
