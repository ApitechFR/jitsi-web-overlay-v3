/// <reference types="react" />

import { JSX as JSX_2 } from 'react/jsx-runtime';
import { ReactNode } from 'react';

export declare const EmailForm: ({ action, method, onSubmit, inputName, children, }: Props) => JSX_2.Element;

export declare const Footer: ({ entity, homepageUrl, serviceName, description, sitemapUrl, a11yUrl, a11yLevel, termsUrl, privacyUrl, links, legalLinks, license, }: Props_2) => JSX_2.Element;

export declare const frTranslations: {
    "email": {
        "placeholder": "Entrez votre adresse e-mail",
        "srLabel": "Adresse e-mail",
        "submit": "Suivant",
        "title": "Connexion avec {linebreak}votre adresse e-mail"
    },
    "footer": {
        "homepageLinkTitle": {
            "withoutService": "Retour à l'accueil",
            "withService": "Retour à l'accueil - {serviceName}"
        },
        "license": "Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site sont proposés sous {license}",
        "licenseEtalab": "licence etalab-2.0",
        "links": {
            "a11y": {
                "perfect": "Accessibilité : conforme",
                "partial": "Accessibilité : partiellement conforme",
                "bad": "Accessibilité : non conforme"
            },
            "privacy": "Données personnelles",
            "sitemap": "Plan du site",
            "terms": "Mentions légales"
        }
    },
    "gaufre": {
        "label": "Les services de La Suite numérique"
    },
    "header": {
        "homepageLinkTitle": "Accueil - {serviceName}"
    },
    "links": {
        "newWindow": "{title} - nouvelle fenêtre"
    },
    "proconnect": {
        "help": "Qu'est-ce que ProConnect ?",
        "loginWith": "S’identifier avec",
        "loginWithProconnect": "{loginWith} {proconnect}",
        "or": "ou",
        "title": "Connexion avec ProConnect"
    }
};

export declare const Gaufre: ({ variant }: Props_3) => JSX_2.Element;

export declare const Header: ({ entity, serviceName, logo, homepageUrl, showServiceName, actions, }: Props_4) => JSX_2.Element;

export declare const Homepage: ({ lasuiteApiUrl, entity, tagline, serviceName, serviceId, logo, homepageUrl, headerOptions, footerOptions, description, children, }: Props_5) => JSX_2.Element;

export declare const HomepageContent: ({ tagline, lasuiteApiUrl, serviceId, description, children, }: Props_6) => JSX_2.Element;

export declare const HomepageEmail: (emailFormProps: Props_8) => JSX_2.Element;

export declare const HomepageEmailOrProconnect: ({ proconnectUrl, emailForm }: Props_9) => JSX_2.Element;

export declare const HomepageProconnect: (proconnectButtonProps: Props_10) => JSX_2.Element;

export declare function LaSuiteTranslationsProvider({ translations, children, }: {
    translations: Translations;
    children: ReactNode;
}): JSX_2.Element;

export declare const ProconnectButton: ({ url }: Props_7) => JSX_2.Element;

declare type Props = {
    /**
     * URL de l'action du formulaire.
     *
     * @default "#"
     */
    action?: string;
    /**
     * attribut `name` à définir sur le champ de saisie de l'email.
     *
     * @default "email"
     */
    inputName?: string;
    /**
     * Méthode du formulaire.
     *
     * @default "post"
     */
    method?: "get" | "post";
    /**
     * Fonction appelée lors de la soumission du formulaire.
     *
     * L'envoi du formulaire n'est jamais intercepté par le composant.
     * À vous d'appeler `event.preventDefault()` si vous souhaitez empêcher l'envoi du formulaire.
     *
     */
    onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
    /**
     * Contenu du formulaire.
     *
     * À utiliser si vous voulez rajouter des champs supplémentaires.
     */
    children?: React.ReactNode;
};

declare type Props_10 = Props_7;

declare type Props_2 = {
    /**
     * Nom de l'entité, affiché au niveau du logo Marianne.
     *
     * @example "Gouvernement"
     * @example "<>Ministère de <br />l'Intérieur</>"
     */
    entity: ReactNode;
    /**
     * L'url vers la page d'accueil de votre service.
     *
     * @default "/"
     */
    homepageUrl?: string;
    /**
     * Nom du service, utilisé dans des libellés accessibles de liens.
     */
    serviceName?: string;
    /**
     * texte affiché sur la droite du footer, au dessus des liens du gouvernement.
     */
    description?: string;
    /**
     * bloc de contenu indiquant la licence utilisée pour le site. Mentionne la licence etalab par défaut.
     */
    license?: ReactNode;
    /**
     * URL de la page de plan du site.
     */
    sitemapUrl?: string;
    /**
     * URL de la page d'accessibilité.
     */
    a11yUrl?: string;
    /**
     * Niveau d'accessibilité du site.
     */
    a11yLevel?: "non compliant" | "partially compliant" | "fully compliant";
    /**
     * URL de la page de mentions légales.
     */
    termsUrl?: string;
    /**
     * URL de la page de politique de confidentialité.
     */
    privacyUrl?: string;
    /**
     * Liens à afficher en bas de page, en supplément du plan du site, de l'accessibilité, des mentions légales et de la politique de confidentialité.
     *
     * Par défaut, on affiche un lien vers le site vitrine de la suite numérique
     */
    links?: Array<{
        label: string;
        url: string;
    }>;
    /**
     * Liens légaux à afficher en bas de page.
     *
     * Par défaut, on affiche les liens indiqués dans le système de design de l'État.
     */
    legalLinks?: Array<{
        label: string;
        url: string;
    }>;
};

