"use client";

import { useState, useRef, useCallback } from "react";

interface ImageItem {
    url: string;
    alt: string;
    order: number;
}

interface ImageUploaderProps {
    images: ImageItem[];
    onChange: (images: ImageItem[]) => void;
    onUploadingChange?: (uploading: boolean) => void;
    heroImageIndex?: number;
    onHeroImageIndexChange?: (index: number) => void;
    pdfImages?: number[];
    onPdfImagesChange?: (indices: number[]) => void;
}

export default function ImageUploader({ images, onChange, onUploadingChange, heroImageIndex = 0, onHeroImageIndexChange, pdfImages = [], onPdfImagesChange }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setUploadingState = (state: boolean) => {
        setUploading(state);
        onUploadingChange?.(state);
    };

    // ---- Upload handler ----
    const uploadFiles = useCallback(async (files: FileList | File[]) => {
        setUploadingState(true);
        const newImages: ImageItem[] = [];

        for (const file of Array.from(files)) {
            try {
                const res = await fetch("/api/admin/upload", {
                    method: "POST",
                    headers: {
                        "X-File-Type": file.type || "application/octet-stream"
                    },
                    body: file,
                });

                if (res.ok) {
                    const data = await res.json();
                    newImages.push({
                        url: data.url,
                        alt: "",
                        order: images.length + newImages.length,
                    });
                } else {
                    const err = await res.json();
                    console.error("Upload failed:", err.error);
                }
            } catch (err) {
                console.error("Upload error:", err);
            }
        }

        if (newImages.length > 0) {
            onChange([...images, ...newImages]);
        }
        setUploadingState(false);
    }, [images, onChange, onUploadingChange]);

    // ---- Drag & Drop ----
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        if (e.dataTransfer.files.length > 0) {
            uploadFiles(e.dataTransfer.files);
        }
    }, [uploadFiles]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    // ---- File input ----
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFiles(e.target.files);
            e.target.value = "";
        }
    };

    // ---- Reorder via drag ----
    const handleReorderDragStart = (index: number) => {
        setDragIndex(index);
    };

    const handleReorderDrop = (targetIndex: number) => {
        if (dragIndex === null || dragIndex === targetIndex) return;

        const reordered = [...images];
        const [moved] = reordered.splice(dragIndex, 1);
        reordered.splice(targetIndex, 0, moved);

        // Remap pdf_images indices after reorder
        if (onPdfImagesChange && pdfImages.length > 0) {
            const indexMap = new Map<number, number>();
            const originalOrder = images.map((_, i) => i);
            const newOrder = [...originalOrder];
            const [movedIdx] = newOrder.splice(dragIndex, 1);
            newOrder.splice(targetIndex, 0, movedIdx);
            newOrder.forEach((oldIdx, newIdx) => indexMap.set(oldIdx, newIdx));
            const remapped = pdfImages.map(idx => indexMap.get(idx) ?? idx).sort((a, b) => a - b);
            onPdfImagesChange(remapped);
        }

        onChange(reordered.map((img, i) => ({ ...img, order: i })));
        setDragIndex(null);
    };

    // ---- Remove ----
    const removeImage = async (index: number) => {
        const img = images[index];
        // Try to delete from blob storage
        try {
            await fetch("/api/admin/upload", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: img.url }),
            });
        } catch {
            // Continue even if blob delete fails
        }

        // Update pdf_images: remove this index and shift higher indices down
        if (onPdfImagesChange) {
            const updated = pdfImages
                .filter(idx => idx !== index)
                .map(idx => idx > index ? idx - 1 : idx);
            onPdfImagesChange(updated);
        }

        onChange(images.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i })));
    };

    // ---- Set as main (move to position 0) ----
    const setAsMain = (index: number) => {
        if (index === 0) return;
        const reordered = [...images];
        const [moved] = reordered.splice(index, 1);
        reordered.unshift(moved);

        // Remap pdf_images indices
        if (onPdfImagesChange && pdfImages.length > 0) {
            const remapped = pdfImages.map(idx => {
                if (idx === index) return 0;
                if (idx < index) return idx + 1;
                return idx;
            }).sort((a, b) => a - b);
            onPdfImagesChange(remapped);
        }

        onChange(reordered.map((img, i) => ({ ...img, order: i })));
    };

    // ---- Toggle PDF image selection ----
    const togglePdfImage = (index: number) => {
        if (!onPdfImagesChange) return;
        if (pdfImages.includes(index)) {
            onPdfImagesChange(pdfImages.filter(idx => idx !== index));
        } else {
            onPdfImagesChange([...pdfImages, index].sort((a, b) => a - b));
        }
    };

    const selectAllForPdf = () => {
        if (!onPdfImagesChange) return;
        onPdfImagesChange(images.map((_, i) => i));
    };

    const deselectAllForPdf = () => {
        if (!onPdfImagesChange) return;
        onPdfImagesChange([]);
    };

    return (
        <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Fotogaléria</h3>

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${dragOver
                    ? "border-[#1C3F43] bg-[#1C3F43]/10"
                    : "border-[#2a2d37] hover:border-[#3a3d47]"
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <svg className="w-8 h-8 animate-spin text-[#1C3F43]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-sm text-gray-400">Nahrávam...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-sm text-gray-400">
                            Pretiahnite fotky sem alebo <span className="text-[#C5A880]">kliknite pre výber</span>
                        </p>
                        <p className="text-[10px] text-gray-600">JPG, PNG, WebP, AVIF · Max 10MB na súbor</p>
                    </div>
                )}
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
                <>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-gray-600">
                            Tahajte pre zmenu poradia · ★ = hlavny obrazok · H = hero na hlavnej stranke · PDF = export do PDF
                        </p>
                        {onPdfImagesChange && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllForPdf}
                                    className="text-[10px] text-[#C5A880] hover:text-[#d4b98f] font-medium"
                                >
                                    PDF: Vybrat vsetky
                                </button>
                                <button
                                    type="button"
                                    onClick={deselectAllForPdf}
                                    className="text-[10px] text-gray-500 hover:text-gray-400 font-medium"
                                >
                                    Zrusit vyber
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {images.map((img, i) => {
                            const isPdfSelected = pdfImages.includes(i);
                            return (
                                <div
                                    key={`${img.url}-${i}`}
                                    draggable
                                    onDragStart={() => handleReorderDragStart(i)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleReorderDrop(i)}
                                    className={`relative group rounded-lg overflow-hidden border aspect-[4/3] cursor-grab active:cursor-grabbing transition-all ${dragIndex === i ? "border-[#1C3F43] opacity-50" : isPdfSelected ? "border-[#C5A880] ring-1 ring-[#C5A880]/50" : "border-[#2a2d37]"
                                        }`}
                                >
                                    {/* Image */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center bg-[#1a1d27]"
                                        style={{ backgroundImage: `url(${img.url})` }}
                                    />

                                    {/* Main badge */}
                                    {i === 0 && (
                                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#C5A880] text-[10px] font-bold text-white rounded z-10">
                                            ★ HLAVNY
                                        </span>
                                    )}

                                    {/* Hero badge */}
                                    {i === heroImageIndex && onHeroImageIndexChange && (
                                        <span className="absolute top-2 left-2 mt-6 px-2 py-0.5 bg-[var(--color-primary)] text-[10px] font-bold text-white rounded z-10">
                                            HERO
                                        </span>
                                    )}

                                    {/* PDF badge - always visible when selected */}
                                    {isPdfSelected && onPdfImagesChange && (
                                        <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#C5A880] text-[10px] font-bold text-white rounded z-10">
                                            PDF
                                        </span>
                                    )}

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors z-10" />

                                    {/* Actions */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        {i !== 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setAsMain(i)}
                                                className="w-7 h-7 bg-[#C5A880]/90 hover:bg-[#C5A880] text-white rounded-lg flex items-center justify-center text-xs"
                                                title="Nastavit ako hlavny"
                                            >
                                                ★
                                            </button>
                                        )}
                                        {onHeroImageIndexChange && i !== heroImageIndex && (
                                            <button
                                                type="button"
                                                onClick={() => onHeroImageIndexChange(i)}
                                                className="w-7 h-7 bg-[var(--color-primary)]/90 hover:bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center text-[9px] font-bold"
                                                title="Nastavit ako hero obrazok pre hlavnu stranku"
                                            >
                                                H
                                            </button>
                                        )}
                                        {onPdfImagesChange && (
                                            <button
                                                type="button"
                                                onClick={() => togglePdfImage(i)}
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold transition-colors ${isPdfSelected
                                                    ? "bg-[#C5A880] text-white"
                                                    : "bg-white/80 hover:bg-white text-gray-700"
                                                    }`}
                                                title={isPdfSelected ? "Odstranit z PDF" : "Pridat do PDF exportu"}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="w-7 h-7 bg-red-500/80 hover:bg-red-500 text-white rounded-lg flex items-center justify-center"
                                            title="Odstranit"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Order number */}
                                    <span className="absolute bottom-2 left-2 w-6 h-6 bg-black/60 text-white text-[10px] font-mono rounded flex items-center justify-center z-10">
                                        {i + 1}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {images.length === 0 && !uploading && (
                <p className="text-[10px] text-gray-600 text-center mt-1">
                    Ziadne fotky. Nahrajte prvu fotku kliknutim alebo pretiahnutim.
                </p>
            )}
        </div>
    );
}
