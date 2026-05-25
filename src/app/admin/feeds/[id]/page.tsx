"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { FeedItem } from "@/lib/feed-items-store";
import type { FeedSource } from "@/lib/feed-store";

// ============================================
// TYPES + HELPERS
// ============================================

interface Facet { value: string; count: number; }
interface ListResponse {
    items: FeedItem[];
    total: number;
    page: number;
    pageSize: number;
    feed: FeedSource;
    facets: {
        estateTypes: Facet[];
        regions: Facet[];
        towns: Facet[];
        totalAll: number;
        totalSelected: number;
        totalUnselected: number;
    };
}

function formatPrice(p: number | null, currency: string | null) {
    if (!p || p === 0) return "—";
    return `${Math.round(p).toLocaleString("sk-SK")} ${currency || "€"}`;
}

// ============================================
// ITEM DETAIL DRAWER
// ============================================

function ItemDetail({ feedId, itemId, onClose, onChanged }: {
    feedId: string;
    itemId: string;
    onClose: () => void;
    onChanged: () => void;
}) {
    const [item, setItem] = useState<FeedItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/admin/feeds/${feedId}/items/${itemId}`)
            .then(r => r.json())
            .then(j => { setItem(j.item || null); setLoading(false); });
    }, [feedId, itemId]);

    const raw = item?.raw_data as Record<string, unknown> | undefined;
    const rawStr = (k: string): string => {
        const v = raw?.[k];
        return typeof v === "string" ? v : v != null ? String(v) : "";
    };
    const images = (raw?.images as string[] | undefined) || [];

    const handleSelect = async () => {
        if (!item) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/admin/feeds/${feedId}/items/select`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item_ids: [item.id] }),
            });
            // Drain stream
            const reader = res.body?.getReader();
            if (reader) { while (true) { const { done } = await reader.read(); if (done) break; } }
            onChanged();
            onClose();
        } finally {
            setBusy(false);
        }
    };

    const handleDeselect = async () => {
        if (!item) return;
        if (!confirm("Odstrániť túto ponuku z webu? Nehnuteľnosť sa presunie do koša.")) return;
        setBusy(true);
        try {
            await fetch(`/api/admin/feeds/${feedId}/items/deselect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item_ids: [item.id], mode: "trash" }),
            });
            onChanged();
            onClose();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
                {loading || !item ? (
                    <div className="p-10 text-center text-gray-400">Načítavam…</div>
                ) : (
                    <>
                        <div className="sticky top-0 z-10 bg-white p-6 border-b border-gray-100 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">#{item.external_uid}</span>
                                    {item.selected && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Na webe</span>
                                    )}
                                    {item.removed_from_feed && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Už nie je vo feede</span>
                                    )}
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">{item.title || "Bez názvu"}</h2>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                        </div>

                        {/* Gallery */}
                        {images.length > 0 && (
                            <div className="bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={images[activeImg]}
                                    alt={item.title || ""}
                                    className="w-full h-72 object-cover"
                                />
                                {images.length > 1 && (
                                    <div className="p-3 flex gap-1.5 overflow-x-auto">
                                        {images.map((url, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImg(idx)}
                                                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${idx === activeImg ? "border-[var(--color-primary)]" : "border-transparent"}`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-6 space-y-5">
                            {/* Quick stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <Stat label="Cena" value={formatPrice(item.price, item.currency)} />
                                <Stat label="Typ" value={item.estate_type || "—"} />
                                <Stat label="Lokalita" value={[item.town, item.region].filter(Boolean).join(", ") || "—"} />
                                <Stat label="Plocha" value={item.area ? `${item.area} m²` : "—"} />
                                <Stat label="Izby (spálne)" value={String(item.beds ?? "—")} />
                                <Stat label="Kúpeľne" value={String(item.baths ?? "—")} />
                                <Stat label="Pozemok" value={item.land_area ? `${item.land_area} m²` : "—"} />
                                <Stat label="Ponuka" value={item.offer_type || "—"} />
                            </div>

                            {/* Description */}
                            {rawStr("DescriptionEn") && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Popis (EN)</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{rawStr("DescriptionEn")}</p>
                                </div>
                            )}

                            {/* Raw fields (compact) */}
                            <details className="border border-gray-100 rounded-xl">
                                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">Všetky polia z feedu</summary>
                                <div className="px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                                    {raw && Object.entries(raw)
                                        .filter(([, v]) => typeof v === "string" && v !== "" && v !== "no")
                                        .map(([k, v]) => (
                                            <div key={k} className="truncate">
                                                <span className="text-gray-400">{k}:</span> <span className="text-gray-700">{String(v)}</span>
                                            </div>
                                        ))}
                                </div>
                            </details>
                        </div>

                        <div className="sticky bottom-0 bg-white p-6 border-t border-gray-100 flex gap-3 justify-end">
                            {item.selected ? (
                                <>
                                    {item.selected_property_id && (
                                        <Link
                                            href={`/admin/properties?source=imported`}
                                            className="px-4 py-2 rounded-xl text-sm border border-[var(--color-border)] text-[var(--color-secondary)] hover:bg-gray-50"
                                        >
                                            Otvoriť v správcovi
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleDeselect}
                                        disabled={busy}
                                        className="px-5 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {busy ? "Pracujem…" : "Odstrániť z webu"}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleSelect}
                                    disabled={busy}
                                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50"
                                >
                                    {busy ? "Pridávam…" : "+ Pridať na web"}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
            <div className="text-sm font-semibold text-gray-800 truncate">{value}</div>
        </div>
    );
}

// ============================================
// BULK PROGRESS MODAL
// ============================================

function BulkProgressModal({ feedId, itemIds, onClose, onDone }: {
    feedId: string;
    itemIds: string[];
    onClose: () => void;
    onDone: () => void;
}) {
    const [done, setDone] = useState(false);
    const [stats, setStats] = useState<{ total: number; added: number; updated: number; skipped: number; errors: number } | null>(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await fetch(`/api/admin/feeds/${feedId}/items/select`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item_ids: itemIds }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                setErr(j.error || `HTTP ${res.status}`);
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
                        if (msg.type === "progress" || msg.type === "done") setStats(msg.stats);
                        if (msg.type === "done") setDone(true);
                        if (msg.type === "error") { setErr(msg.message); setDone(true); }
                    } catch { /* */ }
                }
            }
            if (!cancelled) { setDone(true); onDone(); }
        })();
        return () => { cancelled = true; };
    }, [feedId, itemIds, onDone]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={done ? onClose : undefined}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Pridávam {itemIds.length} ponúk na web</h2>
                    <p className="text-xs text-gray-500 mt-1">Prebieha preklad cez DeepL a zápis do databázy.</p>
                </div>
                <div className="p-6 space-y-3">
                    {stats && (
                        <div className="grid grid-cols-4 gap-2">
                            <StatBig label="Nové" v={stats.added} cls="text-emerald-600" />
                            <StatBig label="Updated" v={stats.updated} cls="text-blue-600" />
                            <StatBig label="Preskoč." v={stats.skipped} cls="text-gray-500" />
                            <StatBig label="Chyby" v={stats.errors} cls="text-red-500" />
                        </div>
                    )}
                    {err && <p className="text-red-600 text-sm">{err}</p>}
                    {!done && <p className="text-xs text-amber-600 animate-pulse">● Beží…</p>}
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} disabled={!done} className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white disabled:opacity-40">
                        {done ? "Hotovo" : "…"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatBig({ label, v, cls }: { label: string; v: number; cls: string }) {
    return (
        <div className="bg-gray-50 rounded-xl py-2 text-center">
            <div className={`text-xl font-bold ${cls}`}>{v}</div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function FeedBrowsePage() {
    const params = useParams<{ id: string }>();
    const feedId = params.id;

    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [estateTypes, setEstateTypes] = useState<string[]>([]);
    const [regions, setRegions] = useState<string[]>([]);
    const [priceMin, setPriceMin] = useState<string>("");
    const [priceMax, setPriceMax] = useState<string>("");
    const [tab, setTab] = useState<"all" | "selected" | "unselected">("unselected");
    const [sort, setSort] = useState<"recent" | "price_asc" | "price_desc" | "uid">("recent");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [detailItem, setDetailItem] = useState<string | null>(null);
    const [bulkRun, setBulkRun] = useState<string[] | null>(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 250);
        return () => clearTimeout(t);
    }, [search]);

    const queryString = useMemo(() => {
        const sp = new URLSearchParams();
        sp.set("page", String(page));
        sp.set("page_size", String(pageSize));
        if (debouncedSearch.trim()) sp.set("q", debouncedSearch.trim());
        if (estateTypes.length) sp.set("estate_types", estateTypes.join(","));
        if (regions.length) sp.set("regions", regions.join(","));
        if (priceMin) sp.set("price_min", priceMin);
        if (priceMax) sp.set("price_max", priceMax);
        sp.set("sort", sort);
        if (tab === "selected") sp.set("selected", "true");
        if (tab === "unselected") sp.set("selected", "false");
        return sp.toString();
    }, [page, pageSize, debouncedSearch, estateTypes, regions, priceMin, priceMax, sort, tab]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/feeds/${feedId}/items?${queryString}`);
            if (res.ok) {
                const j: ListResponse = await res.json();
                setData(j);
            }
        } finally {
            setLoading(false);
        }
    }, [feedId, queryString]);

    useEffect(() => { load(); }, [load]);

    // Reset page on filter changes
    useEffect(() => { setPage(1); }, [debouncedSearch, estateTypes, regions, priceMin, priceMax, tab, sort]);

    // Clear selection when results change
    useEffect(() => { setSelectedIds(new Set()); }, [queryString]);

    const toggle = (set: string[], v: string, on: boolean) => on ? [...set, v] : set.filter(x => x !== v);
    const toggleAllVisible = () => {
        if (!data) return;
        if (selectedIds.size === data.items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data.items.map(i => i.id)));
        }
    };

    const facets = data?.facets;
    const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

    const selectedUnpublishedIds = useMemo(() => {
        if (!data) return [] as string[];
        const setSel = new Set(data.items.filter(i => i.selected).map(i => i.id));
        return Array.from(selectedIds).filter(id => !setSel.has(id));
    }, [selectedIds, data]);

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-4 mb-2 text-sm">
                    <Link href="/admin/feeds" className="text-[var(--color-muted)] hover:text-[var(--color-secondary)]">
                        ← Feedy
                    </Link>
                </div>

                {/* Header */}
                <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-[var(--color-secondary)]">
                            {data?.feed?.name || "Feed"}
                        </h1>
                        <p className="text-sm text-[var(--color-muted)] mt-1 font-mono truncate max-w-2xl">
                            {data?.feed?.url}
                        </p>
                    </div>
                    {facets && (
                        <div className="flex gap-3 text-sm">
                            <Pill label="Spolu" value={facets.totalAll} />
                            <Pill label="Na webe" value={facets.totalSelected} color="emerald" />
                            <Pill label="Čaká" value={facets.totalUnselected} color="amber" />
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-xl border border-[var(--color-border)] p-1 w-fit mb-4">
                    {([
                        ["unselected", "Čaká na výber", facets?.totalUnselected],
                        ["selected", "Na webe", facets?.totalSelected],
                        ["all", "Všetky", facets?.totalAll],
                    ] as [typeof tab, string, number | undefined][]).map(([k, lbl, count]) => (
                        <button
                            key={k}
                            onClick={() => setTab(k)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === k ? "bg-[var(--color-primary)] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                            {lbl}{count != null && <span className="ml-1.5 opacity-70 text-xs">({count})</span>}
                        </button>
                    ))}
                </div>

                {/* Filter bar */}
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 mb-4 space-y-3">
                    <div className="flex gap-3 flex-wrap">
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Hľadať: referenčné č., názov, mesto…"
                            className="flex-1 min-w-[240px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <input
                            type="number"
                            value={priceMin}
                            onChange={e => setPriceMin(e.target.value)}
                            placeholder="Cena od (€)"
                            className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <input
                            type="number"
                            value={priceMax}
                            onChange={e => setPriceMax(e.target.value)}
                            placeholder="Cena do (€)"
                            className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as typeof sort)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        >
                            <option value="recent">Najnovšie</option>
                            <option value="price_asc">Cena ↑</option>
                            <option value="price_desc">Cena ↓</option>
                            <option value="uid">Referenčné č.</option>
                        </select>
                    </div>

                    {/* Estate type chips */}
                    {facets && facets.estateTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs uppercase tracking-wide text-gray-400 self-center mr-2">Typ:</span>
                            {facets.estateTypes.map(f => {
                                const on = estateTypes.includes(f.value);
                                return (
                                    <button
                                        key={f.value}
                                        onClick={() => setEstateTypes(toggle(estateTypes, f.value, !on))}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${on ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-gray-600 border-gray-200 hover:border-[var(--color-primary)]"}`}
                                    >
                                        {f.value} <span className="opacity-60">({f.count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Region chips */}
                    {facets && facets.regions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs uppercase tracking-wide text-gray-400 self-center mr-2">Región:</span>
                            {facets.regions.slice(0, 20).map(f => {
                                const on = regions.includes(f.value);
                                return (
                                    <button
                                        key={f.value}
                                        onClick={() => setRegions(toggle(regions, f.value, !on))}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${on ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-gray-600 border-gray-200 hover:border-[var(--color-primary)]"}`}
                                    >
                                        {f.value} <span className="opacity-60">({f.count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Bulk bar */}
                {selectedIds.size > 0 && (
                    <div className="sticky top-2 z-20 mb-3 bg-[var(--color-secondary)] text-white rounded-2xl px-5 py-3 flex items-center gap-4 shadow-lg">
                        <span className="text-sm font-semibold">{selectedIds.size} označených</span>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs text-white/70 hover:text-white underline"
                        >Zrušiť výber</button>
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={() => setBulkRun(selectedUnpublishedIds.length > 0 ? selectedUnpublishedIds : Array.from(selectedIds))}
                                disabled={selectedUnpublishedIds.length === 0}
                                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-40"
                            >
                                + Pridať na web ({selectedUnpublishedIds.length})
                            </button>
                        </div>
                    </div>
                )}

                {/* List */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400">Načítavam…</div>
                ) : !data || data.items.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        Žiadne položky. {facets?.totalAll === 0 && (
                            <span className="block mt-2 text-sm">Spustite analýzu feedu na stránke <Link href="/admin/feeds" className="text-[var(--color-primary)] underline">Feedy</Link>.</span>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === data.items.length && data.items.length > 0}
                                            ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < data.items.length; }}
                                            onChange={toggleAllVisible}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left w-20"></th>
                                    <th className="px-4 py-3 text-left">Ref / Názov</th>
                                    <th className="px-4 py-3 text-left">Typ</th>
                                    <th className="px-4 py-3 text-left">Lokalita</th>
                                    <th className="px-4 py-3 text-right">Cena</th>
                                    <th className="px-4 py-3 text-center">Stav</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map(item => (
                                    <tr
                                        key={item.id}
                                        className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedIds.has(item.id) ? "bg-[var(--color-primary)]/5" : ""}`}
                                        onClick={() => setDetailItem(item.id)}
                                    >
                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(item.id)}
                                                onChange={e => {
                                                    const ns = new Set(selectedIds);
                                                    if (e.target.checked) ns.add(item.id);
                                                    else ns.delete(item.id);
                                                    setSelectedIds(ns);
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.image_url} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-lg bg-gray-100" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-gray-400 font-mono">#{item.external_uid}</div>
                                            <div className="font-medium text-gray-800 truncate max-w-[24rem]">{item.title || "—"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{item.estate_type || "—"}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            <div className="truncate max-w-[14rem]">{[item.town, item.region].filter(Boolean).join(", ") || "—"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatPrice(item.price, item.currency)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {item.selected ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Na webe</span>
                                            ) : item.removed_from_feed ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Odstránené</span>
                                            ) : (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Čaká</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
                            <span className="text-gray-500">
                                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} z {data.total}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
                                >← Pred.</button>
                                <span className="px-3 py-1.5 text-gray-500">Strana {page} / {totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
                                >Ďalšia →</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {detailItem && (
                <ItemDetail
                    feedId={feedId}
                    itemId={detailItem}
                    onClose={() => setDetailItem(null)}
                    onChanged={load}
                />
            )}
            {bulkRun && (
                <BulkProgressModal
                    feedId={feedId}
                    itemIds={bulkRun}
                    onClose={() => { setBulkRun(null); setSelectedIds(new Set()); load(); }}
                    onDone={() => { /* load happens on close */ }}
                />
            )}
        </div>
    );
}

function Pill({ label, value, color }: { label: string; value: number; color?: "emerald" | "amber" }) {
    const cls = color === "emerald" ? "bg-emerald-50 text-emerald-700"
        : color === "amber" ? "bg-amber-50 text-amber-700"
        : "bg-gray-50 text-gray-700";
    return (
        <div className={`px-3 py-1.5 rounded-xl ${cls}`}>
            <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
            <div className="text-base font-bold leading-tight">{value.toLocaleString("sk-SK")}</div>
        </div>
    );
}
