
import styles from './HeaderJoona.module.css';
import { useState } from 'react';
import JitsiFrame from '../iframePopup/JitsiFrame';
import WeboverlayFrame from '../iframePopup/WeboverlayFrame';
import VoxifyFrame from '../iframePopup/VoxifyFrame';
import docUtilisateur from '/doc/Documentation_utilisateur_Visio_By_Apitech.pdf'

import { Header } from "@apitechfr/react-dsapitech/Header";
import { createModal } from "@apitechfr/react-dsapitech/Modal";
import { useIsModalOpen } from "@apitechfr/react-dsapitech/Modal/useIsModalOpen";

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

  const openPdf = () => {
    window.open(docUtilisateur, '_blank', 'noopener,noreferrer');
  }

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
            href: '/',
            title:
              'Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)',
          }}
          id="fr-header-header-with-quick-access-items"
          quickAccessItems={[
                {
                  buttonProps: {
                    onClick: openPdf,
                    className: 'fr-btn--icon-right'
                  },
                  iconId: 'fr-icon-external-link-fill',
                  text: 'Documentation utilisateur'
                },
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
                href: '/',
                target: '_self',
                
              },
              text: 'Accueil',
            },
            ...(authenticated
              ? [
                  {
                    linkProps: {
                      href: '/profile',
                      target: '_self',
                    },
                    text: 'Mon compte',
                  },
                  {
                    linkProps: {
                      href: '#',
                      target: '_self',
                    },
                    text: 'Conférences',
                  },
                  {
                    linkProps: {
                      href: '#',
                      target: '_self',
                    },
                    text: 'Administration',
                  },
                  {
                    linkProps: {
                      href: '/dashboard',
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
