import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["sk", "en", "cz"];
const defaultLocale = "sk";

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

    // Redirect to default locale
    const url = request.nextUrl.clone();
    // Ensure we don't double slash
    if (pathname === "/") {
        url.pathname = `/${defaultLocale}`;
    } else {
        url.pathname = `/${defaultLocale}${pathname}`;
    }

    return NextResponse.redirect(url);
}

// Remove matcher config to rely on function logic
