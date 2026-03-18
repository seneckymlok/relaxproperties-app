"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PageHeroRecord } from "@/lib/page-hero-store";
import { PAGE_KEYS, PAGE_LABELS, type PageKey } from "@/lib/page-hero-store";
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
            const formData = new FormData();
            formData.append("file", croppedBlob, "hero-crop.jpg");
            formData.append("skip_watermark", "1");

            const uploadRes = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
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
