
import { Footer, FooterProps } from "@ds"
import { useRuntimeConfig } from "@/config/ConfigProvider";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';


interface FooterJoonaProps {
  readonly headerFooterDisplayItem: FooterProps.BottomItem;
}

function FooterJoona({ headerFooterDisplayItem }: FooterJoonaProps) {
  const [domains, setDomains] = useState<string[]>([])
  const { t, i18n } = useTranslation();

  const cfg = useRuntimeConfig();
  const VisioLogo = (cfg.VITE_APP_LIGHTVISIOLOGOFOOTER as string);
  const DarkVisioLogo = (cfg.VITE_APP_DARKVISIOLOGOFOOTER as string);
  const FooterDescription = t('footer.description', (cfg.VITE_APP_FOOTERDESCRIPTION as string) || '');
  // Must be one of: "non compliant", "partially compliant", "fully compliant"
  const accessibilityLabel: "non compliant" | "partially compliant" | "fully compliant" = "fully compliant";
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
      key={i18n.language}
      mainLogoURL={VisioLogo}
      mainLogoURLDark={DarkVisioLogo}
      accessibility={accessibilityLabel}
      contentDescription={FooterDescription}
      termsLinkProps={{
        href: '/mentionslegales',
        title: t('footer.legalNotice')
      }}
      domains={domains}
      bottomItems={[headerFooterDisplayItem]}
    />
  );
}

export default FooterJoona;