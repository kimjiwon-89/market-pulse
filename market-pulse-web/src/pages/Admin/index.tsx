import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';

interface UserItem {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

export function Admin() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [pwdTarget, setPwdTarget] = useState<number | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/users');
      setUsers(res.data.data);
    } catch {
      setError('사용자 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      await apiClient.post('/admin/users', { username: newUsername, password: newPassword, role: newRole });
      setNewUsername('');
      setNewPassword('');
      setNewRole('USER');
      await fetchUsers();
    } catch (err: any) {
      setAddError(err.response?.data?.message || '사용자 추가에 실패했습니다');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id: number, username: string) {
    if (!confirm(`'${username}' 계정을 삭제하시겠습니까?`)) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || '삭제에 실패했습니다');
    }
  }

  async function handlePasswordChange(id: number) {
    if (!newPwd.trim()) return;
    setPwdLoading(true);
    try {
      await apiClient.patch(`/admin/users/${id}/password`, { newPassword: newPwd });
      setPwdTarget(null);
      setNewPwd('');
    } catch {
      alert('비밀번호 변경에 실패했습니다');
    } finally {
      setPwdLoading(false);
    }
  }

  function fmtDate(iso: string) {
    return iso ? iso.replace('T', ' ').substring(0, 16) : '-';
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 860 }}>
      <h1 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>사용자 관리</h1>

      {/* 사용자 추가 폼 */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.875rem', color: 'var(--text-secondary)' }}>
          사용자 추가
        </h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>아이디</label>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              placeholder="아이디"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="비밀번호"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>권한</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button type="submit" disabled={addLoading} className="btn btn--primary" style={{ height: 34 }}>
            {addLoading ? '추가 중...' : '추가'}
          </button>
        </form>
        {addError && <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-down)' }}>{addError}</p>}
      </div>

      {/* 사용자 목록 */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>불러오는 중...</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-down)', fontSize: '0.875rem' }}>{error}</div>
        ) : (
          <table className="t" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>아이디</th>
                <th>권한</th>
                <th>가입일</th>
                <th style={{ width: 260 }}>비밀번호 변경</th>
                <th style={{ width: 80 }}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.username}</td>
                  <td>
                    <span className="tag" style={{ background: u.role === 'ADMIN' ? 'var(--accent-soft)' : undefined }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{fmtDate(u.createdAt)}</td>
                  <td>
                    {pwdTarget === u.id ? (
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <input
                          type="password"
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          placeholder="새 비밀번호"
                          style={{ ...inputStyle, flex: 1, height: 28, fontSize: '0.8125rem' }}
                          autoFocus
                        />
                        <button
                          className="btn btn--primary"
                          style={{ height: 28, fontSize: '0.75rem', padding: '0 8px' }}
                          disabled={pwdLoading}
                          onClick={() => handlePasswordChange(u.id)}
                        >
                          저장
                        </button>
                        <button
                          className="btn"
                          style={{ height: 28, fontSize: '0.75rem', padding: '0 8px' }}
                          onClick={() => { setPwdTarget(null); setNewPwd(''); }}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn"
                        style={{ height: 28, fontSize: '0.75rem' }}
                        onClick={() => { setPwdTarget(u.id); setNewPwd(''); }}
                      >
                        변경
                      </button>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn"
                      style={{ height: 28, fontSize: '0.75rem', color: 'var(--color-down)' }}
                      onClick={() => handleDelete(u.id, u.username)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0 0.625rem',
  height: 34,
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
};
