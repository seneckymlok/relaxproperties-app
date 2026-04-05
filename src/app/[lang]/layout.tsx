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

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = params.lang;

  if (lang === 'cz') {
    return {
      title: "Relax Properties | Nemovitosti u moře",
      description: "Prodej nemovitostí v zahraničí — apartmány u moře, domy, vily v Bulharsku, Chorvatsku, Španělsku a Řecku. Zahraniční reality s českým servisem. Relax Properties s.r.o.",
      keywords: [
        "Nemovitosti u moře", "Reality u moře", "Prodej nemovitostí v zahraničí", "Zahraniční reality",
        "Apartmány u moře prodej", "Domy u moře prodej", "Investiční nemovitosti v zahraničí",
        "Rekreační objekty v zahraničí", "Investiční apartmány u moře", "Nemovitosti u moře s českým servisem",
        "Správa nemovitostí v zahraničí", "Výnos z pronájmu v zahraničí", "Bezpečná koupě reality u moře",
        "Relax Properties s.r.o.", "Relax Properties", "Realitní kancelář Relax Properties",
        "Relax Properties reality", "Relax Properties recenze", "Relax Properties nemovitosti u moře",
        "Relax Properties kontakt", "Reality Relax Properties",
        "Reality Bulharsko", "nemovitosti Bulharsko", "apartmány v Bulharsku u moře",
        "Slunečné pobřeží", "Sveti Vlas", "Nesebar", "Levné apartmány v Bulharsku",
        "Reality Chorvatsko", "domy v Chorvatsku u moře", "nemovitosti Chorvatsko prodej",
        "Makarská riviéra", "Istrie", "Zadar", "Split",
        "Reality Španělsko", "nemovitosti Španělsko u moře", "Costa del Sol", "Costa Blanca", "Alicante", "Marbella",
        "Reality Řecko", "nemovitosti Řecko", "vily v Řecku prodej", "Chalkidiki", "Kréta",
        "Levné nemovitosti u moře", "Levné apartmány", "Luxusní vily u moře",
        "Apartmány v první linii u moře", "Apartmán s výhledem na moře",
        "Zahraniční reality s českým servisem", "Český makléř v zahraničí", "Slovenský makléř v zahraničí",
      ],
      openGraph: {
        title: "Relax Properties | Nemovitosti u moře",
        description: "Prodej nemovitostí v zahraničí — apartmány, domy a vily u moře. Český a slovenský servis.",
        siteName: "Relax Properties",
      },
    };
  }

  if (lang === 'en') {
    return {
      title: "Relax Properties | Luxury Mediterranean Real Estate",
      description: "Discover premium properties across Croatia, Spain, Bulgaria and Greece. Apartments, villas and houses by the sea. Your trusted partner for Mediterranean vacation homes.",
      keywords: [
        "Mediterranean real estate", "properties by the sea", "apartments for sale by the sea",
        "houses by the sea", "villas by the sea", "vacation homes for sale",
        "investment apartments", "luxury villas by the sea", "beachfront property",
        "sea view apartment", "Relax Properties", "Relax Properties s.r.o.",
        "Bulgaria real estate", "Sunny Beach", "Sveti Vlas", "Nesebar",
        "Croatia real estate", "Makarska riviera", "Istria", "Zadar", "Split",
        "Spain real estate", "Costa del Sol", "Costa Blanca", "Alicante", "Marbella", "Malaga",
        "Greece real estate", "Chalkidiki", "Crete", "Rhodes", "Corfu",
        "cheap apartments by the sea", "buy property abroad", "foreign real estate",
      ],
      openGraph: {
        title: "Relax Properties | Luxury Mediterranean Real Estate",
        description: "Premium apartments, villas and houses by the sea in Croatia, Spain, Bulgaria and Greece.",
        siteName: "Relax Properties",
      },
    };
  }

  // SK (default)
  return {
    title: "Relax Properties | Nehnuteľnosti pri mori",
    description: "Predaj nehnuteľností v zahraničí — apartmány pri mori, domy, vily v Bulharsku, Chorvátsku, Španielsku a Grécku. Slovenská realitná kancelária so zahraničným servisom. Relax Properties s.r.o.",
    keywords: [
      "Reality pri mori", "nehnuteľnosti pri mori", "predaj apartmánov pri mori",
      "Zahraničné reality", "kúpa nehnuteľnosti v zahraničí", "investičné apartmány",
      "apartmány predaj", "domy pri mori", "apartmány more", "druhý domov",
      "Dovolenkový dom na predaj", "apartmán s výhľadom na more",
      "Realitná kancelária zahraničie", "lacné nehnuteľnosti", "lacné nehnuteľnosti pri mori",
      "lacné apartmány", "lacné domy pri mori", "Luxusné vily pri mori", "lacné apartmány pri mori",
      "Relax Properties s.r.o.", "Relax Properties", "Realitná kancelária Relax Properties",
      "Relax Properties reality", "Relax Properties recenzie", "Relax Properties nehnuteľnosti pri mori",
      "Relax Properties kontakt", "Reality Relax Properties",
      "Reality v zahraničí", "Predaj nehnuteľností v zahraničí",
      "Apartmány pri mori na predaj", "Domy pri mori predaj", "Vily pri mori",
      "Dovolenkové nehnuteľnosti", "Investičné apartmány pri mori", "Lacné reality pri mori",
      "Slovenská realitná kancelária v zahraničí", "Investícia do nehnuteľností v zahraničí",
      "Nehnuteľnosti s výhľadom na more", "Apartmány v prvej línii pri mori",
      "Zahraničné reality so slovenským servisom", "Slovenský maklér v zahraničí",
      "Reality Bulharsko", "nehnuteľnosti Bulharsko", "apartmány v Bulharsku pri mori",
      "Slnečné pobrežie", "Sveti Vlas", "Nesebar", "Primorsko", "Ravda",
      "Reality Chorvátsko", "domy v Chorvátsku pri mori", "nehnuteľnosti Chorvátsko predaj",
      "Makarská riviéra", "Istria", "Zadar", "Split", "ostrov Brač", "ostrov Krk",
      "Reality Španielsko", "nehnuteľnosti Španielsko pri mori", "apartmány Španielsko predaj",
      "Costa del Sol", "Alicante", "Marbella", "Malaga", "Costa Blanca", "Mallorca",
      "Reality Grécko", "nehnuteľnosti Grécko", "vily v Grécku predaj",
      "Chalkidiki", "Kréta", "Rodos", "Korfu", "Atény",
    ],
    openGraph: {
      title: "Relax Properties | Nehnuteľnosti pri mori",
      description: "Predaj apartmánov, domov a víl pri mori v Chorvátsku, Španielsku, Bulharsku a Grécku.",
      siteName: "Relax Properties",
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
