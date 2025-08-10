// src/auth/AuthContext.tsx
import { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { fetchUserInfos, UserInfos } from '../utils/userInfos';

// ---- Types exposés ----
export interface AuthContextType {
  authenticated: boolean;
  email: string;
  setEmail: (email: string) => void;
  login: (room?: string) => void;
  logout: () => void;
  token: string | null; 
  user: UserInfos | null;
  refresh: () => Promise<void>;
}

// ---- Contexte ----
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- Utils ----
function joinUrl(base: string, path: string) {
  const b = base?.endsWith('/') ? base.slice(0, -1) : base || '';
  const p = path?.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfos | null>(null);

  const baseApi = import.meta.env.VITE_API_URL as string | undefined;

  const refresh = async () => {
    try {
      const info = await fetchUserInfos();
      setUser(info);
      setAuthenticated(!!info);
    } catch {
      setUser(null);
      setAuthenticated(false);
    }
  };

  useEffect(() => {
    // Check d'auth initial au montage
    void refresh();
  }, []);

  const login = (room?: string) => {
    // Génère un state et redirige vers le backend (OIDC)
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
    // Le backend efface les cookies de session et gère la redirection
    const logoutPath = '/authentication/logout';
    const logoutUrl = joinUrl(baseApi ?? '', logoutPath);
    window.location.href = logoutUrl;
  };

  const contextValue = useMemo(
    () => ({ authenticated, email, setEmail, login, logout, token, user, refresh }),
    [authenticated, email, token, user]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
