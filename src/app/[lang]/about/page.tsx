import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";
import { getPageHero } from "@/lib/page-hero-store";
import MagneticButton from "@/components/ui/MagneticButton";

// Team members data
const teamMembers = [
    {
        name: "Mgr. Viera Dvořáková",
        role: "Sales property manager",
        image: "/images/team/tatiana_tothova.png",
        phones: [{ number: "+421 911 819 152", label: "" }],
        email: "info@relaxproperties.sk",
        languages: ["sk", "en"],
    },
    {
        name: "Mgr. Aleš Dvořák",
        role: "Executive Manager",
        image: "/images/team/ales_dvorak.jpg",
        phones: [
            { number: "+421 911 989 895", label: "" },
            { number: "+420 739 049 593", label: "" }
        ],
        email: "info@relaxproperties.cz",
        languages: ["cz", "en"],
    },
    {
        name: "Bc. Tatiana Tóthová",
        role: "Property Sales Manager ES",
        image: "/images/team/viera_dvorakova.jpg",
        phones: [
            { number: "+421 911 353 550", label: "" },
            { number: "+420 739 049 614", label: "" }
        ],
        email: "spanielsko@relaxproperties.sk",
        languages: ["sk", "es"],
    },
];

// Service icons
const serviceIcons = [
    // Magnifying glass — finding property
    <svg key="s1" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>,
    // Eye — viewings
    <svg key="s2" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>,
    // Scale — legal & financial
    <svg key="s3" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>,
    // Document check — detailed research
    <svg key="s4" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
    </svg>,
    // Shield — insurance
    <svg key="s5" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>,
    // Chat bubbles — advisory & contacts
    <svg key="s6" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>,
];

// Why Us icons
const whyUsIcons = [
    // Building/house — complete service
    <svg key="w1" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
    </svg>,
    // Eye/transparency — transparency
    <svg key="w2" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>,
    // Heart/user — individual approach
    <svg key="w3" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>,
    // Globe — local market knowledge
    <svg key="w4" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>,
];

