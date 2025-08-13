
import { Footer, FooterProps } from "@apitechfr/react-dsapitech/Footer"


interface props {
  headerFooterDisplayItem: FooterProps.BottomItem;
}

function FooterJoona({ headerFooterDisplayItem }: props) {
  return (
    <Footer
      accessibility="fully compliant"
      contentDescription="
        Apitech, Éditeur Open Solutions  - L’esprit du Libre au service de la productivité.
        "
      termsLinkProps={{
        href: '#',
      }}
      bottomItems={[headerFooterDisplayItem]}
    />
  );
}

export default FooterJoona;
