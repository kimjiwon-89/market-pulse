import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getToken } from "@/services/apiClient";

interface FavoriteFolderPickerProps {
  assetName: string;
}

export function FavoriteFolderPicker({ assetName }: FavoriteFolderPickerProps) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  function handleClick() {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    setIsSaved((current) => !current);
  }

  return (
    <FavoriteWrap>
      <FavoriteButton
        $saved={isSaved}
        type="button"
        aria-label={`${assetName} 관심 종목 추가`}
        title={isSaved ? "관심 종목에 저장됨" : "관심 종목 추가"}
        onClick={handleClick}
      >
        {isSaved ? "★" : "☆"}
      </FavoriteButton>
    </FavoriteWrap>
  );
}

const FavoriteWrap = styled.div`
  position: relative;
  display: inline-flex;
  justify-content: flex-end;
  vertical-align: middle;
`;

const FavoriteButton = styled.button<{ $saved: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  background: transparent;
  color: ${({ $saved, theme }) => ($saved ? theme.color.accent : theme.color.textSubtle)};
  font-size: 18px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.accent};
  }
`;
