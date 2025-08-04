import { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { decodeJwt } from '../utils/decodeJwt';

interface AuthContextType {
  authenticated: boolean | null;
  email: string;
  setEmail: (email: string) => void;
  login: (room?: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [email, setEmailState] = useState<string>('');

  useEffect(() => {
    // Vérifie la présence d'un JWT valide dans le localStorage
    const token = localStorage.getItem('auth');
    let isAuth = false;
    if (token) {
      const decoded = decodeJwt(token);
      // Vérifie l'expiration du token si le champ exp existe
      if (
        decoded &&
        typeof decoded === 'object' &&
        typeof decoded.exp === 'number'
      ) {
        const now = Date.now() / 1000;
        isAuth = decoded.exp > now;
      } else {
        isAuth = true;
      }
    }
    setAuthenticated(isAuth);
    const storedEmail = localStorage.getItem('email') || '';
    setEmailState(storedEmail);
  }, []);

  const setEmail = (mail: string) => {
    setEmailState(mail);
    localStorage.setItem('email', mail);
  };

  const login = (room?: string) => {
    let url = `${import.meta.env.VITE_API_URL}/authentication/login_authorize`;
    if (room) url += `?room=${room}`;
    window.location.href = url;
  };

  const logout = () => {
    fetch(`${import.meta.env.VITE_API_URL}/authentication/logout`, {
      redirect: 'manual',
    }).then(res => {
      window.location.href = res.url;
    });
  };

  const contextValue = useMemo(
    () => ({ authenticated, email, setEmail, login, logout }),
    [authenticated, email]
  );
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
