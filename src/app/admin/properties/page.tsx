"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PropertyRecord } from "@/lib/property-store";

// ============================================
// CONSTANTS
// ============================================

const countryFlags: Record<string, string> = {
    bulgaria: "🇧🇬",
    croatia: "🇭🇷",
    spain: "🇪🇸",
    greece: "🇬🇷",
    slovakia: "🇸🇰",
    italy: "🇮🇹",
    montenegro: "🇲🇪",
};

const countryLabels: Record<string, string> = {
    bulgaria: "Bulharsko",
    croatia: "Chorvátsko",
    spain: "Španielsko",
    greece: "Grécko",
    slovakia: "Slovensko",
    italy: "Taliansko",
    montenegro: "Čierna Hora",
};

const statusDotColors: Record<string, string> = {
    published: "bg-emerald-500",
    draft: "bg-amber-400",
    trashed: "bg-red-400",
};

const statusLabels: Record<string, string> = {
    published: "Publikované",
    draft: "Koncept",
    trashed: "V koši",
};

const typeLabels: Record<string, string> = {
    studio_apartment_flat: "Štúdio / Apartmán",
    family_house_villa: "Dom / Vila",
    luxury_property: "Luxusná",
    villa: "Vila",
    apartment: "Apartmán",
    house: "Dom",
    land: "Pozemok",
};

type SortKey = "title" | "city" | "type" | "price" | "date" | "status";
type SortDir = "asc" | "desc";

// ============================================
// MULTI-SELECT DROPDOWN COMPONENT
// ============================================

