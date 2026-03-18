import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { countries, propertyTypes, bedroomOptions } from "@/lib/data-access";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Define the filter schema for the AI
const filterSchema = {
    country: countries.map(c => c.value),
    propertyType: propertyTypes.map(t => t.value),
    bedrooms: bedroomOptions.map(b => b.value),
    features: ["seaView", "firstLine", "pool", "newBuild", "newProject", "luxury", "golf", "mountains"],
};

// System prompt for the AI
const SYSTEM_PROMPT = `You are a real estate search assistant. Your job is to analyze user queries about properties and extract search filters.

Available filter options:
- country: ${filterSchema.country.join(", ")} (use "all" if not specified)
- propertyType: ${filterSchema.propertyType.join(", ")} (use "all" if not specified)
- bedrooms: ${filterSchema.bedrooms.join(", ")} (use "all" if not specified)
- priceMin: number (minimum price in euros, leave empty if not specified)
- priceMax: number (maximum price in euros, leave empty if not specified)
- Features (boolean, set to true if mentioned):
  - seaView: property has sea/ocean view
  - firstLine: property is on the first line to the sea/beach
  - pool: property has a pool
  - newBuild: newly built property
  - newProject: new development project
  - luxury: luxury/premium property
  - golf: near golf course
  - mountains: mountain property/view

IMPORTANT:
- Only use exact values from the lists above
- For prices: "under 500k" means priceMax=500000, "over 1M" means priceMin=1000000
- "cheap" or "affordable" typically means priceMax=200000
- "expensive" or "premium" typically means priceMin=500000 and luxury=true
- Country name mappings: Croatia=croatia, Spain=spain, Bulgaria=bulgaria, Greece=greece, Italy=italy, Montenegro=montenegro
- Property type mappings: villa=villa, apartment=apartment, house=house, land=land

Respond ONLY with a valid JSON object containing the filters. No explanations.`;

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

        // Validate and sanitize the filters
        const sanitizedFilters = {
            country: filterSchema.country.includes(filters.country) ? filters.country : "all",
            propertyType: filterSchema.propertyType.includes(filters.propertyType) ? filters.propertyType : "all",
            bedrooms: filterSchema.bedrooms.includes(filters.bedrooms) ? filters.bedrooms : "all",
            priceMin: typeof filters.priceMin === "number" ? filters.priceMin.toString() : "",
            priceMax: typeof filters.priceMax === "number" ? filters.priceMax.toString() : "",
            seaView: filters.seaView === true,
            firstLine: filters.firstLine === true,
            pool: filters.pool === true,
            newBuild: filters.newBuild === true,
            newProject: filters.newProject === true,
            luxury: filters.luxury === true,
            golf: filters.golf === true,
            mountains: filters.mountains === true,
        };

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
