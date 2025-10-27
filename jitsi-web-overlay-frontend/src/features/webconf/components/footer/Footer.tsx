import { Footer, FooterProps } from '@codegouvfr/react-dsfr/Footer';

interface props {
  headerFooterDisplayItem: FooterProps.BottomItem;
  style: any;
}

function footer({ headerFooterDisplayItem, style }: props) {
  return (
    <Footer
      className={style}
      accessibility="fully compliant"
      brandTop={
        <>
          RÉPUBLIQUE
          <br />
          FRANÇAISE
        </>
      }
      contentDescription={
        <div>
          Un service proposé par la Direction Interministérielle du Numérique
          (DINUM) et opéré par le Ministère de la Transition Écologique et de la
          Cohésion des Territoires (MTECT).
        </div>
      }
      // cookiesManagementLinkProps={{
      //   href: '#',
      // }}
      homeLinkProps={{
        to: '/',
        title: "Accueil - Webconférence de l'Etat",
      }}
      termsLinkProps={{
        to: 'mentionslegales',
      }}
      websiteMapLinkProps={{
        to: 'plan-du-site',
      }}
      accessibilityLinkProps={{
        to: 'accessibilite',
      }}
      bottomItems={[headerFooterDisplayItem]}
    />
  );
}

export default footer;