"use client";

import Link from "next/link";
import Image from "next/image";
import MagneticButton from "@/components/ui/MagneticButton";
import type { Dictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";

interface FooterProps {
    lang: Language;
    dictionary: Dictionary;
}

export default function Footer({ lang, dictionary }: FooterProps) {
    const currentYear = new Date().getFullYear();

    const navLinks = [
        { href: `/${lang}/properties`, label: dictionary.nav.properties },
        { href: `/${lang}/buying-process`, label: dictionary.nav.buyingProcess },
        { href: `/${lang}/about`, label: dictionary.nav.about },
        { href: `/${lang}/blog`, label: dictionary.nav.blog },
        { href: `/${lang}/contact`, label: dictionary.nav.contact },
    ];

    const countryLinks = [
        { href: `/${lang}/properties?country=bulgaria`, label: lang === 'sk' ? 'Bulharsko' : lang === 'cz' ? 'Bulharsko' : 'Bulgaria' },
        { href: `/${lang}/properties?country=croatia`, label: lang === 'sk' ? 'Chorvátsko' : lang === 'cz' ? 'Chorvatsko' : 'Croatia' },
        { href: `/${lang}/properties?country=spain`, label: lang === 'sk' ? 'Španielsko' : lang === 'cz' ? 'Španělsko' : 'Spain' },
        { href: `/${lang}/properties?country=greece`, label: lang === 'sk' ? 'Grécko' : lang === 'cz' ? 'Řecko' : 'Greece' },
    ];

    const socials = [
        {
            label: "Facebook",
            href: "https://www.facebook.com/relaxproperties.sk/",
            icon: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />,
            fill: true,
        },
        {
            label: "Instagram",
            href: "https://www.instagram.com/relaxproperties/",
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M7.5 3h9a4.5 4.5 0 014.5 4.5v9a4.5 4.5 0 01-4.5 4.5h-9A4.5 4.5 0 013 16.5v-9A4.5 4.5 0 017.5 3z" />,
            fill: false,
        },
        {
            label: "YouTube",
            href: "https://www.youtube.com/@relaxproperties",
            icon: <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />,
            fill: true,
        },
    ];

    const emailAddress = lang === 'cz' ? 'info@relaxproperties.cz' : 'info@relaxproperties.sk';

    return (
        <footer className="relative bg-[var(--color-secondary)] text-white overflow-hidden">
            {/* Subtle ambient glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse 60% 50% at 20% 0%, rgba(196,168,130,0.04) 0%, transparent 70%),
                                 radial-gradient(ellipse 40% 50% at 80% 100%, rgba(43,110,110,0.03) 0%, transparent 70%)`,
                }}
            />

            {/* ─── Main Content ─── */}
            <div className="relative container-custom pt-[clamp(2.5rem,4vw,3.5rem)] pb-[clamp(2rem,3vw,3rem)]">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-[clamp(2rem,4vw,4rem)]">

                    {/* Brand Column */}
                    <div className="md:max-w-xs text-center md:text-left">
                        <Link href={`/${lang}`} className="group inline-block mb-4 mx-auto md:mx-0">
                            <Image
                                src="/images/relax-logo.png"
                                alt="Relax Properties"
                                width={140}
                                height={36}
                                className="h-[clamp(1.75rem,2.5vw,2.25rem)] w-auto brightness-0 invert opacity-85 group-hover:opacity-100 transition-opacity duration-300"
                            />
                        </Link>
                        <p className="text-white/30 text-[13px] leading-relaxed mb-6">
                            {dictionary.footer.description}
                        </p>

                        {/* Contact */}
                        <div className="space-y-2 mb-6 inline-flex flex-col items-start md:items-start">
                            <a href={`mailto:${emailAddress}`} className="flex items-center gap-2.5 text-[var(--color-accent)] md:text-white/40 hover:text-white transition-colors duration-200">
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-accent)] md:text-[var(--color-accent)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                                <span className="text-[13px]">{emailAddress}</span>
                            </a>
                            <a href="tel:+421911819152" className="flex items-center gap-2.5 text-[var(--color-accent)] md:text-white/40 hover:text-white transition-colors duration-200">
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-accent)] md:text-[var(--color-accent)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                                <span className="text-[13px]">+421 911 819 152</span>
                                <span className="text-[10px] text-white/15 uppercase tracking-wider">SK</span>
                            </a>
                            <a href="tel:+420739049593" className="flex items-center gap-2.5 text-[var(--color-accent)] md:text-white/40 hover:text-white transition-colors duration-200">
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-accent)] md:text-[var(--color-accent)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                                <span className="text-[13px]">+420 739 049 593</span>
                                <span className="text-[10px] text-white/15 uppercase tracking-wider">CZ</span>
                            </a>
                        </div>

                        {/* Social icons */}
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            {socials.map((social) => (
                                <MagneticButton key={social.label} strength={0.3}>
                                    <a
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-full border border-white/8 flex items-center justify-center text-white/25 hover:text-white hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/10 transition-all duration-300"
                                        aria-label={social.label}
                                    >
                                        <svg
                                            className="w-3.5 h-3.5"
                                            fill={social.fill ? "currentColor" : "none"}
                                            stroke={social.fill ? "none" : "currentColor"}
                                            viewBox="0 0 24 24"
                                        >
                                            {social.icon}
                                        </svg>
                                    </a>
                                </MagneticButton>
                            ))}
                        </div>
                    </div>

                    {/* Menu + Countries — side-by-side on mobile, separate columns on desktop */}
                    <div className="grid grid-cols-2 md:contents gap-[clamp(1.5rem,3vw,2rem)] text-center md:text-left justify-items-center md:justify-items-start">
                        {/* Menu */}
                        <div>
                            <h4 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-medium mb-5">
                                {dictionary.header.menu}
                            </h4>
                            <ul className="space-y-2.5">
                                {navLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-white/30 hover:text-white text-[13px] transition-colors duration-200"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Countries */}
                        <div>
                            <h4 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-medium mb-5">
                                {dictionary.footer.countries}
                            </h4>
                            <ul className="space-y-2.5">
                                {countryLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-white/30 hover:text-white text-[13px] transition-colors duration-200"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Bottom Bar ─── */}
            <div className="relative border-t border-white/[0.06]">
                <div className="container-custom py-5">
                    <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
                        <p className="text-[11px] text-white/20 tracking-wide text-center md:text-left">
                            © {currentYear} Relax Properties. {dictionary.footer.allRights}
                        </p>
                        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-5">
                            <div className="flex items-center gap-4">
                                <Link href={`/${lang}/privacy-policy`} className="text-[11px] text-white/20 hover:text-white/40 transition-colors duration-200">
                                    {lang === 'sk' ? 'Zásady ochrany osobných údajov' : lang === 'cz' ? 'Zásady ochrany osobních údajů' : 'Privacy Policy'}
                                </Link>
                                <span className="text-white/[0.08]">·</span>
                                <Link href={`/${lang}/cookie-policy`} className="text-[11px] text-white/20 hover:text-white/40 transition-colors duration-200">
                                    {lang === 'sk' ? 'Zásady cookies' : lang === 'cz' ? 'Zásady cookies' : 'Cookie Policy'}
                                </Link>
                            </div>
                            <div className="hidden md:block">
                                <span className="text-white/[0.06]">|</span>
                            </div>
                            <p className="text-[11px] text-white/15 tracking-wide">
                                made by{" "}
                                <span
                                    className="font-[family-name:var(--font-nunito)] font-bold text-[12px] text-white/30 hover:text-[#E85200] transition-colors duration-200 cursor-default tracking-normal"
                                    style={{ fontFamily: 'var(--font-nunito, Nunito, sans-serif)' }}
                                >
                                    Filip Hegedűs
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
