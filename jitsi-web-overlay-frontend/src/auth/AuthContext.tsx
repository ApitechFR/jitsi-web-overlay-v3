import { createContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { AuthService, type UserInfos } from '@/api'

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


  const baseApi = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

  const refresh = useCallback(async () => {
    try {
      const info = await AuthService.userinfoDecoded();
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
    window.location.href = AuthService.getLoginUrl(room);
  };

  const logout = () => {
    window.location.href = AuthService.getLogoutUrl();

  };

  const contextValue = useMemo(
    () => ({ authenticated, status, email, setEmail, login, logout, user, refresh }),
    [authenticated, status, email, user, refresh]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
