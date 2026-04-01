"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import MagneticButton from "@/components/ui/MagneticButton";
import type { Dictionary } from "@/lib/dictionaries";

interface Review {
    name: string;
    rating: number;
    text: string;
    timeAgo: string;
    timestamp: number;
    photo: string | null;
    language: string;
}

interface ReviewsSectionProps {
    lang?: string;
    dictionary?: Dictionary;
}

// Fallback reviews in case the API is unavailable
const FALLBACK_REVIEWS: Review[] = [
    {
        name: "Martin Kováč",
        rating: 5,
        text: "Skvelá spolupráca! Pomohli nám nájsť perfektný apartmán v Chorvátsku. Profesionálny prístup a osobná starostlivosť po celú dobu.",
        timeAgo: "",
        timestamp: 0,
        photo: null,
        language: "sk",
    },
    {
        name: "Jana Novotná",
        rating: 5,
        text: "Výborná komunikácia a odborné poradenstvo. Vďaka Relax Properties sme si splnili sen o dome pri mori v Španielsku.",
        timeAgo: "",
        timestamp: 0,
        photo: null,
        language: "sk",
    },
    {
        name: "Peter Horváth",
        rating: 5,
        text: "Bezproblémový priebeh celého nákupu. Tím bol vždy k dispozícii a poradil s každým detailom. Vrelo odporúčam!",
        timeAgo: "",
        timestamp: 0,
        photo: null,
        language: "sk",
    },
];

const ROTATION_INTERVAL = 8000; // 8 seconds per review — enough time to read
const VISIBLE_COUNT_DESKTOP = 3;

