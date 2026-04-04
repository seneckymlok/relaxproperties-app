"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useFavorites } from "@/contexts/FavoritesContext";
import type { Dictionary } from "@/lib/dictionaries";

interface PropertyCardProps {
  id: string | number;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: number;
  images: string[];
  featured?: boolean;
  compact?: boolean;
  lang?: string;
  dictionary?: Dictionary;
  previewTags?: string[];
  distanceFromSea?: number | null;
  propertyIdExternal?: string | null;
}

export default function PropertyCard({
  id,
  title,
  location,
  price,
  beds,
  baths,
  area,
  images,
  featured = false,
  compact = false,
  lang = 'sk',
  dictionary,
  previewTags = [],
  distanceFromSea,
  propertyIdExternal,
}: PropertyCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(id);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
    if (!favorited) {
      setHeartAnimating(true);
      setTimeout(() => setHeartAnimating(false), 500);
    }
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(i => (i + 1) % images.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(i => (i - 1 + images.length) % images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setCurrentIndex(i =>
        diff > 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length
      );
    }
  };

  const featuredLabel = dictionary?.common?.featured || 'Featured';
  const addToFavoritesLabel = dictionary?.common?.addToFavorites || 'Add to favorites';
  const removeFromFavoritesLabel = dictionary?.common?.removeFromFavorites || 'Remove from favorites';

  const tagLabels: Record<string, string> = {
    pool: lang === 'en' ? 'Pool' : 'Bazén',
    garden: lang === 'en' ? 'Garden' : lang === 'cz' ? 'Zahrada' : 'Záhrada',
    balcony: lang === 'en' ? 'Balcony' : 'Balkón',
    terrace: lang === 'en' ? 'Terrace' : 'Terasa',
    parking: lang === 'en' ? 'Parking' : lang === 'cz' ? 'Parkování' : 'Parkovanie',
    sea_view: lang === 'en' ? 'Sea View' : lang === 'cz' ? 'Výhled na moře' : 'Výhľad na more',
    first_line: lang === 'en' ? 'Beachfront' : lang === 'cz' ? 'První linie' : 'Prvá línia',
    new_build: lang === 'en' ? 'New Build' : 'Novostavba',
    new_project: lang === 'en' ? 'New Project' : lang === 'cz' ? 'Nový projekt' : 'Nový projekt',
    luxury: lang === 'en' ? 'Luxury' : 'Luxus',
    golf: 'Golf',
    mountains: lang === 'en' ? 'Mountains' : 'Hory',
    near_airport: lang === 'en' ? 'Near Airport' : lang === 'cz' ? 'Blízko letiště' : 'Blízko letiska',
    near_beach: lang === 'en' ? 'Near Beach' : lang === 'cz' ? 'Blízko pláže' : 'Blízko pláže',
    loggia: lang === 'en' ? 'Loggia' : 'Lodžia',
    cellar: lang === 'en' ? 'Cellar' : lang === 'cz' ? 'Sklep' : 'Pivnica',
    grand_garden: lang === 'en' ? 'Large Garden' : lang === 'cz' ? 'Velká zahrada' : 'Veľká záhrada',
    near_golf: lang === 'en' ? 'Near Golf' : lang === 'cz' ? 'Blízko golfu' : 'Blízko golfu',
  };

  return (
    <Link href={`/${lang}/properties/${id}`} className="block h-full">
      <article className="group h-full bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1 flex flex-col">
        {/* Image carousel */}
        <div
          className={`relative ${compact ? "h-[clamp(10rem,28vw,12rem)]" : "aspect-[4/3]"} overflow-hidden bg-[var(--color-surface)] property-image-watermark`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Single image — swap on navigation */}
          <Image
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${title} - foto ${currentIndex + 1}`}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 768px) 60vw, (max-width: 1024px) 50vw, 25vw"
            quality={65}
            loading={currentIndex === 0 ? "eager" : "lazy"}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />

          {/* Desktop navigation arrows */}
          {images.length > 1 && !isTouchDevice && (
            <>
              <button
                onClick={goPrev}
                aria-label="Previous image"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm backdrop-blur-sm"
              >
                <svg className="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goNext}
                aria-label="Next image"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm backdrop-blur-sm"
              >
                <svg className="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Mobile pagination dots — max 5 visible */}
          {images.length > 1 && isTouchDevice && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
              {(images.length <= 5 ? images : images.slice(0, 5)).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-200 ${
                    images.length <= 5
                      ? (i === currentIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50')
                      : (i === Math.min(currentIndex, 4) ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50')
                  }`}
                />
              ))}
            </div>
          )}

          {/* Preview Tags — top left */}
          {previewTags.length > 0 && (
            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none max-w-[75%]">
              {previewTags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-[3px] text-[9px] font-semibold uppercase tracking-wider text-[var(--color-teal)] bg-white/70 backdrop-blur-sm rounded shadow-sm"
                >
                  {tagLabels[tag] || tag}
                </span>
              ))}
            </div>
          )}

          {/* Featured Badge */}
          {featured && (
            <span className={`absolute left-3 z-10 px-3 py-1 text-[10px] font-medium uppercase tracking-widest bg-[var(--color-accent)] text-white rounded-full ${previewTags.length > 0 ? "top-10" : "top-3"}`}>
              {featuredLabel}
            </span>
          )}

          {/* Property ID badge — bottom left of image */}
          {propertyIdExternal && (
            <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 px-2 py-[3px] bg-black/40 backdrop-blur-sm text-white text-[10px] font-mono font-medium rounded tracking-wide pointer-events-none">
              {propertyIdExternal}
            </span>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="group/fav absolute top-3 right-3 z-10 w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-sm transition-all active:scale-95 backdrop-blur-sm"
            title={favorited ? removeFromFavoritesLabel : addToFavoritesLabel}
          >
            <svg
              className={`w-5 h-5 transition-colors ${favorited ? "text-red-500 fill-red-500" : "text-[var(--color-muted)] group-hover/fav:text-red-400"} ${heartAnimating ? "heart-burst" : ""}`}
              fill={favorited ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={`${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"} flex flex-col flex-1`}>
          <p className={`font-serif ${compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"} text-[var(--color-teal)] mb-1.5 tabular-nums`}>
            {price}
          </p>
          <h3 className={`font-medium text-[var(--color-teal)] md:text-[var(--color-secondary)] ${compact ? "text-sm" : "text-sm sm:text-base"} mb-1.5 group-hover:text-[var(--color-teal)] transition-colors line-clamp-1`}>
            {title}
          </h3>
          <p className="text-[var(--color-muted)] text-xs sm:text-sm mb-4 line-clamp-2">{location}</p>

          <div className="mt-auto">
            <div className="flex items-center gap-0 text-xs sm:text-sm text-[var(--color-muted)]">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9M21 7.5v9M3 16.5h18M3 12h18M7.5 12V9a1.5 1.5 0 011.5-1.5h6A1.5 1.5 0 0116.5 9v3" />
                </svg>
                <span>{beds}</span>
              </div>
              <span className="mx-2.5 text-[var(--color-border-dark)]">|</span>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12V5.5A2.5 2.5 0 016.5 3v0A2.5 2.5 0 019 5.5V6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20v4a4 4 0 01-4 4H6a4 4 0 01-4-4v-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 20v1.5M18 20v1.5" />
                </svg>
                <span>{baths}</span>
              </div>
              <span className="mx-2.5 text-[var(--color-border-dark)]">|</span>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                <span>{area} m²</span>
              </div>
            </div>
            {distanceFromSea != null && distanceFromSea > 0 && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--color-muted)] mt-1.5">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 18c2.4-1.6 4.8-1.6 7.2 0 2.4 1.6 4.8 1.6 7.2 0 2.4-1.6 3.6-1.6 3.6-1.6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13c2.4-1.6 4.8-1.6 7.2 0 2.4 1.6 4.8 1.6 7.2 0 2.4-1.6 3.6-1.6 3.6-1.6" />
                </svg>
                <span>{distanceFromSea >= 1000 ? `${(distanceFromSea / 1000).toFixed(1)} km` : `${distanceFromSea} m`}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
