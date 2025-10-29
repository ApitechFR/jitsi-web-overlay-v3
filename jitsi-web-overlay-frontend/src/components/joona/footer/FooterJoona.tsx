
import { Footer, FooterProps } from "@apitechfr/react-dsapitech/Footer"
import { useRuntimeConfig } from "../../../config/ConfigProvider";


interface props {
  headerFooterDisplayItem: FooterProps.BottomItem;
}

function FooterJoona({ headerFooterDisplayItem }: props) {
  const cfg = useRuntimeConfig();
  const VisioLogo = (cfg.VITE_APP_LIGHTVISIOLOGOFOOTER as string);
  const DarkVisioLogo = (cfg.VITE_APP_DARKVISIOLOGOFOOTER as string);

  return (
    <Footer
      mainLogoURL={VisioLogo}
      mainLogoURLDark={DarkVisioLogo}
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
