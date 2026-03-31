/**
 * Blog Import Script
 *
 * Parses the WordPress XML export (Clanky-Export-2026-March-30-2252.xml),
 * groups SK/EN/CZ translations, cleans content, re-uploads featured images
 * to Vercel Blob, and upserts into the Supabase blog_posts table.
 *
 * Usage:
 *   npx tsx scripts/import-blogs.ts              # live import
 *   npx tsx scripts/import-blogs.ts --dry-run    # preview only
 */

import * as path from 'path';
// Load env vars BEFORE any module that reads process.env at import time
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import * as fs from 'fs';
import { put } from '@vercel/blob';
// Note: supabase is dynamically imported in main() so env vars are available

// ============================================
// TYPES
// ============================================

interface RawPost {
    title: string;
    content: string;
    date: string;
    imageFeatured: string;
    imageURLs: string[];
}

interface GroupedArticle {
    sk: RawPost | null;
    en: RawPost | null;
    cz: RawPost | null;
    date: string;
    imageFeatured: string;
    groupKey: string;
}

// ============================================
// XML PARSING (simple regex — no dependency)
// ============================================

function extractTag(xml: string, tag: string): string {
    // Handle CDATA
    const cdataRegex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    // Handle regular tags
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'is');
    const match = xml.match(regex);
    if (match) return match[1].trim();

    // Handle self-closing empty tags like <Tag/>
    return '';
}

function parseXML(xmlContent: string): RawPost[] {
    const posts: RawPost[] = [];
    const postRegex = /<post>([\s\S]*?)<\/post>/g;
    let match;

    while ((match = postRegex.exec(xmlContent)) !== null) {
        const block = match[1];
        let title = extractTag(block, 'Title');
        // Decode HTML entities
        title = title.replace(/&#8211;/g, '–').replace(/&#8217;/g, "'").replace(/&amp;/g, '&');

        const content = extractTag(block, 'Content');
        const date = extractTag(block, 'Date');
        const imageFeatured = extractTag(block, 'ImageFeatured');
        const imageURLRaw = extractTag(block, 'ImageURL');
        const imageURLs = imageURLRaw ? imageURLRaw.split('|').filter(Boolean) : [];

        posts.push({ title, content, date, imageFeatured, imageURLs });
    }

    return posts;
}

// ============================================
// CONTENT CLEANING
// ============================================

function cleanContent(raw: string): string {
    let s = raw;

    // 1. Strip Divi/Elementor shortcodes: [et_pb_*]...[/et_pb_*] and [et_pb_* ... /]
    s = s.replace(/\[et_pb_[^\]]*\]|\[\/et_pb_[^\]]*\]/g, '');

    // 2. Strip &nbsp;
    s = s.replace(/&nbsp;/g, ' ');

    // 3. Strip inline style attributes from spans (but keep the text)
    s = s.replace(/<span\s+style="[^"]*">/g, '');
    s = s.replace(/<\/span>/g, '');

    // 4. Strip WordPress CSS classes from elements (keep the tag)
    s = s.replace(/\s+class="[^"]*"/g, '');
    s = s.replace(/\s+style="[^"]*"/g, '');

    // 5. Clean up image tags — convert WordPress inline images to clean img tags
    // Keep src and alt, strip everything else
    s = s.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/g, '<img src="$1" alt="$2" />');
    s = s.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/g, '<img src="$1" alt="" />');

    // 6. Remove empty headings
    s = s.replace(/<h[1-6]>\s*\.?\s*<\/h[1-6]>/g, '');

    // 7. Clean up WordPress <a> tags to relative links
    s = s.replace(/<a\s+href="https:\/\/relaxproperties\.sk\/tag\/[^"]*">/g, '');

    // 8. Remove \r characters, normalize line endings
    s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 9. Convert double newlines to paragraph breaks
    // First, wrap standalone text blocks in <p> tags if not already in HTML
    const lines = s.split('\n\n');
    const processed = lines.map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        // If already starts with an HTML block element, leave it
        if (/^<(h[1-6]|p|ol|ul|li|div|img|blockquote|table|hr|br)/i.test(trimmed)) {
            return trimmed;
        }
        // If it's just inline text (possibly with <strong>, <em>, <a>), wrap in <p>
        if (trimmed.length > 0) {
            return `<p>${trimmed}</p>`;
        }
        return '';
    }).filter(Boolean);

    s = processed.join('\n\n');

    // 10. Remove excessive whitespace
    s = s.replace(/\n{3,}/g, '\n\n');
    s = s.trim();

    return s;
}

