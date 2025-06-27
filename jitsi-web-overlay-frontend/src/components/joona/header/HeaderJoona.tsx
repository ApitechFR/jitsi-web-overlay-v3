import { Header } from '@codegouvfr/react-dsfr/Header';
import styles from './HeaderJoona.module.css';
import '@gouvfr-lasuite/integration/dist/css/gaufre.css';
import Button from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { useState } from 'react';
import JitsiFrame from '../iframePopup/JitsiFrame';
import WeboverlayFrame from '../iframePopup/WeboverlayFrame';
import VoxifyFrame from '../iframePopup/VoxifyFrame';
import docUtilisateur from '/doc/Documentation utilisateur Visio By Apitech.pdf'

type errorObj = {
  message: string;
  error: { status: string; stack: string };
};

interface headerProps {
  authenticated: boolean | null;
  setAuthenticated: (e: boolean) => void;
  setError: (obj: errorObj) => void;
}

const modal = createModal({
    id: "foo-modal", 
    isOpenedByDefault: false
});

function openModal () {
  modal.open();
}

function HeaderJoona({ authenticated }: headerProps) {

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const isOpen = useIsModalOpen(modal);

  const [modalContent, setModalContent] = useState("jitsi");

  const openPdf = () => {
    window.open(docUtilisateur, '_blank', 'noopener,noreferrer');
  }

  const renderModalContent = () => {
    switch (modalContent) {
      case "jitsi":
        return <JitsiFrame />;
      case "weboverlay":
        return <WeboverlayFrame />;
      case "voxify":
        return <VoxifyFrame />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.parent}>
        {isAuthenticated ? (
          <Header
              brandTop={<>INTITULE<br />OFFICIEL</>}
              homeLinkProps={{
                to: '/',
                title: 'Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)'
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
                    className: 'fr-btn fr-btn--icon-right'
                  },
                  iconId: 'fr-icon-information-line',
                  text: 'Informations'
                },
                {
                  buttonProps: {
                    onClick: function noRefCheck(){},
                    className: 'fr-btn--icon-right'
                  },
                  iconId: 'fr-icon-account-circle-fill',
                  text: 'Se déconnecter'
                },
              ]}
              navigation={[
                {
                  linkProps: {
                    to: '/',
                    target: '_self',
                    replace: true,
                  },
                  text: 'Accueil'
                },
                {
                  linkProps: {
                    to: '/profile',
                    target: '_self',
                  },
                  text: 'Mon compte'
                },
                {
                  linkProps: {
                    to: '#',
                    target: '_self'
                  },
                  text: 'Conférences'
                },
                {
                  linkProps: {
                    to: '#',
                    target: '_self'
                  },
                  text: 'Administration'
                },
                {
                  linkProps: {
                    to: '/dashboard',
                    target: '_self'
                  },
                  text: 'Dashboard'
                }
              ]}
              serviceTitle="Joona.fr"
            />
        ) : (
          <Header
            brandTop={<>INTITULE<br />OFFICIEL</>}
            homeLinkProps={{
              to: '/',
              title: 'Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)'
            }}
            id="fr-header-header-with-quick-access-items"
            quickAccessItems={[
              {
                buttonProps: {
                  onClick: modal.open.bind(modal),
                  className: 'fr-btn--icon-right'

                },
                iconId: 'fr-icon-information-line',
                text: 'Informations'
              },
              {
                buttonProps: {
                  onClick: function noRefCheck(){},
                  className: 'fr-btn fr-btn--icon-right'
                },
                iconId: 'fr-icon-account-circle-fill',
                text: 'Connexion'
              },
            ]}
            serviceTitle="Joona.fr"
          />
        )}      
      </div>

        
      <modal.Component title="Version des services" size="large">
        <div className={styles.modalContainer}>
          <div className={`${styles.flexBox} ${styles.firstFlexBox} ${styles.firstFlexBoxGap}`}>
            <button onClick={() => setModalContent("jitsi")}>Version Jitsi</button>
            <button onClick={() => setModalContent("weboverlay")}>Version Web Overlay</button>
            <button onClick={() => setModalContent("voxify")}>Version Voxify</button>
            {/* <span>Version Jitsi</span>
            <span>Version Web Overlay</span>
            <span>Version Voxify</span> */}
          </div>
          <div className={styles.separator} />
          <div className={styles.secondFlexBox}>{renderModalContent()}</div>
          {/* <div className={`${styles.flexBox} ${styles.secondFlexBox}`}>
            <h3>Titre Lorem ipsum</h3>
            <p>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit.
              Quidem fuga tenetur eaque sunt consequatur quae porro itaque iste enim possimus aliquid,
              qui odio praesentium neque repellendus quibusdam cum perspiciatis doloribus.
            </p>
          </div> */}
        </div>
      </modal.Component>
    </>
  );
}

export default HeaderJoona;
