"use client";

// Parte do mapa que depende do Leaflet (window). Carregada só no navegador via next/dynamic.
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Coordenada } from "@/lib/api/tipos";
import classes from "./mapa.module.css";

const CENTRO_BRASIL: [number, number] = [-14.235, -51.9253];

const icone = (mini: boolean) =>
  L.divIcon({
    className: classes.pinWrapper,
    html: `<svg class="${classes.pin}" width="${mini ? 24 : 32}" height="${mini ? 30 : 40}" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 1.5a9 9 0 0 0 -9 9c0 6.6 9 17.5 9 17.5s9 -10.9 9 -17.5a9 9 0 0 0 -9 -9z" stroke-width="1.5"/><circle cx="12" cy="10.5" r="3.4"/></svg>`,
    iconSize: mini ? [24, 30] : [32, 40],
    iconAnchor: mini ? [12, 30] : [16, 40],
  });

/** Arredonda para 6 casas (~11 cm) e evita o 0 exato, que a API rejeita. */
function normalizar(lat: number, lng: number): Coordenada {
  const r = (v: number) => {
    const x = Math.round(v * 1e6) / 1e6;
    return x === 0 ? 0.000001 : x;
  };
  return { latitude: r(lat), longitude: r(L.Util.wrapNum(lng, [-180, 180], true)) };
}

function Cliques({ ativo, onMarcar }: { ativo: boolean; onMarcar: (c: Coordenada) => void }) {
  useMapEvents({
    click(e) {
      if (ativo) onMarcar(normalizar(e.latlng.lat, e.latlng.lng));
    },
  });
  return null;
}

function Enquadrar({ alvo, raioKm, mini }: { alvo: Coordenada | null; raioKm?: number | null; mini: boolean }) {
  const map = useMap();
  const lat = alvo?.latitude;
  const lng = alvo?.longitude;
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    if (mini && raioKm && raioKm > 0) {
      map.fitBounds(L.latLng(lat, lng).toBounds(raioKm * 2000), { padding: [8, 8] });
    } else {
      map.setView([lat, lng], Math.max(map.getZoom(), mini ? 12 : 14), { animate: !mini });
    }
  }, [map, lat, lng, raioKm, mini]);
  return null;
}

export interface MapaLeafletProps {
  valor: Coordenada | null;
  onChange?: (c: Coordenada) => void;
  mini?: boolean;
  raioKm?: number | null;
  precisaoM?: number | null;
  altura: number | string;
  rotulo: string;
}

export default function MapaLeaflet({ valor, onChange, mini = false, raioKm, precisaoM, altura, rotulo }: MapaLeafletProps) {
  const pin = useMemo(() => icone(mini), [mini]);
  const centro: [number, number] = valor ? [valor.latitude, valor.longitude] : CENTRO_BRASIL;
  const editavel = !mini && Boolean(onChange);

  return (
    <MapContainer
      center={centro}
      zoom={valor ? (mini ? 12 : 14) : 4}
      className={classes.leaflet}
      style={{ height: altura, cursor: editavel ? "crosshair" : "default" }}
      dragging={!mini}
      scrollWheelZoom={!mini}
      doubleClickZoom={!mini}
      touchZoom={!mini}
      boxZoom={!mini}
      keyboard={!mini}
      zoomControl={!mini}
      attributionControl
      aria-label={rotulo}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className={classes.tiles}
      />
      <Cliques ativo={editavel} onMarcar={(c) => onChange?.(c)} />
      <Enquadrar alvo={valor} raioKm={raioKm} mini={mini} />
      {valor && raioKm && raioKm > 0 ? (
        <Circle
          center={[valor.latitude, valor.longitude]}
          radius={raioKm * 1000}
          pathOptions={{ className: classes.raio, dashArray: "6 6", weight: 2 }}
        />
      ) : null}
      {valor && precisaoM && !mini ? (
        <Circle
          center={[valor.latitude, valor.longitude]}
          radius={precisaoM}
          pathOptions={{ className: classes.precisao, weight: 1 }}
        />
      ) : null}
      {valor && (
        <Marker
          position={[valor.latitude, valor.longitude]}
          icon={pin}
          draggable={editavel}
          keyboard={false}
          eventHandlers={{
            dragend(e) {
              const p = (e.target as L.Marker).getLatLng();
              onChange?.(normalizar(p.lat, p.lng));
            },
          }}
        />
      )}
    </MapContainer>
  );
}
