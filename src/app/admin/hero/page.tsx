"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PageHeroRecord } from "@/lib/page-hero-store";
import { PAGE_KEYS, PAGE_LABELS, type PageKey } from "@/lib/page-hero-store";
import type { PropertyRecord } from "@/lib/property-store";
import HeroImageCropper from "@/components/admin/HeroImageCropper";

const DEFAULT_IMAGES: Record<PageKey, string> = {
    contact: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80",
    about: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
    blog: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1920&q=80",
    properties: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80",
    "buying-process": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80",
    favorites: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80",
};

interface CropState {
    pageKey: string;
    imageSrc: string;
}

function getPropertyImage(property: PropertyRecord): string | null {
    if (!property.images || !Array.isArray(property.images) || property.images.length === 0) return null;
    const heroIdx = property.hero_image_index ?? 0;
    const img = property.images[heroIdx] || property.images[0];
    return typeof img === 'string' ? img : (img as { url: string }).url;
}

/* ───────── Homepage Hero Slider Section ───────── */
function HomepageHeroSliderSection() {
    const [properties, setProperties] = useState<PropertyRecord[]>([]);
    const [selectedIds, setSelectedIds] = useState<(string | null)[]>([null, null, null]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [searchTerms, setSearchTerms] = useState<string[]>(["", "", ""]);
    const dropdownRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

    useEffect(() => {
        async function load() {
            try {
                const [propsRes, featuredRes] = await Promise.all([
                    fetch("/api/admin/properties"),
                    fetch("/api/admin/hero-featured"),
                ]);
                const propsData = await propsRes.json();
                const featuredData = await featuredRes.json();

                const allProps: PropertyRecord[] = propsData?.properties ?? (Array.isArray(propsData) ? propsData : []);
                const published = allProps.filter(
                    (p: PropertyRecord) => p.publish_status === "published"
                );
                setProperties(published);

                const ids: string[] = featuredData.propertyIds || [];
                setSelectedIds([ids[0] || null, ids[1] || null, ids[2] || null]);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (openDropdown !== null) {
                const ref = dropdownRefs.current[openDropdown];
                if (ref && !ref.contains(e.target as Node)) {
                    setOpenDropdown(null);
                }
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [openDropdown]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const ids = selectedIds.filter((id): id is string => id !== null);
            await fetch("/api/admin/hero-featured", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyIds: ids }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch {
            alert("Uloženie zlyhalo");
        } finally {
            setSaving(false);
        }
    };

    const handleSelect = (slotIndex: number, propertyId: string) => {
        setSelectedIds(prev => {
            const next = [...prev];
            next[slotIndex] = propertyId;
            return next;
        });
        setOpenDropdown(null);
        setSearchTerms(prev => {
            const next = [...prev];
            next[slotIndex] = "";
            return next;
        });
    };

    const handleRemove = (slotIndex: number) => {
        setSelectedIds(prev => {
            const next = [...prev];
            next[slotIndex] = null;
            return next;
        });
    };

    const getFilteredProperties = (slotIndex: number) => {
        const term = searchTerms[slotIndex].toLowerCase();
        return properties.filter(p => {
            // Exclude already selected in other slots
            const otherSelected = selectedIds.filter((_, i) => i !== slotIndex);
            if (otherSelected.includes(p.id)) return false;
            // Search filter
            if (term) {
                const title = (p.title_sk || "").toLowerCase();
                const location = (p.location_sk || "").toLowerCase();
                return title.includes(term) || location.includes(term);
            }
            return true;
        });
    };

    if (loading) {
        return (
            <div className="mb-10">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-[var(--color-secondary)]">Hero Slider na hlavnej stránke</h2>
                    <p className="text-sm text-[var(--color-muted)] mt-1">Načítava sa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-10">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-[var(--color-secondary)]">Hero Slider na hlavnej stránke</h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                    Vyberte až 3 nehnuteľnosti, ktoré sa zobrazia v hero slideri na hlavnej stránke. Ak žiadne nevyberiete, zobrazia sa 3 najnovšie.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[0, 1, 2].map((slotIndex) => {
                    const selectedId = selectedIds[slotIndex];
                    const selectedProp = selectedId ? properties.find(p => p.id === selectedId) : null;
                    const imageUrl = selectedProp ? getPropertyImage(selectedProp) : null;

                    return (
                        <div
                            key={slotIndex}
                            className="bg-white rounded-2xl border border-[var(--color-border)]"
                        >
                            {/* Preview */}
                            <div className="relative h-44 bg-[var(--color-surface)] rounded-t-2xl overflow-hidden">
                                {selectedProp && imageUrl ? (
                                    <>
                                        <img
                                            src={imageUrl}
                                            alt={selectedProp.title_sk}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-3 left-4 right-4">
                                            <h3 className="text-white font-medium text-sm leading-tight">{selectedProp.title_sk}</h3>
                                            <p className="text-white/60 text-xs mt-0.5">{selectedProp.location_sk}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(slotIndex)}
                                            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-red-500 text-white rounded-full transition-colors"
                                            title="Odstrániť"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)]">
                                        <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                        </svg>
                                        <span className="text-xs">Slot {slotIndex + 1}</span>
                                    </div>
                                )}
                            </div>

                            {/* Dropdown selector */}
                            <div className="p-3 relative" ref={(el) => { dropdownRefs.current[slotIndex] = el; }}>
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === slotIndex ? null : slotIndex)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm hover:border-[var(--color-primary)] transition-colors"
                                >
                                    <span className={selectedProp ? "text-[var(--color-secondary)]" : "text-[var(--color-muted)]"}>
                                        {selectedProp ? selectedProp.title_sk : "Vybrať nehnuteľnosť..."}
                                    </span>
                                    <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {openDropdown === slotIndex && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-xl z-[60] max-h-64 overflow-hidden flex flex-col">
                                        <div className="p-2 border-b border-[var(--color-border)]">
                                            <input
                                                type="text"
                                                placeholder="Hľadať..."
                                                value={searchTerms[slotIndex]}
                                                onChange={(e) => {
                                                    setSearchTerms(prev => {
                                                        const next = [...prev];
                                                        next[slotIndex] = e.target.value;
                                                        return next;
                                                    });
                                                }}
                                                className="w-full px-2.5 py-1.5 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)]"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="overflow-y-auto max-h-52">
                                            {getFilteredProperties(slotIndex).map(p => {
                                                const thumb = getPropertyImage(p);
                                                return (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => handleSelect(slotIndex, p.id)}
                                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-surface)] transition-colors text-left"
                                                    >
                                                        {thumb ? (
                                                            <img src={thumb} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] flex-shrink-0" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-[var(--color-secondary)] truncate">{p.title_sk}</p>
                                                            <p className="text-xs text-[var(--color-muted)] truncate">{p.location_sk}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {getFilteredProperties(slotIndex).length === 0 && (
                                                <p className="px-3 py-4 text-sm text-[var(--color-muted)] text-center">Žiadne výsledky</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                >
                    {saving ? "Ukladám..." : "Uložiť"}
                </button>
                {saved && (
                    <span className="text-sm text-green-600 font-medium">Uložené</span>
                )}
            </div>
        </div>
    );
}

export default function AdminHeroPage() {
    const [heroes, setHeroes] = useState<PageHeroRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [removing, setRemoving] = useState<string | null>(null);
    const [cropState, setCropState] = useState<CropState | null>(null);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const fetchHeroes = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/page-heroes");
            const data = await res.json();
            setHeroes(Array.isArray(data) ? data : []);
        } catch {
            setHeroes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHeroes();
    }, [fetchHeroes]);

    const getHeroForPage = (pageKey: string): PageHeroRecord | undefined =>
        heroes.find(h => h.page_key === pageKey);

    const handleFileSelect = (pageKey: string, file: File) => {
        // Read the file and open the cropper
        const reader = new FileReader();
        reader.onload = () => {
            setCropState({ pageKey, imageSrc: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!cropState) return;
        const { pageKey } = cropState;
        setCropState(null);
        setUploading(pageKey);

        try {
            const uploadRes = await fetch("/api/admin/upload", {
                method: "POST",
                headers: {
                    "X-File-Type": croppedBlob.type || "image/jpeg",
                    "X-Skip-Watermark": "1"
                },
                body: croppedBlob,
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                alert(`Upload zlyhal: ${err.error}`);
                return;
            }

            const { url } = await uploadRes.json();

            await fetch("/api/admin/page-heroes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ page_key: pageKey, image_url: url }),
            });

            await fetchHeroes();
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setUploading(null);
        }
    };

    const handleCropCancel = () => {
        setCropState(null);
    };

    const handleRemove = async (pageKey: string) => {
        if (!confirm("Naozaj chcete odstrániť tento obrázok? Stránka sa vráti na predvolený obrázok.")) return;
        setRemoving(pageKey);
        try {
            await fetch(`/api/admin/page-heroes?page_key=${pageKey}`, { method: "DELETE" });
            await fetchHeroes();
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <p className="text-[var(--color-muted)]">Načítava sa...</p>
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-8">
            {/* Homepage Hero Slider property picker */}
            <HomepageHeroSliderSection />

            {/* Divider */}
            <div className="border-t border-[var(--color-border)] mb-8" />

            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-[var(--color-secondary)]">Hero obrázky stránok</h1>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                    Nahrajte vlastný hero obrázok pre každú stránku. Ak žiadny nenastavíte, použije sa predvolený.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {PAGE_KEYS.map((pageKey) => {
                    const hero = getHeroForPage(pageKey);
                    const imageUrl = hero?.image_url || DEFAULT_IMAGES[pageKey];
                    const isCustom = !!hero;
                    const isUploading = uploading === pageKey;
                    const isRemoving = removing === pageKey;

                    return (
                        <div
                            key={pageKey}
                            className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden"
                        >
                            {/* Image Preview */}
                            <div className="relative h-44 bg-[var(--color-surface)]">
                                <img
                                    src={imageUrl}
                                    alt={PAGE_LABELS[pageKey]}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                                    <div>
                                        <h3 className="text-white font-medium text-base">{PAGE_LABELS[pageKey]}</h3>
                                        <p className="text-white/60 text-xs mt-0.5">/{pageKey}</p>
                                    </div>
                                    {isCustom && (
                                        <span className="px-2 py-0.5 bg-[var(--color-primary)] text-white text-[10px] uppercase tracking-wider font-medium rounded-full">
                                            Vlastný
                                        </span>
                                    )}
                                </div>

                                {/* Upload overlay */}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <div className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Nahrávam...
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-4 flex gap-2">
                                <input
                                    ref={(el) => { fileInputRefs.current[pageKey] = el; }}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/avif"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(pageKey, file);
                                        e.target.value = "";
                                    }}
                                />
                                <button
                                    onClick={() => fileInputRefs.current[pageKey]?.click()}
                                    disabled={isUploading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                    {isCustom ? "Zmeniť" : "Nahrať"}
                                </button>
                                {isCustom && (
                                    <button
                                        onClick={() => handleRemove(pageKey)}
                                        disabled={isRemoving}
                                        className="flex items-center justify-center px-3 py-2.5 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                                        title="Odstrániť a vrátiť predvolený"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Crop Modal */}
            {cropState && (
                <HeroImageCropper
                    imageSrc={cropState.imageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
}
