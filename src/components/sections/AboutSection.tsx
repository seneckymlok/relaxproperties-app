"use client";

import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Dictionary } from "@/lib/dictionaries";

import "swiper/css";
import "swiper/css/free-mode";

interface AboutSectionProps {
    lang?: string;
    dictionary?: Dictionary;
}

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

const langFlagMap: Record<string, string> = {
    sk: "🇸🇰",
    cz: "🇨🇿",
    en: "🇬🇧",
    es: "🇪🇸",
};

export default function AboutSection({ lang = 'sk', dictionary }: AboutSectionProps) {
    const sectionSubtitle = dictionary?.about?.subtitle || (lang === 'en' ? 'About Us' : lang === 'cz' ? 'O nás' : 'O nás');
    const sectionTitle = dictionary?.about?.heroTitle || (lang === 'en' ? 'Your Trusted Partner for Seaside Properties' : lang === 'cz' ? 'Váš spolehlivý partner pro nemovitosti u moře' : 'Váš Spolehlivý Partner pre Nehnuteľnosti pri Mori');
    const sectionDescription = lang === 'en'
        ? 'Welcome to Relax Properties, one of the leading Slovak real estate agencies specializing in premium seaside properties for over 15 years.'
        : lang === 'cz'
            ? 'Vítejte v Relax Properties, jedné z předních slovenských realitních kanceláří, která se více než 15 let specializuje na prodej prémiových nemovitostí u moře.'
            : 'Vitajte v Relax Properties, jednej z popredných slovenských realitných kancelárií, ktorá sa už viac ako 15 rokov špecializuje na predaj prémiových nehnuteľností pri mori.';
    const communicationLabel = lang === 'en' ? 'Communication:' : lang === 'cz' ? 'Komunikace:' : 'Komunikácia:';
    const learnMoreLabel = lang === 'en' ? 'Learn more about us' : lang === 'cz' ? 'Zjistit více o nás' : 'Zistiť viac o nás';

    function TeamMemberCard({ member }: { member: typeof teamMembers[0] }) {
        return (
            <div className="bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="pt-8 px-6 flex justify-center">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-2 ring-[var(--color-accent)]/20 ring-offset-4 ring-offset-white">
                        <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
                <div className="p-5 sm:p-6 pt-4 text-center">
                    <h3 className="text-base sm:text-lg font-medium text-[var(--color-secondary)] mb-0.5">
                        {member.name}
                    </h3>
                    <p className="text-[var(--color-accent)] text-xs sm:text-sm font-medium mb-4 tracking-wide">
                        {member.role}
                    </p>

                    {/* Phone */}
                    <div className="space-y-1.5 mb-3">
                        {member.phones.map((phone, idx) => (
                            <a
                                key={idx}
                                href={`tel:${phone.number.replace(/\s/g, '')}`}
                                className="flex items-center justify-center gap-2 py-1 text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {phone.number}
                            </a>
                        ))}
                    </div>

                    {/* Email */}
                    <a
                        href={`mailto:${member.email}`}
                        className="text-xs sm:text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                        {member.email}
                    </a>

                    {/* Languages */}
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        <p className="text-[10px] text-[var(--color-muted)] mb-2 uppercase tracking-wider">{communicationLabel}</p>
                        <div className="flex justify-center gap-2 text-xl">
                            {member.languages.map((memberLang, idx) => (
                                <span key={idx} title={memberLang}>
                                    {langFlagMap[memberLang] || memberLang}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section className="py-10 sm:py-12 md:py-16 lg:py-20 bg-[var(--color-primary)]">
            <div className="container-custom px-4 sm:px-6">
                {/* Header — light text on dark bg */}
                <div className="text-center max-w-[42rem] mx-auto mb-10 sm:mb-12 md:mb-16">
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white mb-4 sm:mb-6">
                        {sectionTitle}
                    </h2>
                    <p className="text-white/60 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                        {sectionDescription}
                    </p>
                </div>

                {/* Mobile: Swipeable Carousel */}
                <div className="md:hidden -mx-4 px-4 mb-8">
                    <Swiper
                        modules={[FreeMode]}
                        slidesPerView={1.15}
                        spaceBetween={12}
                        freeMode
                        breakpoints={{
                            480: { slidesPerView: 1.5, spaceBetween: 16 },
                            640: { slidesPerView: 2, spaceBetween: 16 },
                        }}
                        className="team-swiper !overflow-visible"
                        style={{ overflow: 'visible' }}
                    >
                        {teamMembers.map((member, index) => (
                            <SwiperSlide key={index} className="!h-auto">
                                <TeamMemberCard member={member} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Desktop: Grid */}
                <div className="hidden md:grid grid-cols-3 gap-8 mb-12">
                    {teamMembers.map((member, index) => (
                        <TeamMemberCard key={index} member={member} />
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        href={`/${lang}/about`}
                        className="group inline-flex items-center gap-2.5 text-white/80 font-medium hover:text-white transition-colors tracking-wide text-sm"
                    >
                        {learnMoreLabel}
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
