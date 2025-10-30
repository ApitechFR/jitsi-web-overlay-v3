import { createContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { fetchUserInfos, UserInfos } from '../utils/userInfos';
import { useRuntimeConfig } from '../config/ConfigProvider';

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  authenticated: boolean;
  status: AuthStatus;
  email: string;
  setEmail: (email: string) => void;
  login: (room?: string) => void;
  logout: () => void;
  user: UserInfos | null;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function joinUrl(base: string, path: string) {
  const b = base?.endsWith('/') ? base.slice(0, -1) : base || '';
  const p = path?.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<UserInfos | null>(null);


  const { VITE_API_URL } = useRuntimeConfig();
  const baseApi = VITE_API_URL || '/api';

  const refresh = useCallback(async () => {
    try {
      const info = await fetchUserInfos();
      const ok = !!info;
      setUser(info ?? null);
      setAuthenticated(ok);
      setStatus(ok ? 'authenticated' : 'unauthenticated');
    } catch {
      setUser(null);
      setAuthenticated(false);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    // Check d'auth initial
    void refresh();

    // Revalider quand l’onglet reprend le focus 
    const onFocus = () => void refresh();
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const login = (room?: string) => {
    const state = [...crypto.getRandomValues(new Uint8Array(16))]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem('oidc_state', state);

    const loginUrl = joinUrl(baseApi, '/authentication/login_authorize');
    const qs = new URLSearchParams({ state, ...(room ? { room } : {}) });
    window.location.href = `${loginUrl}?${qs.toString()}`;
  };

  const logout = () => {
    const logoutUrl = joinUrl(baseApi, '/auth/logout');
    window.location.href = logoutUrl;
  };

  const contextValue = useMemo(
    () => ({ authenticated, status, email, setEmail, login, logout, user, refresh }),
    [authenticated, status, email, user, refresh]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
