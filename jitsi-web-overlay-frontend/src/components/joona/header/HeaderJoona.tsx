
import styles from './HeaderJoona.module.css';
import { useState } from 'react';
import { useAuth } from '../../../auth/useAuth';
import JitsiFrame from '../iframePopup/JitsiFrame';
import WeboverlayFrame from '../iframePopup/WeboverlayFrame';
import VoxifyFrame from '../iframePopup/VoxifyFrame';
import docUtilisateur from '/doc/Documentation_utilisateur_Visio_By_Apitech.pdf';

import { Header } from '@apitechfr/react-dsapitech/Header';
import { createModal } from '@apitechfr/react-dsapitech/Modal';
import { isUserAdmin } from '../../../utils/userInfos';

const modal = createModal({
  id: 'foo-modal',
  isOpenedByDefault: false,
});

type ModalTab = 'jitsi' | 'weboverlay' | 'voxify';

export default function HeaderJoona() {
  const [modalContent, setModalContent] = useState<ModalTab>('jitsi');
  const { user, authenticated, login, logout } = useAuth();

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

  const navItems = [
    { linkProps: { href: '/', target: '_self' }, text: 'Accueil' },
    ...(authenticated
      ? [
          { linkProps: { href: '/profile', target: '_self' }, text: 'Mon compte' },
          { linkProps: { href: '#', target: '_self' }, text: 'Conférences' },
          ...(isUserAdmin(user)
            ? [
                { linkProps: { href: '/admin', target: '_self' }, text: 'Administration' },
                { linkProps: { href: '/dashboard', target: '_self' }, text: 'Dashboard' },
              ]
            : []),
        ]
      : []),
  ];

  const quickAccessItems = [
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
    authenticated
      ? {
          buttonProps: {
            onClick: () => logout(),
            className: 'fr-btn--icon-right',
          },
          iconId: 'fr-icon-account-circle-fill',
          text: 'Se déconnecter',
        }
      : {
          buttonProps: {
            onClick: () => login(),
            className: 'fr-btn fr-btn--icon-right',
          },
          iconId: 'fr-icon-account-circle-fill',
          text: 'Connexion',
        },
  ];

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
              "Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)",
          }}
          id="fr-header-header-with-quick-access-items"
          quickAccessItems={quickAccessItems as any}
          navigation={navItems as any}
          serviceTitle="Joona.fr"
        />
      </div>

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
