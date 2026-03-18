/**
 * Translation Script using Google Gemini API
 * 
 * This script generates translations for SK, EN, and DE.
 * Run with: npx ts-node --esm scripts/translate-mock-data.ts
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Data to translate (embedded for script isolation)
const properties = [
    {
        id: 1,
        title: "Luxusná Villa s bazénom",
        location: "Split, Chorvátsko",
        country: "croatia",
        price: 850000,
        priceFormatted: "€ 850,000",
        beds: 4,
        baths: 3,
        area: 280,
        type: "villa",
        images: [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
        ],
        featured: true,
        year: 2022,
        description: "Nádherná moderná vila s panoramatickým výhľadom na more. Táto nehnuteľnosť ponúka luxusné bývanie v jednej z najžiadanejších lokalít Chorvátska.",
        seaView: true,
        firstLine: true,
        luxury: true,
    },
    {
        id: 2,
        title: "Apartmán s výhľadom na more",
        location: "Marbella, Španielsko",
        country: "spain",
        price: 425000,
        priceFormatted: "€ 425,000",
        beds: 2,
        baths: 2,
        area: 120,
        type: "apartment",
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"],
        featured: false,
        description: "Elegantný apartmán v prestížnej lokalite s priamym výhľadom na Stredozemné more.",
        seaView: true,
    },
    {
        id: 3,
        title: "Moderný byt pri pláži",
        location: "Slnečné pobrežie, Bulharsko",
        country: "bulgaria",
        price: 95000,
        priceFormatted: "€ 95,000",
        beds: 1,
        baths: 1,
        area: 55,
        type: "apartment",
        images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80"],
        featured: true,
        description: "Kompaktný apartmán ideálny na dovolenku alebo investíciu. Len pár minút od pláže.",
    },
    {
        id: 4,
        title: "Historická vila v Toskánsku",
        location: "Firenze, Taliansko",
        country: "italy",
        price: 1200000,
        priceFormatted: "€ 1,200,000",
        beds: 6,
        baths: 4,
        area: 450,
        type: "villa",
        images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80"],
        featured: true,
        description: "Historická vila s moderným interiérom v srdci Toskánska. Ideálna pre milovníkov architektúry a talianskej kultúry.",
    },
    {
        id: 5,
        title: "Penthouse s terasou",
        location: "Dubrovník, Chorvátsko",
        country: "croatia",
        price: 680000,
        priceFormatted: "€ 680,000",
        beds: 3,
        baths: 2,
        area: 180,
        type: "apartment",
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"],
        featured: false,
        description: "Luxusný penthouse s veľkou terasou a výhľadom na historické centrum Dubrovníka.",
    },
    {
        id: 6,
        title: "Rodinný dom pri mori",
        location: "Burgas, Bulharsko",
        country: "bulgaria",
        price: 185000,
        priceFormatted: "€ 185,000",
        beds: 4,
        baths: 2,
        area: 220,
        type: "house",
        images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80"],
        featured: false,
        description: "Priestranný rodinný dom s veľkou záhradou, ideálny pre rodinu s deťmi.",
    },
    {
        id: 7,
        title: "Moderná vila s infinity bazénom",
        location: "Costa Brava, Španielsko",
        country: "spain",
        price: 1450000,
        priceFormatted: "€ 1,450,000",
        beds: 5,
        baths: 4,
        area: 380,
        type: "villa",
        images: ["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80"],
        featured: true,
        description: "Architektonický skvost s infinity bazénom a panoramatickým výhľadom na more.",
    },
    {
        id: 8,
        title: "Apartmán v centre mesta",
        location: "Zadar, Chorvátsko",
        country: "croatia",
        price: 220000,
        priceFormatted: "€ 220,000",
        beds: 2,
        baths: 1,
        area: 75,
        type: "apartment",
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"],
        featured: false,
        description: "Útulný apartmán v historickom centre Zadaru, pešia dostupnosť ku všetkým atrakciám.",
    },
    {
        id: 9,
        title: "Luxusná vila na ostrove",
        location: "Hvar, Chorvátsko",
        country: "croatia",
        price: 2100000,
        priceFormatted: "€ 2,100,000",
        beds: 6,
        baths: 5,
        area: 520,
        type: "villa",
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"],
        featured: true,
        description: "Exkluzívna vila na prestížnom ostrove Hvar s priamym prístupom k moru.",
    },
];

const filterData = {
    countries: [
        { value: "all", label: "Všetky krajiny" },
        { value: "bulgaria", label: "Bulharsko" },
        { value: "greece", label: "Grécko" },
        { value: "spain", label: "Španielsko" },
        { value: "croatia", label: "Chorvátsko" },
    ],
    propertyTypes: [
        { value: "all", label: "Všetky typy" },
        { value: "villa", label: "Vila" },
        { value: "apartment", label: "Apartmán" },
        { value: "house", label: "Dom" },
        { value: "land", label: "Pozemok" },
    ],
    priceRanges: [
        { value: "all", label: "Akákoľvek cena" },
        { value: "0-100000", label: "do €100,000" },
        { value: "100000-300000", label: "€100,000 - €300,000" },
        { value: "300000-500000", label: "€300,000 - €500,000" },
        { value: "500000-1000000", label: "€500,000 - €1,000,000" },
        { value: "1000000+", label: "nad €1,000,000" },
    ],
    bedroomOptions: [
        { value: "all", label: "Všetky" },
        { value: "1", label: "1+ izieb" },
        { value: "2", label: "2+ izieb" },
        { value: "3", label: "3+ izieb" },
        { value: "4", label: "4+ izieb" },
        { value: "5", label: "5+ izieb" },
    ],
    sortOptions: [
        { value: "newest", label: "Najnovšia ponuka" },
        { value: "price-asc", label: "Cena od najnižšej" },
        { value: "price-desc", label: "Cena od najvyššej" },
    ],
};

async function translateText(text: string, targetLang: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const langNames: Record<string, string> = {
        en: "English",
        de: "German",
    };

    const prompt = `You are a professional real estate translator. Translate the following text from Slovak to ${langNames[targetLang]}.
Keep the tone luxurious and inviting, suitable for high-end real estate marketing.
Only return the translated text, nothing else.

Text to translate:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
}

async function translateProperties() {
    const translatedProperties: any[] = [];

    console.log(`\n📦 Translating ${properties.length} properties...\n`);

    for (const property of properties) {
        console.log(`  🏠 Translating property ${property.id}: ${property.title}`);

        const titleEn = await translateText(property.title, "en");
        const titleDe = await translateText(property.title, "de");
        const locationEn = await translateText(property.location, "en");
        const locationDe = await translateText(property.location, "de");

        let descriptionTranslated: { sk: string; en: string; de: string } | undefined;
        if (property.description) {
            const descEn = await translateText(property.description, "en");
            const descDe = await translateText(property.description, "de");
            descriptionTranslated = {
                sk: property.description,
                en: descEn,
                de: descDe,
            };
        }

        translatedProperties.push({
            ...property,
            title: { sk: property.title, en: titleEn, de: titleDe },
            location: { sk: property.location, en: locationEn, de: locationDe },
            description: descriptionTranslated,
        });

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return translatedProperties;
}

async function translateOptions(options: { value: string; label: string }[]) {
    const translatedOptions: any[] = [];

    for (const option of options) {
        const labelEn = await translateText(option.label, "en");
        const labelDe = await translateText(option.label, "de");

        translatedOptions.push({
            value: option.value,
            label: { sk: option.label, en: labelEn, de: labelDe },
        });

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    return translatedOptions;
}

async function main() {
    console.log("🚀 Starting Gemini AI Translation...\n");

    try {
        const translatedProperties = await translateProperties();
        console.log("\n✅ Properties translated successfully!");

        console.log("\n📝 Translating filter options...");
        const translatedCountries = await translateOptions(filterData.countries);
        const translatedPropertyTypes = await translateOptions(filterData.propertyTypes);
        const translatedPriceRanges = await translateOptions(filterData.priceRanges);
        const translatedBedroomOptions = await translateOptions(filterData.bedroomOptions);
        const translatedSortOptions = await translateOptions(filterData.sortOptions);
        console.log("✅ Filter options translated!");

        const output = {
            generatedAt: new Date().toISOString(),
            properties: translatedProperties,
            filters: {
                countries: translatedCountries,
                propertyTypes: translatedPropertyTypes,
                priceRanges: translatedPriceRanges,
                bedroomOptions: translatedBedroomOptions,
                sortOptions: translatedSortOptions,
            },
        };

        const outputPath = path.join(__dirname, "../src/lib/mock-data-multilingual.json");
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

        console.log(`\n🎉 Translation complete!`);
        console.log(`📁 Output saved to: ${outputPath}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Properties: ${translatedProperties.length}`);
        console.log(`   - Languages: SK, EN, DE`);

    } catch (error) {
        console.error("\n❌ Translation failed:", error);
        process.exit(1);
    }
}

main();
