import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getToken } from "@/services/apiClient";

const defaultFavoriteFolders = ["메인 관심", "반도체", "관찰", "리스크 체크"];

interface FavoriteFolderPickerProps {
  assetName: string;
}

export function FavoriteFolderPicker({ assetName }: FavoriteFolderPickerProps) {
  const navigate = useNavigate();
  const [folders, setFolders] = useState(defaultFavoriteFolders);
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  function handleClick() {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    setIsOpen((current) => !current);
  }

  function selectFolder(folderName: string) {
    setSelectedFolder(folderName);
    setIsOpen(false);
    setIsAddingFolder(false);
  }

  function addFolder() {
    const nextFolderName = newFolderName.trim();

    if (!nextFolderName) {
      return;
    }

    setFolders((current) => current.includes(nextFolderName) ? current : [...current, nextFolderName]);
    setSelectedFolder(nextFolderName);
    setNewFolderName("");
    setIsAddingFolder(false);
    setIsOpen(false);
  }

  return (
    <FavoriteWrap>
      <FavoriteButton
        $saved={!!selectedFolder}
        type="button"
        aria-label={`${assetName} 관심 종목 추가`}
        title={selectedFolder ? `${selectedFolder}에 저장됨` : "관심 종목 추가"}
        onClick={handleClick}
      >
        {selectedFolder ? "★" : "☆"}
      </FavoriteButton>
      {isOpen && (
        <FavoritePopover>
          <FavoritePopoverTitle>관심 폴더 선택</FavoritePopoverTitle>
          {folders.map((folderName) => (
            <FavoriteFolderButton
              key={folderName}
              type="button"
              onClick={() => selectFolder(folderName)}
            >
              {folderName}
            </FavoriteFolderButton>
          ))}
          <FavoriteDivider />
          {isAddingFolder ? (
            <FavoriteAddForm>
              <FavoriteFolderInput
                value={newFolderName}
                placeholder="폴더명"
                onChange={(event) => setNewFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addFolder();
                  }
                }}
              />
              <FavoriteAddConfirm type="button" onClick={addFolder}>추가</FavoriteAddConfirm>
            </FavoriteAddForm>
          ) : (
            <FavoriteFolderButton
              $add
              type="button"
              onClick={() => setIsAddingFolder(true)}
            >
              + 폴더 추가
            </FavoriteFolderButton>
          )}
        </FavoritePopover>
      )}
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

const FavoritePopover = styled.div`
  position: absolute;
  top: 30px;
  right: 0;
  z-index: 50;
  width: 150px;
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.panel};
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  text-align: left;
`;

const FavoritePopoverTitle = styled.p`
  margin: 0 0 6px;
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 11px;
`;

const FavoriteFolderButton = styled.button<{ $add?: boolean }>`
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.small};
  background: transparent;
  color: ${({ $add, theme }) => ($add ? theme.color.accent : theme.color.textMuted)};
  font-size: 12px;
  font-weight: ${({ $add }) => ($add ? 600 : 400)};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.accentSoft};
    color: ${({ theme }) => theme.color.accent};
  }
`;

const FavoriteDivider = styled.div`
  height: 1px;
  margin: 6px 0;
  background: ${({ theme }) => theme.color.divider};
`;

const FavoriteAddForm = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 6px;
`;

const FavoriteFolderInput = styled.input`
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.small};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 12px;
`;

const FavoriteAddConfirm = styled.button`
  height: 28px;
  border: 1px solid ${({ theme }) => theme.color.accentBorder};
  border-radius: ${({ theme }) => theme.radius.small};
  background: ${({ theme }) => theme.color.accentSoft};
  color: ${({ theme }) => theme.color.accent};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`;
