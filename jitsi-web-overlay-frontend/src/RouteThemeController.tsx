import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { validateRoomName } from "./utils/roomName";
import { RESERVED_SEGMENTS } from "./constant/routes";

type Scheme = "system" | "light" | "dark";




const BASELINE_KEY = "app:scheme:baseline-before-jitsi";

/** Applique un scheme côté DSFR (event + localStorage) ET en fallback (attrs + classes) */
function hardApplyScheme(scheme: Scheme) {
    //  Notif DSFR + persistance (si la lib l’écoute, elle mettra à jour)
    try {
        if (scheme === "system") localStorage.removeItem("scheme");
        else localStorage.setItem("scheme", scheme);
        window.dispatchEvent(new CustomEvent("scheme", { detail: { scheme } }));
    } catch { }

    // Fallback visuel immédiat : attrs + classes sur <html>
    const root = document.documentElement;

    const setAttr = (k: string, v?: string | null) => {
        if (v == null || v === "") root.removeAttribute(k);
        else root.setAttribute(k, v);
    };

    setAttr("data-fr-scheme", scheme);                 // source DSFR
    setAttr("data-fr-theme", scheme === "system" ? null : scheme);
    setAttr("data-theme", scheme === "system" ? null : scheme);

    root.classList.remove("fr-theme-dark", "fr-theme-light");
    if (scheme === "dark") root.classList.add("fr-theme-dark");
    if (scheme === "light") root.classList.add("fr-theme-light");
}

/** Lit la préférence DSFR actuelle (LS si présent, sinon 'system') */
function readDsfrPreference(): Scheme {
    try {
        const s = localStorage.getItem("scheme") as Scheme | null;
        if (s === "dark" || s === "light" || s === "system") return s;
    } catch { }
    return "system";
}

export default function RouteThemeController() {
    const { pathname } = useLocation();
    const path = pathname.replace(/\/+$/, "") || "/";

    // /:roomName exact, pas réservé, et nom valide
    const firstSeg = path.split("/")[1] ?? "";
    const isSingleSeg = path === `/${firstSeg}` && firstSeg.length > 0;
    const isJitsi = isSingleSeg && !RESERVED_SEGMENTS.has(firstSeg) && validateRoomName(firstSeg);

    useEffect(() => {
        if (isJitsi) {
            // On entre/est en salle : mémorise la préférence actuelle si pas déjà mémorisée
            const saved = (localStorage.getItem(BASELINE_KEY) as Scheme | null);
            if (!saved) {
                const current = readDsfrPreference(); // system/light/dark
                try { localStorage.setItem(BASELINE_KEY, current); } catch { }
            }
            // Force dark (DSFR + fallback visuel)
            hardApplyScheme("dark");
        } else {
            // On est hors Jitsi : si une baseline existe, RESTAURE et efface la baseline.
            const baseline = localStorage.getItem(BASELINE_KEY) as Scheme | null;
            if (baseline) {
                hardApplyScheme(baseline);        // restaure vraiment l'état visuel + DSFR
                try { localStorage.removeItem(BASELINE_KEY); } catch { }
            }
            //  ne touche à rien → le modal DSFR reste maître du thème
        }
    }, [isJitsi, path]);

    return null;
}
