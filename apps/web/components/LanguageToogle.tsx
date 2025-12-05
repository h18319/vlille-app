"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SVGProps } from "react";

type Lang = "fr" | "en";

export default function LanguageToggle({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const currentLang: Lang = useMemo(() => {
    const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
    return isEnglish ? "en" : "fr";
  }, [pathname]);

  const switchTo = (lang: Lang) => {
    if (lang === currentLang) {
      setOpen(false);
      return;
    }

    if (lang === "en") {
      const newPath = pathname === "/" ? "/en" : `/en${pathname}`;
      router.push(newPath);
    } else {
      const withoutEn = pathname.replace(/^\/en(\/?)/, "/");
      router.push(withoutEn === "//" ? "/" : withoutEn);
    }

    setOpen(false);
  };

  // Fermer si clic en dehors
  useEffect(() => {
    if (!open) return;

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target)) setOpen(false);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const label = currentLang.toUpperCase();

  return (
    <div ref={rootRef} className={["relative", className].join(" ")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          // Taille & layout
          "inline-flex items-center gap-1.5",
          "h-9 px-3",

          // Style "compact select"
          "rounded-xl border",
          "bg-white text-slate-900 border-slate-200",
          "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",

          // Ombre légère comme sur ton visuel
          "shadow-sm",

          // Hover / focus
          "hover:bg-slate-50 dark:hover:bg-slate-800/60",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/80",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",

          // Typo
          "text-sm font-medium",
        ].join(" ")}
        title="Language"
      >
        <span className="leading-none">{label}</span>
        <ChevronDown
          className={[
            "h-3.5 w-3.5 transition-transform",
            open ? "rotate-180" : "rotate-0",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className={[
            "absolute right-0 mt-2 min-w-[88px]",
            "rounded-xl border",
            "bg-white border-slate-200",
            "dark:bg-slate-900 dark:border-slate-700",
            "shadow-lg overflow-hidden z-50",
          ].join(" ")}
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => switchTo("fr")}
            className={[
              "w-full text-left px-3 py-2 text-sm",
              currentLang === "fr"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
            ].join(" ")}
          >
            FR
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => switchTo("en")}
            className={[
              "w-full text-left px-3 py-2 text-sm",
              currentLang === "en"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
            ].join(" ")}
          >
            EN
          </button>
        </div>
      )}
    </div>
  );
}

function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m19.5 8.25-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}