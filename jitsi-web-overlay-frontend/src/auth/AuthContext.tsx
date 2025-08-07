import { createContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface AuthContextType {
  authenticated: boolean;
  email: string;
  setEmail: (email: string) => void;
  login: (room?: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmailState] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/authentication/whereami`, {
          credentials: 'include',
        });
        setAuthenticated(res.ok);
      } catch {
        setAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const setEmail = (mail: string) => setEmailState(mail);

  const login = (room?: string) => {
    let url = `${import.meta.env.VITE_API_URL}/authentication/login_authorize`;
    if (room) url += `?room=${room}`;
    window.location.href = url;
  };

  const logout = () => {
   window.location.href = `${import.meta.env.VITE_API_URL}/authentication/logout`;
  };

  const contextValue = useMemo(
    () => ({ authenticated, email, setEmail, login, logout }),
    [authenticated, email]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
