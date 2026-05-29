import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { setAuth } from "@/services/apiClient";
import { Button, Card, MutedText, PageTitle, Stack, SubText } from "@/components/ui/Page";

const LoginShell = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${({ theme }) => theme.color.bg};
`;

const LoginCard = styled(Card)`
  width: min(100%, 380px);
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 12px;
  font-weight: 700;

  input {
    height: 38px;
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.control};
    padding: 0 10px;
    color: ${({ theme }) => theme.color.text};
    font: inherit;
  }
`;

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      if (!username.trim() || !password.trim()) {
        setError("아이디와 비밀번호를 입력해주세요");
        setLoading(false);
        return;
      }
      const role = username.toLowerCase().includes("admin") ? "ADMIN" : "USER";
      setAuth("mock-token", username, role);
      navigate("/", { replace: true });
      setLoading(false);
    }, 250);
  }

  return (
    <LoginShell>
      <LoginCard>
        <Stack>
          <div>
            <PageTitle>Market Pulse</PageTitle>
            <SubText>관심 종목, 메모, 알림을 사용하려면 로그인하세요.</SubText>
          </div>
          <form onSubmit={handleSubmit}>
            <Stack $gap="12px">
              <Field>
                아이디
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
              </Field>
              <Field>
                비밀번호
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              {error && <MutedText>{error}</MutedText>}
              <Button type="submit" disabled={loading} $primary>{loading ? "로그인 중..." : "로그인"}</Button>
              <Button type="button" onClick={() => navigate("/")}>홈으로</Button>
            </Stack>
          </form>
        </Stack>
      </LoginCard>
    </LoginShell>
  );
}
