"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Slot } from "@/lib/locate";

type NowPayload = {
  serverNow: string;
  mode: "grid" | "fallback" | "waiting";
  current: { slot: Slot; offsetS: number } | null;
  slots: Slot[];
  error?: string;
};

type ChatMessage = { id: number; nick: string; body: string; byKayo: boolean; createdAt: string };

function parisTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function duration(value: number) {
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return mins ? `${mins} min` : `${secs} s`;
}

const isAd = (slot?: Slot) => Boolean(slot?.item?.tags?.includes("pub"));

export default function Antenna() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
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
  const slot = current?.slot;
  const item = slot?.item;
  const isBumper = slot?.kind === "bumper";
  const isYouTube = item?.kind === "youtube";

  // Switch exactly when the slot ends instead of waiting for the next 10 s poll.
  useEffect(() => {
    if (!payload?.current) return;
    const leftMs = Date.parse(String(payload.current.slot.endsAt)) - Date.parse(payload.serverNow) - (performance.now() - clockRef.current.receivedAt);
    const timer = window.setTimeout(() => void refresh(), Math.max(200, leftMs + 150));
    return () => window.clearTimeout(timer);
  }, [payload, refresh]);

  useEffect(() => {
    const media = isBumper ? audioRef.current : videoRef.current;
    if (!media || !current || isYouTube) return;
    const elapsed = Math.max(0, (performance.now() - clockRef.current.receivedAt) / 1000);
    const target = Math.max(0, current.offsetS + elapsed);
    if (Math.abs(media.currentTime - target) > 2) media.currentTime = target;
    if (started) void media.play().catch(() => setError("Le navigateur a bloqué la lecture. Appuie sur Reprendre."));
  }, [current, isYouTube, isBumper, started]);

  const onLoadedMetadata = (event: React.SyntheticEvent<HTMLMediaElement>) => {
    const media = event.currentTarget;
    if (!current) return;
    const elapsed = Math.max(0, (performance.now() - clockRef.current.receivedAt) / 1000);
    media.currentTime = Math.min(media.duration || Infinity, current.offsetS + elapsed);
    if (started) void media.play().catch(() => setError("La lecture a été bloquée par le navigateur."));
  };

  const turnOn = () => {
    setStarted(true);
    setError("");
    if (isYouTube && current) {
      const anchor = { slotId: current.slot.id, offsetS: current.offsetS };
      youtubeAnchorRef.current = anchor;
      setYoutubeStart(anchor);
    }
    void (isBumper ? audioRef.current : videoRef.current)?.play().catch(() => setError("La lecture n'a pas démarré. Réessaie."));
  };

  const after = (from?: Slot) => payload?.slots?.find((candidate) => candidate.item && !isAd(candidate) && from && Date.parse(String(candidate.startsAt)) >= Date.parse(String(from.endsAt)));
  const next = after(slot);
  const announced = isBumper ? next : undefined;
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
        <p>Une programmation choisie par des humains, avec Kayo, partagée à la même minute.</p>
      </section>

      <section className="broadcast-layout" aria-label="Antenne TAS TV">
        <div className="broadcast-main">
          <div className={`player-frame ${isYouTube ? "is-youtube" : ""}`}>
            {isBumper ? (
              <div className="kayo-bumper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="kayo-figure" src="/kayo-presente.png" alt="Kayo, le présentateur IA de TAS TV" />
                <div className="kayo-copy">
                  <div className="kayo-kicker">KAYO · TAS TV</div>
                  <div className="kayo-upnext">Up next</div>
                  <div className="kayo-title">{announced?.item?.title ?? "La suite du programme"}</div>
                  <div className="kayo-creator">{announced?.item?.creator?.name ? `by ${announced.item.creator.name}` : ""}</div>
                </div>
                {slot?.bumperAudio && <audio ref={audioRef} key={slot.id} src={slot.bumperAudio} preload="auto" muted={muted} onLoadedMetadata={onLoadedMetadata} />}
              </div>
            ) : isYouTube && youtubeUrl ? (
              <iframe className="youtube-player" src={youtubeUrl} title={item?.title ?? "Programme TAS TV sur YouTube"} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : item?.src ? (
              <video ref={videoRef} key={current?.slot.id} className={`broadcast-video ${started ? "is-playing" : ""}`} src={item.src} playsInline preload="auto" muted={muted} onLoadedMetadata={onLoadedMetadata} onEnded={() => void refresh()} onError={() => setError("Ce fichier de démonstration n'a pas pu être lu.")} />
            ) : (
              <div className="player-empty"><span className="empty-signal">TAS TV</span><span>Préparation de l’antenne…</span></div>
            )}
            {!started && !isYouTube && <div className="player-pause-cover"><span className="pause-label"><span className="live-dot" /> PRÊT À REGARDER</span></div>}
            {!isYouTube && <div className="player-corner"><span className="corner-live"><span className="live-dot" /> EN DIRECT</span>{isAd(slot) && <span className="corner-ad">PUB · TAS</span>}<span className="corner-time">{current ? parisTime(current.slot.startsAt) : "--:--"}</span></div>}
          </div>
          <div className="player-controls">
            <button className="button button-primary" onClick={turnOn} disabled={!slot}>
              <span className="play-icon">{started ? "Ⅱ" : "▶"}</span>{started ? "Antenne allumée" : "Allumer TAS TV"}
            </button>
            {started && <button className="button button-quiet" onClick={() => setMuted((value) => !value)}>{muted ? "Activer le son" : "Couper le son"}</button>}
            <span className="sync-note"><span className="sync-mark">↻</span> Synchronisée par l’heure serveur</span>
          </div>
          {error && <p className="inline-error" role="status">{error}</p>}
          {item && !isAd(slot) && (
            <div className="credit-row">
              <div><div className="eyebrow">CRÉDIT CRÉATEUR</div><div className="credit-name">{item.creator?.name ?? "Tech & Art Society"}</div>{item.summary && <p className="credit-summary">{item.summary}</p>}</div>
              {item.creator?.channel_url && <a href={item.creator.channel_url} target="_blank" rel="noreferrer">Découvrir la chaîne <span aria-hidden="true">↗</span></a>}
            </div>
          )}
          <LiveChat />
        </div>

        <aside className="now-rail">
          <div className="rail-heading"><span>AU PROGRAMME</span><span className="paris-clock">{new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(new Date())} <small>PARIS</small></span></div>
          <article className="now-card">
            <div className="card-kicker"><span className="live-dot" /> {isBumper ? "KAYO PRÉSENTE" : isAd(slot) ? "PUBLICITÉ MAISON" : "À L’ANTENNE"}</div>
            <h2>{isBumper ? (announced?.item?.title ?? "La suite") : (item?.title ?? (error ? "Antenne en pause" : "Chargement du programme"))}</h2>
            <div className="card-meta">{isBumper ? "Annonce de Kayo" : (item?.creator?.name ?? "TAS TV")} <span>·</span> {isBumper ? "8 s" : item ? duration(item.duration_s) : ""}</div>
            <div className="now-progress"><span style={{ width: `${Math.max(3, Math.min(100, ((current?.offsetS ?? 0) / Math.max(1, (Date.parse(String(slot?.endsAt)) - Date.parse(String(slot?.startsAt))) / 1000 || 1)) * 100))}%` }} /></div>
            <div className="now-timing"><span>{current ? parisTime(current.slot.startsAt) : "--:--"}</span><span>{current ? parisTime(current.slot.endsAt) : "--:--"}</span></div>
          </article>
          <div className="next-card">
            <div className="eyebrow">ENSUITE</div>
            <div className="next-time">{next ? parisTime(next.startsAt) : "— —"}</div>
            <div className="next-title">{next?.item?.title ?? "La suite de la programmation"}</div>
            <div className="card-meta">{next?.item?.creator?.name ?? "Boucle de secours TAS"}</div>
          </div>
          <div className="rail-note"><span className="note-icon">✳</span><p>Pas de défilement. Pas de choix infini. Une grille choisie par des humains, présentée par Kayo.</p></div>
          <div className="rail-foot"><span className={`connection-dot ${payload ? "connected" : ""}`} /> {payload ? (payload.mode === "fallback" ? "BOUCLE DE SECOURS ACTIVE" : "GRILLE PUBLIÉE · SIGNAL STABLE") : "CONNEXION À L’ANTENNE"}</div>
        </aside>
      </section>

      <footer className="site-footer"><span>TECH & ART SOCIETY</span><span>TURN IT ON, DON’T CHOOSE.</span><Link href="/studio">Accès programmateur</Link></footer>
    </main>
  );
}

