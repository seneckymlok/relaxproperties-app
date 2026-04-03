import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_LANGS = ['sk', 'en', 'cz'];

/**
 * Domain → default language mapping.
 * Add more domains here as new TLDs are linked.
 */
const DOMAIN_LANG_MAP: Record<string, string> = {
    'relaxproperties.cz': 'cz',
    'www.relaxproperties.cz': 'cz',
    'relaxproperties.sk': 'sk',
    'www.relaxproperties.sk': 'sk',
    'relaxproperties.eu': 'en',
    'www.relaxproperties.eu': 'en',
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // Skip Next.js internals, API routes, and static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/admin') ||
        /\.(.+)$/.test(pathname) // any file with an extension (images, icons, etc.)
    ) {
        return NextResponse.next();
    }

    // If path already starts with a valid lang prefix, leave it alone
    const firstSegment = pathname.split('/')[1];
    if (SUPPORTED_LANGS.includes(firstSegment)) {
        return NextResponse.next();
    }

    // Determine default language from hostname, fall back to 'sk'
    const defaultLang = DOMAIN_LANG_MAP[hostname] ?? 'sk';

    // Redirect to the language-prefixed path
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLang}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url, { status: 307 });
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static  (static files)
         * - _next/image   (image optimisation)
         * - favicon.ico, robots.txt, sitemap.xml
         */
        '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
    ],
};