function generateExcerpt(content: string, maxLen = 200): string {
    // Strip all HTML tags for excerpt
    const text = content
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

// ============================================
// LANGUAGE DETECTION & GROUPING
// ============================================

// Known junk titles to skip
const SKIP_TITLES = [
    'Automatický koncept',
    'Nový server (neveřejný příspěvek Softmedia)',
];

function detectLanguage(title: string, allPosts: RawPost[], index: number): 'sk' | 'en' | 'cz' | null {
    if (SKIP_TITLES.includes(title)) return null;

    const text = title + ' ' + allPosts[index].content.substring(0, 800);

    // English is easiest to detect — Latin words and no diacritics
    const enPatterns = [
        /\b(invest|resort|reasons?|property|Bulgaria|Croatia|Spain|Greece)\b/i,
        /\b(prices?|growth|What|How|Restaurant|Sunny|opening|tax|insurance)\b/i,
        /\b(account|forecast|Confirmed|real estate|information|development)\b/i,
        /\b(beach|living|abroad|renting|buying|ownership|landlords?)\b/i,
    ];
    const enScore = enPatterns.filter(p => p.test(title)).length;

    // Czech-specific: characters ě ř ů ň are CZ-only (not SK)
    // Also CZ-only words
    const czOnly = [
        /[ěřů]/,  // these characters are Czech, NOT Slovak
        /\bnemovitost/i, /\bvyplatí\b/i, /\bpobřeží/i, /\bletovisk[ao]\b/i,
        /\bměst/i, /\bdůvod/i, /\bpřed\b/i, /\búčet/i, /\bnemovitost/i,
        /\bSlunečné\b/i, /\bRestaurace\b/i, /\bChorvatsk/i, /\bBulharsk[oé]\b.*\bpřij/i,
        /\bVývoj cen\b/i, /\bRůst cen\b/i, /\bPodrobněj/i, /\bPotvrzeno/i,
        /\bletovišt/i, /\bkteré\b/i, /\bpronájm/i, /\bSrovnání/i,
        /\bpřijetí\b/i, /\bpřijímá/i, /\bOtevření/i, /\bvinařství/i,
        /\bnemovitostí\b/i, /\bzdravotní\b/i, /\bpojištění\b/i,
    ];

    // Slovak-specific: character ľ is SK-only (not CZ)
    // Also SK-only words
    const skOnly = [
        /ľ/,  // this character is Slovak, NOT Czech
        /\bnehnuteľnost/i, /\boplatí\b/i, /\bpobrežie/i, /\bprečo\b/i,
        /\bSlnečné\b/i, /\bReštaurácia\b/i, /\bChorvátsk/i,
        /\bVývoj cien\b/i, /\bRast cien\b/i, /\bPotvrdené\b/i,
        /\bletovisk[oá]\b/i, /\bvinárstvo/i, /\bsúkromných\b/i,
        /\bzdravotné\b/i, /\bpoistenie/i, /\broku\b/i,
        /\bprenájom/i, /\bPorovnanie/i, /\bprijatiu/i,
    ];

    const czScore = czOnly.filter(p => p.test(text)).length;
    const skScore = skOnly.filter(p => p.test(text)).length;

    // Clear winner
    if (enScore >= 2 && enScore > czScore && enScore > skScore) return 'en';
    if (enScore >= 1 && czScore === 0 && skScore === 0) return 'en';
    if (czScore > skScore) return 'cz';
    if (skScore > czScore) return 'sk';

    // Tied or zero — use character analysis as tiebreaker
    const hasEh = /ě/.test(text);  // ě is CZ only
    const hasRzh = /ř/.test(text);  // ř is CZ only
    const hasLsoft = /ľ/.test(text);  // ľ is SK only
    const hasOhat = /ô/.test(text);  // ô is SK only

    if ((hasEh || hasRzh) && !hasLsoft && !hasOhat) return 'cz';
    if ((hasLsoft || hasOhat) && !hasEh && !hasRzh) return 'sk';

    // Ultimate fallback
    if (enScore > 0) return 'en';
    return 'sk';
}

function normalizeGroupKey(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 40); // first 40 chars for fuzzy matching
}

