import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/reviews?lang=sk|en|cz
 *
 * Fetches Google reviews for the business using the Places API.
 * The `language` param is passed to Google so reviews and time
 * descriptions are returned in the requested language.
 * Cached per-language for 1 hour.
 */

interface GoogleReview {
    author_name: string;
    rating: number;
    text: string;
    relative_time_description: string;
    time: number;
    profile_photo_url: string;
    language: string;
}

interface GooglePlacesResponse {
    result?: {
        rating?: number;
        user_ratings_total?: number;
        reviews?: GoogleReview[];
    };
    status: string;
    error_message?: string;
}

interface CacheEntry {
    data: ReturnType<typeof formatReviews> | null;
    rating: number;
    totalReviews: number;
    fetchedAt: number;
}

// Per-language in-memory cache
const cache: Record<string, CacheEntry> = {};

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Map our lang codes to Google Places API language codes
const LANG_MAP: Record<string, string> = {
    sk: 'sk',
    en: 'en',
    cz: 'cs', // Google uses "cs" for Czech
};

function formatReviews(reviews: GoogleReview[]) {
    return reviews
        .filter(r => r.rating >= 4) // Only show 4+ star reviews
        .map(r => ({
            name: r.author_name,
            rating: r.rating,
            text: r.text,
            timeAgo: r.relative_time_description,
            timestamp: r.time,
            photo: r.profile_photo_url || null,
            language: r.language,
        }));
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const lang = searchParams.get('lang') || 'sk';
        const googleLang = LANG_MAP[lang] || 'sk';
        const now = Date.now();

        // Return cached data if still fresh
        const cached = cache[lang];
        if (cached?.data && (now - cached.fetchedAt) < CACHE_DURATION_MS) {
            return NextResponse.json({
                reviews: cached.data,
                rating: cached.rating,
                totalReviews: cached.totalReviews,
                cached: true,
            }, {
                headers: {
                    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
                },
            });
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        const placeId = process.env.GOOGLE_PLACE_ID;

        if (!apiKey || !placeId) {
            return NextResponse.json(
                { error: 'Missing API key or Place ID configuration' },
                { status: 500 }
            );
        }

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&reviews_sort=newest&language=${googleLang}&key=${apiKey}`;

        const response = await fetch(url, { next: { revalidate: 3600 } });
        const data: GooglePlacesResponse = await response.json();

        if (data.status !== 'OK' || !data.result) {
            console.error('Google Places API error:', data.status, data.error_message);
            // Return stale cached data if available
            if (cached?.data) {
                return NextResponse.json({
                    reviews: cached.data,
                    rating: cached.rating,
                    totalReviews: cached.totalReviews,
                    cached: true,
                    stale: true,
                });
            }
            return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 502 });
        }

        const reviews = formatReviews(data.result.reviews || []);
        const rating = data.result.rating || 5;
        const totalReviews = data.result.user_ratings_total || 0;

        // Update per-language cache
        cache[lang] = { data: reviews, rating, totalReviews, fetchedAt: now };

        return NextResponse.json({
            reviews,
            rating,
            totalReviews,
            cached: false,
        }, {
            headers: {
                'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        console.error('Reviews API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
