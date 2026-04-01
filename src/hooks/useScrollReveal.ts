"use client";

import { useEffect, useRef } from "react";

interface ScrollRevealOptions {
    y?: number;
    x?: number;
    duration?: number;
    delay?: number;
    stagger?: number;
    once?: boolean;
}

/**
 * Hook for scroll-triggered reveal animations.
 * Lazy-loads GSAP + ScrollTrigger to keep them out of the initial bundle.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
    options: ScrollRevealOptions = {}
) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let killed = false;

        async function init() {
            const [{ gsap }, { ScrollTrigger }] = await Promise.all([
                import("gsap"),
                import("gsap/ScrollTrigger"),
            ]);
            gsap.registerPlugin(ScrollTrigger);

            if (killed || !el) return;

            const {
                y = 60,
                x = 0,
                duration = 0.9,
                delay = 0,
                stagger = 0.12,
                once = true,
            } = options;

            const children = el.querySelectorAll("[data-reveal]");
            const targets = children.length > 0 ? children : [el];

            gsap.set(targets, { y, x, opacity: 0 });

            gsap.to(targets, {
                y: 0,
                x: 0,
                opacity: 1,
                duration,
                delay,
                stagger,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: once ? "play none none none" : "play none none reverse",
                },
            });
        }

        init();

        return () => {
            killed = true;
            import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
                ScrollTrigger.getAll().forEach((trigger) => {
                    if (trigger.vars.trigger === el) {
                        trigger.kill();
                    }
                });
            });
        };
    }, [options.y, options.x, options.duration, options.delay, options.stagger, options.once]);

    return ref;
}

/**
 * Hook for parallax effect on an element.
 * Lazy-loads GSAP + ScrollTrigger.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
    speed: number = 0.3
) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let killed = false;

        async function init() {
            const [{ gsap }, { ScrollTrigger }] = await Promise.all([
                import("gsap"),
                import("gsap/ScrollTrigger"),
            ]);
            gsap.registerPlugin(ScrollTrigger);

            if (killed || !el) return;

            gsap.to(el, {
                y: () => speed * 100,
                ease: "none",
                scrollTrigger: {
                    trigger: el,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                },
            });
        }

        init();

        return () => {
            killed = true;
            import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
                ScrollTrigger.getAll().forEach((trigger) => {
                    if (trigger.vars.trigger === el) {
                        trigger.kill();
                    }
                });
            });
        };
    }, [speed]);

    return ref;
}
