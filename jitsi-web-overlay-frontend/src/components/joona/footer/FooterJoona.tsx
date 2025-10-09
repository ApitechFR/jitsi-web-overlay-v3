
import { Footer, FooterProps } from "@apitechfr/react-dsapitech/Footer"
import apitechLogoLightMode from '/assets/apitech-logo-bleunuit.png'
import apitechLogoDarkMode from '/assets/apitech-logo-blanc.png'


interface props {
  headerFooterDisplayItem: FooterProps.BottomItem;
}

function FooterJoona({ headerFooterDisplayItem }: props) {
  return (
    <Footer
      mainLogoURL={apitechLogoLightMode}
      mainLogoURLDark={apitechLogoDarkMode}
      accessibility="fully compliant"
      contentDescription="
        Apitech, Éditeur Open Solutions  - L’esprit du Libre au service de la productivité.
        "
      termsLinkProps={{
        href: '/mentionslegales',
      }}
      bottomItems={[headerFooterDisplayItem]}
    />
  );
}

export default FooterJoona;