function groupPosts(posts: RawPost[]): GroupedArticle[] {
    // Detect language for each post first
    const postLangs: (('sk' | 'en' | 'cz') | null)[] = posts.map((post, i) =>
        detectLanguage(post.title, posts, i)
    );

    // Pass 1: Group by shared featured image URL + same date (most reliable)
    const groups: GroupedArticle[] = [];
    const used = new Set<number>();

    for (let i = 0; i < posts.length; i++) {
        if (used.has(i) || !postLangs[i]) continue;

        const article: GroupedArticle = {
            sk: null, en: null, cz: null,
            date: posts[i].date,
            imageFeatured: posts[i].imageFeatured,
            groupKey: `${posts[i].date}_${i}`,
        };
        article[postLangs[i]!] = posts[i];
        used.add(i);

        // Look for translations: same date, shared featured image or consecutive order
        for (let j = i + 1; j < posts.length; j++) {
            if (used.has(j) || !postLangs[j]) continue;
            if (posts[j].date !== posts[i].date) continue; // different date
            if (article[postLangs[j]!]) continue; // slot already taken

            // Match by shared featured image (strong signal)
            const sharedImage = posts[i].imageFeatured && posts[j].imageFeatured &&
                posts[i].imageFeatured === posts[j].imageFeatured;

            // Match by shared image URLs (any overlap)
            const imgSetA = new Set(posts[i].imageURLs);
            const sharedImgUrls = posts[j].imageURLs.some(u => imgSetA.has(u));

            // Match by title similarity (shared proper nouns like Nesebar, Ravda, etc.)
            const titleA = posts[i].title.toLowerCase();
            const titleB = posts[j].title.toLowerCase();
            const sharedProperNoun = ['nesebar', 'ravda', 'sveti vlas', 'bansko', 'balčik',
                'costa del sol', 'costa blanca', 'khanov', 'hygge', 'schengen', 'bulstat', 'oib',
                'pomori', 'kondomíni', 'condomini']
                .some(n => titleA.includes(n) && titleB.includes(n));

            if (sharedImage || sharedImgUrls || sharedProperNoun) {
                article[postLangs[j]!] = posts[j];
                if (!article.imageFeatured && posts[j].imageFeatured) {
                    article.imageFeatured = posts[j].imageFeatured;
                }
                used.add(j);
            }
        }

        groups.push(article);
    }

    // Pass 2: For remaining ungrouped posts with same date, merge if language slot is free
    // This handles cases where images differ but the posts are clearly related
    for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
            if (groups[i].date !== groups[j].date) continue;

            // Check if groups can be merged (no language conflicts)
            const canMerge = (['sk', 'en', 'cz'] as const).every(lang =>
                !groups[i][lang] || !groups[j][lang]
            );

            if (canMerge) {
                // Check for topical similarity - count shared content words
                const contentA = (groups[i].sk?.content || groups[i].en?.content || groups[i].cz?.content || '').substring(0, 300);
                const contentB = (groups[j].sk?.content || groups[j].en?.content || groups[j].cz?.content || '').substring(0, 300);

                // Extract numbers and proper nouns as fingerprint
                const numsA = new Set(contentA.match(/\d{3,}/g) || []);
                const numsB = new Set(contentB.match(/\d{3,}/g) || []);
                let sharedNums = 0;
                for (const n of numsA) { if (numsB.has(n)) sharedNums++; }

                if (sharedNums >= 2) {
                    // Merge j into i
                    for (const lang of ['sk', 'en', 'cz'] as const) {
                        if (!groups[i][lang] && groups[j][lang]) {
                            groups[i][lang] = groups[j][lang];
                        }
                    }
                    if (!groups[i].imageFeatured && groups[j].imageFeatured) {
                        groups[i].imageFeatured = groups[j].imageFeatured;
                    }
                    groups.splice(j, 1);
                    j--; // re-check this index
                }
            }
        }
    }

    // Log skipped posts
    for (let i = 0; i < posts.length; i++) {
        if (!postLangs[i]) {
            console.log(`  ⊘ SKIP: "${posts[i].title}" (junk/internal)`);
        }
    }

    return groups;
}

