"use client";

import { useState, useEffect } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import type { Dictionary } from "@/lib/dictionaries";
import Link from "next/link";

interface CookieConsentBannerProps {
  lang: string;
  dictionary: Dictionary;
}

export default function CookieConsentBanner({ lang, dictionary }: CookieConsentBannerProps) {
  const { hasConsented, acceptAll, rejectAll, savePreferences, preferences } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [visible, setVisible] = useState(false);

  const t = dictionary.cookies;

  useEffect(() => {
    if (!hasConsented) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [hasConsented]);

  useEffect(() => {
    setAnalytics(preferences.analytics);
    setMarketing(preferences.marketing);
  }, [preferences]);

  if (hasConsented) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px] transition-opacity duration-500 ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Banner */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className={`fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-500 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto max-w-3xl px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 sm:p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-[var(--color-teal)]/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-teal)]">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="5" cy="6" r="1" fill="currentColor" />
                  <circle cx="10" cy="5" r="1.2" fill="currentColor" />
                  <circle cx="7" cy="10" r="1" fill="currentColor" />
                  <circle cx="11" cy="9" r="0.8" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-[family-name:var(--font-dm-sans)] font-semibold text-[var(--color-primary)] text-sm sm:text-base">
                  {t.title}
                </h3>
                <p className="text-[var(--color-muted)] text-xs sm:text-sm mt-1 leading-relaxed">
                  {t.description}{" "}
                  <Link
                    href={`/${lang}/cookie-policy`}
                    className="underline underline-offset-2 text-[var(--color-teal)] hover:text-[var(--color-teal-dark)] transition-colors"
                  >
                    {t.learnMore}
                  </Link>
                </p>
              </div>
            </div>

            {/* Detail toggles */}
            {showDetails && (
              <div className="mt-4 mb-4 space-y-3 border-t border-[var(--color-border)] pt-4">
                {/* Essential - always on */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-primary)]">{t.essential}</p>
                    <p className="text-xs text-[var(--color-muted)]">{t.essentialDesc}</p>
                  </div>
                  <div className="relative w-10 h-5.5 rounded-full bg-[var(--color-teal)] opacity-60 cursor-not-allowed">
                    <div className="absolute top-0.5 right-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm" />
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-primary)]">{t.analytics}</p>
                    <p className="text-xs text-[var(--color-muted)]">{t.analyticsDesc}</p>
                  </div>
                  <button
                    onClick={() => setAnalytics(!analytics)}
                    role="switch"
                    aria-checked={analytics}
                    aria-label={t.analytics}
                    className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                      analytics ? "bg-[var(--color-teal)]" : "bg-[var(--color-muted)]/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                        analytics ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-primary)]">{t.marketing}</p>
                    <p className="text-xs text-[var(--color-muted)]">{t.marketingDesc}</p>
                  </div>
                  <button
                    onClick={() => setMarketing(!marketing)}
                    role="switch"
                    aria-checked={marketing}
                    aria-label={t.marketing}
                    className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                      marketing ? "bg-[var(--color-teal)]" : "bg-[var(--color-muted)]/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                        marketing ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4">
              {!showDetails ? (
                <button
                  onClick={() => setShowDetails(true)}
                  className="order-3 sm:order-1 text-xs sm:text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors underline underline-offset-2"
                >
                  {t.customize}
                </button>
              ) : (
                <button
                  onClick={() => savePreferences({ analytics, marketing })}
                  className="order-3 sm:order-1 px-4 py-2 text-xs sm:text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  {t.savePreferences}
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={rejectAll}
                className="order-2 px-4 py-2 text-xs sm:text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors"
              >
                {t.rejectAll}
              </button>
              <button
                onClick={acceptAll}
                className="order-1 sm:order-3 px-5 py-2.5 text-xs sm:text-sm rounded-lg bg-[var(--color-teal)] text-white font-medium hover:bg-[var(--color-teal-dark)] transition-colors shadow-sm"
              >
                {t.acceptAll}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
