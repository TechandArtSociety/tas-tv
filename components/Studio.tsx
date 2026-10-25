"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type StudioItem = {
  id: string;
  kind: "file" | "youtube";
  src: string;
  title: string;
  duration_s: number;
  lang: string;
  rights: "cleared" | "pending" | "refused";
  rights_note: string | null;
  creator: string;
  channel_url: string | null;
};

type GridSlot = {
  id: string;
  starts_at: string;
  kind?: "item" | "bumper";
  item_id: string | null;
  title: string;
  duration_s: number;
  rights: StudioItem["rights"];
  creator: string;
  bumper_text?: string | null;
  bumper_audio?: string | null;
  reason?: string | null;
  tags?: string[] | null;
};

type Proposal = { source: "openai" | "règles"; note: string | null; rotations: Record<string, { itemIds: string[]; reason: string }>; proposedAt: string };
type GridState = { day: string; status: "draft" | "published"; published_at?: string | null; proposal?: Proposal | null };

const DAYPART_LABELS: Record<string, string> = { nuit: "Nuit · 0 h-7 h", matin: "Matin · 7 h-12 h", "apres-midi": "Après-midi · 12 h-19 h", soiree: "Soirée · 19 h-24 h" };

const slotPayload = (slot: GridSlot) => ({
  kind: slot.kind ?? "item", itemId: slot.item_id, startsAt: slot.starts_at,
  bumperText: slot.bumper_text ?? null, bumperAudio: slot.bumper_audio ?? null, reason: slot.reason ?? null,
});

function parisDayNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function parisTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(iso));
}

function parisDateTime(day: string, time: string): string | null {
  const [year, month, date] = day.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (![year, month, date, hour, minute].every(Number.isFinite)) return null;
  const target = Date.UTC(year, month - 1, date, hour, minute);
  let guess = target;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  for (let step = 0; step < 3; step += 1) {
    const values = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]));
    const shown = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
    guess += target - shown;
  }
  const final = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]));
  if (Number(final.year) !== year || Number(final.month) !== month || Number(final.day) !== date || Number(final.hour) !== hour || Number(final.minute) !== minute) return null;
  return new Date(guess).toISOString();
}

function inputTime(iso: string) {
  return parisTime(iso);
}