declare type Props_3 = {
    /**
     * Variantes d'affichage :
     *
     * "responsive": Affiche un bouton plus petit sur écran mobile/tablette, plus grand sur écran plus large.
     * "small": Affiche un bouton plus petit.
     */
    variant?: "responsive" | "small";
};

declare type Props_4 = {
    /**
     * Nom de l'entité, affiché au niveau du logo Marianne.
     *
     * @example "Gouvernement"
     * @example "<>Ministère de <br />l'Intérieur</>"
     */
    entity: ReactNode;
    /**
     * L'url vers la page d'accueil de votre service.
     *
     * @default "/"
     */
    homepageUrl?: string;
    /**
     * Nom du service, affiché dans le header et utilisé dans des libellés accessibles de liens.
     */
    serviceName: string;
    /**
     * Logo du service.
     *
     * Peut être une chaine de caractère vers un fichier, ou un élément React.
     */
    logo: ReactNode;
    /**
     * Afficher le nom du service à côté du logo ou non.
     *
     * Utile si votre logo à lui-seul est suffisamment explicite.
     *
     * @default true
     */
    showServiceName?: boolean;
    /**
     * liste des actions à afficher à droite du header.
     *
     * Si ceci est passé, vous devez passer manuellement le composant <Gaufre /> dans les actions
     */
    actions?: ReactNode;
};

declare type Props_5 = {
    /**
     * Nom de l'entité, affiché au niveau du logo Marianne.
     *
     * @example "Gouvernement"
     * @example "<>Ministère de <br />l'Intérieur</>"
     */
    entity: ReactNode;
    /**
     * Phrase d'accroche.
     *
     * Si vous passez une chaîne de caractères, vous pouvez facilement mettre du texte en gras en entourant le texte par `**`. Et vous pouvez ajouter des sauts de ligne en utilisant `<br>`.
     *
     * Sinon, vous pouvez passer directement un élément React.
     *
     * @example "**Tchap**, la messagerie <br>sécurisée de l'État"
     */
    tagline?: ReactNode;
    /**
     * url de l'API de lasuite-integration. Nécessaire pour afficher la photo d'arrière-plan.
     */
    lasuiteApiUrl?: string;
    /**
     * L'url vers la page d'accueil de votre service.
     *
     * @default "/"
     */
    homepageUrl?: string;
    /**
     * Nom du service, affiché dans le header et utilisé dans des libellés accessibles de liens.
     */
    serviceName: string;
    /**
     * Identifiant du service sur l'API de la suite-integration.
     *
     * Utilisé pour afficher la photo d'arrière-plan correspondant au service, via l'API.
     */
    serviceId?: string;
    /**
     * Logo du service.
     *
     * Peut être une chaine de caractère vers un fichier, ou un élément React.
     */
    logo?: ReactNode;
    /**
     * options passées au composant Header.
     */
    headerOptions?: Omit<Props_4, "entity" | "serviceName" | "logo" | "homepageUrl">;
    /**
     * options passées au composant Footer.
     */
    footerOptions?: Omit<Props_2, "entity" | "serviceName" | "homepageUrl">;
    /**
     * Contenu de la page d'accueil affiché dans la partie gauche de la page,
     * en dessous de la tagline.
     *
     */
    description?: ReactNode;
    /**
     * Contenu de la page d'accueil affiché dans la partie droite de la page.
     *
     * Passez ici le formulaire de connexion au service. Vous pouvez utiliser pour vous aider les composants déjà existants 'HomepageEmail', 'HomepageProconnect' et 'HomepageEmailOrProconnect'.
     */
    children: ReactNode;
};

declare type Props_6 = {
    /**
     * Phrase d'accroche.
     *
     * Si vous passez une chaîne de caractères, vous pouvez facilement mettre du texte en gras en entourant le texte par `**`. Et vous pouvez ajouter des sauts de ligne en utilisant `<br>`.
     *
     * Sinon, vous pouvez passer directement un élément React.
     *
     * @example "**Tchap**, la messagerie <br>sécurisée de l'État"
     */
    tagline: ReactNode;
    /**
     * Contenu de la page d'accueil affiché dans la partie droite de la page.
     *
     * Passez ici le formulaire de connexion au service. Vous pouvez utiliser pour vous aider les composants déjà existants 'HomepageEmail', 'HomepageProconnect' et 'HomepageEmailOrProconnect'.
     */
    children: ReactNode;
    /**
     * Contenu de la page d'accueil affiché dans la partie gauche de la page,
     * en dessous de la tagline.
     *
     */
    description?: ReactNode;
    /**
     * Identifiant du service sur l'API de la suite-integration.
     *
     * Utilisé pour afficher la photo d'arrière-plan correspondant au service, via l'API.
     */
    serviceId?: string;
    /**
     * url de l'API de lasuite-integration. Nécessaire pour afficher la photo d'arrière-plan.
     */
    lasuiteApiUrl?: string;
};

declare type Props_7 = {
    /**
     * URL de la page de connexion à Proconnect.
     */
    url: string;
};

declare type Props_8 = Props;

declare type Props_9 = {
    emailForm?: Props;
    proconnectUrl: Props_7["url"];
};

declare type Translations = Record<string, any>;

export declare function useTranslate(): {
    t: <T = string>(id: string, params?: Record<string, string | ReactNode>) => T;
};

export { }
