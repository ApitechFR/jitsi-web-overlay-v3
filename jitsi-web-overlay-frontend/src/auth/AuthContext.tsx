import { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { fetchUserInfos, UserInfos } from '../utils/userInfos';

interface AuthContextType {
  authenticated: boolean;
  email: string;
  setEmail: (email: string) => void;
  login: (room?: string) => void;
  logout: () => void;
  token: string | null;
  user: UserInfos | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmailState] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfos | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/authentication/whereami`, {
          credentials: 'include',
        });
        setAuthenticated(res.ok);
        // Récupère le accessToken OIDC depuis le cookie (pour l'authentification)
  const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/);
  console.log('accessToken trouvé:', match ? decodeURIComponent(match[1]) : null);
  setToken(match ? decodeURIComponent(match[1]) : null);
        // Récupère les infos utilisateur si authentifié
        if (res.ok) {
          const infos = await fetchUserInfos();
          setUser(infos);
        } else {
          setUser(null);
        }
      } catch {
        setAuthenticated(false);
        setToken(null);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  // Met à jour les infos utilisateur à chaque changement d'authentification
  useEffect(() => {
    if (authenticated) {
      fetchUserInfos().then(setUser);
    } else {
      setUser(null);
    }
  }, [authenticated]);

  const setEmail = (mail: string) => setEmailState(mail);

  const login = (room?: string) => {
    let url = `${import.meta.env.VITE_API_URL}/authentication/login_authorize`;
    if (room) url += `?room=${room}`;
    window.location.href = url;
    // Après redirection/login, le composant sera rechargé et l'effet ci-dessus mettra à jour user
  };

  const logout = () => {
   window.location.href = `${import.meta.env.VITE_API_URL}/authentication/logout`;
   // Après redirection/logout, le composant sera rechargé et l'effet ci-dessus mettra à jour user
  };

  const contextValue = useMemo(
    () => ({ authenticated, email, setEmail, login, logout, token, user }),
    [authenticated, email, token, user]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
