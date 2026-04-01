import type { Metadata } from "next";
import { DM_Sans, Libre_Baskerville, Instrument_Serif } from "next/font/google";
import "../globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import { getDictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Relax Properties | Luxury Mediterranean Real Estate",
  description:
    "Discover premium properties across Croatia, Spain, Bulgaria and more. Your trusted partner for Mediterranean vacation homes.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const validLang = (['sk', 'en', 'cz'].includes(lang) ? lang : 'sk') as Language;
  const dictionary = getDictionary(validLang);

  return (
    <html lang={validLang}>
      <head>
        {/* DNS prefetch for external image domains (lightweight, no connection overhead) */}
        <link rel="dns-prefetch" href="https://8v6qfutk2bxqslae.public.blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="https://7lisadzjl63dspu3.public.blob.vercel-storage.com" />
      </head>
      <body className={`${dmSans.variable} ${libreBaskerville.variable} ${instrumentSerif.variable} antialiased`}>
        <SmoothScrollProvider>
          <FavoritesProvider>
            <CookieConsentProvider>
              <Header lang={validLang} dictionary={dictionary} />
              <main>{children}</main>
              <Footer lang={validLang} dictionary={dictionary} />
              <CookieConsentBanner lang={validLang} dictionary={dictionary} />
            </CookieConsentProvider>
          </FavoritesProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
