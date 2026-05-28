import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="favorite-wrap">
      <button
        className={`favorite-button ${selectedFolder ? "saved" : ""}`}
        type="button"
        aria-label={`${assetName} 관심 종목 추가`}
        title={selectedFolder ? `${selectedFolder}에 저장됨` : "관심 종목 추가"}
        onClick={handleClick}
      >
        {selectedFolder ? "★" : "☆"}
      </button>
      {isOpen && (
        <div className="favorite-popover">
          <div className="favorite-popover-title">관심 폴더 선택</div>
          {folders.map((folderName) => (
            <button
              key={folderName}
              className="favorite-folder-button"
              type="button"
              onClick={() => selectFolder(folderName)}
            >
              {folderName}
            </button>
          ))}
          <div className="favorite-divider" />
          {isAddingFolder ? (
            <div className="favorite-add-form">
              <input
                className="favorite-folder-input"
                value={newFolderName}
                placeholder="새 폴더명"
                onChange={(event) => setNewFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addFolder();
                  }
                }}
              />
              <button className="favorite-add-confirm" type="button" onClick={addFolder}>추가</button>
            </div>
          ) : (
            <button
              className="favorite-folder-button add"
              type="button"
              onClick={() => setIsAddingFolder(true)}
            >
              + 폴더 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
