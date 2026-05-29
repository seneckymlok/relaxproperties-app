/**
 * Shared DeepL translation helper for feed importers.
 *
 * Uses the JSON + `Authorization: DeepL-Auth-Key` style — the legacy
 * form-encoded `auth_key` body is rejected by DeepL Pro.
 *
 * Throws on non-OK responses so callers see real errors instead of
 * silently storing English in every locale.
 */

export function getDeeplKey(override?: string): string {
    return override || process.env.DEEPL_API_KEY || '';
}

export function assertDeeplKey(key: string, source: string): void {
    if (!key) {
        throw new Error(
            `DEEPL_API_KEY not configured. ${source} listings need translation; ` +
            'set DEEPL_API_KEY in the environment.'
        );
    }
}

/**
 * Translate an array of texts from a source language into a target language.
 * Empty strings are preserved at the same index. The returned array always
 * has the same length as the input.
 */
export async function translateBatch(
    texts: string[],
    sourceLang: 'EN' | 'SK',
    targetLang: 'SK' | 'CS' | 'EN',
    apiKey: string
): Promise<string[]> {
    if (!texts.length) return [];
    const nonEmpty = texts.map((t, i) => ({ t, i })).filter(({ t }) => t && t.trim());
    if (!nonEmpty.length) return texts.map(() => '');

    // Free-tier keys end with ":fx"
    const url = apiKey.endsWith(':fx')
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: nonEmpty.map(({ t }) => t),
            source_lang: sourceLang,
            target_lang: targetLang,
            preserve_formatting: true,
        }),
    });

    if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`DeepL ${sourceLang}→${targetLang} failed: ${resp.status} ${errText.slice(0, 200)}`);
    }

    const json = await resp.json() as { translations: { text: string }[] };
    const results = [...texts];
    nonEmpty.forEach(({ i }, idx) => {
        results[i] = json.translations[idx]?.text ?? texts[i];
    });
    return results;
}
