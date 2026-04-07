import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Valid values for enum filters
const VALID_COUNTRIES = ["all", "spain", "croatia", "italy", "portugal", "greece", "montenegro", "bulgaria"];
const VALID_PROPERTY_TYPES = ["all", "villa", "apartment", "house", "land"];
const VALID_BEDROOMS = ["all", "1", "2", "3", "4+"];
const VALID_SORT = ["featured", "price-asc", "price-desc", "newest", "area-desc"];

// All boolean features the system supports
const ALL_FEATURES = [
    "seaView", "firstLine", "pool", "newBuild", "newProject",
    "luxury", "golf", "mountains", "balcony", "terrace",
    "garden", "parking", "nearBeach", "nearAirport",
] as const;

// System prompt for the AI
const SYSTEM_PROMPT = `You are a real estate search assistant for a Mediterranean property website. Your job is to analyze user queries about properties and extract structured search filters. Users may write in English, Slovak (SK), or Czech (CZ).

Return a JSON object with these fields:

1. ENUM FILTERS (use exact values only):
   - country: "all" | "spain" | "croatia" | "italy" | "portugal" | "greece" | "montenegro" | "bulgaria"
   - propertyType: "all" | "villa" | "apartment" | "house" | "land"
   - bedrooms: "all" | "1" | "2" | "3" | "4+"
   - sort: "featured" | "price-asc" | "price-desc" | "newest" | "area-desc"

2. KEYWORD SEARCH (for text matching against property titles, locations, descriptions):
   - searchQuery: string | null
   Use this for specific names, complexes, addresses, or keywords the user is looking for (e.g. "Majestic", "Vinamar", "Costa del Sol"). This will do a text search across property titles, locations and descriptions. Use null if the query is purely about filters (country, type, price) with no specific keyword.

3. PRICE FILTERS (numbers in euros, use null if not specified):
   - priceMin: number | null
   - priceMax: number | null

4. BOOLEAN FEATURE FILTERS (set to true ONLY if explicitly mentioned or clearly implied):
   - seaView: sea/ocean view
   - firstLine: first line to sea/beachfront
   - pool: has swimming pool
   - newBuild: newly built/constructed property
   - newProject: new development/project (off-plan)
   - luxury: luxury/premium property
   - golf: near golf course
   - mountains: mountain property/view
   - balcony: has balcony
   - terrace: has terrace/patio
   - garden: has garden
   - parking: has parking/garage
   - nearBeach: near the beach (within walking distance)
   - nearAirport: near airport

COUNTRY NAME MAPPINGS (multilingual):
- Spain/Španielsko/Španělsko → "spain"
- Croatia/Chorvátsko/Chorvatsko → "croatia"
- Italy/Taliansko/Itálie → "italy"
- Portugal/Portugalsko → "portugal"
- Greece/Grécko/Řecko → "greece"
- Montenegro/Čierna Hora/Černá Hora → "montenegro"
- Bulgaria/Bulharsko → "bulgaria"

PROPERTY TYPE MAPPINGS (multilingual):
- Villa/Vila → "villa"
- Apartment/Apartmán/Byt → "apartment"
- House/Dom/Dům → "house"
- Land/Pozemok/Pozemek → "land"

PRICE INTERPRETATION:
- "under/do/pod 500k" → priceMax: 500000
- "over/nad/přes 1M/milión" → priceMin: 1000000
- "200-500k" → priceMin: 200000, priceMax: 500000
- "cheap/lacný/levný/affordable/dostupný" → priceMax: 200000
- "mid-range/stredná/střední" → priceMin: 150000, priceMax: 400000
- "expensive/drahý/premium/prémiový" → priceMin: 500000, luxury: true
- "k" = thousand (1000), "M/mil/milión" = million (1000000)

SORT INTERPRETATION:
- "cheapest/najlacnejšie/nejlevnější" → sort: "price-asc"
- "most expensive/najdrahšie/nejdražší" → sort: "price-desc"
- "newest/najnovšie/nejnovější" → sort: "newest"
- "largest/biggest/najväčšie/největší" → sort: "area-desc"
- If no sort preference mentioned → sort: "featured"

FEATURE INTERPRETATION:
- "pri mori/u moře/by the sea/seafront" → seaView: true, nearBeach: true
- "prvá línia/první linie/beachfront/first line" → firstLine: true
- "s bazénom/s bazénem/with pool" → pool: true
- "novostavba/new build" → newBuild: true
- "s balkónom/s balkónem/with balcony" → balcony: true
- "s terasou/with terrace" → terrace: true
- "so záhradou/se zahradou/with garden" → garden: true
- "s parkovaním/s parkováním/with parking/s garážou" → parking: true
- "blízko pláže/near beach" → nearBeach: true
- "blízko letiska/blízko letiště/near airport" → nearAirport: true
- "luxusná/luxusní/luxury" → luxury: true
- "golf" → golf: true
- "hory/mountains/horská" → mountains: true

RULES:
- Default ALL filters to their neutral value ("all", null, or false) unless the query mentions them
- Use "all" for country/propertyType/bedrooms if not specified
- Use null for priceMin/priceMax if not specified
- Use false for all boolean features if not mentioned
- bedrooms: "4+" means 4 or more bedrooms. Use it for "4", "5", "6", etc.
- If user mentions a specific city/region (e.g., "Costa del Sol", "Dalmácia", "Split"), map it to the correct country
- Do NOT hallucinate features — only set true what the user actually mentioned

Respond ONLY with a valid JSON object. No markdown, no explanations, no code blocks.`;

export async function POST(request: NextRequest) {
    try {
        const { query, lang = "sk" } = await request.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            );
        }

        // Call Gemini
        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: `User query (language: ${lang}): "${query}"\n\nExtract the filters as JSON:` },
        ]);

        const responseText = result.response.text();

        // Parse the JSON from the response
        let filters;
        try {
            // Try to extract JSON from the response (in case it has markdown code blocks)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                filters = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in response");
            }
        } catch {
            console.error("Failed to parse AI response:", responseText);
            return NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 500 }
            );
        }

        // Validate and sanitize the filters — never trust the AI output
        const sanitizedFilters: Record<string, string | boolean> = {
            country: VALID_COUNTRIES.includes(filters.country) ? filters.country : "all",
            propertyType: VALID_PROPERTY_TYPES.includes(filters.propertyType) ? filters.propertyType : "all",
            bedrooms: VALID_BEDROOMS.includes(String(filters.bedrooms)) ? String(filters.bedrooms) : "all",
            sort: VALID_SORT.includes(filters.sort) ? filters.sort : "featured",
        };

        // Sanitize searchQuery — extract keyword for text search
        const searchQuery = typeof filters.searchQuery === 'string' ? filters.searchQuery.trim() : "";
        if (searchQuery) sanitizedFilters.searchQuery = searchQuery;

        // Sanitize price — accept number or numeric string
        const priceMin = Number(filters.priceMin);
        const priceMax = Number(filters.priceMax);
        sanitizedFilters.priceMin = (!isNaN(priceMin) && priceMin > 0) ? priceMin.toString() : "";
        sanitizedFilters.priceMax = (!isNaN(priceMax) && priceMax > 0) ? priceMax.toString() : "";

        // Sanitize all boolean features
        for (const feature of ALL_FEATURES) {
            sanitizedFilters[feature] = filters[feature] === true;
        }

        return NextResponse.json({
            success: true,
            filters: sanitizedFilters,
            rawQuery: query,
        });

    } catch (error) {
        console.error("AI Search Error:", error);
        return NextResponse.json(
            { error: "Failed to process search query" },
            { status: 500 }
        );
    }
}
