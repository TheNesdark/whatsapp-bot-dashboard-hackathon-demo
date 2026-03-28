import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, getPassword, savePassword, clearPassword } from '@/utils/api';
import { resetWs } from '@/hooks';
import type { AuthContextValue } from '@/types';

const AuthContext = createContext<AuthContextValue>({
  isLocked: false,
  unlock: async () => false,
  lock: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Escuchar errores 401 globales para bloquear automáticamente
    const onUnauthorized = () => { if (isMounted.current) setIsLocked(true); };
    window.addEventListener('auth:unauthorized', onUnauthorized);

    (async () => {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json() as { enabled: boolean };
        if (!isMounted.current) return;

        if (!data.enabled) {
          // Protección desactivada → siempre libre
          setIsLocked(false);
        } else {
          const password = getPassword();
          if (!password) {
            setIsLocked(true);
          } else {
            // Validar que la contraseña almacenada sigue siendo válida
            try {
              await apiFetch('/api/settings');
              if (isMounted.current) setIsLocked(false);
            } catch {
              clearPassword();
              if (isMounted.current) setIsLocked(true);
            }
          }
        }
      } catch {
        // Si el check falla (red, etc.) no bloqueamos para no romper el dashboard
        if (isMounted.current) setIsLocked(false);
      } finally {
        if (isMounted.current) setReady(true);
      }
    })();

    return () => {
      isMounted.current = false;
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, []);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    savePassword(password);
    try {
      await apiFetch('/api/settings');
      setIsLocked(false);
      resetWs();
      return true;
    } catch {
      clearPassword();
      return false;
    }
  }, []);

  const lock = useCallback(() => {
    clearPassword();
    setIsLocked(true);
  }, []);

  if (!ready) {
    // Splash mínimo mientras se resuelve la verificación inicial
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isLocked, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
