import HeroSlider from "@/components/sections/HeroSlider";
import CountryBanners from "@/components/sections/CountryBanners";
import NewOffers from "@/components/sections/NewOffers";
import AboutSection from "@/components/sections/AboutSection";
import ReviewsSection from "@/components/sections/ReviewsSection";
import BlogCarousel from "@/components/sections/BlogCarousel";
import { getDictionary } from "@/lib/dictionaries";
import { getPropertiesServer, getBlogPostsServer, getReviewsServer, type Language, type PublicProperty } from "@/lib/data-access";
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
    const [properties, heroIds, blogPosts, reviewsData] = await Promise.all([
        getPropertiesServer(validLang),
        getCachedHeroFeaturedPropertyIds(),
        getBlogPostsServer(validLang),
        getReviewsServer(validLang),
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
            <ReviewsSection lang={validLang} dictionary={dictionary} initialReviews={reviewsData.reviews} initialRating={reviewsData.rating} initialTotalReviews={reviewsData.totalReviews} />

            {/* 6. Blog Carousel */}
            <BlogCarousel lang={validLang} dictionary={dictionary} initialArticles={blogPosts.slice(0, 3)} />
        </div>
    );
}