export default function ReviewsSection({ lang = "sk", dictionary }: ReviewsSectionProps) {
    const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);
    const [rating, setRating] = useState(5);
    const [totalReviews, setTotalReviews] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const reviewsHeaderRef = useScrollReveal<HTMLDivElement>({ y: 40 });

    useEffect(() => {
        async function fetchReviews() {
            try {
                const res = await fetch(`/api/reviews?lang=${lang}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.reviews && data.reviews.length > 0) {
                    setReviews(data.reviews);
                    setRating(data.rating || 5);
                    setTotalReviews(data.totalReviews || 0);
                }
            } catch {
                // Keep fallback reviews
            }
        }
        fetchReviews();
    }, [lang]);

    // Auto-rotation
    const nextSlide = useCallback(() => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % Math.max(1, reviews.length - VISIBLE_COUNT_DESKTOP + 1));
            setIsTransitioning(false);
        }, 300);
    }, [reviews.length]);

    useEffect(() => {
        if (isPaused || reviews.length <= VISIBLE_COUNT_DESKTOP) return;

        timerRef.current = setInterval(nextSlide, ROTATION_INTERVAL);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [nextSlide, isPaused, reviews.length]);

    // For mobile: simple single-card rotation
    const [mobileIndex, setMobileIndex] = useState(0);

    useEffect(() => {
        if (isPaused || reviews.length <= 1) return;
        const timer = setInterval(() => {
            setMobileIndex((prev) => (prev + 1) % reviews.length);
        }, ROTATION_INTERVAL);
        return () => clearInterval(timer);
    }, [isPaused, reviews.length]);

    // Desktop grid height lock — prevents page height jumping
    const desktopGridRef = useRef<HTMLDivElement>(null);
    const [desktopMinHeight, setDesktopMinHeight] = useState(0);

    useEffect(() => {
        if (!desktopGridRef.current) return;
        // Wait for transition to finish, then measure
        const timer = setTimeout(() => {
            const h = desktopGridRef.current?.offsetHeight ?? 0;
            if (h > 0) setDesktopMinHeight(prev => Math.max(prev, h));
        }, 350);
        return () => clearTimeout(timer);
    }, [currentIndex, isTransitioning]);

    const sectionSubtitle =
        lang === "en" ? "Reviews" : lang === "cz" ? "Recenze" : "Recenzie";
    const sectionTitle =
        dictionary?.home?.testimonials ||
        (lang === "en"
            ? "What Our Clients Say"
            : lang === "cz"
                ? "Co o nás říkají klienti"
                : "Čo o nás hovoria klienti");
    const viewAllLabel =
        lang === "en"
            ? "View all reviews on Google"
            : lang === "cz"
                ? "Zobrazit všechny recenze na Google"
                : "Zobraziť všetky recenzie na Google";
    const onGoogleReviews =
        lang === "en"
            ? "on Google Reviews"
            : lang === "cz"
                ? "na Google Recenzích"
                : "na Google Reviews";

    // Get initials for avatar fallback
    function getInitials(name: string) {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    function ReviewCard({ review }: { review: Review }) {
        return (
            <div className="relative bg-white rounded-2xl p-[clamp(1.5rem,4vw,2rem)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 h-full flex flex-col">
                {/* Oversized quote mark */}
                <span className="absolute top-4 right-6 font-serif text-[clamp(3.75rem,8vw,4.5rem)] text-[var(--color-accent)]/10 leading-none select-none pointer-events-none">
                    &ldquo;
                </span>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                        <svg
                            key={i}
                            className="w-4 h-4 sm:w-[18px] sm:h-[18px] fill-[var(--color-accent)]"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    ))}
                </div>

                {/* Quote text */}
                <p className="text-[clamp(0.875rem,2.5vw,1rem)] text-[var(--color-foreground)] leading-relaxed mb-6 relative z-10 flex-1">
                    {review.text}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3.5">
                    {review.photo ? (
                        <div className="relative w-[clamp(2.75rem,7vw,3rem)] h-[clamp(2.75rem,7vw,3rem)] rounded-full overflow-hidden ring-2 ring-[var(--color-accent)]/15 ring-offset-2 flex-shrink-0">
                            <Image
                                src={review.photo}
                                alt={review.name}
                                fill
                                sizes="3rem"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    ) : (
                        <div className="w-[clamp(2.75rem,7vw,3rem)] h-[clamp(2.75rem,7vw,3rem)] rounded-full bg-[var(--color-teal)]/10 flex items-center justify-center ring-2 ring-[var(--color-accent)]/15 ring-offset-2 flex-shrink-0">
                            <span className="text-sm font-semibold text-[var(--color-teal)]">
                                {getInitials(review.name)}
                            </span>
                        </div>
                    )}
                    <div>
                        <p className="text-[clamp(0.875rem,2.5vw,1rem)] font-medium text-[var(--color-secondary)]">
                            {review.name}
                        </p>
                        {review.timeAgo && (
                            <p className="text-xs sm:text-sm text-[var(--color-muted)]">
                                {review.timeAgo}
                            </p>
                        )}
                    </div>
                    {/* Google icon */}
                    <div className="ml-auto flex-shrink-0 opacity-40">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop visible reviews (sliding window)
    const desktopReviews = reviews.length <= VISIBLE_COUNT_DESKTOP
        ? reviews
        : reviews.slice(currentIndex, currentIndex + VISIBLE_COUNT_DESKTOP).length === VISIBLE_COUNT_DESKTOP
            ? reviews.slice(currentIndex, currentIndex + VISIBLE_COUNT_DESKTOP)
            : [...reviews.slice(currentIndex), ...reviews.slice(0, VISIBLE_COUNT_DESKTOP - (reviews.length - currentIndex))];

    return (
        <section className="py-[clamp(2.5rem,5vw,5rem)] bg-[var(--color-surface)]">
            <div className="container-custom">
                {/* Header */}
                <div ref={reviewsHeaderRef} className="text-center max-w-[42rem] mx-auto mb-[clamp(2.5rem,4vw,4rem)]">
                    <h2 className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] text-[var(--color-secondary)] mb-3">
                        {sectionTitle}
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-[var(--color-muted)]">
                        <span className="font-semibold text-[var(--color-secondary)]">
                            {rating.toFixed(1)}
                        </span>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                    key={star}
                                    className={`w-4 h-4 ${star <= Math.round(rating) ? "fill-[var(--color-accent)]" : "fill-gray-300"}`}
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-sm">
                            {onGoogleReviews}
                            {totalReviews > 0 && ` (${totalReviews})`}
                        </span>
                    </div>
                </div>

                {/* Mobile: Single card with fade rotation */}
                <div
                    className="md:hidden mb-[clamp(2rem,4vw,2.5rem)]"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
                >
                    <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                        {reviews.map((review, idx) => (
                            <div
                                key={idx}
                                className={`transition-all duration-500 col-start-1 row-start-1 ${idx === mobileIndex
                                    ? "opacity-100 translate-y-0 z-10"
                                    : "opacity-0 translate-y-2 pointer-events-none z-0"
                                    }`}
                            >
                                <ReviewCard review={review} />
                            </div>
                        ))}
                    </div>

                    {/* Dots indicator */}
                    {reviews.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-4">
                            {reviews.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setMobileIndex(idx)}
                                    className={`exclude-touch-size h-1.5 rounded-full transition-all duration-300 ${idx === mobileIndex
                                        ? "bg-[var(--color-primary)] w-5"
                                        : "bg-[var(--color-border-dark)] w-1.5"
                                        }`}
                                    aria-label={`Review ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop: 3-card grid with sliding rotation */}
                <div
                    className="hidden md:block mb-12"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        ref={desktopGridRef}
                        className={`grid grid-cols-3 gap-8 transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
                        style={desktopMinHeight > 0 ? { minHeight: desktopMinHeight } : undefined}
                    >
                        {desktopReviews.map((review, idx) => (
                            <ReviewCard key={`${review.name}-${review.timestamp}-${idx}`} review={review} />
                        ))}
                    </div>

                    {/* Progress dots */}
                    {reviews.length > VISIBLE_COUNT_DESKTOP && (
                        <div className="flex justify-center gap-1.5 mt-6">
                            {Array.from({ length: reviews.length - VISIBLE_COUNT_DESKTOP + 1 }).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setCurrentIndex(idx); setIsTransitioning(false); }}
                                    className={`exclude-touch-size h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                                        ? "bg-[var(--color-primary)] w-5"
                                        : "bg-[var(--color-border-dark)] w-1.5"
                                        }`}
                                    aria-label={`Page ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* View All Link */}
                <div className="text-center">
                    <MagneticButton strength={0.15}>
                        <a
                            href="https://www.google.com/maps/place/?q=place_id:ChIJs9H9jG3tbEcRmxBaz6M7cOw"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2 text-[var(--color-secondary)] font-medium hover:text-[var(--color-teal)] transition-colors text-sm tracking-wide"
                        >
                            {viewAllLabel}
                            <svg
                                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                    </MagneticButton>
                </div>
            </div>
        </section>
    );
}
