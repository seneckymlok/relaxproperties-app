"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

interface PhotoGalleryProps {
    images: string[];
    title: string;
}

export default function PhotoGallery({ images, title }: PhotoGalleryProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
        document.body.style.overflow = "hidden";
    }, []);

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
        document.body.style.overflow = "";
    }, []);

    // Desktop grid: show up to 5 images
    const gridImages = images.slice(0, 5);
    const sideImages = gridImages.slice(1);
    const extraCount = Math.max(0, images.length - 5);

    // Compute span classes for each side image based on how many there are
    function sideSpan(idx: number): string {
        const n = sideImages.length;
        if (n === 1) return "col-span-2 row-span-2";
        if (n === 2) return "col-span-2";
        if (n === 3 && idx === 2) return "col-span-2";
        return "";
    }

    const cellBase = "relative cursor-zoom-in overflow-hidden group";
    const imgHover = "object-cover transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-[1.08]";

    return (
        <>
            {/* ── Desktop: Bento Grid ───────────────────────────── */}
            {images.length === 1 ? (
                <div
                    className={`hidden md:block aspect-[21/9] rounded-2xl overflow-hidden ${cellBase}`}
                    onClick={() => openLightbox(0)}
                >
                    <Image src={images[0]} alt={`${title} - 1`} fill className={imgHover} priority />
                </div>
            ) : (
                <div className="hidden md:grid grid-cols-4 grid-rows-2 aspect-[21/9] gap-[3px] rounded-2xl overflow-hidden">
                    {/* Main image — left half */}
                    <div
                        className={`col-span-2 row-span-2 ${cellBase}`}
                        onClick={() => openLightbox(0)}
                    >
                        <Image
                            src={images[0]}
                            alt={`${title} - 1`}
                            fill
                            className={imgHover}
                            priority
                        />
                    </div>

                    {/* Side images — right half */}
                    {sideImages.map((img, i) => {
                        const globalIdx = i + 1;
                        const isLastCell = i === sideImages.length - 1;
                        const showOverlay = isLastCell && extraCount > 0;

                        return (
                            <div
                                key={globalIdx}
                                className={`${sideSpan(i)} ${cellBase}`}
                                onClick={() => showOverlay ? openLightbox(0) : openLightbox(globalIdx)}
                            >
                                <Image
                                    src={img}
                                    alt={`${title} - ${globalIdx + 1}`}
                                    fill
                                    className={`${imgHover} ${showOverlay ? "brightness-[0.45] group-hover:brightness-[0.55]" : ""}`}
                                />
                                {showOverlay && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                                        <svg className="w-7 h-7 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                        </svg>
                                        <span className="text-white text-sm font-semibold tracking-wide">
                                            +{extraCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Mobile: Swipeable Gallery ─────────────────────── */}
            <div className="md:hidden relative">
                <div className="overflow-x-auto snap-x snap-mandatory flex gap-[3px] rounded-xl scrollbar-hide">
                    {images.slice(0, 8).map((img, i) => (
                        <div
                            key={i}
                            className="snap-center shrink-0 first:pl-0 last:pr-0"
                            style={{ width: "85%" }}
                        >
                            <div
                                className={`relative aspect-[4/3] rounded-xl overflow-hidden ${cellBase}`}
                                onClick={() => openLightbox(i)}
                            >
                                <Image
                                    src={img}
                                    alt={`${title} - ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    priority={i === 0}
                                />
                                {/* Show "+N" on last visible slide if there are more */}
                                {i === 7 && images.length > 8 && (
                                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                        <span className="text-white text-lg font-semibold">+{images.length - 8}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Photo count badge */}
                <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                    1 / {images.length}
                </div>
            </div>

            {/* ── Lightbox ──────────────────────────────────────── */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/96 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close */}
                    <button
                        className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10"
                        onClick={closeLightbox}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Image */}
                    <div className="relative w-full max-w-6xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={images[lightboxIndex]}
                            alt={`${title} - ${lightboxIndex + 1}`}
                            width={1920}
                            height={1080}
                            className="object-contain w-full h-full"
                        />
                    </div>

                    {/* Prev / Next */}
                    {images.length > 1 && (
                        <>
                            <button
                                className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white bg-white/5 hover:bg-white/15 rounded-full transition-all"
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p === 0 ? images.length - 1 : p - 1)); }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white bg-white/5 hover:bg-white/15 rounded-full transition-all"
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p === images.length - 1 ? 0 : p + 1)); }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* Counter */}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
                        {lightboxIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </>
    );
}
