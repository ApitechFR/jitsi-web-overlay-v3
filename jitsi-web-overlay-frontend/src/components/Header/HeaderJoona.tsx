
import styles from './HeaderJoona.module.css';
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/useAuth';
import { AuthService } from '@/api';
import { Header, createModal, SideMenu } from '@ds';
import { isUserAdmin } from '@/utils/user';
import { Item } from '@/utils/changelogs/Item';
import ChangelogContent from '../IframePopup/ChangelogContent';
import { useRuntimeConfig } from '@/config/ConfigProvider';
import { CHANGELOG_VERSION } from '@/utils/changelogs/changelog-version';

import { useTranslation } from 'react-i18next';

const modal = createModal({
  id: 'foo-modal',
  isOpenedByDefault: false,
});

export default function HeaderJoona() {

  const { t, i18n } = useTranslation();

  //const isLangFrench = i18n.language === 'fr';

  const cfg = useRuntimeConfig();
  const VisioLogo = (cfg.VITE_APP_LIGHTVISIOLOGOHEADER as string) || '/assets/visiobyapitech-creme.png';
  const DarkVisioLogo = (cfg.VITE_APP_DARKVISIOLOGOHEADER as string) || '/assets/visiobyapitech-creme.png';
  const HeaderServiceTitle = (cfg.VITE_APP_HEADERSERVICETITLE as string) || '';
  const HeaderServiceTagline = (cfg.VITE_APP_HEADERSERVICETAGLINE as string) || '';

  const [dataChangelog, setDataChangelog] = useState<any>(null);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [currentModalId, setCurrentModalId] = useState<string | null>(null);

  useEffect(() => {
    // Use hash-based versioning for cache busting
    let changelogUrl = cfg.VITE_APP_CHANGELOG_URL || '/infos.json';
    if (changelogUrl.endsWith('.json')) {
      changelogUrl = changelogUrl.replace('.json', `-${CHANGELOG_VERSION}.json`);
    }
    fetch(changelogUrl)
      .then((res) => res.json())
      .then((data) => {
        const lang = i18n.language.startsWith('en') ? 'en' : 'fr';
        const langData = data[lang] || data['fr'];
        setDataChangelog(langData);
        if (langData?.submenu?.items?.length > 0) {
          setModalContent(langData.submenu.items[0].id);
          setCurrentModalId(langData.submenu.items[0].id);
        }
      });
  }, [cfg, i18n.language]);

  const { user, authenticated, login, logout } = useAuth();

  const isFrench = (i18n.resolvedLanguage || i18n.language)
    ?.toLowerCase()
    .startsWith('fr');

  const faqUrl = isFrench
    ? (cfg.VITE_APP_FAQ_URL_FR as string) || '/doc/Documentation_utilisateur_Visio_By_Apitech_FR.pdf'
    : (cfg.VITE_APP_FAQ_URL_EN as string) || '/doc/Documentation_utilisateur_Visio_By_Apitech_EN.pdf';

  const openPdf = () => {
    window.open(faqUrl, '_blank', 'noopener,noreferrer');
  };

  const renderModalContent = () => {
    if (!dataChangelog?.submenu?.items) return null;
    const currentItem = dataChangelog.submenu.items.find(
      (item: Item) => item.id === modalContent
    );
    if (currentItem) {
      return <ChangelogContent content={currentItem.content} />;
    }
    return null;
  };

  const switchLang = () => {
    i18n.changeLanguage(isFrench ? 'en' : 'fr')
  }

  const navItems = [
    ...(authenticated
      ? [
        { linkProps: { href: '/', target: '_self' }, text: t('header.home') },
        { linkProps: { href: '/profile', target: '_self' }, text: t('header.account') },
        { linkProps: { href: '/replays', target: '_self' }, text: t('header.conferences') },
        // { linkProps: { href: '#', target: '_self' }, text: t('header.conferences') },
        ...(isUserAdmin(user)
          ? [
            //{ linkProps: { href: '/admin', target: '_self' }, text: t('header.admin') },
            { linkProps: { href: '/dashboard', target: '_self' }, text: t('header.dashboard') },
          ]
          : []),
      ]
      : []),
  ];

  // Vérifier si on est en mode reseller ET si un JWT est en URL
  const isResellerModeEnabled = (cfg?.VITE_RESELLER_MODE_ENABLED as boolean | string) === true || (cfg?.VITE_RESELLER_MODE_ENABLED as string) === 'true';

  // En mode multi-tenant, masquer complètement le bouton login (sauf si déjà connecté)
  // L'accès doit se faire UNIQUEMENT via lien revendeur avec JWT en URL
  const showLoginButton = !authenticated && !AuthService.isJwtMode() && !isResellerModeEnabled;

  const enableLanguageSwitch = (cfg.VITE_ENABLE_LANGUAGE_SWITCH as boolean) || false;
  const enableHardwareTest = (cfg.VITE_ENABLE_HARDWARE_TEST as boolean) ?? true;

  const quickAccessItems = [
    ...(enableHardwareTest ? [{
      linkProps: {
        href: '/browser_test',
        className: 'fr-btn--icon-right',
      },
      iconId: 'fr-icon-pulse-line',
      text: t('header.hardwareTest'),
    }] : []),
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
    ...(enableLanguageSwitch ? [{
      buttonProps: {
        onClick: switchLang,
        className: 'fr-btn fr-btn--icon-left',
      },
      iconId: 'fr-icon-translate-2',
      text: isFrench ? "EN" : "FR",
    }] : []),
    authenticated
      ? {
        buttonProps: {
          onClick: () => logout(),
          className: 'fr-btn--icon-right',
        },
        iconId: 'fr-icon-logout-box-r-line',
        text: t('header.logout'),
      }
      : showLoginButton
        ? {
          buttonProps: {
            onClick: () => login(),
            className: 'fr-btn fr-btn--icon-right',
          },
          iconId: 'fr-icon-account-circle-fill',
          text: t('header.login'),
        }
        : null,
  ].filter(Boolean);

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

      <modal.Component title={dataChangelog?.submenu?.title || ''} size="large" apitechCustomCloseText={t('modal.close')}>
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