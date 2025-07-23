import { Footer, FooterProps } from "@apitechfr/react-dsapitech/Footer"

interface props {
  headerFooterDisplayItem: FooterProps.BottomItem;
  style: any;
}

function FooterJoona() {
  return (
    <Footer
      accessibility="fully compliant"
      contentDescription="
        Apitech, Éditeur Open Solutions  - L’esprit du Libre au service de la productivité.
        "
      termsLinkProps={{
        href: '#'
      }}
      websiteMapLinkProps={{
        href: '#'
      }}
    />
  );
}

export default FooterJoona;
