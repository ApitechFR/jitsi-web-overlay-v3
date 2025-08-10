import { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { fetchUserInfos, UserInfos } from '../utils/userInfos';

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  authenticated: boolean;
  status: AuthStatus;              
  email: string;
  setEmail: (email: string) => void;
  login: (room?: string) => void;
  logout: () => void;
  token: string | null;
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
  const [status, setStatus] = useState<AuthStatus>('unknown'); // NEW
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfos | null>(null);

  const baseApi = import.meta.env.VITE_API_URL as string | undefined;

  const refresh = async () => {
    try {
      const info = await fetchUserInfos();
      setUser(info);
      const ok = !!info;
      setAuthenticated(ok);
      setStatus(ok ? 'authenticated' : 'unauthenticated');
    } catch {
      setUser(null);
      setAuthenticated(false);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    // Check d'auth initial au montage
    void refresh();
  }, []);

  const login = (room?: string) => {
    const state = [...crypto.getRandomValues(new Uint8Array(16))]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem('oidc_state', state);

    const loginPath = '/authentication/login_authorize';
    const loginUrl = joinUrl(baseApi ?? '', loginPath);

    const qs = new URLSearchParams({ state, ...(room ? { room } : {}) });
    window.location.href = `${loginUrl}?${qs.toString()}`;
  };

  const logout = () => {
    const logoutPath = '/authentication/logout';
    const logoutUrl = joinUrl(baseApi ?? '', logoutPath);
    window.location.href = logoutUrl;
  };

  const contextValue = useMemo(
    () => ({ authenticated, status, email, setEmail, login, logout, token, user, refresh }),
    [authenticated, status, email, token, user]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
