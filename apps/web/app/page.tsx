"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Station } from "@/components/StationsMap";

const StationsMap = dynamic(() => import("@/components/StationsMap"), {
  ssr: false,
  loading: () => <div className="card p-3">Chargement de la carte…</div>,
});

async function fetchStations(
  signal: AbortSignal,
  min?: number
): Promise<Station[]> {
  const qs = min ? `?min=${min}` : "";
  // On appelle le proxy Next (même origine, pas de CORS)
  const res = await fetch(`/api/stations${qs}`, { cache: "no-store", signal });
  if (!res.ok) throw new Error("Failed to fetch stations");
  return res.json();
}

export default function Page() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [min, setMin] = useState<number>(0);

  // Chargement initial + reload quand "min" change
  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchStations(ac.signal, min);
        if (cancelled) return;
        setStations(data);
        setError(null); // on clear l’erreur après succès
      } catch (err) {
        // Abort ? on ignore
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (cancelled) return;
        // Autres erreurs
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (cancelled) return;
        setLoading(false); // on coupe le loading ici
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [min]);

  // rafraîchissement auto toutes les 60s
  useEffect(() => {
    const id = setInterval(() => {
      const ac = new AbortController();
      fetchStations(ac.signal, min)
        .then(setStations)
        .catch(() => { });
      // pas de return ici : setInterval n'utilise pas le cleanup de l'effet interne
    }, 60_000);
    return () => clearInterval(id);
  }, [min]);

  return (
    <main className="page-shell space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Stations V’Lille</h1>
        <p className="text-slate-400">
          Données via proxy Next <code>/api/stations</code> — carte
          OpenStreetMap
        </p>

        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Min vélos dispo</label>
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => setMin(Number(e.target.value) || 0)}
            className="card px-3 py-2 text-slate-100 outline-none"
            style={{ width: 100 }}
          />
        </div>
      </header>

      {error && (
        <div className="card p-3 text-red-300 border-red-400/40">
          Erreur: {error}
        </div>
      )}

      <StationsMap stations={stations} height={520} />

      {/* (optionnel) ta grille de cartes texte */}
      {/* <div className="grid gap-4 md:grid-cols-3">
        {stations.map(...)}
      </div> */}
    </main>
  );
}
