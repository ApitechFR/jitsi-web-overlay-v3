import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/api';
import { readState, clearState } from '@/api/services/authentication/oidc.utils';

export default function LoginCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const code = p.get('code');
    const state = p.get('state');
    const err = p.get('error') || p.get('error_description');

    if (err) {
      navigate('/error', { replace: true });
      return;
    }

    // CSRF check
    const stored = readState();
    if (!code || !state || !stored || stored !== state) {
      clearState();
      navigate('/', { replace: true });
      return;
    }

    // On transfère au backend pour créer la session
    clearState();
    const url = AuthService.getLoginCallbackUrl(code, state);
    window.location.replace(url);
  }, [navigate]);

  return null;
}