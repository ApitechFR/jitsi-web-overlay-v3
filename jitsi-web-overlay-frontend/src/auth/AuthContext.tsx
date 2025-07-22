import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated] = useState<boolean | null>(null);
  const [email, setEmailState] = useState<string>('');

  useEffect(() => {
    // check authentication status from localStorage or API
    const storedEmail = localStorage.getItem('email') || '';
    setEmailState(storedEmail);
    // add logic to check authentication status from backend
  }, []);

  const setEmail = (mail: string) => {
    setEmailState(mail);
    localStorage.setItem('email', mail);
  };

  const login = (room?: string) => {
    let url = `${import.meta.env.VITE_BASE_URL}/authentication/login_authorize`;
    if (room) url += `?room=${room}`;
    window.location.href = url;
  };

  const logout = () => {
    fetch(`${import.meta.env.VITE_BASE_URL}/authentication/logout`, {
      redirect: 'manual',
    }).then(res => {
      window.location.href = res.url;
    });
  };

  return (
    <AuthContext.Provider
      value={{ authenticated, email, setEmail, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
