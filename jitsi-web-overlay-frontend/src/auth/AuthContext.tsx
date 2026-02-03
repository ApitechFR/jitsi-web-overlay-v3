import { createContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { AuthService, type UserInfos } from '@/api'

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  authenticated: boolean;
  status: AuthStatus;
  email: string;
  setEmail: (email: string) => void;
  login: (room?: string, sessionOnly?: boolean) => void;
  logout: () => void;
  user: UserInfos | null;
  refresh: () => Promise<void>;
  sessionOnly: boolean;
  setSessionOnly: (v: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<UserInfos | null>(null);
  // Option sessionOnly : true = cookie de session, false = cookie persistant
  const [sessionOnly, setSessionOnly] = useState(false);

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
    // Initial auth check
    void refresh();


    // validate on tab focus
    const onFocus = () => void refresh();

    globalThis.addEventListener('visibilitychange', onFocus);
    globalThis.addEventListener('focus', onFocus);

    // Automatic logout on browser/tab close
    const handleUnload = () => {
      if (authenticated) {
        const url = AuthService.getLogoutUrl();
        navigator.sendBeacon(url);
      }
    };
    globalThis.addEventListener('unload', handleUnload);

    return () => {
      globalThis.removeEventListener('visibilitychange', onFocus);
      globalThis.removeEventListener('focus', onFocus);
      globalThis.removeEventListener('unload', handleUnload);
    };
  }, [refresh, authenticated]);

  const login = (room?: string, sessionOpt?: boolean) => {
    // sessionOpt priority over state sessionOnly
    const session = sessionOpt ?? sessionOnly;
    globalThis.location.href = AuthService.getLoginUrl(room, session);
  };

  const logout = () => {
    globalThis.location.href = AuthService.getLogoutUrl();
  };

  const contextValue = useMemo(
    () => ({ authenticated, status, email, setEmail, login, logout, user, refresh, sessionOnly, setSessionOnly }),
    [authenticated, status, email, user, refresh, sessionOnly]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
