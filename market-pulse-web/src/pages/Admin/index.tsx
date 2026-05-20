import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';

interface UserItem {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

interface QuantCollectStatus {
  status: 'IDLE' | 'RUNNING' | 'DONE' | 'ERROR';
  progress: number;
  processedDates: number;
  totalDates: number;
  collectedDates: number;
  latestDate: string | null;
  message: string | null;
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

  const [quantFrom, setQuantFrom] = useState('20200101');
  const [quantTo, setQuantTo] = useState('20251231');
  const [quantType, setQuantType] = useState('ALL');
  const [collectStatus, setCollectStatus] = useState<QuantCollectStatus | null>(null);
  const [collectLoading, setCollectLoading] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [quantMessage, setQuantMessage] = useState('');

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

  useEffect(() => {
    fetchQuantStatus();
    const timer = window.setInterval(() => {
      fetchQuantStatus();
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

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

  async function fetchQuantStatus() {
    try {
      const res = await apiClient.get('/quant/collect/status');
      setCollectStatus(res.data.data);
    } catch {
      // 관리자 화면의 사용자 관리 기능을 막지 않기 위해 조용히 무시한다.
    }
  }

  async function handleCollect(e: React.FormEvent) {
    e.preventDefault();
    setCollectLoading(true);
    setQuantMessage('');
    try {
      const res = await apiClient.post('/quant/collect', null, {
        params: { from: quantFrom, to: quantTo, dataType: quantType },
      });
      setCollectStatus(res.data.data);
      setQuantMessage('수집을 시작했습니다.');
    } catch (err: any) {
      setQuantMessage(err.response?.data?.message || '수집 시작에 실패했습니다.');
    } finally {
      setCollectLoading(false);
    }
  }

  async function handleClearQuantCache() {
    if (!confirm(`${quantFrom}~${quantTo} 백테스팅 캐시를 삭제할까요?`)) return;
    setCacheLoading(true);
    setQuantMessage('');
    try {
      await apiClient.delete('/quant/cache', { params: { from: quantFrom, to: quantTo } });
      setQuantMessage('백테스팅 캐시를 삭제했습니다.');
    } catch (err: any) {
      setQuantMessage(err.response?.data?.message || '캐시 삭제에 실패했습니다.');
    } finally {
      setCacheLoading(false);
    }
  }

  const progressPct = collectStatus ? Math.round((collectStatus.progress ?? 0) * 1000) / 10 : 0;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 980 }}>
      <h1 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>관리자</h1>

      {/* 퀀트 데이터 수집 */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '0.875rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>
            퀀트 데이터 수집
          </h2>
          <span className="tag" style={{ fontFamily: 'var(--font-mono)' }}>
            {collectStatus?.status ?? 'IDLE'}
          </span>
        </div>

        <form onSubmit={handleCollect} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>시작일</label>
            <input value={quantFrom} onChange={(e) => setQuantFrom(e.target.value)} required style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>종료일</label>
            <input value={quantTo} onChange={(e) => setQuantTo(e.target.value)} required style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>데이터</label>
            <select value={quantType} onChange={(e) => setQuantType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="ALL">ALL</option>
              <option value="INDEX">INDEX</option>
              <option value="STOCK">STOCK</option>
              <option value="BOND">BOND</option>
              <option value="GOLD">GOLD</option>
            </select>
          </div>
          <button type="submit" disabled={collectLoading || collectStatus?.status === 'RUNNING'} className="btn btn--primary" style={{ height: 34 }}>
            {collectLoading ? '시작 중...' : '수집 시작'}
          </button>
          <button type="button" className="btn" style={{ height: 34 }} onClick={fetchQuantStatus}>
            상태 새로고침
          </button>
          <button type="button" className="btn" style={{ height: 34 }} disabled={cacheLoading} onClick={handleClearQuantCache}>
            {cacheLoading ? '삭제 중...' : '캐시 삭제'}
          </button>
        </form>

        <div style={{ marginTop: '1rem' }}>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-alt)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ width: `${Math.min(100, progressPct)}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', marginTop: '0.625rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            <span>진행률 <strong className="num">{progressPct}%</strong></span>
            <span>처리 <strong className="num">{collectStatus?.processedDates ?? 0}</strong> / <strong className="num">{collectStatus?.totalDates ?? 0}</strong></span>
            <span>수집 <strong className="num">{collectStatus?.collectedDates ?? 0}</strong></span>
            <span>최근 날짜 <strong className="num">{collectStatus?.latestDate ?? '-'}</strong></span>
          </div>
          {(quantMessage || collectStatus?.message) && (
            <p style={{ margin: '0.625rem 0 0', fontSize: '0.8125rem', color: collectStatus?.status === 'ERROR' ? 'var(--color-down)' : 'var(--text-secondary)' }}>
              {quantMessage || collectStatus?.message}
            </p>
          )}
        </div>
      </div>

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
