import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT ?? 4000;
const GBFS_ROOT = "https://media.ilevia.fr/opendata/gbfs.json";

type StationInformation = {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
};

type StationStatus = {
  station_id: string;
  num_bikes_available: number;
  num_docks_available: number;
};

let cache: any = null;
let cacheDate = 0;
const CACHE_MS = 60_000;

async function fetchStations() {
  if (Date.now() - cacheDate < CACHE_MS && cache) {
    return cache;
  }

  const rootRes = await fetch(GBFS_ROOT);
  const root = (await rootRes.json()) as any;

  const feeds = root.data.en.feeds as Array<{ name: string; url: string }>;
  const infoFeed = feeds.find((f) => f.name === "station_information");
  const statusFeed = feeds.find((f) => f.name === "station_status");

  const [info, status] = await Promise.all([
    fetch(infoFeed!.url).then((r) => r.json()),
    fetch(statusFeed!.url).then((r) => r.json()),
  ]);

  const infoById = new Map<string, StationInformation>(
    (info.data.stations as StationInformation[]).map((s) => [s.station_id, s])
  );

  const merged = (status.data.stations as StationStatus[]).map((s) => {
    const i = infoById.get(s.station_id);
    return {
      id: s.station_id,
      name: i?.name,
      lat: i?.lat,
      lon: i?.lon,
      bikes: s.num_bikes_available,
      docks: s.num_docks_available,
      address: i?.address,
    };
  });

  cache = merged;
  cacheDate = Date.now();
  return merged;
}

app.get("/stations", async (req, res) => {
  try {
    const min = Number(req.query.min ?? 0);
    const stations = await fetchStations();
    const filtered = stations.filter((s: any) => (s.bikes ?? 0) >= min);
    res.json(filtered);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to fetch stations" });
  }
});

app.listen(PORT, () => {
  console.log("API running on port " + PORT);
});
