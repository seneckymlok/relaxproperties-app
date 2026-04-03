import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["sk", "en", "cz"];
const defaultLocale = "sk";

const DOMAIN_LANG_MAP: Record<string, string> = {
    'relaxproperties.cz': 'cz',
    'www.relaxproperties.cz': 'cz',
    'relaxproperties.eu': 'en',
    'www.relaxproperties.eu': 'en',
    'relaxproperties.sk': 'sk',
    'www.relaxproperties.sk': 'sk',
};

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip internal paths, static files, and public data feeds
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/json-loading-properties") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Admin auth guard — protect /admin/* but allow /admin/login
    if (pathname.startsWith("/admin")) {
        if (pathname === "/admin/login") {
            return NextResponse.next();
        }

        const session = request.cookies.get("admin_session");
        if (session?.value !== "authenticated") {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = "/admin/login";
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();
    }

    // Check if the pathname already has a locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) return NextResponse.next();

    // Determine language from domain, fall back to defaultLocale
    const hostname = request.headers.get('host') || '';
    const lang = DOMAIN_LANG_MAP[hostname] ?? defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${lang}` : `/${lang}${pathname}`;
    return NextResponse.redirect(url);
}

// Remove matcher config to rely on function logic
