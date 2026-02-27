import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/api';
import { readState, clearState } from '@/api/services/authentication/oidc.utils';
import { getHttp } from '@/api/http';
import { useAuth } from '@/auth/useAuth';
import { getCachedRuntimeConfig } from '../../config/runtimeConfig';
import axios from 'axios';

export default function LoginCallback() {
  const navigate = useNavigate();
  const { refresh: refreshAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cfg = getCachedRuntimeConfig();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);

    // JWT RS256 Bearer token en param d'URL (Multi-Tenant/Reseller mode)
    const jwtToken = p.get('token');

    // Code OIDC (Single-Tenant mode)
    const code = p.get('code');
    const state = p.get('state');
    const err = p.get('error') || p.get('error_description');

    if (err) {
      navigate('/error', { replace: true });
      return;
    }

    // ===== Mode JWT RS256 (Multi-Tenant/Reseller) =====
    const room = p.get('room'); // Optional: conferenceName to redirect to after auth
    console.log('LoginCallback: Checking for JWT token in URL...', { jwtToken, room });
    if (jwtToken) {
      (async () => {
        try {
          // Stocke le JWT dans localStorage
          AuthService.setBearer(jwtToken);

          // Appele POST /authentication/reseller/login avec le Bearer token
          // L'interceptor axios injectera automatiquement le Authorization header
          // const http = await getHttp();
          // const response = await http.post('/authentication/reseller/login', {});

          const response = await axios.post(`${cfg?.VITE_API_URL}/authentication/reseller/login`, {}, {
            headers: {
              Authorization: `Bearer ${jwtToken}`
            },
            withCredentials: true,
          });

          console.log('Reseller login successful:', response.data);

          // Refresh auth context to update user info and authenticated state
          await refreshAuth();

          // Redirige vers la conférence si 'room' est fourni, sinon vers home
          setLoading(false);
          const redirectTarget = room ? `/${room}` : '/';
          navigate(redirectTarget, { replace: true });
        } catch (e: any) {
          console.error('Reseller login failed:', e);
          const msg = e?.response?.data?.message || 'Reseller login failed';
          setError(msg);
          // Nettoyer le token et revenir à la home après 2s
          AuthService.clearBearer();
          setTimeout(() => {
            setLoading(false);
            navigate('/', { replace: true });
          }, 2000);
        }
      })();
      return;
    }

    // ===== Mode OIDC (Single-Tenant - existing flow) =====
    const stored = readState();
    if (!code || !state || !stored || stored !== state) {
      clearState();
      navigate('/', { replace: true });
      return;
    }

    // transfère au backend pour créer la session
    clearState();
    const url = AuthService.getLoginCallbackUrl(code, state);
    window.location.replace(url);
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Erreur d'authentification</h2>
        <p>{error}</p>
        <p>Redirection en cours...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Authentification en cours...</p>
      </div>
    );
  }

  return null;
}