"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";

interface FooterProps {
    lang: Language;
    dictionary: Dictionary;
}

export default function Footer({ lang, dictionary }: FooterProps) {
    const currentYear = new Date().getFullYear();
    const [openSection, setOpenSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const navLinks = [
        { href: `/${lang}/properties`, label: dictionary.nav.properties },
        { href: `/${lang}/buying-process`, label: dictionary.nav.buyingProcess },
        { href: `/${lang}/about`, label: dictionary.nav.about },
        { href: `/${lang}/blog`, label: dictionary.nav.blog },
        { href: `/${lang}/contact`, label: dictionary.nav.contact },
    ];

    const countryLinks = [
        { href: `/${lang}/properties?country=bulgaria`, label: lang === 'sk' ? 'Nehnuteľnosti Bulharsko' : lang === 'cz' ? 'Nemovitosti Bulharsko' : 'Bulgaria Properties' },
        { href: `/${lang}/properties?country=croatia`, label: lang === 'sk' ? 'Nehnuteľnosti Chorvátsko' : lang === 'cz' ? 'Nemovitosti Chorvatsko' : 'Croatia Properties' },
        { href: `/${lang}/properties?country=spain`, label: lang === 'sk' ? 'Nehnuteľnosti Španielsko' : lang === 'cz' ? 'Nemovitosti Španělsko' : 'Spain Properties' },
    ];

    return (
        <footer className="bg-[var(--color-secondary)] text-white pt-10 sm:pt-12 md:pt-16 pb-6 sm:pb-8">
            <div className="container-custom px-4 sm:px-6">
                {/* Top Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-10 md:mb-16">
                    {/* Brand - Spans 2 cols on mobile */}
                    <div className="col-span-2 md:col-span-1 space-y-4 sm:space-y-6">
                        <Link href={`/${lang}`} className="flex items-center gap-2">
                            <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tight">Relax</span>
                            <span className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--color-muted)]">Properties</span>
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                            {dictionary.footer.description}
                        </p>
                        {/* Social Icons - Larger on mobile */}
                        <div className="flex gap-3 pt-2">
                            <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[var(--color-primary)] transition-colors" aria-label="Facebook">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                            </a>
                            <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[var(--color-primary)] transition-colors" aria-label="Instagram">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M7.5 3h9a4.5 4.5 0 014.5 4.5v9a4.5 4.5 0 01-4.5 4.5h-9A4.5 4.5 0 013 16.5v-9A4.5 4.5 0 017.5 3z" /></svg>
                            </a>
                            <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[var(--color-primary)] transition-colors" aria-label="YouTube">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links - Collapsible on mobile only via CSS */}
                    <div className="col-span-1">
                        <button
                            onClick={() => toggleSection("menu")}
                            className="md:cursor-default flex items-center justify-between w-full mb-4 md:mb-6"
                        >
                            <h3 className="text-base sm:text-lg font-serif font-medium">{dictionary.header.menu}</h3>
                            <svg
                                className={`w-5 h-5 md:hidden transform transition-transform ${openSection === "menu" ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {/* Use CSS for desktop always visible, JS state for mobile toggle */}
                        <ul className={`space-y-3 overflow-hidden transition-all md:!max-h-none ${openSection === "menu" ? "max-h-96" : "max-h-0 md:max-h-none"}`}>
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-gray-400 hover:text-[var(--color-accent)] transition-colors text-sm sm:text-base">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Offer Links - Collapsible on mobile */}
                    <div className="col-span-1">
                        <button
                            onClick={() => toggleSection("ponuka")}
                            className="md:cursor-default flex items-center justify-between w-full mb-4 md:mb-6"
                        >
                            <h3 className="text-base sm:text-lg font-serif font-medium">{dictionary.footer.countries}</h3>
                            <svg
                                className={`w-5 h-5 md:hidden transform transition-transform ${openSection === "ponuka" ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <ul className={`space-y-3 overflow-hidden transition-all md:!max-h-none ${openSection === "ponuka" ? "max-h-96" : "max-h-0 md:max-h-none"}`}>
                            {countryLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-gray-400 hover:text-[var(--color-accent)] transition-colors text-sm sm:text-base">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="text-base sm:text-lg font-serif font-medium mb-4 md:mb-6">{dictionary.nav.contact}</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li>
                                <strong className="text-white block text-xs uppercase tracking-wider mb-1">E-mail</strong>
                                <a href="mailto:info@relaxproperties.sk" className="hover:text-[var(--color-accent)] transition-colors text-sm sm:text-base">
                                    info@relaxproperties.sk
                                </a>
                            </li>
                            <li className="pt-2">
                                <strong className="text-white block text-xs uppercase tracking-wider mb-1">{lang === 'cz' ? 'Telefon (SK)' : 'Telefón (SK)'}</strong>
                                <a href="tel:+421911819152" className="hover:text-[var(--color-accent)] transition-colors text-sm sm:text-base">
                                    +421 911 819 152
                                </a>
                            </li>
                            <li className="pt-2">
                                <strong className="text-white block text-xs uppercase tracking-wider mb-1">{lang === 'cz' ? 'Telefon (CZ)' : 'Telefón (CZ)'}</strong>
                                <a href="tel:+420739049593" className="hover:text-[var(--color-accent)] transition-colors text-sm sm:text-base">
                                    +420 739 049 593
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs sm:text-sm text-gray-500 text-center md:text-left">
                        © {currentYear} Relax Properties. {dictionary.footer.allRights} made by <span className="text-white/80">Filip Hegedűs</span>
                    </p>
                    <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                        <Link href={`/${lang}/privacy`} className="hover:text-white transition-colors py-1">
                            {lang === 'sk' ? 'Ochrana súkromia' : lang === 'cz' ? 'Ochrana soukromí' : 'Privacy Policy'}
                        </Link>
                        <Link href={`/${lang}/terms`} className="hover:text-white transition-colors py-1">
                            {lang === 'sk' ? 'Obchodné podmienky' : lang === 'cz' ? 'Obchodní podmínky' : 'Terms & Conditions'}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
