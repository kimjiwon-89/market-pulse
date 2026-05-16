import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, setAuth } from '@/services/apiClient';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      const { token, username: uname, role } = res.data.data;
      setAuth(token, uname, role);
      navigate('/', { replace: true });
    } catch {
      setError('아이디 또는 비밀번호가 틀렸습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 360, padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Market Pulse
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-down)', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary"
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <button
            type="button"
            className="btn ghost"
            style={{ width: '100%', marginTop: '0.25rem' }}
            onClick={() => navigate('/')}
          >
            홈으로
          </button>
        </form>
      </div>
    </div>
  );
}
