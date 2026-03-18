import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

const SYSTEM_PROMPT = `Si skúsený copywriter pre luxusné nehnuteľnosti. Píšeš v slovenčine.

ÚLOHA: Na základe poskytnutých údajov o nehnuteľnosti vytvor pútavý, profesionálny popis v 2-3 odsekoch.

PRAVIDLÁ:
- Píš v slovenčine
- Použi elegantný, no nie príliš kvetnatý jazyk
- Zdôrazni hlavné prednosti nehnuteľnosti
- Spomeň lokalitu a jej výhody
- Ak je bazén, výhľad na more alebo iné špeciálne vlastnosti, zdôrazni ich
- Nepíš cenu v texte
- Nepíš nadpisy ani odrážky — iba plynulý text
- Dĺžka: 150-300 slov`;

/**
 * POST /api/admin/ai-describe — Generate property description using Gemini
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

        // Build a context string from the property fields
        const details: string[] = [];

        if (body.title_sk) details.push(`Názov: ${body.title_sk}`);
        if (body.property_type) {
            const typeLabels: Record<string, string> = {
                villa: 'Vila', apartment: 'Apartmán', house: 'Dom', land: 'Pozemok'
            };
            details.push(`Typ: ${typeLabels[body.property_type] || body.property_type}`);
        }
        if (body.country) {
            const countryLabels: Record<string, string> = {
                croatia: 'Chorvátsko', spain: 'Španielsko', bulgaria: 'Bulharsko',
                greece: 'Grécko', italy: 'Taliansko', montenegro: 'Čierna Hora'
            };
            details.push(`Krajina: ${countryLabels[body.country] || body.country}`);
        }
        if (body.city) details.push(`Mesto: ${body.city}`);
        if (body.location_sk) details.push(`Lokalita: ${body.location_sk}`);
        if (body.beds) details.push(`Spálne: ${body.beds}`);
        if (body.baths) details.push(`Kúpeľne: ${body.baths}`);
        if (body.area) details.push(`Rozloha: ${body.area} m²`);
        if (body.year) details.push(`Rok výstavby: ${body.year}`);
        if (body.floors) details.push(`Počet podlaží: ${body.floors}`);
        if (body.distance_from_sea) details.push(`Vzdialenosť od mora: ${body.distance_from_sea} m`);
        if (body.disposition) details.push(`Dispozícia: ${body.disposition}`);

        // Features
        const features: string[] = [];
        if (body.pool) features.push('Bazén');
        if (body.garden) features.push('Záhrada');
        if (body.balcony) features.push('Balkón/Terasa');
        if (body.sea_view) features.push('Výhľad na more');
        if (body.first_line) features.push('Prvá línia od mora');
        if (body.luxury) features.push('Luxusná nehnuteľnosť');
        if (body.golf) features.push('Golf v blízkosti');
        if (body.mountains) features.push('Horské prostredie');
        if (body.new_build) features.push('Novostavba');
        if (body.parking && body.parking > 0) features.push(`Parkovanie (${body.parking} miesta)`);

        if (features.length > 0) {
            details.push(`Vlastnosti: ${features.join(', ')}`);
        }

        if (details.length < 3) {
            return NextResponse.json(
                { error: 'Vyplňte aspoň názov, typ a lokalitu pre generovanie popisu' },
                { status: 400 }
            );
        }

        const userPrompt = `Údaje o nehnuteľnosti:\n${details.join('\n')}\n\nVytvor popis:`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: userPrompt },
        ]);

        const description = result.response.text()?.trim();

        if (!description) {
            return NextResponse.json(
                { error: 'AI nevygenerovala žiadny text' },
                { status: 500 }
            );
        }

        return NextResponse.json({ description });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'AI generation failed';
        console.error('AI describe error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
