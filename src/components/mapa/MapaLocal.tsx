"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button, Loader, Text, UnstyledButton } from "@mantine/core";
import { IconCheck, IconCurrentLocation, IconMapPin } from "@tabler/icons-react";
import type { Coordenada } from "@/lib/api/tipos";
import classes from "./mapa.module.css";

const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => <div className={classes.carregando} />,
});

export const MSG_GEO_NEGADA = "Não foi possível obter sua localização. Marque no mapa.";

export interface MapaLocalProps {
  valor: Coordenada | null;
  onChange?: (c: Coordenada | null) => void;
  erro?: React.ReactNode;
  altura?: number;
  /** Versão só leitura (card lateral do feed), com o raio do filtro. */
  mini?: boolean;
  raioKm?: number | null;
  desabilitado?: boolean;
}

/**
 * Mapa de localização (Leaflet + OpenStreetMap). O usuário nunca digita coordenadas:
 * clica no mapa, arrasta o marcador ou usa a localização do navegador.
 */
export function MapaLocal({ valor, onChange, erro, altura, mini = false, raioKm, desabilitado = false }: MapaLocalProps) {
  const [localizando, setLocalizando] = useState(false);
  const [porGeo, setPorGeo] = useState(false);
  const [precisao, setPrecisao] = useState<number | null>(null);
  const [erroGeo, setErroGeo] = useState<string | null>(null);
  const editavel = !mini && !desabilitado && Boolean(onChange);
  const h = altura ?? (mini ? 150 : 300);

  const marcar = (c: Coordenada | null, geo = false, acc: number | null = null) => {
    setPorGeo(geo);
    setPrecisao(acc);
    setErroGeo(null);
    onChange?.(c);
  };

  const usarLocalizacao = () => {
    if (!navigator.geolocation) {
      setErroGeo(MSG_GEO_NEGADA);
      return;
    }
    setLocalizando(true);
    setErroGeo(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalizando(false);
        const r = (v: number) => {
          const x = Math.round(v * 1e6) / 1e6;
          return x === 0 ? 0.000001 : x;
        };
        marcar({ latitude: r(pos.coords.latitude), longitude: r(pos.coords.longitude) }, true, pos.coords.accuracy);
      },
      () => {
        setLocalizando(false);
        setErroGeo(MSG_GEO_NEGADA);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  };

  const temErro = Boolean(erro);

  return (
    <div className={classes.raiz}>
      <div className={classes.moldura} data-erro={temErro || undefined} data-erro-mapa={temErro || undefined}>
        <MapaLeaflet
          valor={valor}
          onChange={editavel ? (c) => marcar(c) : undefined}
          mini={mini}
          raioKm={raioKm}
          precisaoM={porGeo ? precisao : null}
          altura={h}
          rotulo={
            mini
              ? "Mapa com a localização do seu perfil"
              : valor
                ? "Mapa: clique para mudar o local marcado"
                : "Mapa: clique para marcar sua localização"
          }
        />

        {!mini && !valor && !localizando && (
          <div className={classes.aviso}>
            <IconMapPin size={22} stroke={1.75} aria-hidden />
            <Text fz={14} fw={600}>
              Clique no mapa para marcar sua localização
            </Text>
            <Text fz={12} c="dimmed">
              ou use sua localização atual
            </Text>
          </div>
        )}

        {editavel && (
          <Button
            className={classes.geo}
            variant="default"
            size="sm"
            onClick={usarLocalizacao}
            disabled={localizando}
            leftSection={localizando ? <Loader size={14} /> : <IconCurrentLocation size={18} stroke={1.75} />}
          >
            {localizando ? "Localizando…" : "Usar minha localização"}
          </Button>
        )}
      </div>

      {!mini && (
        <div className={classes.rodape} aria-live="polite">
          {localizando ? (
            <Text fz={12} c="dimmed">
              Aguardando a permissão de localização do navegador…
            </Text>
          ) : temErro ? (
            <Text fz={12} c="var(--app-err)" data-erro="true" tabIndex={-1}>
              {erro}
            </Text>
          ) : erroGeo ? (
            <Text fz={12} c="var(--app-err)">
              {erroGeo}
            </Text>
          ) : valor ? (
            <>
              <Text component="span" fz={13} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className={classes.ok}>
                  <IconCheck size={11} stroke={3.5} aria-hidden />
                </span>
                <strong style={{ fontWeight: 600 }}>
                  {porGeo ? "Sua localização atual foi marcada" : "Local marcado no mapa"}
                </strong>
                {editavel && <Text component="span" fz={13} c="dimmed">· clique no mapa ou arraste o marcador para ajustar</Text>}
              </Text>
              {editavel && (
                <UnstyledButton onClick={() => marcar(null)} fz={13} fw={600} td="underline" px={10} h={28}>
                  Remarcar
                </UnstyledButton>
              )}
            </>
          ) : (
            <Text fz={12} c="dimmed">
              Clique no mapa ou use “Usar minha localização”. Nenhuma coordenada é digitada.
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
