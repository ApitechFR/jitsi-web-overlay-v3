import { Header } from '@codegouvfr/react-dsfr/Header';
import styles from './HeaderJoona.module.css';
import '@gouvfr-lasuite/integration/dist/css/gaufre.css';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useState } from 'react';
import JitsiFrame from '../iframePopup/JitsiFrame';
import WeboverlayFrame from '../iframePopup/WeboverlayFrame';
import VoxifyFrame from '../iframePopup/VoxifyFrame';

interface HeaderJoonaProps {
  readonly authenticated: boolean | null;
}

const modal = createModal({
  id: 'foo-modal',
  isOpenedByDefault: false,
});

function HeaderJoona({ authenticated }: HeaderJoonaProps) {
  const logOut = () => {
    fetch(`${import.meta.env.VITE_BASE_URL}/authentication/logout`, {
      redirect: 'manual',
      credentials: 'include',
    }).then(res => {
      window.location.href = res.url;
    });
  };

  const [modalContent, setModalContent] = useState<
    'jitsi' | 'weboverlay' | 'voxify'
  >('jitsi');

  const renderModalContent = () => {
    switch (modalContent) {
      case 'jitsi':
        return <JitsiFrame />;
      case 'weboverlay':
        return <WeboverlayFrame />;
      case 'voxify':
        return <VoxifyFrame />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.parent}>
        <Header
          brandTop={
            <>
              INTITULE
              <br />
              OFFICIEL
            </>
          }
          homeLinkProps={{
            to: '/',
            title:
              'Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)',
          }}
          id="fr-header-header-with-quick-access-items"
          quickAccessItems={[
            {
              buttonProps: {
                onClick: modal.open.bind(modal),
                className: 'fr-btn fr-btn--icon-right',
              },
              iconId: 'fr-icon-information-line',
              text: 'Informations',
            },
            authenticated
              ? {
                  buttonProps: {
                    onClick: logOut,
                    className: 'fr-btn--icon-right',
                  },
                  iconId: 'fr-icon-account-circle-fill',
                  text: 'Se déconnecter',
                }
              : {
                  buttonProps: {
                    onClick: () => {
                      // Génère un state OIDC aléatoire
                      const state = [
                        ...crypto.getRandomValues(new Uint8Array(16)),
                      ]
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join('');
                      sessionStorage.setItem('oidc_state', state);
                      // Redirige avec le state en paramètre
                      window.location.href = `${
                        import.meta.env.VITE_BASE_URL
                      }/authentication/login_authorize?state=${state}`;
                    },
                    className: 'fr-btn fr-btn--icon-right',
                  },
                  iconId: 'fr-icon-account-circle-fill',
                  text: 'Connexion',
                },
          ]}
          navigation={[
            {
              linkProps: {
                to: '/',
                target: '_self',
                replace: true,
              },
              text: 'Accueil',
            },
            ...(authenticated
              ? [
                  {
                    linkProps: {
                      to: '/profile',
                      target: '_self',
                    },
                    text: 'Mon compte',
                  },
                  {
                    linkProps: {
                      to: '#',
                      target: '_self',
                    },
                    text: 'Conférences',
                  },
                  {
                    linkProps: {
                      to: '#',
                      target: '_self',
                    },
                    text: 'Administration',
                  },
                  {
                    linkProps: {
                      to: '/dashboard',
                      target: '_self',
                    },
                    text: 'Dashboard',
                  },
                ]
              : []),
          ]}
          serviceTitle="Joona.fr"
        />
      </div>

      <modal.Component title="Version des services" size="large">
        <div className={styles.modalContainer}>
          <div
            className={`${styles.flexBox} ${styles.firstFlexBox} ${styles.firstFlexBoxGap}`}
          >
            <button onClick={() => setModalContent('jitsi')}>
              Version Jitsi
            </button>
            <button onClick={() => setModalContent('weboverlay')}>
              Version Web Overlay
            </button>
            <button onClick={() => setModalContent('voxify')}>
              Version Voxify
            </button>
          </div>
          <div className={styles.separator} />
          <div className={styles.secondFlexBox}>{renderModalContent()}</div>
        </div>
      </modal.Component>
    </>
  );
}

export default HeaderJoona;
