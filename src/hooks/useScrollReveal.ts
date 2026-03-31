"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
 * Attach the returned ref to a container — all children with `data-reveal`
 * will animate in when scrolled into view.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
    options: ScrollRevealOptions = {}
) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

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

        gsap.set(targets, {
            y,
            x,
            opacity: 0,
        });

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

        return () => {
            ScrollTrigger.getAll().forEach((trigger) => {
                if (trigger.vars.trigger === el) {
                    trigger.kill();
                }
            });
        };
    }, [options.y, options.x, options.duration, options.delay, options.stagger, options.once]);

    return ref;
}

/**
 * Hook for parallax effect on an element.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
    speed: number = 0.3
) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

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

        return () => {
            ScrollTrigger.getAll().forEach((trigger) => {
                if (trigger.vars.trigger === el) {
                    trigger.kill();
                }
            });
        };
    }, [speed]);

    return ref;
}
