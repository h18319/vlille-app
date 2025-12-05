"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { Station } from "@/components/StationsMap";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToogle";
import { motion, AnimatePresence } from "framer-motion";
import type { MotionProps, Variants } from "framer-motion";

const StationsMap = dynamic(() => import("@/components/StationsMap"), {
  ssr: false,
  loading: () => <div className="card p-3">Chargement de la carte…</div>,
});

// --- Data fetcher (proxy Next) ---
async function fetchStations(
  signal: AbortSignal,
  min?: number
): Promise<Station[]> {
  const qs = min ? `?min=${min}` : "";
  const res = await fetch(`/api/stations${qs}`, { cache: "no-store", signal });
  if (!res.ok) throw new Error("Failed to fetch stations");
  return res.json();
}

// --- Utils ---
function formatDate(d: Date) {
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

/* ---------------- Motion presets ---------------- */

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.25,
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.28, ease: EASE_OUT },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
};

const statHover: MotionProps = {
  whileHover: { y: -4, scale: 1.01 },
  whileTap: { scale: 0.99 },
  transition: { type: "spring", stiffness: 300, damping: 22 },
};

export default function Page() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [min, setMin] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Chargement initial + au changement de filtre
  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchStations(ac.signal, min);
        if (cancelled) return;
        setStations(data);
        setError(null);
        setLastUpdate(new Date());
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [min]);

  // Rafraîchissement automatique toutes les 60s
  useEffect(() => {
    const id = setInterval(() => {
      const ac = new AbortController();
      fetchStations(ac.signal, min)
        .then((data) => {
          setStations(data);
          setLastUpdate(new Date());
        })
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, [min]);

  // --- Stats dérivées ---
  const stats = useMemo(() => {
    const totalStations = stations.length;
    const totalBikes = stations.reduce((acc, s) => acc + (s.bikes ?? 0), 0);
    const avg = totalStations
      ? Math.round((totalBikes / totalStations) * 10) / 10
      : 0;
    return { totalStations, totalBikes, avg };
  }, [stations]);

  return (
    <motion.main
      className="page-shell space-y-8"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      {/* HERO */}
      <motion.section className="space-y-3" variants={sectionVariants}>
        <motion.div
          className="chip text-xs"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <span>🟢 Prototype</span>
          <span aria-hidden>•</span>
          <span>Données temps réel</span>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 justify-between">
          <motion.h1
            className="text-3xl md:text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            V’Lille — Disponibilités en temps réel
          </motion.h1>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: "easeOut", delay: 0.05 }}
          >
            <LanguageToggle />
            <ThemeToggle className="shrink-0" />
          </motion.div>
        </div>

        <motion.p
          className="max-w-2xl text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.06 }}
        >
          Visualisez les stations V’Lille sur une carte et consultez en direct
          le nombre de vélos et d’emplacements disponibles. Filtrez par seuil
          minimal de vélos pour trouver rapidement une station utile.
        </motion.p>

        {/* Controls */}
        <motion.div
          className="flex flex-wrap items-center gap-3 pt-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.08 }}
        >
          <label className="text-sm text-slate-400">
            Seuil minimum de vélos
          </label>
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => setMin(Number(e.target.value) || 0)}
            className="input"
            placeholder="0"
            aria-label="Filtrer par nombre minimum de vélos disponibles"
          />

          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Dernière mise à jour :{" "}
              <span className="text-slate-600 dark:text-slate-300">
                {formatDate(lastUpdate)}
              </span>
            </span>
          )}
        </motion.div>
      </motion.section>

      {/* STATS */}
      <motion.section
        className="grid gap-3 md:grid-cols-3"
        variants={sectionVariants}
      >
        <motion.div className="card p-4" variants={cardVariants} {...statHover}>
          <div className="text-xs text-slate-400">Stations affichées</div>
          <div className="text-2xl font-semibold">{stats.totalStations}</div>
        </motion.div>

        <motion.div className="card p-4" variants={cardVariants} {...statHover}>
          <div className="text-xs text-slate-400">
            Vélos disponibles (somme)
          </div>
          <div className="text-2xl font-semibold">{stats.totalBikes}</div>
        </motion.div>

        <motion.div className="card p-4" variants={cardVariants} {...statHover}>
          <div className="text-xs text-slate-400">Moyenne vélos / station</div>
          <div className="text-2xl font-semibold">{stats.avg}</div>
        </motion.div>
      </motion.section>

      {/* MAP */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="card p-4 border-red-500/30 text-red-300"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            Erreur de chargement : {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        aria-label="Carte des stations V’Lille"
        variants={sectionVariants}
      >
        <motion.div
          className="will-change-transform"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <StationsMap stations={stations} height={560} />
        </motion.div>

        {/* Légende */}
        <motion.div
          className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, delay: 0.05 }}
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow-[0_0_0_3px_rgba(0,0,0,.25)]" />
            Disponibilité bonne (≥ 4)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500 ring-2 ring-white/90 shadow-[0_0_0_3px_rgba(0,0,0,.25)]" />
            Faible (1–3)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white/90 shadow-[0_0_0_3px_rgba(0,0,0,.25)]" />
            Indisponible (0)
          </span>
        </motion.div>
      </motion.section>

      {/* ABOUT */}
      <motion.section className="card p-5 space-y-3" variants={sectionVariants}>
        <h2 className="text-lg font-semibold">À propos du projet</h2>
        <p className="text-sm text-slate-400">
          Ce prototype pédagogique illustre une stack moderne&nbsp;: backend
          Node/Express (cache 60s), proxy API via Next.js, front React avec App
          Router, Tailwind v4, et carte Leaflet (icônes colorées, clustering,
          géolocalisation).
        </p>
        <ul className="text-sm text-slate-400 list-disc pl-5 space-y-1">
          <li>
            Les données proviennent de l’Open Data (format GBFS) exposé par
            l’opérateur, et sont agrégées côté serveur pour la carte.
          </li>
          <li>
            Le champ <code>min</code> filtre côté serveur les stations selon le
            nombre de vélos disponibles.
          </li>
          <li>
            Le rafraîchissement est automatique chaque minute (et peut être
            ajusté).
          </li>
        </ul>
        <div className="text-xs text-slate-500">
          Astuce&nbsp;: utilisez le bouton <strong>📍 Me centrer</strong> sur la
          carte pour vous géolocaliser et recentrer la vue.
        </div>
      </motion.section>

      {/* FOOTER */}
      <motion.footer
        className="py-6 text-xs text-slate-500"
        variants={sectionVariants}
      >
        Prototype non officiel — pour démonstration technique.
      </motion.footer>

      {/* Loader fin / overlay léger si besoin */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-xs text-slate-300 shadow"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            Actualisation des données…
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
