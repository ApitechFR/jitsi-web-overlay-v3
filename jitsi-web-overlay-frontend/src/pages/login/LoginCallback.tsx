import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const code = p.get('code');
    const state = p.get('state');
    const providerError = p.get('error_description');

    // Erreur côté IdP
    if (providerError) {
      navigate('/error', { replace: true });
      return;
    }

    // CSRF/state check côté front (optionnel mais recommandé)
    const stored = sessionStorage.getItem('oidc_state');
    if (!code || !state || !stored || stored !== state) {
      // on nettoie et on retourne à l'accueil
      sessionStorage.removeItem('oidc_state');
      navigate('/', { replace: true });
      return;
    }

    // Consommer le code via navigation (pas de XHR, pas de retry)
    sessionStorage.removeItem('oidc_state');
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const url = `${apiBase}/authentication/login_callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;


    window.location.replace(url);
  }, [navigate]);

  return null; // on ne reste pas sur cette page
}
