import Image from "next/image";
import ContactAgentForm from "@/components/ui/ContactAgentForm";
import { getDictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";
import { getPageHero } from "@/lib/page-hero-store";

export default async function ContactPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;
    const validLang = (['sk', 'en', 'cz'].includes(lang) ? lang : 'sk') as Language;
    const dictionary = getDictionary(validLang);
    const t = dictionary.contact;

    let heroImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80";
    try {
        const hero = await getPageHero('contact');
        if (hero?.image_url) heroImage = hero.image_url;
    } catch {}

    return (
        <>
            {/* =============================================
                Hero — Cinematic full-bleed
                ============================================= */}
            <section className="relative bg-[var(--color-secondary)]" style={{ minHeight: '500px' }}>
                <Image
                    src={heroImage}
                    alt="Contact Relax Properties"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Removed dark filter per user request */}
                <div className="absolute inset-0 flex flex-col justify-end">
                    <div className="container-custom" style={{ paddingBottom: '5rem' }}>
                        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sand-light)] mb-4">
                            {t.subtitle}
                        </p>
                        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white max-w-3xl leading-tight">
                            {t.heroTitle}
                        </h1>
                    </div>
                </div>
            </section>

            {/* =============================================
                Main Content — Company Info + Form
                ============================================= */}
            <section className="bg-[var(--color-background)]" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

                        {/* Left Column — Real Company Info */}
                        <div>
                            {/* Company Details Card */}
                            <div
                                className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden"
                            >
                                <div className="p-6 sm:p-8">
                                    <h2 className="font-serif text-2xl text-[var(--color-secondary)] mb-1">
                                        {t.companyInfo.name}
                                    </h2>
                                    <span className="block w-8 h-px bg-[var(--color-accent)] mb-5" />

                                    {/* Address */}
                                    <div className="flex items-start gap-3 mb-5">
                                        <svg className="w-5 h-5 text-[var(--color-primary)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                        <div className="text-sm text-[var(--color-foreground)] leading-relaxed">
                                            {t.companyInfo.address.map((line: string, i: number) => (
                                                <p key={i}>{line}</p>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Registration Info */}
                                    <div className="bg-[var(--color-surface)] rounded-xl p-4 mb-6 text-xs text-[var(--color-muted)] leading-relaxed">
                                        <p className="mb-1">{t.companyInfo.registration}</p>
                                        <p>{t.companyInfo.ids}</p>
                                    </div>

                                    {/* Divider */}
                                    <span className="block w-full h-px bg-[var(--color-border)] mb-6" />

                                    {/* Phone Numbers */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                            </svg>
                                            <p className="text-sm font-medium text-[var(--color-secondary)]">{t.companyInfo.phoneLabel}</p>
                                        </div>
                                        <div className="space-y-3 pl-7">
                                            {t.companyInfo.phones.map((phone: { name: string; number: string; raw: string }, i: number) => (
                                                <div key={i} className="flex items-center justify-between text-sm">
                                                    <span className="text-[var(--color-foreground)]">{phone.name}</span>
                                                    <a href={`tel:${phone.raw}`} className="text-[var(--color-primary)] hover:text-[var(--color-teal)] transition-colors font-medium">{phone.number}</a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Email Addresses */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                            </svg>
                                            <p className="text-sm font-medium text-[var(--color-secondary)]">{t.companyInfo.emailLabel}</p>
                                        </div>
                                        <div className="space-y-2 pl-7">
                                            {t.companyInfo.emails.map((email: string, i: number) => (
                                                <a key={i} href={`mailto:${email}`} className="block text-sm text-[var(--color-primary)] hover:text-[var(--color-teal)] transition-colors">
                                                    {email}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column — Contact Form */}
                        <div>
                            <ContactAgentForm lang={validLang} dictionary={dictionary} />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
