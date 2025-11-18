"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle({ className = "" }: { className?: string }) {
    const [theme, setTheme] = useState<Theme | null>(null);

    useEffect(() => {
        const el = document.documentElement;
        const cur = (el.getAttribute("data-theme") as Theme) ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        setTheme(cur);
    }, []);

    const setBoth = (t: Theme) => {
        document.documentElement.setAttribute("data-theme", t);
        try {
            localStorage.setItem("theme", t);
            document.cookie = `theme=${t}; Path=/; Max-Age=31536000; SameSite=Lax`;
        } catch { }
        setTheme(t);
    };

    const toggle = () => setBoth((theme === "dark" ? "light" : "dark") as Theme);

    if (!theme) return null;
    
    const checked = theme === "dark";

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={toggle}
            className={[
                "group relative inline-flex h-8 w-14 items-center rounded-full transition-colors",
                "border",
                checked
                    ? "bg-slate-900 border-slate-700"
                    : "bg-zinc-200 border-zinc-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                "shadow-sm",
                className,
            ].join(" ")}
            aria-label="Basculer le thème clair/sombre"
            title={checked ? "Passer en clair" : "Passer en sombre"}
        >
            {/* Icône soleil (gauche) */}
            <svg aria-hidden xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={[
                "absolute left-2 h-4 w-4 transition-opacity z-10",
                checked ? "opacity-0" : "opacity-100",

            ].join(" ")}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>


            {/* Bouton/knob */}
            <span
                className={[
                    "absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white shadow-md transition-transform",
                    checked ? "translate-x-6" : "translate-x-0",
                ].join(" ")}
            />

            {/* Icône lune (droite) */}

            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="rgb(15 23 42)" className={[
                "absolute right-1.5 h-4 w-4 transition-opacity",
                checked ? "opacity-100" : "opacity-0",
            ].join(" ")}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>

        </button>
    );
}
