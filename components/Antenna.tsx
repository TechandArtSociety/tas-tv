"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Slot } from "@/lib/locate";

type NowPayload = {
  serverNow: string;
  mode: "grid" | "fallback" | "waiting";
  current: { slot: Slot; offsetS: number } | null;
  slots: Slot[];
  error?: string;
};

function parisTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function duration(value: number) {
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return mins ? `${mins} min` : `${secs} s`;
}

export default function Antenna() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clockRef = useRef({ receivedAt: 0 });
  const youtubeAnchorRef = useRef<{ slotId: string; offsetS: number } | null>(null);
  const [payload, setPayload] = useState<NowPayload | null>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [youtubeStart, setYoutubeStart] = useState<{ slotId: string; offsetS: number } | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const receivedAt = performance.now();
    try {
      const response = await fetch("/api/now", { cache: "no-store" });
      const data = (await response.json()) as NowPayload;
      if (!response.ok) throw new Error(data.error ?? "Antenne indisponible");
      clockRef.current = { receivedAt };
      if (data.current?.slot.item?.kind === "youtube" && youtubeAnchorRef.current?.slotId !== data.current.slot.id) {
        const anchor = { slotId: data.current.slot.id, offsetS: data.current.offsetS };
        youtubeAnchorRef.current = anchor;
        setYoutubeStart(anchor);
      }
      setPayload(data);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Antenne indisponible");
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(refresh, 10_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const current = payload?.current;
  const item = current?.slot.item;
  const isYouTube = item?.kind === "youtube";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current || isYouTube) return;
    const elapsed = Math.max(0, (performance.now() - clockRef.current.receivedAt) / 1000);
    const target = Math.max(0, current.offsetS + elapsed);
    if (Math.abs(video.currentTime - target) > 2) video.currentTime = target;
    if (started) void video.play().catch(() => setError("Le navigateur a bloqué la lecture. Appuie sur Reprendre."));
  }, [current, isYouTube, started]);

  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || !current) return;
    const elapsed = Math.max(0, (performance.now() - clockRef.current.receivedAt) / 1000);
    video.currentTime = Math.min(video.duration || Infinity, current.offsetS + elapsed);
    if (started) void video.play().catch(() => setError("La lecture a été bloquée par le navigateur."));
  };

  const turnOn = () => {
    setStarted(true);
    setError("");
    if (isYouTube && current) {
      const anchor = { slotId: current.slot.id, offsetS: current.offsetS };
      youtubeAnchorRef.current = anchor;
      setYoutubeStart(anchor);
    }
    void videoRef.current?.play().catch(() => setError("La lecture n'a pas démarré. Réessaie."));
  };

  const next = payload?.slots?.[1];
  const youtubeUrl = isYouTube && item?.src
    ? `https://www.youtube-nocookie.com/embed/${item.src}?autoplay=${started ? 1 : 0}&start=${Math.floor(youtubeStart?.offsetS ?? current?.offsetS ?? 0)}&playsinline=1`
    : "";

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="TAS TV, accueil">
          <span className="brand-mark">T</span><span>TAS<span className="brand-light">TV</span></span>
        </Link>
        <div className="topbar-center"><span className="live-dot" /> ANTENNE EN DIRECT <span className="topbar-separator">/</span> PARIS · 24/7</div>
        <Link className="studio-link" href="/studio">Studio <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="hero-copy">
        <div className="eyebrow">LA CULTURE, EN CONTINU</div>
        <h1>Allumez. <em>Et laissez tourner.</em></h1>
        <p>Une programmation choisie par TAS, partagée à la même minute.</p>
      </section>

      <section className="broadcast-layout" aria-label="Antenne TAS TV">
        <div className="broadcast-main">
          <div className={`player-frame ${isYouTube ? "is-youtube" : ""}`}>
            {isYouTube && youtubeUrl ? (
              <iframe className="youtube-player" src={youtubeUrl} title={item?.title ?? "Programme TAS TV sur YouTube"} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : item?.src ? (
              <video ref={videoRef} key={current?.slot.id} className={`broadcast-video ${started ? "is-playing" : ""}`} src={item.src} playsInline preload="auto" muted={muted} onLoadedMetadata={onLoadedMetadata} onError={() => setError("Ce fichier de démonstration n'a pas pu être lu.")} />
            ) : (
              <div className="player-empty"><span className="empty-signal">TAS TV</span><span>Préparation de l’antenne…</span></div>
            )}
            {!started && !isYouTube && <div className="player-pause-cover"><span className="pause-label"><span className="live-dot" /> PRÊT À REGARDER</span></div>}
            {!isYouTube && <div className="player-corner"><span className="corner-live"><span className="live-dot" /> EN DIRECT</span><span className="corner-time">{current ? parisTime(current.slot.startsAt) : "--:--"}</span></div>}
          </div>
          <div className="player-controls">
            <button className="button button-primary" onClick={turnOn} disabled={!item}>
              <span className="play-icon">{started ? "Ⅱ" : "▶"}</span>{started ? "Antenne allumée" : "Allumer TAS TV"}
            </button>
            {started && <button className="button button-quiet" onClick={() => setMuted((value) => !value)}>{muted ? "Activer le son" : "Couper le son"}</button>}
            <span className="sync-note"><span className="sync-mark">↻</span> Synchronisée par l’heure serveur</span>
          </div>
          {error && <p className="inline-error" role="status">{error}</p>}
          {item && (
            <div className="credit-row">
              <div><div className="eyebrow">CRÉDIT CRÉATEUR</div><div className="credit-name">{item.creator?.name ?? "Tech & Art Society"}</div></div>
              {item.creator?.channel_url && <a href={item.creator.channel_url} target="_blank" rel="noreferrer">Découvrir la chaîne <span aria-hidden="true">↗</span></a>}
            </div>
          )}
        </div>

        <aside className="now-rail">
          <div className="rail-heading"><span>AU PROGRAMME</span><span className="paris-clock">{new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(new Date())} <small>PARIS</small></span></div>
          <article className="now-card">
            <div className="card-kicker"><span className="live-dot" /> À L’ANTENNE</div>
            <h2>{item?.title ?? (error ? "Antenne en pause" : "Chargement du programme")}</h2>
            <div className="card-meta">{item?.creator?.name ?? "TAS TV"} <span>·</span> {item ? duration(item.duration_s) : ""}</div>
            <div className="now-progress"><span style={{ width: `${Math.max(3, Math.min(100, ((current?.offsetS ?? 0) / Math.max(1, item?.duration_s ?? 1)) * 100))}%` }} /></div>
            <div className="now-timing"><span>{current ? parisTime(current.slot.startsAt) : "--:--"}</span><span>{current ? parisTime(current.slot.endsAt) : "--:--"}</span></div>
          </article>
          <div className="next-card">
            <div className="eyebrow">ENSUITE</div>
            <div className="next-time">{next ? parisTime(next.startsAt) : "— —"}</div>
            <div className="next-title">{next?.item?.title ?? "La suite de la programmation"}</div>
            <div className="card-meta">{next?.item?.creator?.name ?? "Boucle de secours TAS"}</div>
          </div>
          <div className="rail-note"><span className="note-icon">✳</span><p>Pas de défilement. Pas de choix infini. Juste TAS TV.</p></div>
          <div className="rail-foot"><span className={`connection-dot ${payload ? "connected" : ""}`} /> {payload ? (payload.mode === "fallback" ? "BOUCLE DE SECOURS ACTIVE" : "SIGNAL STABLE") : "CONNEXION À L’ANTENNE"}</div>
        </aside>
      </section>

      <footer className="site-footer"><span>TECH & ART SOCIETY</span><span>TURN IT ON, DON’T CHOOSE.</span><Link href="/studio">Accès programmateur</Link></footer>
    </main>
  );
}
