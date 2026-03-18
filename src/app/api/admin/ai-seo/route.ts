import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

const SYSTEM_PROMPT = `Si SEO expert pre luxusné nehnuteľnosti. Píšeš v slovenčine.

ÚLOHA: Na základe poskytnutých údajov o nehnuteľnosti vygeneruj SEO-optimalizované metadáta.

VRÁŤ PRESNE TENTO JSON FORMÁT (bez markdown, bez komentárov, iba čistý JSON):
{
  "meta_title": "...",
  "meta_description": "...",
  "keywords": ["...", "...", "..."]
}

PRAVIDLÁ PRE META TITLE:
- Max 60 znakov
- Obsahuj typ nehnuteľnosti, lokalitu a hlavný predajný bod
- Formát: "[Typ] v [Lokalita] - [USP]"
- Príklad: "Luxusná vila s bazénom pri mori - Split, Chorvátsko"

PRAVIDLÁ PRE META DESCRIPTION:
- Max 155 znakov
- Pútavý popis pre Google výsledky vyhľadávania
- Obsahuj cenu ak je dostupná, rozlohu, kľúčové vlastnosti
- Konci výzvou k akcii

PRAVIDLÁ PRE KEYWORDS:
- 5-10 relevantných kľúčových slov v slovenčine
- Mix obecných a špecifických slov
- Zahrň lokalitu, typ, vlastnosti
- Príklady: "luxusná vila chorvátsko", "apartmán pri mori", "novostavba split"`;

/**
 * POST /api/admin/ai-seo — Generate SEO metadata using Gemini
 */
export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'Gemini API kľúč nie je nastavený. Pridajte GEMINI_API_KEY do .env.local' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();

        // Build context from property fields
        const details: string[] = [];

        if (body.title_sk) details.push(`Názov: ${body.title_sk}`);
        if (body.property_type) {
            const typeLabels: Record<string, string> = {
                studio_apartment_flat: 'Štúdio / Apartmán / Byt',
                family_house_villa: 'Rodinný dom / Vila',
                luxury_property: 'Luxusná nehnuteľnosť',
                villa: 'Vila', apartment: 'Apartmán', house: 'Dom', land: 'Pozemok',
            };
            details.push(`Typ: ${typeLabels[body.property_type] || body.property_type}`);
        }
        if (body.country) {
            const countryLabels: Record<string, string> = {
                croatia: 'Chorvátsko', spain: 'Španielsko', bulgaria: 'Bulharsko',
                greece: 'Grécko', italy: 'Taliansko', slovakia: 'Slovensko',
                montenegro: 'Čierna Hora',
            };
            details.push(`Krajina: ${countryLabels[body.country] || body.country}`);
        }
        if (body.city) details.push(`Mesto: ${body.city}`);
        if (body.location_sk) details.push(`Lokalita: ${body.location_sk}`);
        if (body.description_sk) details.push(`Popis: ${body.description_sk.slice(0, 300)}`);
        if (body.beds) details.push(`Spálne: ${body.beds}`);
        if (body.baths) details.push(`Kúpeľne: ${body.baths}`);
        if (body.area) details.push(`Rozloha: ${body.area} m²`);
        if (body.price && !body.price_on_request) details.push(`Cena: € ${parseInt(body.price).toLocaleString('en-US')}`);
        if (body.price_on_request) details.push('Cena: na vyžiadanie');
        if (body.distance_from_sea) details.push(`Vzdialenosť od mora: ${body.distance_from_sea} m`);

        // Features
        const features: string[] = [];
        if (body.pool) features.push('Bazén');
        if (body.garden) features.push('Záhrada');
        if (body.balcony) features.push('Balkón');
        if (body.sea_view) features.push('Výhľad na more');
        if (body.first_line) features.push('Prvá línia');
        if (body.luxury) features.push('Luxus');
        if (body.golf) features.push('Golf');
        if (body.mountains) features.push('Hory');
        if (body.new_build) features.push('Novostavba');
        if (body.terasa) features.push('Terasa');
        if (body.fireplace) features.push('Krb');
        if (body.garage) features.push('Garáž');

        if (features.length > 0) {
            details.push(`Vlastnosti: ${features.join(', ')}`);
        }

        if (details.length < 2) {
            return NextResponse.json(
                { error: 'Vyplňte aspoň názov a typ nehnuteľnosti pre generovanie SEO' },
                { status: 400 }
            );
        }

        const userPrompt = `Údaje o nehnuteľnosti:\n${details.join('\n')}\n\nVygeneruj SEO metadáta vo formáte JSON:`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: userPrompt },
        ]);

        const rawText = result.response.text()?.trim() || '';

        // Parse JSON from the response (strip markdown code fences if present)
        const jsonStr = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        let parsed: { meta_title?: string; meta_description?: string; keywords?: string[] };
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            console.error('Failed to parse AI SEO response:', rawText);
            return NextResponse.json(
                { error: 'AI vrátila neplatný formát. Skúste znova.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            meta_title: parsed.meta_title || '',
            meta_description: parsed.meta_description || '',
            keywords: parsed.keywords || [],
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'AI generation failed';
        console.error('AI SEO error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
