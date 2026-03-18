"use client";

import { useState, useEffect } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";

interface ContactAgentFormProps {
    propertyTitle?: string;
    className?: string;
    lang?: Language;
    dictionary?: Dictionary;
}

export default function ContactAgentForm({
    propertyTitle,
    className = "",
    lang = 'sk',
    dictionary,
}: ContactAgentFormProps) {
    // Translations with fallbacks
    const formTitle = lang === 'en' ? 'Send Us a Message' : lang === 'cz' ? 'Napíšte nám' : 'Napíšte nám';
    const nameLabel = lang === 'en' ? 'Full Name *' : lang === 'cz' ? 'Jméno a příjmení *' : 'Meno a priezvisko *';
    const namePlaceholder = lang === 'en' ? 'Your name' : lang === 'cz' ? 'Vaše jméno' : 'Vaše meno';
    const emailLabel = 'E-mail *';
    const phoneLabel = lang === 'en' ? 'Phone' : lang === 'cz' ? 'Telefon' : 'Telefón';
    const messageLabel = lang === 'en' ? 'Message' : lang === 'cz' ? 'Zpráva' : 'Správa';
    const messagePlaceholder = lang === 'en' ? 'How can we help you?' : lang === 'cz' ? 'Jak vám můžeme pomoci?' : 'Ako vám môžeme pomôcť?';
    const submitLabel = dictionary?.common?.send || (lang === 'en' ? 'Send Message' : lang === 'cz' ? 'Odeslat zprávu' : 'Odoslať správu');
    const submittingLabel = lang === 'en' ? 'Sending...' : lang === 'cz' ? 'Odesílám...' : 'Odosielam...';
    const thankYou = lang === 'en' ? 'Thank you!' : lang === 'cz' ? 'Děkujeme!' : 'Ďakujeme!';
    const messageSent = lang === 'en' ? 'Your message has been sent. We will get back to you as soon as possible.' : lang === 'cz' ? 'Vaše zpráva byla odeslána. Ozveme se vám co nejdříve.' : 'Vaša správa bola odoslaná. Ozveme sa vám čo najskôr.';
    const privacyNotice = lang === 'en' ? 'By submitting the form, you agree to the processing of personal data.' : lang === 'cz' ? 'Odesláním formuláře souhlasíte se zpracováním osobních údajů.' : 'Odoslaním formulára súhlasíte so spracovaním osobných údajov.';
    const propertyInterest = lang === 'en' ? 'I am interested in the property:' : lang === 'cz' ? 'Mám zájem o nemovitost:' : 'Mám záujem o nehnuteľnosť:';

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: propertyTitle
            ? `${propertyInterest} ${propertyTitle}`
            : "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Update message when propertyTitle or lang changes
    useEffect(() => {
        if (propertyTitle) {
            setFormData(prev => ({
                ...prev,
                message: `${propertyInterest} ${propertyTitle}`
            }));
        }
    }, [propertyTitle, propertyInterest]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSubmitting(false);
        setIsSubmitted(true);

        // Reset after showing success message
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({
                name: "",
                email: "",
                phone: "",
                message: propertyTitle
                    ? `${propertyInterest} ${propertyTitle}`
                    : "",
            });
        }, 3000);
    };

    if (isSubmitted) {
        return (
            <div className={`bg-white rounded-2xl border border-[var(--color-border)] shadow-sm ${className}`} style={{ padding: '2.5rem' }}>
                <div className="text-center" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                    <div className="w-16 h-16 mx-auto mb-5 bg-green-50 rounded-full flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h3 className="font-serif text-2xl text-[var(--color-secondary)] mb-2">
                        {thankYou}
                    </h3>
                    <p className="text-[var(--color-muted)] leading-relaxed">
                        {messageSent}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl border border-[var(--color-border)] shadow-sm ${className}`} style={{ padding: '2rem' }}>
            <h3 className="font-serif text-xl text-[var(--color-secondary)] mb-1">
                {formTitle}
            </h3>
            <span className="block w-8 h-px bg-[var(--color-accent)] mb-6" />

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-[var(--color-muted)] mb-2"
                    >
                        {nameLabel}
                    </label>
                    <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-colors"
                        style={{ height: '3.25rem' }}
                        placeholder={namePlaceholder}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-[var(--color-muted)] mb-2"
                        >
                            {emailLabel}
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-colors"
                            style={{ height: '3.25rem' }}
                            placeholder="vas@email.com"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-[var(--color-muted)] mb-2"
                        >
                            {phoneLabel}
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-colors"
                            style={{ height: '3.25rem' }}
                            placeholder="+421 900 000 000"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="message"
                        className="block text-sm font-medium text-[var(--color-muted)] mb-2"
                    >
                        {messageLabel}
                    </label>
                    <textarea
                        id="message"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 resize-none transition-colors"
                        placeholder={messagePlaceholder}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[var(--color-primary)] text-white font-medium rounded-full hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ paddingTop: '0.9rem', paddingBottom: '0.9rem' }}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg
                                className="w-5 h-5 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            {submittingLabel}
                        </span>
                    ) : (
                        <>
                            {submitLabel}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </>
                    )}
                </button>
            </form>

            <div className="flex items-center gap-2 mt-4 justify-center">
                <svg className="w-3.5 h-3.5 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-xs text-[var(--color-muted)]">
                    {privacyNotice}
                </p>
            </div>
        </div>
    );
}
