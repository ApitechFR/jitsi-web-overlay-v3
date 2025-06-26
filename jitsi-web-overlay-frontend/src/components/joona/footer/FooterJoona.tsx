import { Footer, FooterProps } from '@codegouvfr/react-dsfr/Footer';

interface props {
  headerFooterDisplayItem: FooterProps.BottomItem;
  style: any;
}

function FooterJoona({ headerFooterDisplayItem, style }: props) {
  return (
    <Footer
      accessibility="fully compliant"
      contentDescription="
        Ce message est à remplacer par les informations de votre site.

        Comme exemple de contenu, vous pouvez indiquer les informations 
        suivantes : Le site officiel d’information administrative pour les entreprises.
        Retrouvez toutes les informations et démarches administratives nécessaires à la création, 
        à la gestion et au développement de votre entreprise.
        "
      termsLinkProps={{
        to: '#'
      }}
      websiteMapLinkProps={{
        to: '#'
      }}
      bottomItems={[headerFooterDisplayItem]}

    />
  );
}

export default FooterJoona;
