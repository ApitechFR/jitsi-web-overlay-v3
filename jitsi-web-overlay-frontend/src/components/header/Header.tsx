
import { Header } from '@codegouvfr/react-dsfr/Header';
import { Gaufre } from '@gouvfr-lasuite/integration';
import styles from './Header.module.css';
import '@gouvfr-lasuite/integration/dist/css/gaufre.css';

type errorObj = {
  message: string;
  error: { status: string; stack: string };
};

interface headerProps {
  authenticated: boolean | null;
  setAuthenticated: (e: boolean) => void;
  setError: (obj: errorObj) => void;
}

function HeaderComponent({ authenticated }: headerProps) {
  const logOut = () => {
    fetch(`${import.meta.env.VITE_API_URL}/authentication/logout`, {
      redirect: 'manual',
    }).then(res => {
      if (res.type === 'opaqueredirect') {
        window.location.href = res.url;
      } else {
        // handle normally / pass on to next handler
        window.location.href = res.url;
      }
    });
  };
  return (
    <div className={styles.parent}>
      <Header
        brandTop={
          <>
            RÉPUBLIQUE
            <br />
            FRANÇAISE
          </>
        }
        homeLinkProps={{
          to: '/',
          title: "Accueil - Webconférence de l'Etat",
        }}
        quickAccessItems={[
          <Gaufre />,
          {
            iconId: 'fr-icon-mail-fill',
            linkProps: {
              to: 'contact',
            },
            text: 'Contact',
          },
          authenticated
            ? {
                iconId: 'fr-icon-user-fill',
                buttonProps: {
                  onClick: logOut,
                },
                text: 'Se déconnecter',
              }
            : null,
        ]}
        id="fr-header-header-with-quick-access-items"
        serviceTagline=""
        serviceTitle={window.location.host}
        navigation={[
          {
            linkProps: {
              to: '/',
              target: '_self',
              replace: true,
            },
            text: 'Accueil',
          },
          {
            menuLinks: [
              {
                linkProps: {
                  to: '/apropos',
                },
                text: 'Présentation du service',
              },
              {
                linkProps: {
                  to: 'faq',
                },
                text: 'Foire aux questions',
              },
              {
                linkProps: {
                  to: 'cgu',
                },
                text: "Conditions générales d'utilisation",
              },
            ],
            text: 'À propos',
          },
          {
            linkProps: {
              to: 'cgu',
              target: '_self',
            },
            text: 'Centre de ressources',
          },
        ]}
      />
    </div>
  );
}

export default HeaderComponent;