function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nick, setNick] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const lastId = useRef(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { try { setNick(localStorage.getItem("tas-tv-nick") ?? ""); } catch {} }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/chat?after=${lastId.current}`, { cache: "no-store" });
        const data = (await response.json()) as { messages?: ChatMessage[] };
        if (!alive || !data.messages?.length) return;
        lastId.current = data.messages.at(-1)!.id;
        setMessages((current) => [...current, ...data.messages!].slice(-60));
      } catch {}
    };
    void poll();
    const interval = window.setInterval(poll, 2000);
    return () => { alive = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nick, body }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) { setNotice(data.error ?? "Message non envoyé."); return; }
    try { localStorage.setItem("tas-tv-nick", nick); } catch {}
    setBody("");
  }

  return (
    <section className="chat-panel" aria-label="Chat en direct">
      <div className="chat-head"><span className="eyebrow">LE CHAT · EN DIRECT</span><span className="chat-hint">Écris <strong>@kayo</strong> pour lui poser une question sur le programme</span></div>
      <ol className="chat-list" ref={listRef}>
        {messages.length === 0 && <li className="chat-empty">Personne n’a encore parlé. Lance la conversation.</li>}
        {messages.map((message) => (
          <li key={message.id} className={message.byKayo ? "is-kayo" : ""}><span className="chat-nick">{message.nick}</span> {message.body}</li>
        ))}
      </ol>
      <form className="chat-form" onSubmit={send}>
        <input aria-label="Pseudo" placeholder="Pseudo" value={nick} maxLength={24} onChange={(event) => setNick(event.target.value)} required />
        <input aria-label="Message" placeholder="Ton message… (@kayo pour Kayo)" value={body} maxLength={300} onChange={(event) => setBody(event.target.value)} required />
        <button className="button button-primary" type="submit">Envoyer</button>
      </form>
      {notice && <p className="inline-error" role="status">{notice}</p>}
      <small className="chat-note">Chaque message passe par la modération avant d’apparaître.</small>
    </section>
  );
}
