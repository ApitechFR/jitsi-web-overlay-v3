
import { useState, useEffect } from 'react';
import docUtilisateur from '/doc/Documentation_utilisateur_Visio_By_Apitech.pdf';

import styles from './HeaderJoona.module.css';
import { Header, createModal, SideMenu } from '@ds';

import dataChangelog from '@/utils/changelogs/infos.json'
import { Item } from '@/utils/changelogs/Item'
import ChangelogContent from '../IframePopup/ChangelogContent';
import { useRuntimeConfig } from '@/config/ConfigProvider';

const modal = createModal({
  id: 'foo-modal',
  isOpenedByDefault: false,
});

export default function HeaderVisio() {
  const [dataChangelog, setDataChangelog] = useState<any>(null);
  const [modalContent, setModalContent] = useState<any>(null);
  const [currentModalId, setCurrentModalId] = useState<string | null>(null);

  const cfg = useRuntimeConfig();
  const VisioLogo = (cfg.VITE_APP_LIGHTVISIOLOGOHEADER as string) || '/assets/visiobyapitech-creme.png';
  const DarkVisioLogo = (cfg.VITE_APP_DARKVISIOLOGOHEADER as string) || '/assets/visiobyapitech-creme.png';
  const HeaderServiceTitle = (cfg.VITE_APP_HEADERSERVICETITLE as string) || '';
  const HeaderServiceTagline = (cfg.VITE_APP_HEADERSERVICETAGLINE as string) || '';

  useEffect(() => {
    const changelogUrl = cfg.VITE_APP_CHANGELOG_URL || '/infos.json';
    fetch(changelogUrl)
      .then((res) => res.json())
      .then((data) => {
        setDataChangelog(data);
        if (data?.submenu?.items?.length > 0) {
          setModalContent(data.submenu.items[0].id);
          setCurrentModalId(data.submenu.items[0].id);
        }
      });
  }, [cfg]);

  const faqUrl = cfg.VITE_APP_FAQ_URL || '/doc/Documentation_utilisateur_Visio_By_Apitech.pdf';
  const openPdf = () => {
    window.open(faqUrl, '_blank', 'noopener,noreferrer');
  };

  const renderModalContent = () => {
    if (!dataChangelog) return null;
    const currentItem = dataChangelog.submenu.items.find(
      (item: Item) => item.id === modalContent
    );
    if (currentItem) {
      return <ChangelogContent content={currentItem.content} />;
    }
    return null;
  };

  let roomName = localStorage.getItem("conferenceName") || "";
  const quickAccessItems = [
    {
      buttonProps: {
        onClick: () => {
          window.open(`/feedback?src=visio&room=${roomName}`, '_blank', 'noopener,noreferrer');
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
      text: 'Documentation',
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
        mainLogoURL={VisioLogo}
        mainLogoURLDark={DarkVisioLogo}
        serviceTitle={HeaderServiceTitle}
        serviceTagline={HeaderServiceTagline}
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

      <modal.Component title={dataChangelog?.submenu?.title || ''} size="large">
          <div className={styles.modalContainer}>
            {dataChangelog && (
              <SideMenu
                align="left"
                burgerMenuButtonText=""
                title=""
                items={dataChangelog.submenu.items.map((item: Item) => ({
                  isActive: item.id === currentModalId,
                  linkProps: {
                    href: '#',
                    onClick: (e: React.MouseEvent) => {
                      e.preventDefault();
                      setCurrentModalId(item.id);
                      setModalContent(item.id);
                    },
                  },
                  text: item.label,
                }))}
              />
            )}
            <div className={styles.secondFlexBox}>{renderModalContent()}</div>
          </div>
        </modal.Component>
    </>
  );
}