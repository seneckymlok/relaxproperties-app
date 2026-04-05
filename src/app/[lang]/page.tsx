export const revalidate = 300; // Serve from edge CDN, regenerate in background every 5 min

import type { Metadata } from "next";
import HeroSlider from "@/components/sections/HeroSlider";
import BelowFoldSections from "@/components/sections/BelowFoldSections";
import { getDictionary } from "@/lib/dictionaries";
import { getPropertiesServer, getBlogPostsServer, type Language, type PublicProperty } from "@/lib/data-access";
import { getCachedHeroFeaturedPropertyIds } from "@/lib/hero-featured-store";

const HOME_BASE = {
  sk: 'https://relaxproperties.sk',
  en: 'https://relaxproperties.eu',
  cz: 'https://relaxproperties.cz',
};

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = params.lang as 'sk' | 'en' | 'cz';
  const base = HOME_BASE[lang] ?? HOME_BASE.sk;

  if (lang === 'cz') {
    return {
      title: "Relax Properties | Nemovitosti u moře — Bulharsko, Chorvatsko, Španělsko, Řecko",
      description: "Prodej apartmánů, domů a vil u moře. Levné i luxusní nemovitosti v Bulharsku, Chorvatsku, Španělsku a Řecku. Zahraniční reality s českým a slovenským servisem.",
      alternates: {
        canonical: `${base}/cz`,
        languages: { sk: `${HOME_BASE.sk}/sk`, en: `${HOME_BASE.en}/en`, cs: `${HOME_BASE.cz}/cz` },
      },
      openGraph: {
        title: "Relax Properties | Nemovitosti u moře",
        description: "Prodej apartmánů, domů a vil u moře v Bulharsku, Chorvatsku, Španělsku a Řecku.",
        type: 'website',
        siteName: 'Relax Properties',
        locale: 'cs_CZ',
      },
    };
  }
  if (lang === 'en') {
    return {
      title: "Relax Properties | Properties by the Sea — Bulgaria, Croatia, Spain, Greece",
      description: "Apartments, houses and villas for sale by the sea. Affordable and luxury Mediterranean real estate in Bulgaria, Croatia, Spain and Greece.",
      alternates: {
        canonical: `${base}/en`,
        languages: { sk: `${HOME_BASE.sk}/sk`, en: `${HOME_BASE.en}/en`, cs: `${HOME_BASE.cz}/cz` },
      },
      openGraph: {
        title: "Relax Properties | Properties by the Sea",
        description: "Apartments, houses and villas for sale by the sea in Bulgaria, Croatia, Spain and Greece.",
        type: 'website',
        siteName: 'Relax Properties',
        locale: 'en_US',
      },
    };
  }
  return {
    title: "Relax Properties | Nehnuteľnosti pri mori — Bulharsko, Chorvátsko, Španielsko, Grécko",
    description: "Predaj apartmánov, domov a víl pri mori. Lacné aj luxusné nehnuteľnosti v Bulharsku, Chorvátsku, Španielsku a Grécku. Zahraničné reality so slovenským servisom.",
    alternates: {
      canonical: `${base}/sk`,
      languages: { sk: `${HOME_BASE.sk}/sk`, en: `${HOME_BASE.en}/en`, cs: `${HOME_BASE.cz}/cz` },
    },
    openGraph: {
      title: "Relax Properties | Nehnuteľnosti pri mori",
      description: "Predaj apartmánov, domov a víl pri mori v Bulharsku, Chorvátsku, Španielsku a Grécku.",
      type: 'website',
      siteName: 'Relax Properties',
      locale: 'sk_SK',
    },
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

    const orgJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'Relax Properties, s.r.o.',
        url: 'https://relaxproperties.sk',
        logo: 'https://relaxproperties.sk/images/relax-logo.png',
        email: 'info@relaxproperties.sk',
        contactPoint: [
            { '@type': 'ContactPoint', telephone: '+421911819152', contactType: 'customer service', areaServed: 'SK', availableLanguage: 'Slovak' },
            { '@type': 'ContactPoint', telephone: '+421911989895', contactType: 'customer service', areaServed: 'SK', availableLanguage: 'Slovak' },
            { '@type': 'ContactPoint', telephone: '+420739049593', contactType: 'customer service', areaServed: 'CZ', availableLanguage: 'Czech' },
        ],
        sameAs: ['https://relaxproperties.eu', 'https://relaxproperties.cz'],
        areaServed: ['Bulgaria', 'Croatia', 'Spain', 'Greece'],
    };

    const websiteJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Relax Properties',
        url: 'https://relaxproperties.sk',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `https://relaxproperties.sk/sk/properties?searchQuery={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
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
        </>
    );
}
