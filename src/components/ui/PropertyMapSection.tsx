"use client";

import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/ui/PropertyMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[380px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center">
            <svg className="w-6 h-6 animate-spin text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
        </div>
    ),
});

interface PropertyMapSectionProps {
    lat?: number | null;
    lng?: number | null;
    zoom?: number | null;
    title?: string;
    location?: string;
    lang?: string;
}

export default function PropertyMapSection({ lat, lng, zoom, title, location, lang = 'sk' }: PropertyMapSectionProps) {
    if (!lat || !lng) return null;

    const heading = lang === 'en' ? 'Location' : lang === 'cz' ? 'Lokalita' : 'Lokalita';

    return (
        <div className="py-6 border-t border-[var(--color-border)]">
            <h2 className="font-serif text-lg text-[var(--color-secondary)] mb-1">{heading}</h2>
            <span className="block w-8 h-px bg-[var(--color-accent)] mb-4" />
            {location && (
                <p className="text-sm text-[var(--color-muted)] mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {location}
                </p>
            )}
            <PropertyMap lat={lat} lng={lng} zoom={zoom || 14} title={title} />
        </div>
    );
}
