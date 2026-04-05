export const revalidate = 300;

import type { Metadata } from "next";
import { Suspense } from "react";
import PropertiesContent from "@/components/sections/PropertiesContent";
import { getDictionary } from "@/lib/dictionaries";
import { getPropertiesServer, type Language } from "@/lib/data-access";
import { getPageHero } from "@/lib/page-hero-store";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = params.lang;
  if (lang === 'cz') {
    return {
      title: "Nemovitosti u moře na prodej | Relax Properties",
      description: "Prohlédněte si nabídku apartmánů, domů a vil u moře v Bulharsku, Chorvatsku, Španělsku a Řecku. Levné i luxusní nemovitosti u moře.",
      keywords: [
        "Prodej apartmánů u moře", "Zahraniční nemovitosti", "Levné nemovitosti u moře",
        "Apartmány u moře na prodej", "Domy u moře", "Vily u moře", "Rekreační nemovitosti",
        "Investiční apartmány", "Apartmán s výhledem na moře", "Apartmány v první linii u moře",
        "Reality Bulharsko", "Reality Chorvatsko", "Reality Španělsko", "Reality Řecko",
        "Slunečné pobřeží", "Costa del Sol", "Chalkidiki", "Makarská riviéra",
      ],
    };
  }
  if (lang === 'en') {
    return {
      title: "Properties for Sale by the Sea | Relax Properties",
      description: "Browse apartments, houses and villas for sale by the sea in Bulgaria, Croatia, Spain and Greece. Affordable and luxury beachfront real estate.",
      keywords: [
        "properties for sale by the sea", "apartments by the sea", "beachfront real estate",
        "houses by the sea for sale", "villas by the sea", "Mediterranean property",
        "Bulgaria real estate", "Croatia real estate", "Spain real estate", "Greece real estate",
        "Sunny Beach", "Costa del Sol", "Chalkidiki", "Makarska riviera",
      ],
    };
  }
  return {
    title: "Nehnuteľnosti pri mori na predaj | Relax Properties",
    description: "Prezrite si ponuku apartmánov, domov a víl pri mori v Bulharsku, Chorvátsku, Španielsku a Grécku. Lacné aj luxusné nehnuteľnosti pri mori.",
    keywords: [
      "Predaj apartmánov pri mori", "Zahraničné reality", "Lacné nehnuteľnosti pri mori",
      "Apartmány pri mori na predaj", "Domy pri mori predaj", "Vily pri mori", "Dovolenkové nehnuteľnosti",
      "Investičné apartmány pri mori", "Apartmány v prvej línii pri mori",
      "Reality Bulharsko", "Reality Chorvátsko", "Reality Španielsko", "Reality Grécko",
      "Slnečné pobrežie", "Costa del Sol", "Chalkidiki", "Makarská riviéra",
      "lacné apartmány", "lacné domy pri mori", "Luxusné vily pri mori",
    ],
  };
}

// Loading fallback for Suspense
function LoadingFallback() {
    return (
        <section className="py-[clamp(2rem,4vw,4rem)]">
            <div className="container-custom">
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-24 mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-12 bg-gray-200 rounded"></div>
                                <div className="h-12 bg-gray-200 rounded"></div>
                                <div className="h-12 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </aside>
                    <main className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden animate-pulse">
                                    <div className="h-56 bg-gray-200"></div>
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-5 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </section>
    );
}

export default async function PropertiesPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;
    const validLang = (['sk', 'en', 'cz'].includes(lang) ? lang : 'sk') as Language;
    const dictionary = getDictionary(validLang);
    const properties = await getPropertiesServer(validLang);

    let heroImage = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80";
    try {
        const hero = await getPageHero('properties');
        if (hero?.image_url) heroImage = hero.image_url;
    } catch {}

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero Banner */}
            <section className="relative h-40 sm:h-56 md:h-80 bg-[var(--color-primary)]">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: `url('${heroImage}')`,
                    }}
                />
                <div className="relative container-custom h-full flex flex-col justify-center items-center text-center text-white pt-14 sm:pt-16">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[var(--color-sand-light)] mb-2 sm:mb-3">
                        {dictionary.properties.subtitle}
                    </p>
                    <h1 className="font-serif text-[clamp(1.75rem,5vw,3rem)] font-medium text-white mb-2 sm:mb-4">
                        {dictionary.properties.title}
                    </h1>
                    <p className="hidden sm:block text-lg text-white/80">
                        {dictionary.properties.heroText}
                    </p>
                </div>
            </section>

            <Suspense fallback={<LoadingFallback />}>
                <PropertiesContent lang={validLang} properties={properties} />
            </Suspense>
        </div>
    );
}
