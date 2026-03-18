"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";

const countryIds = ["bulgaria", "croatia", "spain", "greece"] as const;
type CountryId = typeof countryIds[number];

/* Advantage icons — lightweight inline SVGs */
const advantageIcons = [
    // Shield (Legal Security)
    <svg key="shield" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>,
    // Chart (Investment Potential)
    <svg key="chart" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>,
    // People (Personal Guidance)
    <svg key="people" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>,
    // Transparency (No Hidden Fees)
    <svg key="transparency" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>,
];

export default function BuyingProcessPage() {
    const params = useParams();
    const lang = (params?.lang as string) || 'sk';
    const validLang = (['sk', 'en', 'cz'].includes(lang) ? lang : 'sk') as Language;
    const dictionary = getDictionary(validLang);
    const t = dictionary.buyingProcess as any;

    const [selectedCountry, setSelectedCountry] = useState<CountryId>("bulgaria");
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
    const [heroImage, setHeroImage] = useState("https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80");
    const country = (t.countries as any)[selectedCountry];

    useEffect(() => {
        fetch('/api/page-heroes?page=buying-process')
            .then(res => res.json())
            .then(data => { if (data.image_url) setHeroImage(data.image_url); })
            .catch(() => {});
    }, []);

    const toggleStep = (index: number) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const readMoreLabel = lang === 'en' ? 'Read more' : lang === 'cz' ? 'Číst více' : 'Čítať viac';
    const readLessLabel = lang === 'en' ? 'Read less' : lang === 'cz' ? 'Číst méně' : 'Čítať menej';

    return (
        <div className="min-h-screen bg-[var(--color-background)]">

            {/* =============================================
                SECTION 1: Cinematic Hero
                ============================================= */}
            <section className="relative h-96 md:h-[500px] bg-[var(--color-primary)]">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: `url('${heroImage}')`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)] via-transparent to-transparent" />
                <div className="relative container-custom h-full flex flex-col justify-center items-center text-center text-white pt-16">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sand-light)] mb-3">
                        {t.subtitle}
                    </p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-6">
                        {t.heroTitle}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl">
                        {t.heroText}
                    </p>
                </div>
            </section>

            {/* =============================================
                SECTION 2: Interactive Country Selector
                ============================================= */}
            <section className="py-12 md:py-16 bg-white border-b border-[var(--color-border)]">
                <div className="container-custom px-4 sm:px-6">
                    <div className="text-center mb-8 md:mb-10">
                        <p className="text-sm text-[var(--color-muted)]">
                            {t.selectCountry}
                        </p>
                    </div>

                    {/* Country Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-10 md:mb-12">
                        {countryIds.map((id) => {
                            const c = (t.countries as any)[id];
                            const isActive = selectedCountry === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => { setSelectedCountry(id); setExpandedSteps(new Set()); }}
                                    className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all duration-300 cursor-pointer ${isActive
                                            ? "border-[var(--color-accent)] bg-white shadow-lg scale-[1.02]"
                                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30 hover:shadow-md"
                                        }`}
                                >
                                    <span className="text-2xl sm:text-3xl block mb-1.5">{c.flag}</span>
                                    <span className={`font-serif text-sm sm:text-base block transition-colors ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-secondary)]"
                                        }`}>
                                        {c.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Country Intro + Highlights */}
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-base sm:text-lg text-[var(--color-foreground)] leading-relaxed mb-5">
                            {country.intro}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {country.highlights.map((h: string, i: number) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)] text-xs sm:text-sm font-medium rounded-full"
                                >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {h}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* =============================================
                SECTION 3: Process Timeline
                ============================================= */}
            <section className="py-16 sm:py-20 md:py-28 bg-[var(--color-surface)]">
                <div className="container-custom px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
                        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                            {country.name}
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-secondary)]">
                            {t.stepsTitle}
                        </h2>
                    </div>

                    {/* Desktop: Horizontal Timeline */}
                    <div className="hidden md:block max-w-5xl mx-auto">
                        {/* Connector line */}
                        <div className="relative flex items-start justify-between">
                            <div className="absolute top-6 left-[10%] right-[10%] h-px bg-[var(--color-accent)]/30" />

                            {country.process.map((step: { title: string; description: string }, index: number) => {
                                const isExpanded = expandedSteps.has(index);
                                return (
                                <div key={index} className="relative flex flex-col items-center text-center w-1/5 px-2">
                                    {/* Step Circle */}
                                    <button
                                        onClick={() => toggleStep(index)}
                                        className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center z-10 mb-5 shadow-md cursor-pointer hover:scale-110 transition-transform"
                                    >
                                        <span className="font-serif text-lg text-white font-medium">
                                            {index + 1}
                                        </span>
                                    </button>
                                    {/* Step Content */}
                                    <h3
                                        className="font-medium text-[var(--color-secondary)] text-sm lg:text-base mb-2 leading-tight cursor-pointer hover:text-[var(--color-primary)] transition-colors"
                                        onClick={() => toggleStep(index)}
                                    >
                                        {step.title}
                                    </h3>
                                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <p className="text-xs lg:text-sm text-[var(--color-muted)] leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleStep(index)}
                                        className="text-[10px] text-[var(--color-primary)] mt-1 hover:underline cursor-pointer"
                                    >
                                        {isExpanded ? readLessLabel : readMoreLabel}
                                    </button>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile: Vertical Timeline */}
                    <div className="md:hidden max-w-lg mx-auto">
                        <div className="space-y-0">
                            {country.process.map((step: { title: string; description: string }, index: number) => {
                                const isExpanded = expandedSteps.has(index);
                                return (
                                <div key={index} className="relative flex gap-4 sm:gap-6">
                                    {/* Timeline rail */}
                                    <div className="flex flex-col items-center">
                                        <button
                                            onClick={() => toggleStep(index)}
                                            className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer"
                                        >
                                            <span className="font-serif text-base text-white font-medium">
                                                {index + 1}
                                            </span>
                                        </button>
                                        {index < country.process.length - 1 && (
                                            <div className="w-px h-full min-h-[48px] bg-[var(--color-accent)]/30" />
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="pb-8 pt-1.5">
                                        <h3
                                            className="font-medium text-[var(--color-secondary)] text-base mb-1.5 cursor-pointer"
                                            onClick={() => toggleStep(index)}
                                        >
                                            {step.title}
                                        </h3>
                                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleStep(index)}
                                            className="text-xs text-[var(--color-primary)] mt-1 hover:underline cursor-pointer"
                                        >
                                            {isExpanded ? readLessLabel : readMoreLabel}
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* =============================================
                SECTION 4: Why Buy Abroad — Advantages Grid
                ============================================= */}
            <section className="py-16 sm:py-20 md:py-28 bg-white">
                <div className="container-custom px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
                        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                            {t.subtitle}
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-secondary)]">
                            {t.advantagesTitle}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
                        {t.advantages.map((adv: { title: string; description: string }, index: number) => (
                            <div
                                key={index}
                                className="p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-lg transition-all group"
                            >
                                <div className="w-14 h-14 mb-5 flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-2xl group-hover:scale-110 transition-transform">
                                    {advantageIcons[index]}
                                </div>
                                <h3 className="text-lg font-medium text-[var(--color-secondary)] mb-2">
                                    {adv.title}
                                </h3>
                                <p className="text-[var(--color-muted)] leading-relaxed text-sm sm:text-base">
                                    {adv.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* =============================================
                SECTION 5: FAQ Accordion
                ============================================= */}
            <section className="py-16 sm:py-20 md:py-28 bg-[var(--color-surface)]">
                <div className="container-custom px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                            FAQ
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-secondary)]">
                            {t.faqTitle}
                        </h2>
                    </div>
                    <div className="max-w-3xl mx-auto space-y-4">
                        {t.faq.map((faq: { q: string; a: string }, index: number) => (
                            <details
                                key={index}
                                className="group p-6 bg-white rounded-xl border border-[var(--color-border)] cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <summary className="flex items-center justify-between font-medium text-[var(--color-secondary)] list-none">
                                    {faq.q}
                                    <svg
                                        className="w-5 h-5 text-[var(--color-muted)] group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <p className="mt-4 text-[var(--color-foreground)] leading-relaxed">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* =============================================
                SECTION 6: Full-Width CTA Band
                ============================================= */}
            <section className="py-20 md:py-28 bg-[var(--color-primary)]">
                <div className="container-custom text-center px-4 sm:px-6">
                    <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">
                        {t.readyTitle}
                    </h2>
                    <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                        {t.readyText}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={`/${validLang}/contact`}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[var(--color-primary)] font-medium rounded-full hover:bg-white/90 transition-colors"
                        >
                            {t.contactUs}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                        <Link
                            href={`/${validLang}/properties?country=${selectedCountry}`}
                            className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white font-medium rounded-full hover:bg-white/10 transition-colors"
                        >
                            {t.viewProperties} {country.name}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
