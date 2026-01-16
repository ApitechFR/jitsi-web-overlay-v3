
import styles from './HeaderJoona.module.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../../auth/useAuth';
import { Header } from '@apitechfr/react-dsapitech/Header';
import { createModal } from '@apitechfr/react-dsapitech/Modal';
import { SideMenu } from "@apitechfr/react-dsapitech/SideMenu";
import { isUserAdmin } from '../../../../utils/user';
import { Item } from '../../../../utils/changelogs/Item';
import ChangelogContent from '../IframePopup/ChangelogContent';
import { useRuntimeConfig } from '../../../../config/ConfigProvider';

import { useTranslation } from 'react-i18next';

const modal = createModal({
  id: 'foo-modal',
  isOpenedByDefault: false,
});

export default function HeaderJoona() {

  const { t, i18n } = useTranslation();

  const isLangFrench = i18n.language === 'fr';

  const cfg = useRuntimeConfig();
  const VisioLogo = (cfg.VITE_APP_LIGHTVISIOLOGOHEADER as string) || '/assets/visiobyapitech-creme.png';
  const DarkVisioLogo = (cfg.VITE_APP_DARKVISIOLOGOHEADER as string) || '/assets/visiobyapitech-creme.png';
  const HeaderServiceTitle = (cfg.VITE_APP_HEADERSERVICETITLE as string) || '';
  const HeaderServiceTagline = (cfg.VITE_APP_HEADERSERVICETAGLINE as string) || '';

  const [dataChangelog, setDataChangelog] = useState<any>(null);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [currentModalId, setCurrentModalId] = useState<string | null>(null);

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

  const { user, authenticated, login, logout } = useAuth();

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

  const switchLang = () => {
    i18n.changeLanguage(isLangFrench ? 'en' : 'fr')
  }

  const navItems = [
    ...(authenticated
      ? [
        { linkProps: { href: '/', target: '_self' }, text: t('header.home') },
        { linkProps: { href: '/profile', target: '_self' }, text: t('header.account') },
        // { linkProps: { href: '#', target: '_self' }, text: t('header.conferences') },
        ...(isUserAdmin(user)
          ? [
            //{ linkProps: { href: '/admin', target: '_self' }, text: t('header.admin') },
            { linkProps: { href: '/replays', target: '_self' }, text: t('header.conferences') },
            { linkProps: { href: '/dashboard', target: '_self' }, text: t('header.dashboard') },
          ]
          : []),
      ]
      : []),
  ];

  const quickAccessItems = [
    {
      linkProps: {
        href: '/browser_test',
        className: 'fr-btn--icon-right',
      },
      iconId: 'fr-icon-pulse-line',
      text: t('header.hardwareTest'),
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
      text: t('header.information'),
    },
    {
      buttonProps: {
        onClick: switchLang,
        className: 'fr-btn fr-btn--icon-left',
      },
      iconId: 'fr-icon-translate-2',
      text: isLangFrench ? "FR" : "EN",
    },
    authenticated
      ? {
        buttonProps: {
          onClick: () => logout(),
          className: 'fr-btn--icon-right',
        },
        iconId: 'fr-icon-logout-box-r-line',
        text: t('header.logout'),
      }
      : {
        buttonProps: {
          onClick: () => login(),
          className: 'fr-btn fr-btn--icon-right',
        },
        iconId: 'fr-icon-account-circle-fill',
        text: t('header.login'),
      },
  ];

  return (
    <>
      <div className={styles.parent}>
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
            title: t('header.homeTitle'),
          }}
          id="fr-header-header-with-quick-access-items"
          quickAccessItems={quickAccessItems as any}
          navigation={navItems as any}
        />
      </div>

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