"use client";

import Image from "next/image";
import { useState, useCallback, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/free-mode";

interface PhotoGalleryProps {
    images: string[];
    title: string;
}

export default function PhotoGallery({ images, title }: PhotoGalleryProps) {
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const mainSwiperRef = useRef<SwiperType | null>(null);

    const openLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
        document.body.style.overflow = "hidden";
    }, []);

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
        document.body.style.overflow = "";
    }, []);

    const showDots = images.length > 1 && images.length <= 12;
    const showCount = images.length > 12;

    return (
        <>
            {/* ── Cinematic Hero Gallery ─────────────────────────── */}
            <div className="relative w-full h-[82vh] min-h-[420px] bg-black">
                <Swiper
                    modules={[Navigation, Thumbs]}
                    navigation={{
                        nextEl: ".gallery-next",
                        prevEl: ".gallery-prev",
                    }}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    onSwiper={(s) => { mainSwiperRef.current = s; }}
                    onSlideChange={(s) => setActiveIndex(s.activeIndex)}
                    className="w-full h-full"
                >
                    {images.map((image, index) => (
                        <SwiperSlide key={index}>
                            <div
                                className="relative w-full h-full cursor-zoom-in property-image-watermark"
                                onClick={() => openLightbox(index)}
                            >
                                <Image
                                    src={image}
                                    alt={`${title} - foto ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    priority={index === 0}
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none z-10" />

                {/* Navigation arrows */}
                {images.length > 1 && (
                    <>
                        <button className="gallery-prev absolute left-5 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-black/25 hover:bg-black/45 backdrop-blur-sm rounded-full transition-all border border-white/15 group">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button className="gallery-next absolute right-5 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-black/25 hover:bg-black/45 backdrop-blur-sm rounded-full transition-all border border-white/15 group">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Bottom bar: dots / count + All photos button */}
                <div className="absolute bottom-0 inset-x-0 z-20 px-5 md:px-8 pb-5 flex items-end justify-between gap-4">
                    {/* Dot indicators or count */}
                    <div className="flex items-center gap-[5px]">
                        {showDots && images.map((_, i) => (
                            <button
                                key={i}
                                aria-label={`Photo ${i + 1}`}
                                onClick={(e) => { e.stopPropagation(); mainSwiperRef.current?.slideTo(i); }}
                                className={`rounded-full transition-all duration-200 ${
                                    i === activeIndex
                                        ? "w-5 h-[5px] bg-white"
                                        : "w-[5px] h-[5px] bg-white/45 hover:bg-white/70"
                                }`}
                            />
                        ))}
                        {showCount && (
                            <span className="text-white/80 text-sm tabular-nums">
                                {activeIndex + 1} / {images.length}
                            </span>
                        )}
                        {images.length === 1 && null}
                    </div>

                    {/* All photos button */}
                    <button
                        onClick={() => openLightbox(activeIndex)}
                        className="flex items-center gap-2 px-4 py-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white text-sm font-medium rounded-lg border border-white/20 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                        {images.length}
                    </button>
                </div>
            </div>

            {/* ── Thumbnail strip ────────────────────────────────── */}
            {images.length > 1 && (
                <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0.625rem clamp(1.5rem, 4vw, 3rem)" }}>
                        <Swiper
                            onSwiper={setThumbsSwiper}
                            modules={[FreeMode, Thumbs]}
                            spaceBetween={8}
                            slidesPerView={5}
                            freeMode
                            watchSlidesProgress
                            breakpoints={{
                                480:  { slidesPerView: 6 },
                                640:  { slidesPerView: 7 },
                                768:  { slidesPerView: 9 },
                                1024: { slidesPerView: 11 },
                                1280: { slidesPerView: 13 },
                            }}
                            className="gallery-thumbs"
                        >
                            {images.map((image, index) => (
                                <SwiperSlide key={index}>
                                    <div className="relative aspect-[4/3] rounded-md overflow-hidden cursor-pointer opacity-50 hover:opacity-80 transition-opacity duration-150 [.swiper-slide-thumb-active_&]:opacity-100 [.swiper-slide-thumb-active_&]:ring-2 [.swiper-slide-thumb-active_&]:ring-[var(--color-teal)]">
                                        <Image
                                            src={image}
                                            alt={`Thumbnail ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            )}

            {/* ── Lightbox ───────────────────────────────────────── */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/96 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    <button
                        className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        onClick={closeLightbox}
                    >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="relative w-full max-w-6xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={images[lightboxIndex]}
                            alt={`${title} - foto ${lightboxIndex + 1}`}
                            width={1920}
                            height={1080}
                            className="object-contain w-full h-full"
                        />
                    </div>

                    {images.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p === 0 ? images.length - 1 : p - 1)); }}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p === images.length - 1 ? 0 : p + 1)); }}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
                        {lightboxIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </>
    );
}
