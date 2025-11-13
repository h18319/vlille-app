"use client";
import { useEffect, useState } from "react";

type Station = {
  id: string;
  name?: string;
  lat?: number;
  lon?: number;
  bikes?: number;
  docks?: number;
  address?: string;
};

async function fetchStations(signal: AbortSignal, min?: number): Promise<Station[]> {
  const qs = min ? `?min=${min}` : "";
  // On appelle le proxy Next (même origine, pas de CORS)
  const res = await fetch(`/api/stations${qs}`, { cache: "no-store", signal });
  if (!res.ok) throw new Error("Failed to fetch stations");
  return res.json();
}

export default function Page() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [min, setMin] = useState<number>(0);

  // 1) Chargement initial + reload quand "min" change
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    fetchStations(ac.signal, min)
      .then(setStations)
      .catch((e) => {
        if ((e as any)?.name !== "AbortError") setError((e as Error).message);
      })
      .finally(() => setLoading(false));

    return () => ac.abort(); // nettoie si on change de page ou de filtre
  }, [min]);

  // 2) (optionnel) rafraîchissement auto toutes les 60s
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
        <p className="text-slate-400">Données via proxy Next : <code>/api/stations</code></p>

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

      {loading && (
        <div className="text-slate-400">Chargement…</div>
      )}

      {error && (
        <div className="card p-3 text-red-300 border-red-400/40">
          Erreur: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-3">
          {stations.map((s) => (
            <article key={s.id} className="card p-4">
              <h2 className="font-semibold">{s.name ?? "Station"}</h2>
              <p className="text-xs text-slate-400">{s.address ?? "—"}</p>
              <p className="mt-2">🚲 {s.bikes ?? 0} — 🅿️ {s.docks ?? 0}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}