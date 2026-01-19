import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import '@apitechfr/react-dsapitech/main.css';
import './index.css';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import { AuthProvider } from './auth/AuthContext';
import { loadRuntimeConfig } from './config/runtimeConfig';

import { ConfigProvider } from './config/ConfigProvider';
import './config/i18n';


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

// Add dynamic script for gaufre.js
// const apptemplate = import.meta.env.VITE_APP_TEMPLATE;
// if (apptemplate === 'webconf') {
//   const script = document.createElement('script');
//   script.id = 'lasuite-gaufre-script';
//   script.async = true;
//   script.defer = true;
//   script.src = 'https://integration.lasuite.numerique.gouv.fr/api/v1/gaufre.js';
//   document.body.appendChild(script);
// }

loadRuntimeConfig().then(cfg => {
  if (cfg.VITE_APP_TEMPLATE === 'webconf') {
    const script = document.createElement('script');
    script.id = 'lasuite-gaufre-script';
    script.async = true;
    script.defer = true;
    script.src = 'https://integration.lasuite.numerique.gouv.fr/api/v1/gaufre.js';
    document.body.appendChild(script);
  } else if (cfg.VITE_APP_TEMPLATE === 'joona') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://raw.githack.com/ApitechFR/dsapitech/refs/heads/main/dsapitech.css';
    document.head.appendChild(link);
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ConfigProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ConfigProvider>
);

