"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { FeedSource, FeedFilterConfig } from "@/lib/feed-store";
import { FORMAT_LABELS, FORMAT_FILTER_CAPABILITIES } from "@/lib/importers/registry";

// ============================================
// HELPERS
// ============================================

function statusBadge(feed: FeedSource) {
    if (!feed.last_status) return <span className="text-xs text-gray-400">Nikdy</span>;
    const colors: Record<string, string> = {
        ok: "bg-emerald-100 text-emerald-700",
        error: "bg-red-100 text-red-700",
        running: "bg-amber-100 text-amber-700",
    };
    const labels: Record<string, string> = { ok: "OK", error: "Chyba", running: "Beží…" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[feed.last_status] || "bg-gray-100 text-gray-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${feed.last_status === "ok" ? "bg-emerald-500" : feed.last_status === "running" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} />
            {labels[feed.last_status] || feed.last_status}
        </span>
    );
}

function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString("sk-SK", { dateStyle: "short", timeStyle: "short" });
}

// ============================================
// ADD / EDIT FEED MODAL
// ============================================

const EMPTY_FILTER: FeedFilterConfig = {
    estate_types: [],
    price_min: null,
    price_max: null,
    regions: [],
    offer_types: ["For Sale"],
};

function FeedModal({
    feed,
    onClose,
    onSaved,
}: {
    feed: FeedSource | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const isEdit = !!feed;
    const [name, setName] = useState(feed?.name || "");
    const [url, setUrl] = useState(feed?.url || "https://api.grekodom.com/userfiles/realtyxml/grekodom.xml");
    const [format, setFormat] = useState(feed?.format || "grekodom_xml");
    const [enabled, setEnabled] = useState(feed?.enabled ?? true);
    const [scheduleCron, setScheduleCron] = useState(feed?.schedule_cron || "");
    const [filter, setFilter] = useState<FeedFilterConfig>(feed?.filter_config || EMPTY_FILTER);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const toggleEstateType = (et: string) => {
        const cur = filter.estate_types || [];
        setFilter(f => ({
            ...f,
            estate_types: cur.includes(et) ? cur.filter(x => x !== et) : [...cur, et],
        }));
    };

    const save = async () => {
        if (!name.trim() || !url.trim()) { setError("Meno a URL sú povinné."); return; }
        setSaving(true);
        setError("");
        try {
            const body = { name, url, format, enabled, schedule_cron: scheduleCron || null, filter_config: filter };
            const res = await fetch(
                isEdit ? `/api/admin/feeds/${feed!.id}` : "/api/admin/feeds",
                {
                    method: isEdit ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }
            );
            if (!res.ok) { const j = await res.json(); setError(j.error || "Chyba"); return; }
            onSaved();
            onClose();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Upraviť feed" : "Pridať feed"}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>
                <div className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Názov</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="napr. Grekodom" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                    </div>
                    {/* URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL feedu</label>
                        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                    </div>
                    {/* Format */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Formát</label>
                        <select
                            value={format}
                            onChange={e => {
                                setFormat(e.target.value);
                                // Reset filter config when format changes — old config may not apply
                                setFilter(EMPTY_FILTER);
                            }}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        >
                            {Object.entries(FORMAT_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                    {/* Cron */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Plán (cron, voliteľné)</label>
                        <input value={scheduleCron} onChange={e => setScheduleCron(e.target.value)} placeholder="napr. 0 3 * * * (každý deň o 3:00)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                        <p className="text-xs text-gray-400 mt-1">Nechajte prázdne pre manuálnu synchronizáciu.</p>
                    </div>
                    {/* Enabled */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? "bg-[var(--color-primary)]" : "bg-gray-200"}`} onClick={() => setEnabled(e => !e)}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-4" : ""}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Aktívny</span>
                    </label>

                    {/* ---- Filters — driven by FORMAT_FILTER_CAPABILITIES ---- */}
                    {(() => {
                        const caps = FORMAT_FILTER_CAPABILITIES[format];
                        if (!caps) return null;
                        return (
                            <div className="border-t border-gray-100 pt-5">
                                <h3 className="text-sm font-semibold text-gray-800 mb-1">Filtre importu</h3>
                                <p className="text-xs text-gray-400 mb-3">Prázdne pole = importovať všetko.</p>

                                {/* Estate types — only if this format has them */}
                                {caps.estateTypes && caps.estateTypes.length > 0 && (
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                            Typy nehnuteľností
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {caps.estateTypes.map(et => {
                                                const sel = (filter.estate_types || []).includes(et);
                                                return (
                                                    <button key={et} type="button" onClick={() => toggleEstateType(et)}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${sel ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-gray-600 border-gray-200 hover:border-[var(--color-primary)]"}`}>
                                                        {et}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Price range — only if this format has prices */}
                                {caps.priceRange && (
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cena od (€)</label>
                                            <input type="number" value={filter.price_min || ""} onChange={e => setFilter(f => ({ ...f, price_min: e.target.value ? Number(e.target.value) : null }))} placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cena do (€)</label>
                                            <input type="number" value={filter.price_max || ""} onChange={e => setFilter(f => ({ ...f, price_max: e.target.value ? Number(e.target.value) : null }))} placeholder="bez limitu" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {error && <p className="text-red-600 text-sm">{error}</p>}
                </div>
                <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 border border-gray-200">Zrušiť</button>
                    <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50">
                        {saving ? "Ukladám…" : isEdit ? "Uložiť" : "Pridať feed"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// SYNC PROGRESS PANEL
// ============================================

interface SyncStats {
    total: number; filtered: number; added: number;
    updated: number; skipped: number; errors: number;
}

function SyncPanel({ feedId, feedName, onClose }: { feedId: string; feedName: string; onClose: () => void }) {
    const [lines, setLines] = useState<string[]>(["Spúšťam synchronizáciu…"]);
    const [stats, setStats] = useState<SyncStats | null>(null);
    const [done, setDone] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/admin/feeds/${feedId}/sync`, { method: "POST" });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    setErrMsg(j.error || `HTTP ${res.status}`);
                    setDone(true);
                    return;
                }
                const reader = res.body!.getReader();
                const dec = new TextDecoder();
                let buf = "";
                while (!cancelled) {
                    const { done: d, value } = await reader.read();
                    if (d) break;
                    buf += dec.decode(value, { stream: true });
                    const parts = buf.split("\n");
                    buf = parts.pop()!;
                    for (const part of parts) {
                        if (!part.trim()) continue;
                        try {
                            const msg = JSON.parse(part);
                            if (msg.type === "progress") {
                                setStats(msg.stats);
                                setLines(prev => [...prev, `+${msg.stats.added} upd:${msg.stats.updated} skip:${msg.stats.skipped} err:${msg.stats.errors}`]);
                            } else if (msg.type === "done") {
                                setStats(msg.stats);
                                setDone(true);
                            } else if (msg.type === "error") {
                                setErrMsg(msg.message);
                                setDone(true);
                            }
                        } catch { /* ignore parse errors */ }
                    }
                }
            } catch (e) {
                if (!cancelled) { setErrMsg((e as Error).message); setDone(true); }
            }
        })();
        return () => { cancelled = true; };
    }, [feedId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={done ? onClose : undefined}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Synchronizácia: {feedName}</h2>
                </div>
                <div className="p-6 space-y-4">
                    {/* Stats grid */}
                    {stats && (
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                ["Nové", stats.added, "text-emerald-600"],
                                ["Aktualizované", stats.updated, "text-blue-600"],
                                ["Preskočené", stats.skipped, "text-gray-500"],
                                ["Chyby", stats.errors, "text-red-500"],
                                ["Spolu v feede", stats.total, "text-gray-700"],
                                ["Po filtri", stats.filtered, "text-amber-600"],
                            ] as [string, number, string][]).map(([label, val, cls]) => (
                                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                                    <div className={`text-2xl font-bold ${cls}`}>{val ?? "—"}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Log */}
                    <div className="bg-gray-900 rounded-xl p-4 h-40 overflow-y-auto font-mono text-xs text-gray-300 space-y-0.5">
                        {lines.map((l, i) => <div key={i}>{l}</div>)}
                        {!done && <div className="text-amber-400 animate-pulse">● beží…</div>}
                    </div>
                    {errMsg && <p className="text-red-600 text-sm font-medium">Chyba: {errMsg}</p>}
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} disabled={!done} className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white disabled:opacity-40">
                        {done ? "Zavrieť" : "Prebieha…"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// DELETE CONFIRMATION MODAL
// ============================================

function DeleteFeedModal({
    feed,
    onClose,
    onDeleted,
}: {
    feed: FeedSource;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const [propertiesMode, setPropertiesMode] = useState<"keep" | "trash" | "permanent">("keep");
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    const confirm = async () => {
        setDeleting(true);
        setError("");
        try {
            const qs = propertiesMode !== "keep" ? `?deleteProperties=${propertiesMode}` : "";
            const res = await fetch(`/api/admin/feeds/${feed.id}${qs}`, { method: "DELETE" });
            if (!res.ok) {
                const j = await res.json();
                setError(j.error || "Chyba pri mazaní");
                return;
            }
            onDeleted();
            onClose();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setDeleting(false);
        }
    };

    const options: { value: "keep" | "trash" | "permanent"; label: string; description: string; color: string }[] = [
        {
            value: "keep",
            label: "Ponechať nehnuteľnosti",
            description: "Importované nehnuteľnosti zostanú v databáze, len stratia väzbu na feed. Môžete ich ďalej spravovať ručne.",
            color: "border-gray-200",
        },
        {
            value: "trash",
            label: "Presunúť do koša",
            description: "Všetky importované nehnuteľnosti z tohto feedu sa presunú do koša. Obnoviť ich môžete do 30 dní.",
            color: "border-amber-300",
        },
        {
            value: "permanent",
            label: "Natrvalo vymazať",
            description: "Všetky importované nehnuteľnosti z tohto feedu sa natrvalo a nezvratne vymažú z databázy.",
            color: "border-red-400",
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Vymazať feed</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            <span className="font-medium text-gray-700">{feed.name}</span>
                            {feed.last_stats?.added ? ` · ${feed.last_stats.added} nehnuteľností importovaných` : ""}
                        </p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>

                {/* Options */}
                <div className="p-6 space-y-3">
                    <p className="text-sm text-gray-600 mb-4">Čo sa má stať s nehnuteľnosťami importovanými z tohto feedu?</p>
                    {options.map(opt => (
                        <label
                            key={opt.value}
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                propertiesMode === opt.value
                                    ? `${opt.color} bg-gray-50`
                                    : "border-gray-100 hover:border-gray-200"
                            }`}
                        >
                            <input
                                type="radio"
                                name="propertiesMode"
                                value={opt.value}
                                checked={propertiesMode === opt.value}
                                onChange={() => setPropertiesMode(opt.value)}
                                className="mt-0.5 accent-[var(--color-primary)]"
                            />
                            <div>
                                <p className={`text-sm font-semibold ${opt.value === "permanent" ? "text-red-600" : "text-gray-800"}`}>
                                    {opt.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                            </div>
                        </label>
                    ))}

                    {propertiesMode === "permanent" && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <p className="text-xs text-red-700 font-medium">Táto akcia je nezvratná. Nehnuteľnosti sa nedajú obnoviť.</p>
                        </div>
                    )}

                    {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 border border-gray-200">
                        Zrušiť
                    </button>
                    <button
                        onClick={confirm}
                        disabled={deleting}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity ${
                            propertiesMode === "permanent" ? "bg-red-600 hover:bg-red-700" : "bg-[var(--color-primary)] hover:opacity-90"
                        }`}
                    >
                        {deleting ? "Mažem…" : propertiesMode === "permanent" ? "Natrvalo vymazať" : "Vymazať feed"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function FeedsPage() {
    const [feeds, setFeeds] = useState<FeedSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalFeed, setModalFeed] = useState<FeedSource | null | "new">(null);
    const [syncFeed, setSyncFeed] = useState<FeedSource | null>(null);
    const [deleteFeed, setDeleteFeed] = useState<FeedSource | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/feeds");
            const j = await res.json();
            setFeeds(j.feeds || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="text-[var(--color-muted)] hover:text-[var(--color-secondary)] text-sm">
                        ← Admin
                    </Link>
                    <h1 className="text-2xl font-serif font-bold text-[var(--color-secondary)]">Importované feedy</h1>
                    <div className="ml-auto">
                        <button
                            onClick={() => setModalFeed("new")}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            <span className="text-lg leading-none">+</span> Pridať feed
                        </button>
                    </div>
                </div>

                {/* Info banner */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
                    <strong>Ako to funguje:</strong> Pridajte URL XML feedu, nastavte filtre a kliknite „Sync". Nové nehnuteľnosti sa importujú ako koncepty — skontrolujte ich v správcovi nehnuteľností a ručne publikujte. Ručne upravené záznamy sa pri ďalšom sync neprepíšu.
                </div>

                {/* Feeds list */}
                {loading ? (
                    <div className="text-center py-20 text-[var(--color-muted)]">Načítavam…</div>
                ) : feeds.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">📡</div>
                        <p className="text-[var(--color-muted)] mb-6">Žiadne feedy. Pridajte prvý.</p>
                        <button onClick={() => setModalFeed("new")} className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90">
                            Pridať feed
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feeds.map(feed => (
                            <div key={feed.id} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="text-3xl select-none">📡</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                                            <h3 className="font-semibold text-[var(--color-secondary)]">{feed.name}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">{FORMAT_LABELS[feed.format] || feed.format}</span>
                                            {!feed.enabled && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Vypnutý</span>}
                                            {statusBadge(feed)}
                                        </div>
                                        <p className="text-xs text-[var(--color-muted)] font-mono truncate mb-2">{feed.url}</p>
                                        <div className="flex flex-wrap gap-4 text-xs text-[var(--color-muted)]">
                                            <span>Posledný sync: {fmtDate(feed.last_synced_at)}</span>
                                            {feed.last_stats && (
                                                <span>+{feed.last_stats.added} nových · {feed.last_stats.updated} aktualizovaných · {feed.last_stats.skipped} preskočených</span>
                                            )}
                                            {feed.schedule_cron && <span>🕐 {feed.schedule_cron}</span>}
                                        </div>
                                        {feed.last_error && (
                                            <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5 font-mono truncate">{feed.last_error}</p>
                                        )}
                                        {/* Filter summary */}
                                        {(feed.filter_config.estate_types?.length || feed.filter_config.price_min || feed.filter_config.price_max) ? (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {feed.filter_config.estate_types?.map(et => (
                                                    <span key={et} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">{et}</span>
                                                ))}
                                                {feed.filter_config.price_min && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">od €{feed.filter_config.price_min.toLocaleString()}</span>}
                                                {feed.filter_config.price_max && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">do €{feed.filter_config.price_max.toLocaleString()}</span>}
                                            </div>
                                        ) : null}
                                    </div>
                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                                        <button
                                            onClick={() => setSyncFeed(feed)}
                                            disabled={!feed.enabled || feed.last_status === "running"}
                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                                        >
                                            {feed.last_status === "running" ? "⟳ Beží…" : "⟳ Sync"}
                                        </button>
                                        <button onClick={() => setModalFeed(feed)} className="px-3.5 py-2 rounded-xl text-sm font-semibold border border-[var(--color-border)] text-[var(--color-secondary)] hover:bg-gray-50">
                                            Upraviť
                                        </button>
                                        <button onClick={() => setDeleteFeed(feed)} className="px-3.5 py-2 rounded-xl text-sm border border-red-200 text-red-500 hover:bg-red-50">
                                            Zmazať
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Link to imported properties */}
                {feeds.length > 0 && (
                    <div className="mt-6 text-center">
                        <Link href="/admin/properties?source=imported" className="text-sm text-[var(--color-primary)] hover:underline">
                            → Zobraziť importované nehnuteľnosti v správcovi →
                        </Link>
                    </div>
                )}
            </div>

            {/* Modals */}
            {modalFeed !== null && (
                <FeedModal
                    feed={modalFeed === "new" ? null : modalFeed}
                    onClose={() => setModalFeed(null)}
                    onSaved={load}
                />
            )}
            {syncFeed && (
                <SyncPanel
                    feedId={syncFeed.id}
                    feedName={syncFeed.name}
                    onClose={() => { setSyncFeed(null); load(); }}
                />
            )}
            {deleteFeed && (
                <DeleteFeedModal
                    feed={deleteFeed}
                    onClose={() => setDeleteFeed(null)}
                    onDeleted={load}
                />
            )}
        </div>
    );
}