export default async function AboutPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;
    const validLang = (['sk', 'en', 'cz'].includes(lang) ? lang : 'sk') as Language;
    const dictionary = getDictionary(validLang);
    const t = dictionary.about;

    let heroImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80";
    try {
        const hero = await getPageHero('about');
        if (hero?.image_url) heroImage = hero.image_url;
    } catch {}

    return (
        <>
            {/* =============================================
                HERO — Cinematic full-bleed
                ============================================= */}
            <section className="relative h-96 md:h-[500px] bg-[var(--color-primary)]">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url('${heroImage}')` }}
                />
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
                INTRO — Two paragraphs + Google reviews badge
                ============================================= */}
            <section className="py-[clamp(4rem,7vw,9rem)] bg-white">
                <div className="container-custom">
                    <div className="relative max-w-4xl mx-auto text-center">
                        {/* Decorative oversized quotation mark */}
                        <span
                            className="absolute -top-12 left-1/2 -translate-x-1/2 font-serif text-[10rem] md:text-[14rem] leading-none text-[var(--color-primary)]/[0.06] select-none pointer-events-none"
                            aria-hidden="true"
                        >
                            &ldquo;
                        </span>

                        <p className="relative text-xl md:text-2xl leading-relaxed md:leading-relaxed text-[var(--color-foreground)] font-light">
                            {t.intro}
                        </p>

                        <p className="relative mt-6 text-base md:text-lg leading-relaxed text-[var(--color-muted)]">
                            {t.introSecondary}
                        </p>

                        {/* Google Reviews badge */}
                        <div className="mt-10 inline-flex items-center gap-3 px-6 py-3 bg-[var(--color-surface)] rounded-full border border-[var(--color-border)]">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="text-sm font-medium text-[var(--color-secondary)]">
                                {t.googleReviews}
                            </span>
                        </div>
                    </div>

                    {/* Partner types strip */}
                    <div className="mt-16 md:mt-20 flex flex-col items-center">
                        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-muted)] mb-5">
                            {t.partnersLabel}
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 md:gap-x-4">
                            {(t.partners as string[]).map((partner: string, index: number) => (
                                <span key={index} className="flex items-center gap-3 md:gap-4">
                                    <span className="text-sm md:text-base text-[var(--color-secondary)] tracking-wide">
                                        {partner}
                                    </span>
                                    {index < (t.partners as string[]).length - 1 && (
                                        <span className="w-1 h-1 rounded-full bg-[var(--color-primary)]/40" aria-hidden="true" />
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* =============================================
                WHY US — 2x2 card grid with icons
                ============================================= */}
            <section className="py-[clamp(3rem,5.5vw,7rem)] bg-[var(--color-primary)]">
                <div className="container-custom">
                    <div className="text-center max-w-2xl mx-auto mb-6 md:mb-8">
                        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sand-light)] mb-3">
                            {t.whyUsSubtitle}
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl text-white">
                            {t.whyUsTitle}
                        </h2>
                    </div>
                    <p className="text-center text-white/60 text-base md:text-lg max-w-2xl mx-auto mb-14 md:mb-18">
                        {t.whyUsIntro}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
                        {(t.whyUs as { title: string; description: string }[]).map((item, index) => (
                            <div
                                key={index}
                                className="group relative overflow-hidden rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/10 p-8 md:p-9 hover:bg-white/[0.12] hover:border-white/20 transition-all duration-300"
                            >
                                {/* Decorative number */}
                                <span className="absolute top-4 right-6 font-serif text-[6rem] leading-none text-white/[0.04] select-none pointer-events-none" aria-hidden="true">
                                    {String(index + 1).padStart(2, '0')}
                                </span>

                                <div className="relative w-14 h-14 mb-5 flex items-center justify-center bg-white/10 text-[var(--color-sand-light)] rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                    {whyUsIcons[index]}
                                </div>

                                <h3 className="relative text-lg md:text-xl font-medium text-white mb-3">
                                    {item.title}
                                </h3>
                                <p className="relative text-white/65 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* =============================================
                SERVICES — Bento grid with hierarchy
                First service full-width featured, then 2-col pairs
                ============================================= */}
            <section className="py-[clamp(3rem,5.5vw,7rem)] bg-[var(--color-surface)]">
                <div className="container-custom">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                            {t.servicesSubtitle}
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-secondary)]">
                            {t.servicesTitle}
                        </h2>
                    </div>

                    <div className="max-w-5xl mx-auto space-y-5">
                        {/* Featured first service — full-width, horizontal layout */}
                        <div className="group relative overflow-hidden rounded-2xl bg-[var(--color-primary)] p-8 md:p-10 md:flex md:items-center md:gap-10 transition-all duration-300 hover:shadow-xl">
                            <span className="absolute top-4 right-6 md:right-10 font-serif text-[8rem] md:text-[10rem] leading-none text-white/[0.04] select-none pointer-events-none" aria-hidden="true">
                                01
                            </span>
                            <div className="relative shrink-0 w-16 h-16 mb-5 md:mb-0 flex items-center justify-center bg-white/10 text-white rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                {serviceIcons[0]}
                            </div>
                            <div className="relative">
                                <h3 className="text-xl md:text-2xl font-medium text-white mb-2">
                                    {(t.services as { title: string; description: string }[])[0].title}
                                </h3>
                                <p className="text-white/70 leading-relaxed md:text-lg">
                                    {(t.services as { title: string; description: string }[])[0].description}
                                </p>
                            </div>
                        </div>

                        {/* Services 2 & 3 — two columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="group relative overflow-hidden rounded-2xl bg-white border border-[var(--color-border)] p-8 hover:border-[var(--color-primary)]/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <span className="absolute top-3 right-5 font-serif text-[6rem] leading-none text-[var(--color-primary)]/[0.04] select-none pointer-events-none" aria-hidden="true">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <div className="relative w-14 h-14 mb-5 flex items-center justify-center bg-[var(--color-teal)]/10 text-[var(--color-teal)] rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                        {serviceIcons[i]}
                                    </div>
                                    <h3 className="relative text-lg font-medium text-[var(--color-secondary)] mb-2">
                                        {(t.services as { title: string; description: string }[])[i].title}
                                    </h3>
                                    <p className="relative text-[var(--color-muted)] leading-relaxed">
                                        {(t.services as { title: string; description: string }[])[i].description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Service 4 — full-width detail card */}
                        <div className="group relative overflow-hidden rounded-2xl bg-white border border-[var(--color-border)] p-8 md:p-10 md:flex md:items-center md:gap-10 hover:border-[var(--color-teal)]/30 hover:shadow-lg transition-all duration-300">
                            <span className="absolute top-4 right-6 md:right-10 font-serif text-[8rem] md:text-[10rem] leading-none text-[var(--color-primary)]/[0.03] select-none pointer-events-none" aria-hidden="true">
                                04
                            </span>
                            <div className="relative shrink-0 w-16 h-16 mb-5 md:mb-0 flex items-center justify-center bg-[var(--color-teal)]/10 text-[var(--color-teal)] rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                {serviceIcons[3]}
                            </div>
                            <div className="relative">
                                <h3 className="text-xl md:text-2xl font-medium text-[var(--color-secondary)] mb-2">
                                    {(t.services as { title: string; description: string }[])[3].title}
                                </h3>
                                <p className="text-[var(--color-muted)] leading-relaxed md:text-lg">
                                    {(t.services as { title: string; description: string }[])[3].description}
                                </p>
                            </div>
                        </div>

                        {/* Services 5 & 6 — two columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="group relative overflow-hidden rounded-2xl bg-white border border-[var(--color-border)] p-8 hover:border-[var(--color-primary)]/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <span className="absolute top-3 right-5 font-serif text-[6rem] leading-none text-[var(--color-primary)]/[0.04] select-none pointer-events-none" aria-hidden="true">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <div className="relative w-14 h-14 mb-5 flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                        {serviceIcons[i]}
                                    </div>
                                    <h3 className="relative text-lg font-medium text-[var(--color-secondary)] mb-2">
                                        {(t.services as { title: string; description: string }[])[i].title}
                                    </h3>
                                    <p className="relative text-[var(--color-muted)] leading-relaxed">
                                        {(t.services as { title: string; description: string }[])[i].description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* =============================================
                VISION — Editorial trust section
                ============================================= */}
            <section className="py-[clamp(3rem,5.5vw,7rem)] bg-white">
                <div className="container-custom">
                    <div className="max-w-5xl mx-auto md:flex md:gap-16 md:items-start">
                        {/* Left — heading + lead text */}
                        <div className="md:w-2/5 mb-10 md:mb-0 md:sticky md:top-32">
                            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                                {t.visionSubtitle}
                            </p>
                            <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-secondary)] mb-6">
                                {t.visionTitle}
                            </h2>
                            <p className="text-[var(--color-muted)] leading-relaxed text-base md:text-lg">
                                {t.visionText}
                            </p>
                        </div>

                        {/* Right — vision points */}
                        <div className="md:w-3/5">
                            <div className="space-y-0">
                                {(t.visionPoints as string[]).map((point: string, index: number) => (
                                    <div key={index} className="flex gap-5 py-7 border-b border-[var(--color-border)] last:border-b-0">
                                        {/* Check icon */}
                                        <div className="shrink-0 w-10 h-10 mt-0.5 flex items-center justify-center rounded-full bg-[var(--color-teal)]/10 text-[var(--color-teal)]">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                                            </svg>
                                        </div>
                                        <p className="text-[var(--color-foreground)] leading-relaxed text-base md:text-lg pt-1.5">
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =============================================
                TEAM — Circular photos, lift effect
                ============================================= */}
            <section className="py-[clamp(3rem,5.5vw,7rem)] bg-[var(--color-surface)]">
                <div className="container-custom">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                            {t.teamSubtitle}
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-secondary)]">
                            {t.teamTitle}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                className="group bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="pt-8 px-6 flex justify-center">
                                    <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-shadow">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 pt-4 text-center">
                                    <h3 className="text-lg font-medium text-[var(--color-secondary)] mb-0.5">
                                        {member.name}
                                    </h3>
                                    <p className="text-[var(--color-teal)] text-sm font-medium mb-4">
                                        {member.role}
                                    </p>
                                    <div className="space-y-1.5 mb-4 text-sm text-[var(--color-muted)]">
                                        {member.phones.map((phone, idx) => (
                                            <div key={idx}>
                                                {phone.label && <span className="mr-1 inline-block">{phone.label}</span>}
                                                <a href={`tel:${phone.number.replace(/\s/g, '')}`} className="hover:text-[var(--color-teal)] transition-colors">
                                                    {phone.number}
                                                </a>
                                            </div>
                                        ))}
                                        <div>
                                            <a href={`mailto:${member.email}`} className="hover:text-[var(--color-teal)] transition-colors">
                                                {member.email}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-[var(--color-border)]">
                                        <p className="text-xs text-[var(--color-muted)] mb-2">{t.teamLanguages}</p>
                                        <div className="flex justify-center gap-2 text-xl">
                                            {member.languages.map((memberLang, idx) => (
                                                <span key={idx} title={memberLang}>
                                                    {memberLang === 'sk' && '🇸🇰'}
                                                    {memberLang === 'cz' && '🇨🇿'}
                                                    {memberLang === 'en' && '🇬🇧'}
                                                    {memberLang === 'es' && '🇪🇸'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* =============================================
                CTA — Dark band with pill buttons
                ============================================= */}
            <section className="py-[clamp(3rem,5.5vw,7rem)] bg-[var(--color-primary)]">
                <div className="container-custom text-center">
                    <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">
                        {t.ctaTitle}
                    </h2>
                    <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                        {t.ctaText}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <MagneticButton strength={0.15}>
                            <Link
                                href={`/${validLang}/properties`}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[var(--color-primary)] font-medium rounded-full hover:bg-white/90 transition-colors"
                            >
                                {dictionary.common.browseProperties}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </MagneticButton>
                        <MagneticButton strength={0.15}>
                            <Link
                                href={`/${validLang}/contact`}
                                className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white font-medium rounded-full hover:bg-white/10 transition-colors"
                            >
                                {dictionary.common.contactUs}
                            </Link>
                        </MagneticButton>
                    </div>
                </div>
            </section>
        </>
    );
}
