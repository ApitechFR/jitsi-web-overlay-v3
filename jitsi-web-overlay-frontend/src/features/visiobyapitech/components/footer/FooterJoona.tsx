
import { Footer, FooterProps } from "@apitechfr/react-dsapitech/Footer"
import { useRuntimeConfig } from "../../../../config/ConfigProvider";
import { useEffect, useState } from "react";


interface props {
  headerFooterDisplayItem: FooterProps.BottomItem;
}

function FooterJoona({ headerFooterDisplayItem }: props) {
  const [domains, setDomains] = useState<string[]>([])

  const cfg = useRuntimeConfig();
  const VisioLogo = (cfg.VITE_APP_LIGHTVISIOLOGOFOOTER as string);
  const DarkVisioLogo = (cfg.VITE_APP_DARKVISIOLOGOFOOTER as string);
  const FooterDescription = (cfg.VITE_APP_FOOTERDESCRIPTION as string) || '';
  const FooterLinks = (cfg.VITE_APP_FOOTERLINKS as string) || '';

  useEffect(() => {
    if (!FooterLinks) return;
    const split = FooterLinks
      .split(',')
      .map(strings => strings.trim())
      .filter(strings => strings.length > 0)
    setDomains(split);
  }, [FooterLinks])

  return (
    <Footer
      mainLogoURL={VisioLogo}
      mainLogoURLDark={DarkVisioLogo}
      accessibility="fully compliant"
      contentDescription={FooterDescription}
      termsLinkProps={{
        href: '/mentionslegales',
      }}
      domains={domains}
      bottomItems={[headerFooterDisplayItem]}
    />
  );
}

export default FooterJoona;