import HeroSlider from "@/components/sections/HeroSlider";
import BelowFoldSections from "@/components/sections/BelowFoldSections";
import { getDictionary } from "@/lib/dictionaries";
import { getPropertiesServer, getBlogPostsServer, type Language, type PublicProperty } from "@/lib/data-access";
import { getCachedHeroFeaturedPropertyIds } from "@/lib/hero-featured-store";

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
