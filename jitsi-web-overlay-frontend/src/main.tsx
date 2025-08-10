import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import { Link } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';

startReactDsfr({
  defaultColorScheme: 'system',
  Link,
});

// Only in TypeScript projects
declare module '@codegouvfr/react-dsfr/spa' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

