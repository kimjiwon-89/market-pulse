import { useEffect, useRef, useState } from "react";
import { apiClient, getToken, getUsername } from "@/services/apiClient";
import type { LottoComment } from "@/types";

export function LottoDiscussion({ drawNo }: { drawNo: number }) {
  const [comments, setComments] = useState<LottoComment[]>([]);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const isAuthed = !!getToken();
  const currentUser = getUsername();

  const fetchComments = async () => {
    try {
      const res = await apiClient.get("/lotto/comment", { params: { round: drawNo } });
      setComments(res.data.data ?? []);
    } catch {}
  };

  useEffect(() => {
    fetchComments();
  }, [drawNo]);

  const handleImageUpload = async (
    file: File,
    onUrl: (url: string) => void
  ) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiClient.post("/lotto/comment/image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUrl(res.data.data.imageUrl);
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/lotto/comment", { drawNo, content, imageUrl });
      setContent("");
      setImageUrl(null);
      await fetchComments();
    } catch {
      alert("댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c: LottoComment) => {
    setEditingId(c.id);
    setEditContent(c.content);
    setEditImageUrl(c.imageUrl);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditImageUrl(null);
  };

  const submitEdit = async (id: number) => {
    try {
      await apiClient.patch(`/lotto/comment/${id}`, {
        content: editContent,
        imageUrl: editImageUrl,
      });
      cancelEdit();
      await fetchComments();
    } catch {
      alert("수정에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("댓글을 삭제할까요?")) return;
    try {
      await apiClient.delete(`/lotto/comment/${id}`);
      await fetchComments();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <div className="card" style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
          아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
        </div>
      ) : (
        comments.map(c => (
          <div key={c.id} className="card" style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: "var(--accent)",
                  background: "var(--accent-soft)", borderRadius: 20,
                  padding: "2px 10px",
                }}>
                  {c.username}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-4)" }}>
                  {formatTime(c.createdAt)}
                  {c.updatedAt !== c.createdAt && " (수정됨)"}
                </span>
              </div>
              {c.isOwner && editingId !== c.id && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => startEdit(c)}
                    style={btnStyle}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    style={{ ...btnStyle, color: "var(--down)" }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {editingId === c.id ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={3}
                  style={textareaStyle}
                />
                {editImageUrl && (
                  <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
                    <img src={editImageUrl} alt="첨부" style={{ maxWidth: 200, borderRadius: "var(--radius)" }} />
                    <button
                      onClick={() => setEditImageUrl(null)}
                      style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10 }}
                    >
                      ×
                    </button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
                  <button onClick={() => editFileRef.current?.click()} style={btnStyle} disabled={uploading}>
                    {uploading ? "업로드 중..." : "이미지 변경"}
                  </button>
                  <input
                    ref={editFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f, url => setEditImageUrl(url));
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => submitEdit(c.id)}
                    style={{ ...btnStyle, background: "var(--accent)", color: "var(--accent-fg)", border: "none" }}
                  >
                    저장
                  </button>
                  <button onClick={cancelEdit} style={btnStyle}>취소</button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "var(--text)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {c.content}
                </p>
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt="첨부 이미지"
                    style={{ marginTop: 10, maxWidth: "100%", maxHeight: 400, borderRadius: "var(--radius)", objectFit: "contain" }}
                  />
                )}
              </>
            )}
          </div>
        ))
      )}

      {/* 댓글 입력 폼 */}
      {isAuthed ? (
        <div className="card" style={{ padding: "14px 18px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", margin: "0 0 8px" }}>
            {currentUser} 으로 댓글 작성
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="번호 인증, 수식 토론 등 자유롭게 남겨보세요..."
            rows={3}
            style={textareaStyle}
          />
          {imageUrl && (
            <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
              <img src={imageUrl} alt="첨부" style={{ maxWidth: 200, borderRadius: "var(--radius)" }} />
              <button
                onClick={() => setImageUrl(null)}
                style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10 }}
              >
                ×
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <button
              onClick={() => fileRef.current?.click()}
              style={btnStyle}
              disabled={uploading}
            >
              {uploading ? "업로드 중..." : "사진 첨부"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f, url => setImageUrl(url));
                e.target.value = "";
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              style={{
                padding: "7px 18px", borderRadius: "var(--radius)",
                background: content.trim() && !submitting ? "var(--accent)" : "var(--bg-alt)",
                color: content.trim() && !submitting ? "var(--accent-fg)" : "var(--text-3)",
                border: "none", fontSize: 13,
                cursor: content.trim() && !submitting ? "pointer" : "default",
              }}
            >
              {submitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: "20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
          <a href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>로그인</a> 후 댓글을 작성할 수 있습니다.
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "3px 10px",
  borderRadius: "var(--radius)",
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-3)",
  fontSize: 12,
  cursor: "pointer",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--bg-input)",
  color: "var(--text)",
  fontSize: 13,
  resize: "vertical",
  boxSizing: "border-box",
  lineHeight: 1.6,
};
