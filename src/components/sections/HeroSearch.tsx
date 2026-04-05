"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/ui/CustomSelect";
import { getFilterOptions, type Language } from "@/lib/data-access";
import type { Dictionary } from "@/lib/dictionaries";

const PRICE_STEP = 1_000;
/* PRICE_MIN / PRICE_MAX are now dynamic — received via props */

function formatPrice(value: number, lang = 'sk'): string {
    if (value >= 1_000_000) {
        const m = value / 1_000_000;
        return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M €`;
    }
    if (value >= 1_000) {
        const suffix = lang === 'en' ? 'k' : 'tis.';
        return `${Math.round(value / 1_000).toLocaleString()} ${suffix} €`;
    }
    return `${value.toLocaleString()} €`;
}

interface DualRangeSliderProps {
    variant?: "default" | "glass";
    boundsMin: number;
    boundsMax: number;
    sliderMin: number;
    sliderMax: number;
    priceMin: string;
    priceMax: string;
    onSliderMinChange: (val: number) => void;
    onSliderMaxChange: (val: number) => void;
    onPriceMinChange: (val: string) => void;
    onPriceMaxChange: (val: string) => void;
    minLabel: string;
    maxLabel: string;
    lang?: string;
}

function DualRangeSlider({
    variant = "default",
    boundsMin,
    boundsMax,
    sliderMin,
    sliderMax,
    priceMin,
    priceMax,
    onSliderMinChange,
    onSliderMaxChange,
    onPriceMinChange,
    onPriceMaxChange,
    minLabel,
    maxLabel,
    lang,
}: DualRangeSliderProps) {
    const minPercent = ((sliderMin - boundsMin) / (boundsMax - boundsMin)) * 100;
    const maxPercent = ((sliderMax - boundsMin) / (boundsMax - boundsMin)) * 100;

    const isGlass = variant === "glass";
    const inputClass = isGlass
        ? "w-full bg-white/10 border border-white/15 rounded-lg pl-8 pr-2 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all"
        : "w-full bg-white border border-[var(--color-border)] rounded-xl pl-8 pr-3 py-2.5 text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all";
    const euroColor = isGlass ? "text-white/40" : "text-[var(--color-muted)]";
    const dashColor = isGlass ? "text-white/30" : "text-[var(--color-border-dark)]";
    const trackBg = isGlass ? "rgba(255,255,255,0.15)" : "var(--color-border)";
    const labelColor = isGlass ? "text-white/50" : "text-[var(--color-muted)]";

    return (
        <div>
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none ${euroColor}`}>€</span>
                    <input
                        type="number"
                        min="0"
                        placeholder={minLabel}
                        value={priceMin}
                        onChange={(e) => onPriceMinChange(e.target.value)}
                        className={inputClass}
                    />
                </div>
                <span className={dashColor}>–</span>
                <div className="relative flex-1">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none ${euroColor}`}>€</span>
                    <input
                        type="number"
                        min="0"
                        placeholder={maxLabel}
                        value={priceMax}
                        onChange={(e) => onPriceMaxChange(e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="pt-5 pb-1">
                <div className="range-slider relative h-[18px]">
                    {/* Background track */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[4px] rounded-full"
                        style={{ background: trackBg }}
                    />
                    {/* Active range highlight */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 h-[4px] rounded-full"
                        style={{
                            left: `${minPercent}%`,
                            right: `${100 - maxPercent}%`,
                            background: 'var(--color-primary)',
                        }}
                    />
                    <input
                        type="range"
                        min={boundsMin}
                        max={boundsMax}
                        step={PRICE_STEP}
                        value={sliderMin}
                        onChange={(e) => onSliderMinChange(Number(e.target.value))}
                        style={{ zIndex: sliderMin > boundsMax - PRICE_STEP * 5 ? 5 : 3 }}
                        aria-label={minLabel}
                    />
                    <input
                        type="range"
                        min={boundsMin}
                        max={boundsMax}
                        step={PRICE_STEP}
                        value={sliderMax}
                        onChange={(e) => onSliderMaxChange(Number(e.target.value))}
                        style={{ zIndex: 4 }}
                        aria-label={maxLabel}
                    />
                </div>
                <div className={`flex justify-between text-[11px] mt-0.5 ${labelColor}`}>
                    <span>{formatPrice(boundsMin, lang)}</span>
                    <span>{formatPrice(boundsMax, lang)}</span>
                </div>
            </div>
        </div>
    );
}

interface HeroSearchProps {
    lang?: string;
    dictionary?: Dictionary;
    priceRange?: { min: number; max: number };
}

export default function HeroSearch({ lang = 'sk', dictionary, priceRange }: HeroSearchProps) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const advancedRef = useRef<HTMLDivElement>(null);

    // Dynamic price bounds from real property data — fallback to safe defaults
    const PRICE_MIN = priceRange?.min ?? 0;
    const PRICE_MAX = priceRange?.max ?? 2_000_000;

    // Localized filter options
    const filterOptions = useMemo(() => getFilterOptions(lang as Language), [lang]);
    const { countries, propertyTypes, bedroomOptions } = filterOptions;

    // Translations
    const t = {
        searchProperties: lang === 'en' ? 'Search properties' : lang === 'cz' ? 'Hledat nemovitosti' : 'Hľadať nehnuteľnosti',
        filterProperties: lang === 'en' ? 'Filter properties' : lang === 'cz' ? 'Filtrovat nemovitosti' : 'Filtrovať nehnuteľnosti',
        propertyType: lang === 'en' ? 'Property type' : lang === 'cz' ? 'Typ nemovitosti' : 'Typ nehnuteľnosti',
        country: lang === 'en' ? 'Country' : lang === 'cz' ? 'Země' : 'Krajina',
        bedrooms: lang === 'en' ? 'Bedrooms' : lang === 'cz' ? 'Dispozice' : 'Dispozícia',
        allTypes: lang === 'en' ? 'All types' : lang === 'cz' ? 'Všechny typy' : 'Všetky typy',
        allCountries: lang === 'en' ? 'All countries' : lang === 'cz' ? 'Všechny země' : 'Všetky krajiny',
        all: lang === 'en' ? 'All' : lang === 'cz' ? 'Všechny' : 'Všetky',
        priceRange: lang === 'en' ? 'Price range' : lang === 'cz' ? 'Cenový rozsah' : 'Cenový rozsah',
        propertyPrice: lang === 'en' ? 'Property price' : lang === 'cz' ? 'Cena nemovitosti' : 'Cena nehnuteľnosti',
        features: lang === 'en' ? 'Features' : lang === 'cz' ? 'Vlastnosti' : 'Vlastnosti',
        seaView: lang === 'en' ? 'Sea view' : lang === 'cz' ? 'Výhled na moře' : 'Výhľad na more',
        firstLine: lang === 'en' ? 'First line' : lang === 'cz' ? 'První linie' : 'Prvá línia',
        pool: lang === 'en' ? 'Pool' : lang === 'cz' ? 'Bazén' : 'Bazén',
        newBuild: lang === 'en' ? 'New build' : lang === 'cz' ? 'Novostavba' : 'Novostavba',
        newProject: lang === 'en' ? 'New project' : lang === 'cz' ? 'Nový projekt' : 'Nový projekt',
        luxury: lang === 'en' ? 'Luxury property' : lang === 'cz' ? 'Luxusní nemovitost' : 'Luxusná nehnuteľnosť',
        golf: 'Golf',
        mountains: lang === 'en' ? 'Mountains' : lang === 'cz' ? 'Hory' : 'Hory',
        resetFilters: lang === 'en' ? 'Reset all filters' : lang === 'cz' ? 'Resetovat všechny filtry' : 'Resetovať všetky filtre',
        resetFiltersShort: lang === 'en' ? 'Reset filters' : lang === 'cz' ? 'Resetovat filtry' : 'Resetovať filtre',
        moreFilters: lang === 'en' ? 'More filters' : lang === 'cz' ? 'Více filtrů' : 'Viac filtrov',
        lessFilters: lang === 'en' ? 'Less filters' : lang === 'cz' ? 'Méně filtrů' : 'Menej filtrov',
        advancedSearch: lang === 'en' ? 'Advanced search' : lang === 'cz' ? 'Rozšířené vyhledávání' : 'Rozšírené vyhľadávanie',
        search: lang === 'en' ? 'Search' : lang === 'cz' ? 'Hledat' : 'Hľadať',
        classicSearch: lang === 'en' ? 'Search' : lang === 'cz' ? 'Vyhledávání' : 'Vyhľadávanie',
        aiAssistant: 'AI Asistent',
        aiPlaceholder: lang === 'en' ? 'Describe what you are looking for (e.g. Villa in Croatia with pool under 500k)...' : lang === 'cz' ? 'Popište, co hledáte (např. Vila v Chorvatsku s bazénem do 500k)...' : 'Opíšte čo hľadáte (napr. Vila v Chorvátsku s bazénom do 500k)...',
        aiMobilePlaceholder: lang === 'en' ? 'Describe what you are looking for...' : lang === 'cz' ? 'Popište, co hledáte...' : 'Opíšte, čo hľadáte...',
        searching: lang === 'en' ? 'Searching...' : lang === 'cz' ? 'Hledám...' : 'Hľadám...',
        propertyId: lang === 'en' ? 'Property ID' : lang === 'cz' ? 'ID nemovitosti' : 'ID nehnuteľnosti',
        idPlaceholder: 'ID',
        min: 'Min',
        max: 'Max',
    };

    // Check if mobile
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Auto-scroll when expanded (desktop) — scroll page down so the panel is fully visible
    useEffect(() => {
        if (isExpanded && advancedRef.current && !isMobile) {
            setTimeout(() => {
                const el = advancedRef.current;
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const overflow = rect.bottom - window.innerHeight + 80;
                if (overflow > 0) {
                    window.scrollBy({ top: overflow, behavior: 'smooth' });
                }
            }, 50);
        }
    }, [isExpanded, isMobile]);

    // Prevent body scroll + hide header when mobile modal is open
    useEffect(() => {
        if (isMobileModalOpen) {
            document.body.style.overflow = "hidden";
            document.body.classList.add('search-modal-open');
        } else {
            document.body.style.overflow = "";
            document.body.classList.remove('search-modal-open');
        }
        return () => {
            document.body.style.overflow = "";
            document.body.classList.remove('search-modal-open');
        };
    }, [isMobileModalOpen]);

    // Filter state
    const [filters, setFilters] = useState({
        country: "all",
        propertyType: "all",
        bedrooms: "all",
        priceMin: "",
        priceMax: "",
        propertyId: "",
        seaView: false,
        firstLine: false,
        pool: false,
        newBuild: false,
        newProject: false,
        luxury: false,
        golf: false,
        mountains: false,
    });

    // Slider state (numeric, synced with priceMin/priceMax strings)
    const [sliderMin, setSliderMin] = useState(PRICE_MIN);
    const [sliderMax, setSliderMax] = useState(PRICE_MAX);

    const handleFilterChange = (key: string, value: string | boolean) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        // Sync text inputs → slider
        if (key === "priceMin") {
            const num = parseInt(value as string, 10);
            setSliderMin(isNaN(num) ? PRICE_MIN : Math.max(PRICE_MIN, Math.min(num, sliderMax)));
        }
        if (key === "priceMax") {
            const num = parseInt(value as string, 10);
            setSliderMax(isNaN(num) ? PRICE_MAX : Math.min(PRICE_MAX, Math.max(num, sliderMin)));
        }
    };

    const handleSliderMinChange = useCallback((val: number) => {
        const clamped = Math.min(val, sliderMax - PRICE_STEP);
        setSliderMin(Math.max(PRICE_MIN, clamped));
        setFilters(prev => ({ ...prev, priceMin: clamped > PRICE_MIN ? String(clamped) : "" }));
    }, [sliderMax]);

    const handleSliderMaxChange = useCallback((val: number) => {
        const clamped = Math.max(val, sliderMin + PRICE_STEP);
        setSliderMax(Math.min(PRICE_MAX, clamped));
        setFilters(prev => ({ ...prev, priceMax: clamped < PRICE_MAX ? String(clamped) : "" }));
    }, [sliderMin]);

    const handleSearch = () => {
        // If searching by ID, navigate directly to the property
        if (filters.propertyId.trim()) {
            setIsMobileModalOpen(false);
            router.push(`/${lang}/properties?searchQuery=${encodeURIComponent(filters.propertyId.trim())}`);
            return;
        }

        const params = new URLSearchParams();
        if (filters.country !== "all") params.set("country", filters.country);
        if (filters.propertyType !== "all") params.set("type", filters.propertyType);
        if (filters.bedrooms !== "all") params.set("beds", filters.bedrooms);
        if (filters.priceMin) params.set("priceMin", filters.priceMin);
        if (filters.priceMax) params.set("priceMax", filters.priceMax);
        if (filters.seaView) params.set("seaView", "true");
        if (filters.firstLine) params.set("firstLine", "true");
        if (filters.pool) params.set("pool", "true");
        if (filters.newBuild) params.set("newBuild", "true");
        if (filters.newProject) params.set("newProject", "true");
        if (filters.luxury) params.set("luxury", "true");
        if (filters.golf) params.set("golf", "true");
        if (filters.mountains) params.set("mountains", "true");

        setIsMobileModalOpen(false);
        router.push(`/${lang}/properties?${params.toString()}`);
    };

    const resetFilters = () => {
        setFilters({
            country: "all",
            propertyType: "all",
            bedrooms: "all",
            priceMin: "",
            priceMax: "",
            propertyId: "",
            seaView: false,
            firstLine: false,
            pool: false,
            newBuild: false,
            newProject: false,
            luxury: false,
            golf: false,
            mountains: false,
        });
        setSliderMin(PRICE_MIN);
        setSliderMax(PRICE_MAX);
    };

    const activeFiltersCount = [
        filters.country !== "all",
        filters.propertyType !== "all",
        filters.bedrooms !== "all",
        filters.firstLine,
        filters.pool,
        filters.newBuild,
        filters.newProject,
        filters.luxury,
        filters.golf,
        filters.mountains,
        filters.priceMin,
        filters.priceMax,
        filters.seaView,
    ].filter(Boolean).length;

    // Shared slider props
    const sliderProps = {
        boundsMin: PRICE_MIN,
        boundsMax: PRICE_MAX,
        sliderMin,
        sliderMax,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        onSliderMinChange: handleSliderMinChange,
        onSliderMaxChange: handleSliderMaxChange,
        onPriceMinChange: (val: string) => handleFilterChange("priceMin", val),
        onPriceMaxChange: (val: string) => handleFilterChange("priceMax", val),
        minLabel: t.min,
        maxLabel: t.max,
        lang,
    };

    // Toggle Switch Component for mobile
    const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) => (
        <label className="flex items-center justify-between py-3 cursor-pointer">
            <span className="text-[var(--color-foreground)] text-sm">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`exclude-touch-size relative w-[51px] h-[31px] rounded-full transition-colors duration-300 flex-shrink-0 ${checked ? "bg-[var(--color-teal)]" : "bg-[#E5E5E5]"}`}
            >
                <span
                    className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.06)] transition-transform duration-300 ${checked ? "translate-x-[20px]" : "translate-x-0"}`}
                />
            </button>
        </label>
    );

    // Feature labels for advanced filters
    const featureLabels = [
        { key: "seaView", label: t.seaView },
        { key: "firstLine", label: t.firstLine },
        { key: "pool", label: t.pool },
        { key: "newBuild", label: t.newBuild },
        { key: "newProject", label: t.newProject },
        { key: "luxury", label: t.luxury },
        { key: "golf", label: t.golf },
        { key: "mountains", label: t.mountains },
    ];

    // AI Search state
    const [searchMode, setSearchMode] = useState<'classic' | 'ai'>('classic');
    const [aiQuery, setAiQuery] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);

    const handleAiSearch = async () => {
        if (!aiQuery.trim()) return;

        setIsAiSearching(true);
        try {
            const response = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: aiQuery, lang }),
            });

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();

            if (data.success && data.filters) {
                const params = new URLSearchParams();
                const f = data.filters;
                if (f.country !== "all") params.set("country", f.country);
                if (f.propertyType !== "all") params.set("type", f.propertyType);
                if (f.bedrooms !== "all") params.set("beds", f.bedrooms);
                if (f.sort && f.sort !== "featured") params.set("sort", f.sort);
                if (f.priceMin) params.set("priceMin", f.priceMin);
                if (f.priceMax) params.set("priceMax", f.priceMax);

                // All boolean feature filters
                const booleanFeatures = [
                    "seaView", "firstLine", "pool", "newBuild", "newProject",
                    "luxury", "golf", "mountains", "balcony", "terrace",
                    "garden", "parking", "nearBeach", "nearAirport",
                ];
                for (const key of booleanFeatures) {
                    if (f[key]) params.set(key, "true");
                }

                setIsMobileModalOpen(false);
                router.push(`/${lang}/properties?${params.toString()}`);
            }
        } catch (error) {
            console.error('AI Search error:', error);
        } finally {
            setIsAiSearching(false);
        }
    };

    /* ========================================
       MODE TOGGLE — Prominent Tab Control
       ======================================== */
    const ModeToggle = ({ variant = "default" }: { variant?: "default" | "glass" }) => (
        <div className={variant === "glass" ? "inline-flex flex-row items-center bg-[rgba(26,26,24,0.9)] backdrop-blur-md border border-white/12 rounded-full p-1" : `inline-flex bg-[var(--color-surface)] rounded-full p-[3px] border border-[var(--color-border)]/60`}>
            <button
                onClick={() => setSearchMode('classic')}
                className={`whitespace-nowrap px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${searchMode === 'classic'
                    ? variant === "glass"
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-[var(--color-secondary)] shadow-sm'
                    : variant === "glass"
                        ? 'text-white/40 hover:text-white/70'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                    }`}
            >
                {t.classicSearch}
            </button>
            <button
                onClick={() => setSearchMode('ai')}
                className={`whitespace-nowrap px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${searchMode === 'ai'
                    ? variant === "glass"
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-[var(--color-secondary)] shadow-sm'
                    : variant === "glass"
                        ? 'text-white/40 hover:text-white/70'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                    }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                {t.aiAssistant}
            </button>
        </div>
    );

    return (
        <>
            {/* =============================================
                MOBILE: Inline Filter Panel (below hero image)
                ============================================= */}
            <div className="md:hidden flex-1 z-30 relative bg-[var(--color-surface)]">
                <div className="mx-4 -mt-5 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1.5px_6px_rgba(0,0,0,0.06)] px-5 pt-5 pb-5 flex flex-col justify-center gap-3">
                    {/* Country */}
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-1.5 font-medium">
                            {t.country}
                        </label>
                        <CustomSelect
                            options={countries}
                            value={filters.country}
                            onChange={(value) => handleFilterChange("country", value)}
                            placeholder={t.allCountries}
                            searchable
                            alphabetical
                        />
                    </div>

                    {/* Property Type */}
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-1.5 font-medium">
                            {t.propertyType}
                        </label>
                        <CustomSelect
                            options={propertyTypes}
                            value={filters.propertyType}
                            onChange={(value) => handleFilterChange("propertyType", value)}
                            placeholder={t.allTypes}
                            searchable
                            alphabetical
                        />
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 mt-1">
                        <button
                            onClick={handleSearch}
                            className="flex-1 bg-[var(--color-primary)] text-white py-3.5 rounded-full font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[var(--color-primary)]/15"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {t.search}
                        </button>
                        <button
                            onClick={() => setIsMobileModalOpen(true)}
                            className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors whitespace-nowrap px-2"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                            </svg>
                            {t.moreFilters}
                            {activeFiltersCount > 0 && (
                                <span className="w-5 h-5 flex items-center justify-center bg-[var(--color-accent)] text-white text-[10px] font-semibold rounded-full">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* =============================================
                MOBILE: Premium Full-screen Filter Modal
                ============================================= */}
            <div
                className={`fixed inset-0 bg-white z-[100] md:hidden transition-transform duration-300 ease-out ${isMobileModalOpen ? "translate-y-0" : "translate-y-full"
                    }`}
            >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[var(--color-border)]/50 px-5 pt-[max(1rem,env(safe-area-inset-top,1rem))] pb-3 flex items-center justify-between z-10">
                    <h2 className="font-serif text-lg text-[var(--color-secondary)]">{t.filterProperties}</h2>
                    <button
                        onClick={() => setIsMobileModalOpen(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-border)] transition-colors active:scale-95"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5 text-[var(--color-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Content */}
                <div className="overflow-y-auto h-[calc(100%-140px)] px-5 py-5">
                    {/* Mode Toggle */}
                    <div className="flex justify-center mb-5">
                        <ModeToggle />
                    </div>

                    {searchMode === 'classic' ? (
                        <>
                            {/* Main Filters */}
                            <div className="space-y-5 mb-8">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-2">
                                        {t.propertyType}
                                    </label>
                                    <CustomSelect
                                        options={propertyTypes}
                                        value={filters.propertyType}
                                        onChange={(value) => handleFilterChange("propertyType", value)}
                                        placeholder={t.allTypes}
                                        searchable
                                        alphabetical
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-2">
                                        {t.country}
                                    </label>
                                    <CustomSelect
                                        options={countries}
                                        value={filters.country}
                                        onChange={(value) => handleFilterChange("country", value)}
                                        placeholder={t.allCountries}
                                        searchable
                                        alphabetical
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-2">
                                        {t.bedrooms}
                                    </label>
                                    <CustomSelect
                                        options={bedroomOptions}
                                        value={filters.bedrooms}
                                        onChange={(value) => handleFilterChange("bedrooms", value)}
                                        placeholder={t.all}
                                    />
                                </div>

                                {/* Price Range with Dual Slider */}
                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-2">
                                        {t.priceRange}
                                    </label>
                                    <DualRangeSlider variant="default" {...sliderProps} />
                                </div>
                            </div>

                            {/* Feature Toggles */}
                            <div className="border-t border-[var(--color-border)]/50 pt-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-5 h-px bg-[var(--color-accent)]" />
                                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium">
                                        {t.features}
                                    </p>
                                </div>
                                <div className="space-y-0">
                                    <ToggleSwitch checked={filters.seaView} onChange={(v) => handleFilterChange("seaView", v)} label={t.seaView} />
                                    <ToggleSwitch checked={filters.firstLine} onChange={(v) => handleFilterChange("firstLine", v)} label={t.firstLine} />
                                    <ToggleSwitch checked={filters.pool} onChange={(v) => handleFilterChange("pool", v)} label={t.pool} />
                                    <ToggleSwitch checked={filters.newBuild} onChange={(v) => handleFilterChange("newBuild", v)} label={t.newBuild} />
                                    <ToggleSwitch checked={filters.luxury} onChange={(v) => handleFilterChange("luxury", v)} label={t.luxury} />
                                    <ToggleSwitch checked={filters.golf} onChange={(v) => handleFilterChange("golf", v)} label={t.golf} />
                                    <ToggleSwitch checked={filters.mountains} onChange={(v) => handleFilterChange("mountains", v)} label={t.mountains} />
                                </div>
                            </div>

                            {/* Property ID Search */}
                            <div className="border-t border-[var(--color-border)]/50 pt-5 mt-6">
                                <label className="block text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-2">
                                    {t.propertyId}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-sm font-medium">#</span>
                                    <input
                                        type="text"
                                        placeholder={t.idPlaceholder}
                                        value={filters.propertyId}
                                        onChange={(e) => handleFilterChange("propertyId", e.target.value)}
                                        className="w-full bg-white border border-[var(--color-border)] rounded-xl pl-8 pr-3 py-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Reset */}
                            <button
                                onClick={resetFilters}
                                className="w-full mt-6 py-3 text-[var(--color-muted)] hover:text-[var(--color-teal)] text-sm transition-colors"
                            >
                                {t.resetFilters}
                            </button>
                        </>
                    ) : (
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] mb-3">
                                {t.aiMobilePlaceholder}
                            </p>
                            <textarea
                                value={aiQuery}
                                onChange={(e) => {
                                    setAiQuery(e.target.value);
                                    // Auto-resize
                                    const el = e.target;
                                    el.style.height = 'auto';
                                    el.style.height = Math.min(el.scrollHeight, 240) + 'px';
                                }}
                                placeholder={t.aiPlaceholder}
                                rows={3}
                                className="w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)]/50 rounded-xl resize-none text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal)]/10 transition-all leading-relaxed"
                            />
                            <p className="text-[11px] text-[var(--color-muted)] mt-2.5 leading-relaxed">
                                {lang === 'en' ? 'Describe your dream property in natural language. Our AI will find the best matches.' : lang === 'cz' ? 'Popište svou vysněnou nemovitost přirozeným jazykem. Naše AI najde nejlepší shody.' : 'Opíšte svoju vysnívanú nehnuteľnosť bežným jazykom. Naše AI nájde najlepšie zhody.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sticky Footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[var(--color-border)]/50 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] safe-area-inset-bottom">
                    {searchMode === 'classic' ? (
                        <button
                            onClick={handleSearch}
                            className="w-full bg-[var(--color-primary)] text-white py-4 rounded-full font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[var(--color-primary)]/20"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {t.searchProperties}
                        </button>
                    ) : (
                        <button
                            onClick={handleAiSearch}
                            disabled={isAiSearching || !aiQuery.trim()}
                            className="w-full bg-[var(--color-primary)] text-white py-4 rounded-full font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-lg shadow-[var(--color-primary)]/20"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {isAiSearching ? t.searching : t.searchProperties}
                        </button>
                    )}
                </div>
            </div>

            {/* =============================================
                DESKTOP: Glassmorphic Search Panel
                ============================================= */}
            <div className="hidden md:block absolute bottom-[clamp(1.5rem,5vh,4rem)] left-0 right-0 z-50">
                <div className="container-custom">
                    <div className="relative max-w-4xl mx-auto">

                        {/* Mode Toggle — centered above card */}
                        <div className="flex justify-center mb-3">
                            <ModeToggle variant="glass" />
                        </div>

                        {/* Main Card */}
                        <div className="bg-[rgba(26,26,24,0.88)] backdrop-blur-md border border-white/12 rounded-2xl shadow-2xl">
                            <div className="px-6 py-5">
                                {searchMode === 'classic' ? (
                                    /* Classic: 3 selectors + sea view + search */
                                    <div className="flex items-end gap-4">
                                        {/* Property Type */}
                                        <div className="flex-1 min-w-0">
                                            <label className="block text-[10px] uppercase tracking-[0.15em] text-white/50 mb-2">
                                                {t.propertyType}
                                            </label>
                                            <CustomSelect
                                                options={propertyTypes}
                                                value={filters.propertyType}
                                                onChange={(value) => handleFilterChange("propertyType", value)}
                                                placeholder={t.allTypes}
                                                variant="hero"
                                                searchable
                                                alphabetical
                                            />
                                        </div>

                                        {/* Divider */}
                                        <div className="w-px h-10 bg-white/15 flex-shrink-0" />

                                        {/* Country */}
                                        <div className="flex-1 min-w-0">
                                            <label className="block text-[10px] uppercase tracking-[0.15em] text-white/50 mb-2">
                                                {t.country}
                                            </label>
                                            <CustomSelect
                                                options={countries}
                                                value={filters.country}
                                                onChange={(value) => handleFilterChange("country", value)}
                                                placeholder={t.allCountries}
                                                variant="hero"
                                                searchable
                                                alphabetical
                                            />
                                        </div>

                                        {/* Divider */}
                                        <div className="w-px h-10 bg-white/15 flex-shrink-0" />

                                        {/* Bedrooms */}
                                        <div className="flex-1 min-w-0">
                                            <label className="block text-[10px] uppercase tracking-[0.15em] text-white/50 mb-2">
                                                {t.bedrooms}
                                            </label>
                                            <CustomSelect
                                                options={bedroomOptions}
                                                value={filters.bedrooms}
                                                onChange={(value) => handleFilterChange("bedrooms", value)}
                                                placeholder={t.all}
                                                variant="hero"
                                            />
                                        </div>

                                        {/* Divider */}
                                        <div className="w-px h-10 bg-white/15 flex-shrink-0" />

                                        {/* Sea View Checkbox + More Filters */}
                                        <div className="flex flex-col justify-end gap-1.5 min-w-[130px] flex-shrink-0">
                                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${filters.seaView
                                                    ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                                                    : "border-white/30 group-hover:border-white/60"
                                                    }`}>
                                                    {filters.seaView && (
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={filters.seaView}
                                                    onChange={(e) => handleFilterChange("seaView", e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <span className="text-sm text-white/80">
                                                    {t.seaView}
                                                </span>
                                            </label>

                                            <button
                                                onClick={() => setIsExpanded(!isExpanded)}
                                                className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                                            >
                                                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                                <span>{isExpanded ? t.lessFilters : t.moreFilters}</span>
                                                {activeFiltersCount > 0 && (
                                                    <span className="w-5 h-5 flex items-center justify-center bg-[var(--color-accent)] text-white text-[10px] font-semibold rounded-full">
                                                        {activeFiltersCount}
                                                    </span>
                                                )}
                                            </button>
                                        </div>

                                        {/* Search Button */}
                                        <button
                                            onClick={handleSearch}
                                            className="flex items-center gap-2.5 bg-[var(--color-teal)] text-white px-7 py-3 rounded-full hover:bg-[var(--color-teal-dark)] transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0 font-medium text-sm shadow-md shadow-[var(--color-teal)]/20"
                                            title={t.search}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            {t.search}
                                        </button>
                                    </div>
                                ) : (
                                    /* AI Mode */
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={aiQuery}
                                                onChange={(e) => setAiQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                                                placeholder={t.aiPlaceholder}
                                                className="w-full h-12 pl-11 pr-4 bg-white/10 rounded-xl border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAiSearch}
                                            disabled={isAiSearching || !aiQuery.trim()}
                                            className="flex items-center gap-2.5 bg-[var(--color-accent)] text-white px-7 py-3 rounded-full hover:bg-[var(--color-accent-dark)] transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0 font-medium text-sm disabled:opacity-50 shadow-md shadow-[var(--color-accent)]/20"
                                            title={t.search}
                                        >
                                            {isAiSearching ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            )}
                                            {isAiSearching ? t.searching : t.search}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Advanced Filters — positioned BELOW the card, expanding downward */}
                        <div
                            ref={advancedRef}
                            className={`absolute left-0 right-0 top-full z-50 transition-all duration-300 ease-out origin-top ${isExpanded && searchMode === 'classic'
                                ? "mt-2 opacity-100 scale-y-100 pointer-events-auto"
                                : "mt-0 opacity-0 scale-y-95 pointer-events-none"
                                }`}
                        >
                            <div className="bg-[rgba(26,26,24,0.88)] backdrop-blur-md border border-white/12 rounded-2xl shadow-2xl p-5">
                                <div className="flex flex-wrap md:flex-nowrap items-start gap-5">
                                    {/* Price Range with Dual Slider */}
                                    <div className="w-full md:w-auto md:min-w-[300px]">
                                        <label className="block text-[10px] text-white/50 mb-2 uppercase tracking-[0.15em]">
                                            {t.propertyPrice}
                                        </label>
                                        <DualRangeSlider variant="glass" {...sliderProps} />
                                    </div>

                                    {/* Property Features — rounded pills */}
                                    <div className="flex-1">
                                        <label className="block text-[10px] text-white/50 mb-2 uppercase tracking-[0.15em]">
                                            {t.advancedSearch}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {featureLabels.map(({ key, label }) => (
                                                <label
                                                    key={key}
                                                    className={`flex items-center px-3.5 py-1.5 rounded-full border cursor-pointer transition-all text-sm ${filters[key as keyof typeof filters]
                                                        ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                                        : "bg-white/10 border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={filters[key as keyof typeof filters] as boolean}
                                                        onChange={(e) => handleFilterChange(key, e.target.checked)}
                                                        className="sr-only"
                                                    />
                                                    <span>{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Property ID Search + Reset */}
                                <div className="mt-4 pt-3 border-t border-white/10 flex items-end justify-between gap-4">
                                    <div className="w-full max-w-[220px]">
                                        <label className="block text-[10px] text-white/50 mb-2 uppercase tracking-[0.15em]">
                                            {t.propertyId}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium pointer-events-none">#</span>
                                            <input
                                                type="text"
                                                placeholder={t.idPlaceholder}
                                                value={filters.propertyId}
                                                onChange={(e) => handleFilterChange("propertyId", e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                className="w-full bg-white/10 border border-white/15 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                    {activeFiltersCount > 0 && (
                                        <button
                                            onClick={resetFilters}
                                            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors whitespace-nowrap pb-2"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
                                            </svg>
                                            {t.resetFiltersShort}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
