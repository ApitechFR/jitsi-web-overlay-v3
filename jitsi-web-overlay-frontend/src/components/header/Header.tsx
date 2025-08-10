import styles from './Header.module.css';
import { Header } from '@codegouvfr/react-dsfr/Header';
import { Gaufre } from '@gouvfr-lasuite/integration';
import '@gouvfr-lasuite/integration/dist/css/gaufre.css';
import { useAuth } from '../../auth/useAuth'; 

export default function HeaderComponent() {
  const { authenticated, login, logout } = useAuth();

  return (
    <div className={styles.parent}>
      <Header
        brandTop={
          <>
            RÉPUBLIQUE
            <br />
            FRANÇAISE
          </>
        }
        homeLinkProps={{
          to: '/',
          title: "Accueil - Webconférence de l'Etat",
        }}
        quickAccessItems={[
          <Gaufre key="gaufre" />,
          {
            iconId: 'fr-icon-mail-fill',
            linkProps: { to: '/contact' },
            text: 'Contact',
          },
          authenticated
            ? {
                iconId: 'fr-icon-user-fill',
                buttonProps: { onClick: () => logout() },
                text: 'Se déconnecter',
              }
            : {
                iconId: 'fr-icon-account-circle-fill',
                buttonProps: { onClick: () => login() },
                text: 'Connexion',
              },
        ]}
        id="fr-header-header-with-quick-access-items"
        serviceTagline=""
        serviceTitle={window.location.host}
        navigation={[
          {
            linkProps: { to: '/', target: '_self' },
            text: 'Accueil',
          },
          {
            menuLinks: [
              { linkProps: { to: '/apropos' }, text: 'Présentation du service' },
              { linkProps: { to: '/faq' }, text: 'Foire aux questions' },
              { linkProps: { to: '/cgu' }, text: "Conditions générales d'utilisation" },
            ],
            text: 'À propos',
          },
          {
            linkProps: { to: '/cgu', target: '_self' },
            text: 'Centre de ressources',
          },
        ]}
      />
    </div>
  );
}
