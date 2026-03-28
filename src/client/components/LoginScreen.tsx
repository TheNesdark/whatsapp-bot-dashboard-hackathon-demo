import React, { useState, FormEvent } from 'react';
import { Lock, Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/schemas/auth';

export function LoginScreen() {
  const { unlock } = useAuth();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ password });
    if (!result.success) return;
    setLoading(true);
    setError(false);
    const ok = await unlock(result.data.password);
    setLoading(false);
    if (!ok) {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="sidebar-logo-icon" style={{ marginBottom: 0 }}>
            <Zap size={20} />
          </div>
        </div>

        <div className="login-header">
          <div className="login-lock-icon">
            <Lock size={18} />
          </div>
          <h1 className="login-title">Acceso restringido</h1>
          <p className="login-subtitle">Introduce la contraseña para acceder al dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-wrap">
            <input
              className={`s-input login-input${error ? ' login-input--error' : ''}`}
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="Contraseña…"
              autoFocus
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              className="login-eye-btn"
              onClick={() => setShowPw(v => !v)}
              tabIndex={-1}
              title={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <p className="login-error">Contraseña incorrecta. Inténtalo de nuevo.</p>
          )}

          <button
            type="submit"
            className="btn btn--primary login-submit"
            disabled={loading || !password.trim()}
          >
            {loading ? <><Loader2 size={14} className="spin" /> Verificando…</> : <>Acceder</>}
          </button>
        </form>
      </div>
    </div>
  );
}
