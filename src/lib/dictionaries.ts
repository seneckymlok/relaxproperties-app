/**
 * Dictionary Loader for i18n
 * 
 * Loads the appropriate dictionary based on locale.
 */

import type { Language } from './data-access';

// Import dictionaries statically to enable bundling
import sk from '@/dictionaries/sk.json';
import en from '@/dictionaries/en.json';
import cz from '@/dictionaries/cz.json';

const dictionaries = {
    sk,
    en,
    cz,
} as const;

export type Dictionary = typeof sk;

export function getDictionary(locale: Language): Dictionary {
    return dictionaries[locale] || dictionaries.sk;
}

// Type helper for nested dictionary access
export type DictionaryKey = keyof Dictionary;
