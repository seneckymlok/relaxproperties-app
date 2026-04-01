"use client";

import { useEffect } from "react";

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Defer GSAP + ScrollTrigger loading until after initial paint
        const id = typeof requestIdleCallback !== 'undefined'
            ? requestIdleCallback(initGsap)
            : setTimeout(initGsap, 100) as unknown as number;

        let cleanup: (() => void) | undefined;

        async function initGsap() {
            const [{ gsap }, { ScrollTrigger }] = await Promise.all([
                import("gsap"),
                import("gsap/ScrollTrigger"),
            ]);
            gsap.registerPlugin(ScrollTrigger);
            ScrollTrigger.defaults({ scroller: window });
            ScrollTrigger.refresh();

            cleanup = () => {
                ScrollTrigger.getAll().forEach((t) => t.kill());
            };
        }

        return () => {
            if (typeof cancelIdleCallback !== 'undefined') {
                cancelIdleCallback(id);
            } else {
                clearTimeout(id);
            }
            cleanup?.();
        };
    }, []);

    return <>{children}</>;
}
