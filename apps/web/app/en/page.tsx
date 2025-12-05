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
  loading: () => <div className="card p-3">Loading the map…</div>,
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
  return d.toLocaleString("en-GB", {
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

  // Initial load + when filter changes
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

  // Auto refresh every 60s
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

  // --- Derived stats ---
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
          <span>Real-time data</span>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 justify-between">
          <motion.h1
            className="text-3xl md:text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            V’Lille — Live availability
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
          View V’Lille stations on a map and check in real time how many bikes
          and docks are available. Filter by a minimum bike threshold to quickly
          find a useful station.
        </motion.p>

        {/* Controls */}
        <motion.div
          className="flex flex-wrap items-center gap-3 pt-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.08 }}
        >
          <label className="text-sm text-slate-400">
            Minimum bikes threshold
          </label>
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => setMin(Number(e.target.value) || 0)}
            className="input"
            placeholder="0"
            aria-label="Filter by minimum number of available bikes"
          />

          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Last update:{" "}
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
          <div className="text-xs text-slate-400">Stations displayed</div>
          <div className="text-2xl font-semibold">{stats.totalStations}</div>
        </motion.div>

        <motion.div className="card p-4" variants={cardVariants} {...statHover}>
          <div className="text-xs text-slate-400">Available bikes (total)</div>
          <div className="text-2xl font-semibold">{stats.totalBikes}</div>
        </motion.div>

        <motion.div className="card p-4" variants={cardVariants} {...statHover}>
          <div className="text-xs text-slate-400">Average bikes / station</div>
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
            Loading error: {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        aria-label="V’Lille stations map"
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

        {/* Legend */}
        <motion.div
          className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, delay: 0.05 }}
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow-[0_0_0_3px_rgba(0,0,0,.25)]" />
            Good availability (≥ 4)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500 ring-2 ring-white/90 shadow-[0_0_0_3px_rgba(0,0,0,.25)]" />
            Low (1–3)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white/90 shadow-[0_0_0_3px_rgba(0,0,0,.25)]" />
            Empty (0)
          </span>
        </motion.div>
      </motion.section>

      {/* ABOUT */}
      <motion.section className="card p-5 space-y-3" variants={sectionVariants}>
        <h2 className="text-lg font-semibold">About this project</h2>
        <p className="text-sm text-slate-400">
          This educational prototype showcases a modern stack: Node/Express
          backend (60s cache), API proxy via Next.js, React front-end with the
          App Router, Tailwind v4, and a Leaflet map (colored icons, clustering,
          geolocation).
        </p>
        <ul className="text-sm text-slate-400 list-disc pl-5 space-y-1">
          <li>
            Data comes from the operator’s Open Data feed (GBFS format) and is
            aggregated server-side for the map.
          </li>
          <li>
            The <code>min</code> parameter filters stations server-side based on
            available bikes.
          </li>
          <li>Auto-refresh runs every minute (and can be adjusted).</li>
        </ul>
        <div className="text-xs text-slate-500">
          Tip: use the <strong>📍 Center me</strong> button on the map to
          geolocate yourself and recenter the view.
        </div>
      </motion.section>

      {/* FOOTER */}
      <motion.footer
        className="py-6 text-xs text-slate-500"
        variants={sectionVariants}
      >
        Unofficial prototype — for technical demonstration.
      </motion.footer>

      {/* Bottom loader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-xs text-slate-300 shadow"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            Updating data…
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
