"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { Station } from "@/components/StationsMap";
import ThemeToggle from "@/components/ThemeToggle";

const StationsMap = dynamic(() => import("@/components/StationsMap"), {
  ssr: false,
  loading: () => <div className="card p-3">Chargement de la carte…</div>,
});

// --- Data fetcher (proxy Next) ---
async function fetchStations(signal: AbortSignal, min?: number): Promise<Station[]> {
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
        .catch(() => { });
    }, 60_000);
    return () => clearInterval(id);
  }, [min]);

  // --- Stats dérivées ---
  const stats = useMemo(() => {
    const totalStations = stations.length;
    const totalBikes = stations.reduce((acc, s) => acc + (s.bikes ?? 0), 0);
    const avg = totalStations ? Math.round((totalBikes / totalStations) * 10) / 10 : 0;
    return { totalStations, totalBikes, avg };
  }, [stations]);

  return (

    <main className="page-shell space-y-8">
      {/* HERO */}
      <section className="space-y-3">
        <div className="chip text-xs">
          <span>🟢 Prototype</span>
          <span aria-hidden>•</span>
          <span>Données temps réel</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            V’Lille — Disponibilités en temps réel
          </h1>
          <ThemeToggle className="shrink-0" />
        </div>

        <p className="max-w-2xl text-slate-400">
          Visualisez les stations V’Lille sur une carte et consultez en direct le
          nombre de vélos et d’emplacements disponibles. Filtrez par seuil minimal
          de vélos pour trouver rapidement une station utile.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="text-sm text-slate-400">Seuil minimum de vélos</label>
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => setMin(Number(e.target.value) || 0)}
            className="input"                       // ← remplace "card px-3 py-2 text-slate-100 outline-none"
            placeholder="0"
            aria-label="Filtrer par nombre minimum de vélos disponibles"
          />

          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Dernière mise à jour : <span className="text-slate-600 dark:text-slate-300">{formatDate(lastUpdate)}</span>
            </span>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="grid gap-3 md:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs text-slate-400">Stations affichées</div>
          <div className="text-2xl font-semibold">{stats.totalStations}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-400">Vélos disponibles (somme)</div>
          <div className="text-2xl font-semibold">{stats.totalBikes}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-400">Moyenne vélos / station</div>
          <div className="text-2xl font-semibold">{stats.avg}</div>
        </div>
      </section>

      {/* MAP */}
      {error && (
        <div className="card p-4 border-red-500/30 text-red-300">
          Erreur de chargement : {error}
        </div>
      )}

      <section aria-label="Carte des stations V’Lille">
        <StationsMap stations={stations} height={560} />
        {/* Légende */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
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
          <span className="inline-flex items-center gap-2">
            {/* <span className="inline-block h-3 w-3 rounded-full bg-emerald-500/70 ring-2 ring-white/90 shadow-[0_0_0_3px_rgba(0,0,0,.25)]" />
            Couleur du cluster = somme des vélos du groupe */}
          </span>
        </div>
      </section>

      {/* ABOUT */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-semibold">À propos du projet</h2>
        <p className="text-sm text-slate-400">
          Ce prototype pédagogique illustre une stack moderne&nbsp;: backend Node/Express
          (cache 60s), proxy API via Next.js, front React avec App Router, Tailwind v4,
          et carte Leaflet (icônes colorées, clustering, géolocalisation).
        </p>
        <ul className="text-sm text-slate-400 list-disc pl-5 space-y-1">
          <li>
            Les données proviennent de l’Open Data (format GBFS) exposé par l’opérateur,
            et sont agrégées côté serveur pour la carte.
          </li>
          <li>
            Le champ <code>min</code> filtre côté serveur les stations selon le nombre
            de vélos disponibles.
          </li>
          <li>
            Le rafraîchissement est automatique chaque minute (et peut être ajusté).
          </li>
        </ul>
        <div className="text-xs text-slate-500">
          Astuce&nbsp;: utilisez le bouton <strong>📍 Me centrer</strong> sur la carte
          pour vous géolocaliser et recentrer la vue.
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-xs text-slate-500">
        Prototype non officiel — pour démonstration technique.
      </footer>

      {/* Loader fin / overlay léger si besoin */}
      {loading && (
        <div className="fixed inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-xs text-slate-300 shadow">
          Actualisation des données…
        </div>
      )}
    </main>
  );
}
