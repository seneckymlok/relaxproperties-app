import type { Metadata } from "next";
import { Inter, Libre_Baskerville } from "next/font/google";
import "../globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { getDictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";

const inter = Inter({
  variable: "--font-inter",
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
      <body className={`${inter.variable} ${libreBaskerville.variable} antialiased`}>
        <FavoritesProvider>
          <Header lang={validLang} dictionary={dictionary} />
          <main>{children}</main>
          <Footer lang={validLang} dictionary={dictionary} />
        </FavoritesProvider>
      </body>
    </html>
  );
}
