export const revalidate = 300; // Serve from edge CDN, regenerate in background every 5 min

import type { Metadata } from "next";
import HeroSlider from "@/components/sections/HeroSlider";
import BelowFoldSections from "@/components/sections/BelowFoldSections";
import { getDictionary } from "@/lib/dictionaries";
import { getPropertiesServer, getBlogPostsServer, type Language, type PublicProperty } from "@/lib/data-access";
import { getCachedHeroFeaturedPropertyIds } from "@/lib/hero-featured-store";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = params.lang;
  if (lang === 'cz') {
    return {
      title: "Relax Properties | Nemovitosti u moře — Bulharsko, Chorvatsko, Španělsko, Řecko",
      description: "Prodej apartmánů, domů a vil u moře. Levné i luxusní nemovitosti v Bulharsku, Chorvatsku, Španělsku a Řecku. Zahraniční reality s českým a slovenským servisem.",
    };
  }
  if (lang === 'en') {
    return {
      title: "Relax Properties | Properties by the Sea — Bulgaria, Croatia, Spain, Greece",
      description: "Apartments, houses and villas for sale by the sea. Affordable and luxury Mediterranean real estate in Bulgaria, Croatia, Spain and Greece.",
    };
  }
  return {
    title: "Relax Properties | Nehnuteľnosti pri mori — Bulharsko, Chorvátsko, Španielsko, Grécko",
    description: "Predaj apartmánov, domov a víl pri mori. Lacné aj luxusné nehnuteľnosti v Bulharsku, Chorvátsku, Španielsku a Grécku. Zahraničné reality so slovenským servisom.",
  };
}

export default async function Home({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;
    const validLang = (['sk', 'en', 'cz'].includes(lang) ? lang : 'sk') as Language;
    const dictionary = getDictionary(validLang);

    // Parallel data fetching — all queries run simultaneously
    const [properties, heroIds, blogPosts] = await Promise.all([
        getPropertiesServer(validLang),
        getCachedHeroFeaturedPropertyIds(),
        getBlogPostsServer(validLang, 3),
    ]);

    const featuredForHero = heroIds.length > 0
        ? heroIds
            .map(id => properties.find(p => p.id === id))
            .filter((p): p is PublicProperty => !!p && p.images.length > 0)
        : [];

    return (
        <div className="flex flex-col min-h-screen">
            {/* 1. Hero Banners with integrated Search */}
            <HeroSlider lang={validLang} dictionary={dictionary} featuredProperties={featuredForHero} allProperties={properties} />

            {/* Below-fold sections: client-side lazy loaded to defer GSAP */}
            <BelowFoldSections
                lang={validLang}
                dictionary={dictionary}
                properties={properties}
                blogPosts={blogPosts}
            />
        </div>
    );
}
