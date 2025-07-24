import styles from './Header.module.css';
import { Header } from '@codegouvfr/react-dsfr/Header';
import { Gaufre } from '@gouvfr-lasuite/integration';
import '@gouvfr-lasuite/integration/dist/css/gaufre.css';

type errorObj = {
  message: string;
  error: { status: string; stack: string };
};

interface HeaderProps {
  readonly authenticated: boolean | null;
  readonly setError: (obj: errorObj) => void;
}

function HeaderComponent({ authenticated, setError }: HeaderProps) {
  const logOut = () => {
    fetch(`${import.meta.env.VITE_BASE_URL}/authentication/logout`, {
      redirect: 'manual',
      credentials: 'include',
    })
      .then(res => {
        window.location.href = res.url;
      })
      .catch((error: unknown) => {
        setError({
          message: 'Erreur lors de la déconnexion',
          error: {
            status:
              typeof error === 'object' && error !== null && 'status' in error
                ? (error as { status?: string }).status ?? 'unknown'
                : 'unknown',
            stack:
              typeof error === 'object' && error !== null && 'stack' in error
                ? (error as { stack?: string }).stack ?? ''
                : '',
          },
        });
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
          <Gaufre key="gaufre" />,
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
