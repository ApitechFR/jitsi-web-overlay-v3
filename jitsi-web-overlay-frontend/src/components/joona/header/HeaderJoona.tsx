
import styles from './HeaderJoona.module.css';
import { useState } from 'react';
import { useAuth } from '../../../auth/useAuth';
import docUtilisateur from '/doc/Documentation_utilisateur_Visio_By_Apitech.pdf';
import visioLogo from '/assets/visiobyapitech-creme.png'

import { Header } from '@apitechfr/react-dsapitech/Header';
import { createModal } from '@apitechfr/react-dsapitech/Modal';
import { SideMenu } from "@apitechfr/react-dsapitech/SideMenu";
import { isUserAdmin } from '../../../utils/userInfos';

import dataChangelog from '../../../utils/changelogs/infos.json'
import { Item } from '../../../utils/changelogs/Item'
import ChangelogContent from '../iframePopup/ChangelogContent';

const modal = createModal({
  id: 'foo-modal',
  isOpenedByDefault: false,
});

export default function HeaderJoona() {
  const [modalContent, setModalContent] = useState<string | null>(
    dataChangelog.submenu.items.length > 0
      ? dataChangelog.submenu.items[0].id
      : null
  );
  const [currentModalId, setCurrentModalId] = useState<string | null>(
    dataChangelog.submenu.items.length > 0
      ? dataChangelog.submenu.items[0].id
      : null
  );

  const { user, authenticated, login, logout } = useAuth();

  const openPdf = () => {
    window.open(docUtilisateur, '_blank', 'noopener,noreferrer');
  };

  const renderModalContent = () => {
    const currentItem = dataChangelog.submenu.items.find(
      (item: Item) => item.id === modalContent
    );

    if(currentItem) {
      return <ChangelogContent content={currentItem.content} />
    }
  };

  const navItems = [
    ...(authenticated
      ? [
        { linkProps: { href: '/', target: '_self' }, text: 'Accueil' },
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
          navigation={navItems as any}
        />
      </div>

      <modal.Component title={dataChangelog.submenu.title} size="large">
        <div className={styles.modalContainer}>
          <SideMenu
            align="left"
            burgerMenuButtonText=""
            title=""
            items={dataChangelog.submenu.items.map((item: Item) => ({
              isActive: item.id === currentModalId,
              linkProps: {
                href: '#',
                onClick: (e: React.MouseEvent) => {
                  e.preventDefault()
                  setCurrentModalId(item.id)
                  setModalContent(item.id)
                },
              },
              text: item.label,
            }))}
          />
          <div className={styles.secondFlexBox}>{renderModalContent()}</div>
        </div>
      </modal.Component>
    </>
  );
}
