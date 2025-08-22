
import { useState } from 'react';
import JitsiFrame from '../iframePopup/JitsiFrame';
import WeboverlayFrame from '../iframePopup/WeboverlayFrame';
import VoxifyFrame from '../iframePopup/VoxifyFrame';
import docUtilisateur from '/doc/Documentation_utilisateur_Visio_By_Apitech.pdf';
import visioLogo from '/assets/visiobyapitech-creme.png'

import styles from './HeaderJoona.module.css';
import { Header } from '@apitechfr/react-dsapitech/Header';
import { createModal } from '@apitechfr/react-dsapitech/Modal';

const modal = createModal({
  id: 'foo-modal',
  isOpenedByDefault: false,
});

type ModalTab = 'jitsi' | 'weboverlay' | 'voxify';

export default function HeaderJoona() {
  const [modalContent, setModalContent] = useState<ModalTab>('jitsi');

  const openPdf = () => {
    window.open(docUtilisateur, '_blank', 'noopener,noreferrer');
  };

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

  const quickAccessItems = [
    {
       buttonProps: {
        onClick: () => {
          window.open('/feedback', '_blank', 'noopener,noreferrer');
        },
        className: 'fr-btn--icon-right',
      },
      iconId: 'fr-icon-search-line',
      text: 'Sondage qualité', 
    },
    {
      buttonProps: {
        onClick: openPdf,
        className: 'fr-btn--icon-right',
      },
      iconId: 'fr-icon-external-link-fill',
      text: 'Documentation utilisateur',
    },
    {
      buttonProps: {
        onClick: modal.open.bind(modal),
        className: 'fr-btn fr-btn--icon-right',
      },
      iconId: 'fr-icon-information-line',
      text: 'Informations',
    },
    {
       buttonProps: {
        onClick: function(){},
        className: 'fr-btn--icon-right',
      },
      iconId: 'fr-icon-settings-5-line',
      text: 'Paramétrage de la conférence', 
    }
  ];

  return (
    <>
        <Header
          mainLogoURL={visioLogo}
          serviceTitle="Visio"
          serviceTagline="by Apitech"
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
              "Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)",
          }}
          id="fr-header-header-with-quick-access-items"
          quickAccessItems={quickAccessItems as any}
        />

      <modal.Component title="Version des services" size="large">
        <div className={styles.modalContainer}>
          <div className={`${styles.flexBox} ${styles.firstFlexBox} ${styles.firstFlexBoxGap}`}>
            <button onClick={() => setModalContent('jitsi')}>Version Jitsi</button>
            <button onClick={() => setModalContent('weboverlay')}>Version Web Overlay</button>
            <button onClick={() => setModalContent('voxify')}>Version Voxify</button>
          </div>
          <div className={styles.separator} />
          <div className={styles.secondFlexBox}>{renderModalContent()}</div>
        </div>
      </modal.Component>
    </>
  );
}
