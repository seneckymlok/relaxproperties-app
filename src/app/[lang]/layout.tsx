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

const BASE_URL = 'https://www.relaxproperties.sk';

const metaByLang: Record<string, { title: string; description: string }> = {
  sk: {
    title: 'Relax Properties | Luxusné Nehnuteľnosti pri Mori',
    description: 'Objavte prémiové nehnuteľnosti v Chorvátsku, Španielsku, Bulharsku a ďalších krajinách. Váš spoľahlivý partner pre kúpu dovolenkových domov pri Stredozemnom mori.',
  },
  en: {
    title: 'Relax Properties | Luxury Mediterranean Real Estate',
    description: 'Discover premium properties across Croatia, Spain, Bulgaria and more. Your trusted partner for Mediterranean vacation homes and seaside investments.',
  },
  cz: {
    title: 'Relax Properties | Luxusní Nemovitosti u Moře',
    description: 'Objevte prémiové nemovitosti v Chorvatsku, Španělsku, Bulharsku a dalších zemích. Váš spolehlivý partner pro koupi dovolenkových domů u Středozemního moře.',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const validLang = ['sk', 'en', 'cz'].includes(lang) ? lang : 'sk';
  const meta = metaByLang[validLang] || metaByLang.sk;
  const url = `${BASE_URL}/${validLang}`;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: meta.title,
      template: `%s | Relax Properties`,
    },
    description: meta.description,
    alternates: {
      canonical: url,
      languages: {
        'sk': `${BASE_URL}/sk`,
        'en': `${BASE_URL}/en`,
        'cs': `${BASE_URL}/cz`,
      },
    },
    openGraph: {
      type: 'website',
      locale: validLang === 'cz' ? 'cs_CZ' : validLang === 'en' ? 'en_US' : 'sk_SK',
      url,
      siteName: 'Relax Properties',
      title: meta.title,
      description: meta.description,
      images: [{
        url: `${BASE_URL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Relax Properties - Mediterranean Real Estate',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${BASE_URL}/images/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'google-site-verification': '',
    },
  };
}

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
      <body className={`${dmSans.variable} ${libreBaskerville.variable} ${instrumentSerif.variable} antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'RealEstateAgent',
              name: 'Relax Properties',
              url: BASE_URL,
              logo: `${BASE_URL}/images/relax-logo.png`,
              description: metaByLang[validLang]?.description || metaByLang.sk.description,
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'SK',
              },
              areaServed: ['Croatia', 'Spain', 'Bulgaria', 'Italy', 'Portugal', 'Greece', 'Montenegro'],
              contactPoint: [
                {
                  '@type': 'ContactPoint',
                  telephone: '+421-911-819-152',
                  contactType: 'sales',
                  availableLanguage: ['Slovak', 'English'],
                },
                {
                  '@type': 'ContactPoint',
                  telephone: '+421-911-989-895',
                  contactType: 'sales',
                  availableLanguage: ['Czech', 'English'],
                },
              ],
              sameAs: [],
            }),
          }}
        />
        <SmoothScrollProvider>
          <FavoritesProvider>
            <CookieConsentProvider>
              <Header lang={validLang} dictionary={dictionary} />
              <main id="main">{children}</main>
              <Footer lang={validLang} dictionary={dictionary} />
              <CookieConsentBanner lang={validLang} dictionary={dictionary} />
            </CookieConsentProvider>
          </FavoritesProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
