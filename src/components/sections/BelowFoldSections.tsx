"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/dictionaries";
import type { PublicProperty } from "@/lib/data-access";

const CountryBanners = dynamic(() => import("./CountryBanners"), { ssr: false });
const NewOffers = dynamic(() => import("./NewOffers"), { ssr: false });
const AboutSection = dynamic(() => import("./AboutSection"), { ssr: false });
const ReviewsSection = dynamic(() => import("./ReviewsSection"), { ssr: false });
const BlogCarousel = dynamic(() => import("./BlogCarousel"), { ssr: false });

interface BelowFoldSectionsProps {
    lang: string;
    dictionary: Dictionary;
    properties: PublicProperty[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blogPosts: any[];
}

export default function BelowFoldSections({ lang, dictionary, properties, blogPosts }: BelowFoldSectionsProps) {
    return (
        <>
            <CountryBanners lang={lang} dictionary={dictionary} properties={properties} />
            <NewOffers lang={lang} dictionary={dictionary} properties={properties} />
            <AboutSection lang={lang} dictionary={dictionary} />
            <ReviewsSection lang={lang} dictionary={dictionary} />
            <BlogCarousel lang={lang} dictionary={dictionary} initialArticles={blogPosts} />
        </>
    );
}