// ============================================
// CATEGORY INFERENCE
// ============================================

function inferCategory(article: GroupedArticle): string {
    const title = (article.sk?.title || article.en?.title || article.cz?.title || '').toLowerCase();
    const content = (article.sk?.content || article.en?.content || article.cz?.content || '').toLowerCase().substring(0, 1000);
    const combined = title + ' ' + content;

    if (/bulhar|bulgaria|sunny beach|slnečné|slunečn|nesebar|ravda|sveti vlas|bansko|balčik|pomori/i.test(combined)) return 'Bulharsko';
    if (/chorvát|chorvatsk|croatia|oib|split|dubrovník|istri/i.test(combined)) return 'Chorvátsko';
    if (/španiel|španěl|spain|costa del sol|costa blanca/i.test(combined)) return 'Španielsko';
    if (/gréck|řeck|greece|kréta|crete/i.test(combined)) return 'Grécko';
    if (/invest|zhodnocen|analýz|vývoj cien|rast cien|růst cen|cenov|tax|daň/i.test(combined)) return 'Investície';
    if (/poisten|pojišt|insurance|zdravotn|účet|account|bulstat|schengen|eu\b/i.test(combined)) return 'Legislatíva';
    if (/interiér|interior|hygge|dizajn|design/i.test(combined)) return 'Lifestyle';
    if (/reštauráci|restaurac|restaurant|gastro|víno|vínar|winer/i.test(combined)) return 'Gastronómia';

    return 'Nehnuteľnosti';
}

// ============================================
// IMAGE RE-UPLOAD
// ============================================

async function reUploadImage(url: string, dryRun: boolean): Promise<string> {
    if (!url || dryRun) return url;

    try {
        console.log(`    📷 Downloading: ${url.substring(url.lastIndexOf('/') + 1)}`);
        const response = await fetch(url);
        if (!response.ok) {
            console.log(`    ⚠️  Failed to download (${response.status}), keeping original URL`);
            return url;
        }

        const inputBuffer = Buffer.from(await response.arrayBuffer());

        // Convert to WebP for performance
        const sharp = (await import('sharp')).default;
        const webpBuffer = await sharp(inputBuffer).webp({ quality: 82 }).toBuffer();
        const filename = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

        const blob = await put(filename, webpBuffer, {
            access: 'public',
            addRandomSuffix: false,
        });

        console.log(`    ✅ Uploaded: ${blob.url}`);
        return blob.url;
    } catch (error) {
        console.log(`    ⚠️  Upload failed, keeping original URL: ${error}`);
        return url;
    }
}

// ============================================
// SLUG GENERATION
// ============================================

