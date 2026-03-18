import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

const DEEPL_FREE_URL = 'https://api-free.deepl.com/v2/translate';
const DEEPL_PRO_URL = 'https://api.deepl.com/v2/translate';

function getDeepLUrl(): string {
    const key = process.env.DEEPL_API_KEY || '';
    // Free API keys end with ":fx"
    return key.endsWith(':fx') ? DEEPL_FREE_URL : DEEPL_PRO_URL;
}

/**
 * POST /api/admin/translate — Translate text via DeepL API
 * Body: { texts: string[], targetLang: "EN" | "CS" }
 *
 * Notes:
 * - Source language is always Slovak (SK)
 * - Czech uses "CS" in DeepL (not "CZ")
 * - Free tier: 500,000 chars/month
 */
export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'DeepL API kľúč nie je nastavený. Pridajte DEEPL_API_KEY do .env.local' },
            { status: 500 }
        );
    }

    try {
        const { texts, targetLang } = await request.json();

        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return NextResponse.json({ error: 'No texts provided' }, { status: 400 });
        }

        if (!targetLang || !['EN', 'CS'].includes(targetLang)) {
            return NextResponse.json({ error: 'targetLang must be "EN" or "CS"' }, { status: 400 });
        }

        // Filter out empty strings
        const nonEmpty = texts.filter((t: string) => t && t.trim());
        if (nonEmpty.length === 0) {
            return NextResponse.json({ translations: texts.map(() => '') });
        }

        // Call DeepL API
        const response = await fetch(getDeepLUrl(), {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: nonEmpty,
                source_lang: 'SK',
                target_lang: targetLang,
                preserve_formatting: true,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('DeepL error:', response.status, errText);
            return NextResponse.json(
                { error: `DeepL API chyba: ${response.status}` },
                { status: 502 }
            );
        }

        const data = await response.json();

        // Map translations back, preserving empty string positions
        const translatedMap = new Map<string, string>();
        nonEmpty.forEach((original: string, i: number) => {
            translatedMap.set(original, data.translations[i]?.text || original);
        });

        const translations = texts.map((t: string) =>
            t && t.trim() ? (translatedMap.get(t) || t) : ''
        );

        return NextResponse.json({ translations });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Translation failed';
        console.error('Translation error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
