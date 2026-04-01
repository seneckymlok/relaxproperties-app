import type { Metadata } from "next";
import HeroSlider from "@/components/sections/HeroSlider";
import CountryBanners from "@/components/sections/CountryBanners";
import NewOffers from "@/components/sections/NewOffers";
import AboutSection from "@/components/sections/AboutSection";
import ReviewsSection from "@/components/sections/ReviewsSection";
import BlogCarousel from "@/components/sections/BlogCarousel";
import { getDictionary } from "@/lib/dictionaries";
import { getPropertiesServer, type Language, type PublicProperty } from "@/lib/data-access";
import { getCachedHeroFeaturedPropertyIds } from "@/lib/hero-featured-store";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    sk: 'Relax Properties | Luxusné Nehnuteľnosti pri Mori',
    en: 'Relax Properties | Luxury Mediterranean Real Estate',
    cz: 'Relax Properties | Luxusní Nemovitosti u Moře',
  };
  const descriptions: Record<string, string> = {
    sk: 'Objavte prémiové nehnuteľnosti v Chorvátsku, Španielsku, Bulharsku a ďalších. Váš spoľahlivý partner pre kúpu nehnuteľností pri mori.',
    en: 'Discover premium properties across Croatia, Spain, Bulgaria and more. Your trusted partner for Mediterranean vacation homes.',
    cz: 'Objevte prémiové nemovitosti v Chorvatsku, Španělsku, Bulharsku a dalších. Váš spolehlivý partner pro koupi nemovitostí u moře.',
  };
  const v = ['sk', 'en', 'cz'].includes(lang) ? lang : 'sk';
  return {
    title: titles[v] || titles.sk,
    description: descriptions[v] || descriptions.sk,
    alternates: {
      canonical: `https://www.relaxproperties.sk/${v}`,
      languages: { sk: '/sk', en: '/en', cs: '/cz' },
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

    // Parallel data fetching — both queries run simultaneously
    const [properties, heroIds] = await Promise.all([
        getPropertiesServer(validLang),
        getCachedHeroFeaturedPropertyIds(),
    ]);

    const featuredForHero = heroIds.length > 0
        ? heroIds
            .map(id => properties.find(p => p.id === id))
            .filter((p): p is PublicProperty => !!p && p.images.length > 0)
        : properties.filter(p => p.images.length > 0).slice(0, 3);

    return (
        <div className="flex flex-col min-h-screen">
            {/* 1. Hero Banners with integrated Search */}
            <HeroSlider lang={validLang} dictionary={dictionary} featuredProperties={featuredForHero} allProperties={properties} />

            {/* 2. Country Selection */}
            <CountryBanners lang={validLang} dictionary={dictionary} properties={properties} />

            {/* 3. New Offers */}
            <NewOffers lang={validLang} dictionary={dictionary} properties={properties} />

            {/* 4. About Us */}
            <AboutSection lang={validLang} dictionary={dictionary} />

            {/* 5. Reviews */}
            <ReviewsSection lang={validLang} dictionary={dictionary} />

            {/* 6. Blog Carousel */}
            <BlogCarousel lang={validLang} dictionary={dictionary} />
        </div>
    );
}
