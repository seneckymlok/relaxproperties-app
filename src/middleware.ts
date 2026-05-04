import { proxy } from "./proxy";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    return proxy(request);
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         *  - _next/static  (static assets)
         *  - _next/image   (image optimisation)
         *  - favicon.ico, robots.txt, sitemap.xml, etc. (public root files)
         *  - Files with an extension (images, fonts, …)
         */
        "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
    ],
};