function MultiSelectFilter({
    label,
    options,
    selected,
    onChange,
}: {
    label: string;
    options: { value: string; label: string }[];
    selected: Set<string>;
    onChange: (next: Set<string>) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggle = (val: string) => {
        const next = new Set(selected);
        if (next.has(val)) next.delete(val);
        else next.add(val);
        onChange(next);
    };

    const count = selected.size;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all shadow-sm ${count > 0
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                    }`}
            >
                {label}
                {count > 0 && (
                    <span className="bg-white/25 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                        {count}
                    </span>
                )}
                <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-[var(--color-border)] rounded-xl shadow-xl z-50 py-1.5 max-h-64 overflow-y-auto">
                    {count > 0 && (
                        <button
                            type="button"
                            onClick={() => onChange(new Set())}
                            className="w-full text-left px-4 py-2 text-xs text-red-500 font-semibold hover:bg-red-50 transition-colors"
                        >
                            Zrušiť filter
                        </button>
                    )}
                    {options.map((opt) => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selected.has(opt.value)}
                                onChange={() => toggle(opt.value)}
                                className="w-3.5 h-3.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)]"
                            />
                            <span className="text-sm text-[var(--color-foreground)]">{opt.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================
// SORTABLE HEADER COMPONENT
// ============================================

function SortableHeader({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
    align = "left",
}: {
    label: string;
    sortKey: SortKey;
    currentSort: SortKey;
    currentDir: SortDir;
    onSort: (key: SortKey) => void;
    align?: "left" | "center" | "right";
}) {
    const isActive = currentSort === sortKey;
    const alignClass = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

    return (
        <th className={`text-${align} text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider px-6 py-4`}>
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1 ${alignClass} hover:text-[var(--color-foreground)] transition-colors ${isActive ? "text-[var(--color-foreground)]" : ""}`}
            >
                {label}
                <span className="flex flex-col leading-none">
                    <svg className={`w-3 h-3 -mb-0.5 ${isActive && currentDir === "asc" ? "text-[var(--color-primary)]" : "text-[var(--color-border)]"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 12l5-5 5 5H5z" />
                    </svg>
                    <svg className={`w-3 h-3 ${isActive && currentDir === "desc" ? "text-[var(--color-primary)]" : "text-[var(--color-border)]"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 8l5 5 5-5H5z" />
                    </svg>
                </span>
            </button>
        </th>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PropertiesListPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<PropertyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");

    // Sorting
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    // Multi-select filters
    const [countryFilter, setCountryFilter] = useState<Set<string>>(new Set());
    const [cityFilter, setCityFilter] = useState<Set<string>>(new Set());
    const [dateFilter, setDateFilter] = useState<Set<string>>(new Set());

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Export changes
    const [pendingExports, setPendingExports] = useState<Record<string, string | null>>({});
    const [saving, setSaving] = useState(false);
    const [purging, setPurging] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/admin/properties");
            if (res.ok) {
                const data = await res.json();
                setProperties(data.properties || []);
            }
        } catch (err) {
            console.error("Error fetching properties:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Presunúť "${title}" do koša?`)) return;
        try {
            const res = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
            if (res.ok) {
                setProperties(prev => prev.map(p => p.id === id ? { ...p, publish_status: 'trashed' as const, export_target: null } : p));
                setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
            }
        } catch (err) {
            console.error("Error trashing:", err);
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/properties/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ save_mode: "restore" }),
            });
            if (res.ok) {
                setProperties(prev => prev.map(p => p.id === id ? { ...p, publish_status: 'draft' as const } : p));
            }
        } catch (err) {
            console.error("Error restoring:", err);
        }
    };

    const handlePermanentDelete = async (id: string, title: string) => {
        if (!confirm(`NATRVALO vymazať "${title}"? Táto akcia sa nedá vrátiť!`)) return;
        try {
            const res = await fetch(`/api/admin/properties/${id}?permanent=true`, { method: "DELETE" });
            if (res.ok) {
                setProperties(prev => prev.filter(p => p.id !== id));
                setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
            }
        } catch (err) {
            console.error("Error permanently deleting:", err);
        }
    };

    const handlePurgeTrash = async () => {
        if (!confirm('Natrvalo vymazať všetky položky v koši staršie ako 30 dní? Táto akcia sa nedá vrátiť!')) return;
        setPurging(true);
        try {
            const res = await fetch('/api/admin/cron/purge-trash', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                if (data.purged > 0) {
                    // Refresh the list
                    await fetchProperties();
                }
                alert(`Vymazaných ${data.purged} nehnuteľností, ${data.imagesDeleted} obrázkov.`);
            }
        } catch (err) {
            console.error('Error purging trash:', err);
        } finally {
            setPurging(false);
        }
    };

    // ============================================
    // EXPORT TOGGLE (per-row)
    // ============================================

    const toggleExport = useCallback((propertyId: string, target: "sk" | "softreal") => {
        setPendingExports(prev => {
            const property = properties.find(p => p.id === propertyId);
            const currentRaw = prev[propertyId] !== undefined ? prev[propertyId] : (property?.export_target || null);
            const current = new Set((currentRaw || '').split(',').filter(Boolean));

            const key = target === 'softreal' ? 'softreal' : 'sk';
            if (current.has(key)) current.delete(key);
            else current.add(key);

            const newValue = current.size > 0 ? Array.from(current).join(',') : null;
            const originalValue = property?.export_target || null;
            if (newValue === originalValue) {
                const updated = { ...prev };
                delete updated[propertyId];
                return updated;
            }
            return { ...prev, [propertyId]: newValue };
        });
    }, [properties]);

    const getExportValue = (p: PropertyRecord): string | null => {
        if (pendingExports[p.id] !== undefined) return pendingExports[p.id];
        return p.export_target || null;
    };

    // ============================================
    // BULK ACTIONS
    // ============================================

    const bulkDisableExport = useCallback(() => {
        setPendingExports(prev => {
            const next = { ...prev };
            selectedIds.forEach(id => {
                const property = properties.find(p => p.id === id);
                const originalValue = property?.export_target || null;
                if (originalValue === null && next[id] === undefined) return;
                next[id] = null;
            });
            return next;
        });
    }, [selectedIds, properties]);

    const bulkToggleExport = useCallback((target: string) => {
        setPendingExports(prev => {
            const next = { ...prev };
            // Check if ALL selected already have this target — if so, remove it; otherwise add it
            const allHaveTarget = Array.from(selectedIds).every(id => {
                const property = properties.find(p => p.id === id);
                const currentRaw = next[id] !== undefined ? next[id] : (property?.export_target || null);
                const current = new Set((currentRaw || '').split(',').filter(Boolean));
                return current.has(target);
            });

            selectedIds.forEach(id => {
                const property = properties.find(p => p.id === id);
                const currentRaw = next[id] !== undefined ? next[id] : (property?.export_target || null);
                const current = new Set((currentRaw || '').split(',').filter(Boolean));

                if (allHaveTarget) current.delete(target);
                else current.add(target);

                const newValue = current.size > 0 ? Array.from(current).join(',') : null;
                const originalValue = property?.export_target || null;
                if (newValue === originalValue) {
                    delete next[id];
                } else {
                    next[id] = newValue;
                }
            });
            return next;
        });
    }, [selectedIds, properties]);

    const bulkTrash = useCallback(async () => {
        const count = selectedIds.size;
        if (!confirm(`Presunúť ${count} nehnuteľností do koša?`)) return;
        setSaving(true);
        try {
            await Promise.all(
                Array.from(selectedIds).map(id =>
                    fetch(`/api/admin/properties/${id}`, { method: "DELETE" })
                )
            );
            setProperties(prev => prev.map(p =>
                selectedIds.has(p.id) ? { ...p, publish_status: 'trashed' as const, export_target: null } : p
            ));
            setSelectedIds(new Set());
        } catch (err) {
            console.error("Bulk trash error:", err);
        } finally {
            setSaving(false);
        }
    }, [selectedIds]);

    const bulkRestore = useCallback(async () => {
        setSaving(true);
        try {
            await Promise.all(
                Array.from(selectedIds).map(id =>
                    fetch(`/api/admin/properties/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ save_mode: "restore" }),
                    })
                )
            );
            setProperties(prev => prev.map(p =>
                selectedIds.has(p.id) ? { ...p, publish_status: 'draft' as const } : p
            ));
            setSelectedIds(new Set());
        } catch (err) {
            console.error("Bulk restore error:", err);
        } finally {
            setSaving(false);
        }
    }, [selectedIds]);

    const bulkPermanentDelete = useCallback(async () => {
        const count = selectedIds.size;
        if (!confirm(`NATRVALO vymazať ${count} nehnuteľností? Táto akcia sa nedá vrátiť!`)) return;
        setSaving(true);
        try {
            await Promise.all(
                Array.from(selectedIds).map(id =>
                    fetch(`/api/admin/properties/${id}?permanent=true`, { method: "DELETE" })
                )
            );
            setProperties(prev => prev.filter(p => !selectedIds.has(p.id)));
            setSelectedIds(new Set());
        } catch (err) {
            console.error("Bulk permanent delete error:", err);
        } finally {
            setSaving(false);
        }
    }, [selectedIds]);

    const hasPendingChanges = Object.keys(pendingExports).length > 0;

    const saveExportChanges = async () => {
        setSaving(true);
        try {
            const promises = Object.entries(pendingExports).map(([id, exportTarget]) =>
                fetch(`/api/admin/properties/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ export_target: exportTarget, save_mode: "auto" }),
                })
            );
            await Promise.all(promises);
            setProperties(prev =>
                prev.map(p => {
                    if (pendingExports[p.id] !== undefined) {
                        return { ...p, export_target: pendingExports[p.id] };
                    }
                    return p;
                })
            );
            setPendingExports({});
        } catch (err) {
            console.error("Error saving exports:", err);
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // SORTING HANDLER
    // ============================================

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir(key === "price" || key === "date" ? "desc" : "asc");
        }
    };

    // ============================================
    // DERIVED DATA: Dynamic filter options
    // ============================================

    const countryOptions = useMemo(() => {
        const unique = [...new Set(properties.map(p => p.country))].sort();
        return unique.map(c => ({
            value: c,
            label: `${countryFlags[c] || ""} ${countryLabels[c] || c}`,
        }));
    }, [properties]);

    const cityOptions = useMemo(() => {
        const unique = [...new Set(properties.map(p => p.city).filter(Boolean))].sort();
        return unique.map(c => ({ value: c, label: c }));
    }, [properties]);

    const dateOptions = useMemo(() => {
        // Group by age buckets
        return [
            { value: "7d", label: "Posledných 7 dní" },
            { value: "30d", label: "Posledných 30 dní" },
            { value: "90d", label: "Posledných 90 dní" },
            { value: "180d", label: "Posledných 6 mesiacov" },
            { value: "365d", label: "Posledný rok" },
            { value: "older", label: "Staršie ako rok" },
        ];
    }, []);

    // ============================================
    // FILTERING + SORTING PIPELINE
    // ============================================

    const filtered = useMemo(() => {
        let result = properties;

        // Status filter — "all" excludes trashed; trashed items only show in the Kôš tab
        if (statusFilter === "all") {
            result = result.filter(p => p.publish_status !== 'trashed');
        } else {
            result = result.filter(p => p.publish_status === statusFilter);
        }

        // Search (supports title, city, country, and listing ID)
        if (search) {
            const q = search.toLowerCase().trim();
            result = result.filter(p =>
                p.title_sk.toLowerCase().includes(q) ||
                p.city.toLowerCase().includes(q) ||
                p.country.toLowerCase().includes(q) ||
                (p.property_id_external && p.property_id_external.toLowerCase().includes(q)) ||
                (p.id && p.id.toLowerCase().includes(q))
            );
        }

        // Country filter
        if (countryFilter.size > 0) {
            result = result.filter(p => countryFilter.has(p.country));
        }

        // City filter
        if (cityFilter.size > 0) {
            result = result.filter(p => cityFilter.has(p.city));
        }

        // Date filter
        if (dateFilter.size > 0) {
            const now = Date.now();
            const dayMs = 86400000;
            const buckets: Record<string, (d: number) => boolean> = {
                "7d": (d) => (now - d) <= 7 * dayMs,
                "30d": (d) => (now - d) <= 30 * dayMs,
                "90d": (d) => (now - d) <= 90 * dayMs,
                "180d": (d) => (now - d) <= 180 * dayMs,
                "365d": (d) => (now - d) <= 365 * dayMs,
                "older": (d) => (now - d) > 365 * dayMs,
            };
            result = result.filter(p => {
                const ts = new Date(p.created_at).getTime();
                return [...dateFilter].some(key => buckets[key]?.(ts));
            });
        }

        // Sorting
        result = [...result].sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case "title":
                    cmp = a.title_sk.localeCompare(b.title_sk, "sk");
                    break;
                case "city":
                    cmp = a.city.localeCompare(b.city, "sk");
                    break;
                case "type":
                    cmp = a.property_type.localeCompare(b.property_type);
                    break;
                case "price":
                    cmp = a.price - b.price;
                    break;
                case "date":
                    cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
                case "status":
                    cmp = (a.publish_status || "").localeCompare(b.publish_status || "");
                    break;
            }
            return sortDir === "asc" ? cmp : -cmp;
        });

        return result;
    }, [properties, statusFilter, search, countryFilter, cityFilter, dateFilter, sortKey, sortDir]);

    // ============================================
    // SELECTION HELPERS
    // ============================================

    const allFilteredSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));
    const someFilteredSelected = filtered.some(p => selectedIds.has(p.id));

    const toggleSelectAll = () => {
        if (allFilteredSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                filtered.forEach(p => next.delete(p.id));
                return next;
            });
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev);
                filtered.forEach(p => next.add(p.id));
                return next;
            });
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const activeFiltersCount = (countryFilter.size > 0 ? 1 : 0) + (cityFilter.size > 0 ? 1 : 0) + (dateFilter.size > 0 ? 1 : 0);

    const clearAllFilters = () => {
        setCountryFilter(new Set());
        setCityFilter(new Set());
        setDateFilter(new Set());
        setSearch("");
        setStatusFilter("all");
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-serif text-[var(--color-secondary)]">Nehnuteľnosti</h1>
                    <p className="text-sm text-[var(--color-muted)] mt-1">{properties.length} celkovo</p>
                </div>
                <Link
                    href="/admin/properties/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-xl transition-colors shadow-sm self-start sm:self-auto"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Pridať nehnuteľnosť
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Status Filter */}
                <div className="flex bg-white border border-[var(--color-border)] rounded-xl p-1 shadow-sm">
                    {[
                        { key: "all", label: "Všetky" },
                        { key: "published", label: "Publikované" },
                        { key: "draft", label: "Koncepty" },
                        { key: "trashed", label: "🗑️ Kôš" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${statusFilter === f.key
                                ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm"
                                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px] shadow-sm">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Hľadať podľa názvu, mesta..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                    />
                </div>
            </div>

            {/* Advanced Filters Row */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
                <span className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mr-1">Filtre:</span>
                <MultiSelectFilter label="Krajina" options={countryOptions} selected={countryFilter} onChange={setCountryFilter} />
                <MultiSelectFilter label="Mesto" options={cityOptions} selected={cityFilter} onChange={setCityFilter} />
                <MultiSelectFilter label="Dátum pridania" options={dateOptions} selected={dateFilter} onChange={setDateFilter} />

                {activeFiltersCount > 0 && (
                    <button
                        type="button"
                        onClick={clearAllFilters}
                        className="text-xs text-red-500 font-semibold hover:text-red-700 transition-colors ml-1"
                    >
                        Zrušiť všetky ({activeFiltersCount})
                    </button>
                )}

                <span className="ml-auto text-xs text-[var(--color-muted)] font-medium">
                    {filtered.length} z {properties.length}
                </span>
            </div>

            {/* Trash info banner */}
            {statusFilter === 'trashed' && (
                <div className="flex items-center gap-3 mb-4 px-5 py-3 bg-red-50 border border-red-200 rounded-2xl">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-xs text-red-600 font-medium">
                        Položky v koši sa natrvalo vymažú po 30 dňoch.
                    </p>
                    <button
                        type="button"
                        onClick={handlePurgeTrash}
                        disabled={purging}
                        className="ml-auto px-3.5 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {purging && (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        Vyprázdniť kôš
                    </button>
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (() => {
                const selected = properties.filter(p => selectedIds.has(p.id));
                const hasTrashed = selected.some(p => p.publish_status === 'trashed');
                const hasNonTrashed = selected.some(p => p.publish_status !== 'trashed');
                return (
                    <div className="flex items-center flex-wrap gap-2 mb-4 px-5 py-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-2xl">
                        <span className="text-sm font-semibold text-[var(--color-foreground)]">
                            {selectedIds.size} vybraných
                        </span>
                        <div className="h-5 w-px bg-[var(--color-border)]" />

                        {/* Export toggles — only for non-trashed */}
                        {hasNonTrashed && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => bulkToggleExport("sk")}
                                    disabled={saving}
                                    className="px-3 py-1.5 text-xs font-semibold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Pridať/odobrať SK export"
                                >
                                    SK export
                                </button>
                                <button
                                    type="button"
                                    onClick={() => bulkToggleExport("softreal")}
                                    disabled={saving}
                                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Pridať/odobrať CZ export"
                                >
                                    CZ export
                                </button>
                                <button
                                    type="button"
                                    onClick={bulkDisableExport}
                                    disabled={saving}
                                    className="px-3 py-1.5 text-xs font-semibold bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Zrušiť export
                                </button>
                                <div className="h-5 w-px bg-[var(--color-border)]" />
                            </>
                        )}

                        {/* Trash — for non-trashed items */}
                        {hasNonTrashed && (
                            <button
                                type="button"
                                onClick={bulkTrash}
                                disabled={saving}
                                className="px-3 py-1.5 text-xs font-semibold bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Do koša
                            </button>
                        )}

                        {/* Restore & permanent delete — for trashed items */}
                        {hasTrashed && (
                            <>
                                <button
                                    type="button"
                                    onClick={bulkRestore}
                                    disabled={saving}
                                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Obnoviť
                                </button>
                                <button
                                    type="button"
                                    onClick={bulkPermanentDelete}
                                    disabled={saving}
                                    className="px-3 py-1.5 text-xs font-semibold bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Natrvalo vymazať
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => setSelectedIds(new Set())}
                            className="ml-auto px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] font-semibold transition-colors"
                        >
                            Zrušiť výber
                        </button>
                    </div>
                );
            })()}

            {/* Table */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-[var(--color-muted)] text-sm">
                        <svg className="w-6 h-6 animate-spin mx-auto mb-3 text-[var(--color-foreground)]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Načítavam...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                        </svg>
                        <p className="text-[var(--color-muted)] text-sm">
                            {activeFiltersCount > 0 ? "Žiadne výsledky pre vybrané filtre" : "Žiadne nehnuteľnosti"}
                        </p>
                        {activeFiltersCount > 0 ? (
                            <button onClick={clearAllFilters} className="inline-block mt-3 text-sm text-[var(--color-sand)] hover:underline">
                                Zrušiť filtre →
                            </button>
                        ) : (
                            <Link href="/admin/properties/new" className="inline-block mt-3 text-sm text-[var(--color-sand)] hover:underline">
                                Pridať prvú nehnuteľnosť →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                                    {/* Checkbox column */}
                                    <th className="w-12 px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={allFilteredSelected}
                                            ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                            title="Vybrať všetky"
                                        />
                                    </th>
                                    <SortableHeader label="Nehnuteľnosť" sortKey="title" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    <SortableHeader label="Lokalita" sortKey="city" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    <SortableHeader label="Typ" sortKey="type" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    <SortableHeader label="Cena" sortKey="price" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    <SortableHeader label="Pridané" sortKey="date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    <SortableHeader label="Stav" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />
                                    <th className="text-center text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider px-4 py-4">Export</th>
                                    <th className="text-right text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider px-6 py-4">Akcie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)] bg-white">
                                {filtered.map((p) => {
                                    const exportRaw = getExportValue(p) || '';
                                    const exportSet = new Set(exportRaw.split(',').filter(Boolean));
                                    const isPending = pendingExports[p.id] !== undefined;
                                    const isSelected = selectedIds.has(p.id);

                                    return (
                                        <tr
                                            key={p.id}
                                            className={`hover:bg-[var(--color-surface)] transition-colors cursor-pointer whitespace-nowrap group ${isSelected ? "bg-[var(--color-primary)]/[0.03]" : ""}`}
                                            onClick={() => router.push(`/admin/properties/${p.id}/edit`)}
                                        >
                                            {/* Checkbox */}
                                            <td className="w-12 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(p.id)}
                                                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-normal min-w-[200px]">
                                                <div className="flex items-center gap-4">
                                                    {p.images && p.images.length > 0 ? (
                                                        <div
                                                            className="w-14 h-10 rounded-lg bg-cover bg-center flex-shrink-0 border border-[var(--color-border)] shadow-sm"
                                                            style={{ backgroundImage: `url(${typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url})` }}
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-10 rounded-lg bg-[var(--color-surface)] flex items-center justify-center flex-shrink-0 border border-[var(--color-border)]">
                                                            <svg className="w-5 h-5 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M18 13.5a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors">{p.title_sk}</p>
                                                        {p.featured && (
                                                            <span className="text-[10px] text-[var(--color-accent)] font-semibold mt-0.5 block">★ Odporúčané</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--color-muted)]">
                                                {countryFlags[p.country] || ""} {p.city}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--color-muted)] font-medium">
                                                {typeLabels[p.property_type] || p.property_type}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--color-foreground)] font-semibold">
                                                {p.price_on_request ? "Na vyžiadanie" : `€ ${p.price.toLocaleString("en-US")}`}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--color-muted)]">
                                                {p.created_at ? new Date(p.created_at).toLocaleDateString("sk-SK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                            </td>
                                            {/* Status — colored dot */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span
                                                        className={`w-2.5 h-2.5 rounded-full ${statusDotColors[p.publish_status] || statusDotColors.draft}`}
                                                        title={statusLabels[p.publish_status] || p.publish_status}
                                                    />
                                                    {p.draft_data && p.publish_status === 'published' && (
                                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="Neuložené zmeny" />
                                                    )}
                                                </div>
                                            </td>
                                            {/* Export toggles */}
                                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => toggleExport(p.id, "sk")}
                                                        className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${exportSet.has('sk')
                                                            ? "bg-[var(--color-secondary)] text-white shadow-sm"
                                                            : "bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)]"
                                                            } ${isPending ? "ring-1 ring-[var(--color-primary)]" : ""}`}
                                                        title="Export na slovenské portály"
                                                    >
                                                        SK
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExport(p.id, "softreal")}
                                                        className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${exportSet.has('softreal')
                                                            ? "bg-[var(--color-secondary)] text-white shadow-sm"
                                                            : "bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)]"
                                                            } ${isPending ? "ring-1 ring-[var(--color-primary)]" : ""}`}
                                                        title="Export na české portály (Softreal)"
                                                    >
                                                        CZ
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {p.publish_status === 'trashed' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleRestore(p.id)}
                                                                className="p-2 text-[var(--color-muted)] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                title="Obnoviť"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handlePermanentDelete(p.id, p.title_sk)}
                                                                className="p-2 text-[var(--color-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Natrvalo vymazať"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link
                                                                href={`/admin/properties/${p.id}/edit`}
                                                                className="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] rounded-lg transition-colors"
                                                                title="Upraviť"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                                                </svg>
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(p.id, p.title_sk)}
                                                                className="p-2 text-[var(--color-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Do koša"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            {hasPendingChanges && (
                <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
                    <button
                        onClick={saveExportChanges}
                        disabled={saving}
                        className="flex items-center gap-2.5 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold rounded-2xl shadow-xl transition-all disabled:opacity-60"
                    >
                        {saving ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        )}
                        Uložiť export ({Object.keys(pendingExports).length})
                    </button>
                </div>
            )}
        </>
    );
}
