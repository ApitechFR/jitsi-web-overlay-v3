import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { validateconferenceName } from "./utils/conferenceName";
import { RESERVED_SEGMENTS } from "./constant/routes";
import { useFrTheme } from "@apitechfr/react-dsapitech/dsapitech_hooks"

type Scheme = "system" | "light" | "dark";

const BASELINE_KEY = "app:scheme:baseline-before-jitsi";

function hardApplyScheme(scheme: Scheme) {
    try {
        if (scheme === "system") localStorage.removeItem("scheme");
        else localStorage.setItem("scheme", scheme);
        window.dispatchEvent(new CustomEvent("scheme", { detail: { scheme } }));
    } catch { }

    const root = document.documentElement;

    const setAttr = (k: string, v?: string | null) => {
        if (v == null || v === "") root.removeAttribute(k);
        else root.setAttribute(k, v);
    };

    setAttr("data-fr-scheme", scheme);
    setAttr("data-fr-theme", scheme === "system" ? null : scheme);
    setAttr("data-theme", scheme === "system" ? null : scheme);

    root.classList.remove("fr-theme-dark", "fr-theme-light");
    if (scheme === "dark") root.classList.add("fr-theme-dark");
    if (scheme === "light") root.classList.add("fr-theme-light");
}

export default function RouteThemeController() {

    const theme = useFrTheme();

    const { pathname } = useLocation();
    const path = pathname.replace(/\/+$/, "") || "/";

    const firstSeg = path.split("/")[1] ?? "";
    const isSingleSeg = path === `/${firstSeg}` && firstSeg.length > 0;
    const isJitsi = isSingleSeg && !RESERVED_SEGMENTS.has(firstSeg) && validateconferenceName(firstSeg);

    useEffect(() => {
        if (isJitsi) {

            const saved = (localStorage.getItem(BASELINE_KEY) as Scheme | null);
            if (!saved) {
                const current = theme;
                try { localStorage.setItem(BASELINE_KEY, current); } catch { }
            }

            hardApplyScheme("dark");
        } else {

            const baseline = localStorage.getItem(BASELINE_KEY) as Scheme | null;
            if (baseline) {
                hardApplyScheme(baseline);
                try {
                    localStorage.removeItem(BASELINE_KEY);
                } catch { }
            } else {
                const scheme = localStorage.getItem("scheme") as Scheme;
                hardApplyScheme(scheme);
            }
            //  ne touche à rien → le modal DSFR reste maître du thème
        }
    }, [isJitsi, path]);

    return null;
}
