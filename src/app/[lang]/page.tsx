import dynamic from "next/dynamic";
import HeroSlider from "@/components/sections/HeroSlider";
import CountryBanners from "@/components/sections/CountryBanners";
import { getDictionary } from "@/lib/dictionaries";
import { getPropertiesServer, getBlogPostsServer, type Language, type PublicProperty } from "@/lib/data-access";
import { getCachedHeroFeaturedPropertyIds } from "@/lib/hero-featured-store";

// Below-fold sections: dynamically imported to reduce initial JS bundle
// These components pull in Swiper, GSAP, and other heavy deps
const NewOffers = dynamic(() => import("@/components/sections/NewOffers"));
const AboutSection = dynamic(() => import("@/components/sections/AboutSection"));
const ReviewsSection = dynamic(() => import("@/components/sections/ReviewsSection"));
const BlogCarousel = dynamic(() => import("@/components/sections/BlogCarousel"));

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
        getBlogPostsServer(validLang),
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
            <BlogCarousel lang={validLang} dictionary={dictionary} initialArticles={blogPosts.slice(0, 3)} />
        </div>
    );
}