function generateSlug(title: string): string {
    const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${slug}-${suffix}`;
}

// ============================================
// READ TIME CALCULATION
// ============================================

function estimateReadTime(content: string): number {
    const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const wordCount = text.split(' ').length;
    return Math.max(2, Math.ceil(wordCount / 200)); // ~200 wpm
}

// ============================================
// MAIN
// ============================================

async function main() {
    const dryRun = process.argv.includes('--dry-run');
    console.log(dryRun ? '🔍 DRY RUN — no data will be written\n' : '🚀 LIVE IMPORT — writing to Supabase + Vercel Blob\n');

    // 1. Read XML
    const xmlPath = path.resolve(__dirname, '../Clanky-Export-2026-March-30-2252.xml');
    if (!fs.existsSync(xmlPath)) {
        console.error('❌ XML file not found:', xmlPath);
        process.exit(1);
    }
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    console.log(`📄 Read XML file (${(xmlContent.length / 1024).toFixed(0)} KB)`);

    // 2. Parse posts
    const rawPosts = parseXML(xmlContent);
    console.log(`📝 Parsed ${rawPosts.length} raw posts\n`);

    // 3. Group into unique articles
    const articles = groupPosts(rawPosts);
    console.log(`\n📦 Grouped into ${articles.length} unique articles\n`);

    // 4. Process & import
    const supabase = dryRun ? null : (await import('../src/lib/supabase')).getAdminClient();
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const skTitle = article.sk?.title || article.en?.title || article.cz?.title || 'Untitled';
        console.log(`\n[${i + 1}/${articles.length}] ${skTitle}`);
        console.log(`  📅 ${article.date} | SK: ${article.sk ? '✓' : '✗'} | EN: ${article.en ? '✓' : '✗'} | CZ: ${article.cz ? '✓' : '✗'}`);

        // Skip if no actual content
        if (!article.sk && !article.en && !article.cz) {
            console.log('  ⊘ SKIP: No content in any language');
            skipped++;
            continue;
        }

        // Clean content
        const contentSk = article.sk ? cleanContent(article.sk.content) : null;
        const contentEn = article.en ? cleanContent(article.en.content) : null;
        const contentCz = article.cz ? cleanContent(article.cz.content) : null;

        // Check if content is too short (likely junk)
        const mainContent = contentSk || contentEn || contentCz || '';
        if (mainContent.replace(/<[^>]+>/g, '').trim().length < 50) {
            console.log('  ⊘ SKIP: Content too short');
            skipped++;
            continue;
        }

        // Generate excerpts
        const excerptSk = contentSk ? generateExcerpt(contentSk) : null;
        const excerptEn = contentEn ? generateExcerpt(contentEn) : null;
        const excerptCz = contentCz ? generateExcerpt(contentCz) : null;

        // Category
        const category = inferCategory(article);
        console.log(`  🏷️  Category: ${category}`);

        // Image
        let imageUrl = article.imageFeatured || '';
        if (imageUrl) {
            imageUrl = await reUploadImage(imageUrl, dryRun);
        }

        // Slug (from SK title, fallback EN)
        const slug = generateSlug(article.sk?.title || article.en?.title || 'blog-post');

        // Read time
        const readTime = estimateReadTime(mainContent);

        // Build insert payload
        const payload = {
            slug,
            title_sk: article.sk?.title || article.en?.title || '',
            title_en: article.en?.title || null,
            title_cz: article.cz?.title || null,
            excerpt_sk: excerptSk || excerptEn || '',
            excerpt_en: excerptEn || null,
            excerpt_cz: excerptCz || null,
            content_sk: contentSk || contentEn || '',
            content_en: contentEn || null,
            content_cz: contentCz || null,
            category,
            author: 'Relax Properties',
            read_time: readTime,
            image: imageUrl,
            video_url: null,
            meta_title_sk: null,
            meta_title_en: null,
            meta_title_cz: null,
            meta_description_sk: null,
            meta_description_en: null,
            meta_description_cz: null,
            featured: false,
            publish_status: 'published' as const,
            published_at: article.date ? new Date(article.date).toISOString() : new Date().toISOString(),
        };

        if (dryRun) {
            console.log(`  ✅ Would insert: "${payload.title_sk}" [${category}] (${readTime} min read)`);
            imported++;
            continue;
        }

        // Insert into Supabase
        try {
            const { data, error } = await supabase!
                .from('blog_posts')
                .insert(payload)
                .select('id')
                .single();

            if (error) {
                console.error(`  ❌ DB error: ${error.message}`);
                errors++;
            } else {
                console.log(`  ✅ Inserted: ${data.id}`);
                imported++;
            }
        } catch (err) {
            console.error(`  ❌ Error: ${err}`);
            errors++;
        }

        // Small delay to avoid rate limits on Vercel Blob
        if (!dryRun) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Results:`);
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⊘ Skipped:  ${skipped}`);
    console.log(`   ❌ Errors:   ${errors}`);
    console.log('='.repeat(60));
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
