import { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { decodeJwt } from '../utils/decodeJwt';

interface AuthContextType {
  /**
   * Etat d'authentification : true si connecté, false sinon
   */
  authenticated: boolean;
  email: string;
  setEmail: (email: string) => void;
  login: (room?: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  // false par défaut pour éviter les cas non gérés
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [email, setEmailState] = useState<string>('');

  // Vérifie l'authentification via le backend (cookie httpOnly)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/authentication/whereami`, {
          credentials: 'include',
        });
        // Si le backend répond, l'utilisateur est authentifié
        setAuthenticated(res.ok);
      } catch {
        setAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const setEmail = (mail: string) => {
    setEmailState(mail);
  };

  const login = (room?: string) => {
    let url = `${import.meta.env.VITE_API_URL}/authentication/login_authorize`;
    if (room) url += `?room=${room}`;
    // Affiche un loader ou message si besoin avant la redirection
    window.location.href = url;
  };

  const logout = () => {
    fetch(`${import.meta.env.VITE_API_URL}/authentication/logout`, {
      redirect: 'manual',
    })
      .then(res => {
        window.location.href = res.url;
      })
      .catch(() => {
        // Affiche une notification ou message d'erreur
        alert('Erreur lors de la déconnexion. Veuillez réessayer.');
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
