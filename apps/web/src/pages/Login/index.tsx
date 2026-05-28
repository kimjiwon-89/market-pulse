import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuth } from '@/services/apiClient';

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
    window.setTimeout(() => {
      if (!username.trim() || !password.trim()) {
        setError('아이디와 비밀번호를 입력해주세요');
        setLoading(false);
        return;
      }
      const role = username.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';
      setAuth('mock-token', username, role);
      navigate('/', { replace: true });
      setLoading(false);
    }, 250);
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
                background: 'var(--bg-input)',
                color: 'var(--text)',
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
                background: 'var(--bg-input)',
                color: 'var(--text)',
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
            className="btn primary"
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
