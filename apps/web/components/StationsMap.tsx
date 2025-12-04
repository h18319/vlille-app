"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";

export type Station = {
  id: string;
  name?: string;
  lat?: number;
  lon?: number;
  bikes?: number;
  docks?: number;
  address?: string;
};

type MarkerWithBikes = L.Marker & {
  options: L.MarkerOptions & { bikes?: number };
};

/* ---------- Utils ---------- */
function iconFor(bikes = 0) {
  const color = bikes === 0 ? "#ef4444" : bikes <= 3 ? "#f59e0b" : "#22c55e";
  return L.divIcon({
    className: "vlille-marker",
    html: `<span style="--dot:${color}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

/* ---------- Classe contrôle (déclarée au niveau module) ---------- */
class LocateControlClass extends L.Control {
  onAdd(m: L.Map) {
    const btn = L.DomUtil.create("button", "leaflet-bar vlille-locate-btn");
    btn.title = "Me centrer";
    btn.innerHTML = "📍";
    btn.setAttribute("type", "button");

    L.DomEvent.on(btn, "click", (ev) => {
      L.DomEvent.stopPropagation(ev);
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          m.setView(latlng, 15);
          L.circle(latlng, {
            radius: Math.max(50, pos.coords.accuracy || 50),
            color: "#38bdf8",
            weight: 2,
            fillColor: "#38bdf8",
            fillOpacity: 0.15,
          }).addTo(m);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });

    return btn; // HTMLElement attendu par Leaflet
  }
  onRemove() {
    /* noop */
  }
}

/* ---------- Sub-components ---------- */
function FitToStations({ stations }: { stations: Station[] }) {
  const map = useMap();

  useEffect(() => {
    const pts = stations
      .filter((s) => typeof s.lat === "number" && typeof s.lon === "number")
      .map((s) => [s.lat as number, s.lon as number] as [number, number]);

    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 15);
      return;
    }

    const bounds = L.latLngBounds(pts);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [stations, map]);

  return null;
}

/** Contrôle Leaflet avec un bouton “📍 Me centrer” (géoloc navigateur) */
function LocateControl() {
  const map = useMap();

  useEffect(() => {
    const locate = new LocateControlClass({ position: "topright" });
    locate.addTo(map);

    // ⬇️ IMPORTANT: retourner une fonction qui ne renvoie rien
    return () => {
      locate.remove(); // ou: map.removeControl(locate);
    };
  }, [map]);

  return null;
}

/** Groupe de clusters avec pastille colorée selon le TOTAL de vélos du cluster */
function ClusteredMarkers({ stations }: { stations: Station[] }) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) Charger les libs + créer le groupe une seule fois
      if (!clusterRef.current) {
        await import("leaflet-defaulticon-compatibility").catch(() => {});
        await import("leaflet.markercluster");

        if (cancelled) return;

        clusterRef.current = L.markerClusterGroup({
          chunkedLoading: true,
          iconCreateFunction: (cluster) => {
            const total = cluster
              .getAllChildMarkers()
              .reduce(
                (acc, m) => acc + ((m as MarkerWithBikes).options.bikes ?? 0),
                0
              );

            const color =
              total === 0 ? "#ef4444" : total <= 10 ? "#f59e0b" : "#22c55e";

            return L.divIcon({
              html: `<div class="vlille-cluster" style="--c:${color}">
                       <span>${total}</span>
                     </div>`,
              className: "vlille-cluster-wrapper",
              iconSize: [42, 42],
            });
          },
        });

        map.addLayer(clusterRef.current);
      }

      if (cancelled) return;
      const group = clusterRef.current;
      if (!group) return;

      // 2) Mettre à jour les markers à chaque changement de `stations`
      group.clearLayers();

      const markers: L.Marker[] = stations
        .filter((s) => typeof s.lat === "number" && typeof s.lon === "number")
        .map((s) => {
          const m = L.marker([s.lat as number, s.lon as number], {
            icon: iconFor(s.bikes),
          }) as MarkerWithBikes;

          m.options.bikes = s.bikes ?? 0;

          m.bindPopup(
            `<div style="min-width:200px">
              <strong>${s.name ?? "Station"}</strong>
              <div style="font-size:12px;opacity:.8">
                ${s.address ?? "—"}
              </div>
              <div style="margin-top:6px">
                🚲 ${s.bikes ?? 0} • 🅿️ ${s.docks ?? 0}
              </div>
            </div>`
          );

          return m;
        });

      group.addLayers(markers);
    })();

    return () => {
      cancelled = true;
    };
  }, [map, stations]);

  // Optionnel : cleanup quand le composant est démonté
  useEffect(() => {
    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [map]);

  return null;
}

export default function StationsMap({
  stations,
  className = "",
  height = 520,
}: {
  stations: Station[];
  className?: string;
  height?: number;
}) {
  const center: [number, number] = [50.6292, 3.0573]; // Lille

  return (
    <div
      className={`card relative overflow-hidden ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <FitToStations stations={stations} />
          <LocateControl />
          <ClusteredMarkers stations={stations} />
        </>
      </MapContainer>
    </div>
  );
}
