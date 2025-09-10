
import { useState } from 'react';
import docUtilisateur from '/doc/Documentation_utilisateur_Visio_By_Apitech.pdf';
import visioLogo from '/assets/visiobyapitech-creme.png'

import styles from './HeaderJoona.module.css';
import { Header } from '@apitechfr/react-dsapitech/Header';
import { createModal } from '@apitechfr/react-dsapitech/Modal';

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

  const openPdf = () => {
    window.open(docUtilisateur, '_blank', 'noopener,noreferrer');
  };

  const renderModalContent = () => {
    const currentItem = dataChangelog.submenu.items.find(
      (item: Item) => item.id === modalContent
    );

    if (currentItem) {
      return <ChangelogContent content={currentItem.content} />
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
    // {
    //   buttonProps: {
    //     onClick: function () { },
    //     className: 'fr-btn--icon-right',
    //   },
    //   iconId: 'fr-icon-settings-5-line',
    //   text: 'Paramétrage de la conférence',
    // }
  ];

  return (
    <>
      <Header
        mainLogoURLDark={visioLogo}
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

      <modal.Component title={dataChangelog.submenu.title} size="large">
        <div className={styles.modalContainer}>
          <div className={`${styles.flexBox} ${styles.firstFlexBox} ${styles.firstFlexBoxGap}`}>
            {dataChangelog.submenu.items.map((item: Item) => (
              <button
                key={item.id}
                onClick={() => setModalContent(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.separator} />
          <div className={styles.secondFlexBox}>{renderModalContent()}</div>
        </div>
      </modal.Component>
    </>
  );
}