function duration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes} min ${String(remainder).padStart(2, "0")} s` : `${remainder} s`;
}

async function responseData<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "La requête n’a pas abouti.");
  return data;
}

export function StudioLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await responseData(await fetch("/api/studio/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
      }));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="studio-login-card">
      <div className="studio-eyebrow">ACCÈS PROGRAMMATEUR</div>
      <h1>Le studio TAS TV.</h1>
      <p>Connecte-toi pour gérer les vidéos et le programme de l’antenne.</p>
      <form onSubmit={submit} className="studio-login-form">
        <label htmlFor="studio-password">Mot de passe</label>
        <input id="studio-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus />
        {error && <p className="studio-error" role="alert">{error}</p>}
        <button className="studio-primary" type="submit" disabled={busy}>{busy ? "Connexion…" : "Entrer dans le studio"}</button>
      </form>
      <div className="studio-login-foot">SESSION PRIVÉE · TAS TV</div>
    </section>
  );
}

export function StudioDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<StudioItem[]>([]);
  const [itemsBusy, setItemsBusy] = useState(true);
  const [gridBusy, setGridBusy] = useState(true);
  const [tab, setTab] = useState<"library" | "grid">("grid");
  const [day, setDay] = useState(parisDayNow);
  const [grid, setGrid] = useState<GridState>({ day: parisDayNow(), status: "draft" });
  const [slots, setSlots] = useState<GridSlot[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [kind, setKind] = useState<"file" | "youtube">("file");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const clearedItems = useMemo(() => items.filter((item) => item.rights === "cleared"), [items]);

  const loadItems = useCallback(async () => {
    setItemsBusy(true);
    try {
      const result = await responseData<{ items: StudioItem[] }>(await fetch("/api/studio/items", { cache: "no-store" }));
      setItems(result.items);
      setSelectedItem((current) => current || result.items.find((item) => item.rights === "cleared")?.id || "");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Bibliothèque indisponible.");
    } finally {
      setItemsBusy(false);
    }
  }, []);

  const loadGrid = useCallback(async (selectedDay: string) => {
    setGridBusy(true);
    try {
      const result = await responseData<{ grid: GridState; slots: GridSlot[] }>(await fetch(`/api/studio/grid/${selectedDay}`, { cache: "no-store" }));
      setGrid(result.grid);
      setSlots(result.slots.map((slot) => ({ ...slot, starts_at: new Date(slot.starts_at).toISOString() })));
      if (result.slots.length) setStartTime(inputTime(result.slots[result.slots.length - 1].starts_at));
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Grille indisponible.");
      setSlots([]);
      setGrid({ day: selectedDay, status: "draft" });
    } finally {
      setGridBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/studio/items", { cache: "no-store" })
      .then((response) => responseData<{ items: StudioItem[] }>(response))
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setSelectedItem((current) => current || result.items.find((item) => item.rights === "cleared")?.id || "");
      })
      .catch((cause) => { if (active) setNotice(cause instanceof Error ? cause.message : "Bibliothèque indisponible."); })
      .finally(() => { if (active) setItemsBusy(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/studio/grid/${day}`, { cache: "no-store" })
      .then((response) => responseData<{ grid: GridState; slots: GridSlot[] }>(response))
      .then((result) => {
        if (!active) return;
        setGrid(result.grid);
        setSlots(result.slots.map((slot) => ({ ...slot, starts_at: new Date(slot.starts_at).toISOString() })));
        if (result.slots.length) setStartTime(inputTime(result.slots[result.slots.length - 1].starts_at));
      })
      .catch((cause) => {
        if (!active) return;
        setNotice(cause instanceof Error ? cause.message : "Grille indisponible.");
        setSlots([]);
        setGrid({ day, status: "draft" });
      })
      .finally(() => { if (active) setGridBusy(false); });
    return () => { active = false; };
  }, [day]);

  async function signOut() {
    await fetch("/api/studio/logout", { method: "POST" });
    router.refresh();
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      if (kind === "file") {
        await responseData(await fetch("/api/studio/items/upload", { method: "POST", body: data }));
      } else {
        await responseData(await fetch("/api/studio/items", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...Object.fromEntries(data.entries()), kind: "youtube" }),
        }));
      }
      form.reset();
      setNotice("Programme ajouté à la bibliothèque.");
      await loadItems();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Ajout impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function updateRights(id: string, rights: StudioItem["rights"]) {
    setNotice("");
    try {
      await responseData(await fetch("/api/studio/items", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, rights }),
      }));
      setItems((current) => current.map((item) => item.id === id ? { ...item, rights } : item));
      setNotice("Droits mis à jour.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Mise à jour impossible.");
    }
  }

  function addSlot() {
    const item = clearedItems.find((candidate) => candidate.id === selectedItem);
    const startsAt = parisDateTime(day, startTime);
    if (!item) { setNotice("Choisis un programme dont les droits sont OK."); return; }
    if (!startsAt) { setNotice("Cette heure n’existe pas dans le fuseau Europe/Paris."); return; }
    setSlots((current) => [...current, {
      id: `new-${Date.now()}`, starts_at: startsAt, item_id: item.id, title: item.title,
      duration_s: item.duration_s, rights: item.rights, creator: item.creator,
    }].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at)));
    setGrid((current) => ({ ...current, status: "draft" }));
    const next = new Date(Date.parse(startsAt) + item.duration_s * 1000 + 60_000);
    const nextParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(next);
    setStartTime(`${nextParts.find((part) => part.type === "hour")?.value}:${nextParts.find((part) => part.type === "minute")?.value}`);
  }

  function changeSlotTime(id: string, value: string) {
    const slot = slots.find((candidate) => candidate.id === id);
    if (!slot) return;
    const startsAt = parisDateTime(day, value);
    if (!startsAt) { setNotice("Cette heure n’existe pas dans le fuseau Europe/Paris."); return; }
    setSlots((current) => current.map((candidate) => candidate.id === id ? { ...candidate, starts_at: startsAt } : candidate).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at)));
    setGrid((current) => ({ ...current, status: "draft" }));
  }

  async function saveGrid() {
    setBusy(true);
    setNotice("");
    try {
      const result = await responseData<{ saved: number }>(await fetch(`/api/studio/grid/${day}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: slots.map(slotPayload) }),
      }));
      await loadGrid(day);
      setGrid({ day, status: "draft" });
      setNotice(`Brouillon enregistré · ${result.saved} programme${result.saved > 1 ? "s" : ""}.`);
      return true;
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Enregistrement impossible.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function proposeDay() {
    setBusy(true);
    setNotice("Kayo prépare la journée…");
    try {
      const result = await responseData<{ source: string; note: string | null; slots: number }>(await fetch(`/api/studio/grid/${day}/propose`, { method: "POST" }));
      await loadGrid(day);
      setNotice(`Proposition de Kayo (${result.source === "openai" ? "API OpenAI" : "règles"}) : ${result.slots} créneaux, annonces et pubs comprises. Relis-la, puis publie.${result.note ? ` ${result.note}` : ""}`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Proposition impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function publishGrid() {
    if (slots.length === 0) { setNotice("Ajoute au moins un programme avant de publier."); return; }
    setBusy(true);
    setNotice("");
    try {
      await responseData(await fetch(`/api/studio/grid/${day}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: slots.map(slotPayload) }),
      }));
      const result = await responseData<{ grid: GridState }>(await fetch(`/api/studio/grid/${day}/publish`, { method: "POST" }));
      setGrid(result.grid);
      await loadGrid(day);
      setNotice("Grille publiée. L’antenne la prend en compte à l’heure du créneau.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Publication impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="studio-heading">
        <div><div className="studio-eyebrow">TAS TV · RÉGIE</div><h1>Le studio.</h1><p>Une grille humaine, des créateurs crédités, la même heure pour tout le monde.</p></div>
        <button className="studio-secondary studio-logout" onClick={signOut}>Fermer la session</button>
      </section>

      <nav className="studio-tabs" aria-label="Sections du studio">
        <button className={tab === "grid" ? "is-selected" : ""} onClick={() => setTab("grid")}>Grille <span>{slots.filter((slot) => slot.kind !== "bumper").length}</span></button>
        <button className={tab === "library" ? "is-selected" : ""} onClick={() => setTab("library")}>Bibliothèque <span>{items.length}</span></button>
      </nav>

      {notice && <p className="studio-notice" role="status">{notice}</p>}

      {tab === "grid" ? (
        <section className="studio-grid-layout">
          <div className="studio-panel studio-grid-panel">
            <div className="studio-panel-head">
              <div><div className="studio-eyebrow">PROGRAMMATION QUOTIDIENNE</div><h2>La grille</h2></div>
              <span className={`studio-status ${grid.status}`}>{grid.status === "published" ? "PUBLIÉE" : "BROUILLON"}</span>
            </div>
            <div className="studio-day-row"><label htmlFor="grid-day">Jour de Paris</label><input id="grid-day" type="date" value={day} onChange={(event) => { setGridBusy(true); setDay(event.target.value); }} /></div>
            <div className="studio-kayo-row">
              <p><strong>Kayo, propose la journée.</strong> Il ordonne les programmes par tranche horaire, glisse ses annonces et les pubs maison. Rien ne passe à l’antenne sans ta publication.</p>
              <button className="studio-primary" onClick={() => void proposeDay()} disabled={busy || gridBusy}>Kayo, propose la journée</button>
            </div>
            {grid.proposal && (
              <ul className="studio-reasons" aria-label="Raisons de Kayo">
                {Object.entries(grid.proposal.rotations).map(([part, rotation]) => <li key={part}><b>{DAYPART_LABELS[part] ?? part}</b> — {rotation.reason}</li>)}
                <li><b>Source</b> — {grid.proposal.source === "openai" ? "API OpenAI (Responses, Structured Outputs)" : "règles locales (pas de clé OpenAI)"}</li>
              </ul>
            )}
            {gridBusy ? <div className="studio-empty">Chargement de la grille…</div> : slots.length === 0 ? (
              <div className="studio-empty"><span>∅</span><strong>La journée est encore libre.</strong><small>Ajoute des programmes pour préparer l’antenne.</small></div>
            ) : (
              <ol className="studio-slot-list">
                {slots.map((slot) => (
                  <li key={slot.id} className={`studio-slot ${slot.kind === "bumper" ? "is-bumper" : ""}`}>
                    <input aria-label={`Heure de ${slot.title}`} type="time" value={inputTime(slot.starts_at)} onChange={(event) => changeSlotTime(slot.id, event.target.value)} />
                    <div className="studio-slot-copy"><strong>{slot.title}</strong><span>{slot.creator} · {duration(slot.duration_s)}</span></div>
                    <span className="studio-rights-tag cleared">{slot.kind === "bumper" ? "KAYO" : slot.tags?.includes("pub") ? "PUB" : "DROITS OK"}</span>
                    <button className="studio-remove" aria-label={`Retirer ${slot.title}`} onClick={() => { setSlots((current) => current.filter((candidate) => candidate.id !== slot.id)); setGrid((current) => ({ ...current, status: "draft" })); }}>×</button>
                  </li>
                ))}
              </ol>
            )}
            <div className="studio-add-slot">
              <label htmlFor="grid-item">Programme disponible</label>
              <div className="studio-add-row">
                <select id="grid-item" value={selectedItem} onChange={(event) => setSelectedItem(event.target.value)}>
                  <option value="">Choisir dans la bibliothèque…</option>
                  {clearedItems.map((item) => <option key={item.id} value={item.id}>{item.title} · {duration(item.duration_s)}</option>)}
                </select>
                <input aria-label="Heure de début, heure de Paris" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                <button className="studio-secondary" onClick={addSlot} disabled={clearedItems.length === 0}>Ajouter</button>
              </div>
              {clearedItems.length === 0 && <small>Il n’y a pas encore de vidéo avec droits OK.</small>}
            </div>
            <div className="studio-grid-actions">
              <span>Fuseau : Europe/Paris · chevauchements contrôlés à l’enregistrement</span>
              <div><button className="studio-secondary" onClick={() => void saveGrid()} disabled={busy || gridBusy}>Enregistrer le brouillon</button><button className="studio-primary" onClick={() => void publishGrid()} disabled={busy || gridBusy || slots.length === 0}>Publier la grille</button></div>
            </div>
          </div>
          <aside className="studio-panel studio-hint-panel"><div className="studio-eyebrow">À GARDER EN TÊTE</div><h3>Les droits d’abord.</h3><p>Seuls les programmes marqués « droits OK » peuvent entrer dans une grille publiée.</p><p>Les changements de grille prennent effet aux heures prévues. La boucle de secours assure l’antenne entre les créneaux.</p><button className="studio-text-link" onClick={() => setTab("library")}>Gérer la bibliothèque ↗</button></aside>
        </section>
      ) : (
        <section className="studio-library-layout">
          <div className="studio-panel">
            <div className="studio-panel-head"><div><div className="studio-eyebrow">VIDÉOS ET CRÉATEURS</div><h2>La bibliothèque</h2></div><span className="studio-count">{items.length} programmes</span></div>
            {itemsBusy ? <div className="studio-empty">Chargement de la bibliothèque…</div> : items.length === 0 ? <div className="studio-empty">Aucun programme. Ajoute une vidéo ou un lien YouTube.</div> : (
              <div className="studio-library-list">
                {items.map((item) => (
                  <article className="studio-library-item" key={item.id}>
                    <div className="studio-item-type">{item.kind === "file" ? "MP4" : "YT"}</div>
                    <div className="studio-item-copy"><strong>{item.title}</strong><span>{item.creator} · {item.lang.toUpperCase()} · {duration(item.duration_s)}</span>{item.rights_note && <small>{item.rights_note}</small>}</div>
                    <select aria-label={`Droits de ${item.title}`} value={item.rights} onChange={(event) => void updateRights(item.id, event.target.value as StudioItem["rights"])}>
                      <option value="cleared">Droits OK</option><option value="pending">À vérifier</option><option value="refused">Refusés</option>
                    </select>
                  </article>
                ))}
              </div>
            )}
          </div>
          <div className="studio-panel studio-add-panel">
            <div className="studio-eyebrow">ENRICHIR LE CATALOGUE</div><h2>Ajouter un programme</h2>
            <div className="studio-kind-toggle"><button className={kind === "file" ? "is-selected" : ""} onClick={() => setKind("file")} type="button">Fichier MP4</button><button className={kind === "youtube" ? "is-selected" : ""} onClick={() => setKind("youtube")} type="button">Lien YouTube</button></div>
            <form className="studio-add-form" onSubmit={addItem}>
              {kind === "file" ? <label>Fichier MP4<input name="file" type="file" accept="video/mp4,.mp4" required /></label> : <label>URL YouTube<input name="src" type="url" placeholder="https://youtu.be/…" required /></label>}
              <label>Titre<input name="title" placeholder="Nom du programme" required /></label>
              <label>Créateur<input name="creator" placeholder="Nom ou collectif" required /></label>
              <div className="studio-form-split"><label>Langue<input name="lang" placeholder="fr" defaultValue="fr" required maxLength={12} /></label><label>Durée (secondes)<input name="duration_s" type="number" min="1" max="86400" defaultValue="90" required /></label></div>
              <label>Droits<select name="rights" defaultValue="pending"><option value="pending">À vérifier</option><option value="cleared">Droits OK</option></select></label>
              <label>Note de droits<input name="rights_note" placeholder="Accord, source ou note de vérification" /></label>
              {kind === "file" && <small>Fichier copié dans `media/uploads/` · 500 Mo maximum.</small>}
              <button className="studio-primary" type="submit" disabled={busy}>{busy ? "Ajout…" : "Ajouter à la bibliothèque"}</button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
