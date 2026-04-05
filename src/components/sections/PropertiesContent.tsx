"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PropertyCard from "@/components/ui/PropertyCard";
import CustomSelect from "@/components/ui/CustomSelect";
import PriceRangeSlider from "@/components/ui/PriceRangeSlider";
import { getFilterOptions, type Language, type PublicProperty } from "@/lib/data-access";

const INITIAL_FEATURES_SHOWN = 4;

interface PropertiesContentProps {
    lang: 'sk' | 'en' | 'cz';
    properties: PublicProperty[];
}

// All 3-language labels for the page chrome
const labels = {
    sk: {
        filter: 'Filtrovať', country: 'Krajina', type: 'Typ', bedrooms: 'Spálne', price: 'Cena',
        features: 'Vlastnosti',
        seaView: 'Výhľad na more', firstLine: 'Prvá línia', pool: 'Bazén', luxury: 'Luxusná',
        newBuild: 'Novostavba', balcony: 'Balkón', terrace: 'Terasa', garden: 'Záhrada',
        parking: 'Parkovanie', nearBeach: 'Blízko pláže', nearAirport: 'Blízko letiska',
        found: 'Nájdených', propertiesLabel: 'nehnuteľností',
        noResults: 'Žiadne nehnuteľnosti nezodpovedajú vašim kritériám.',
        sort: 'Zoradiť', searchPlaceholder: 'Hľadať podľa ID alebo názvu...', search: 'Hľadať',
        resetFilters: 'Zrušiť filtre',
    },
    en: {
        filter: 'Filter', country: 'Country', type: 'Type', bedrooms: 'Bedrooms', price: 'Price',
        features: 'Features',
        seaView: 'Sea View', firstLine: 'Beachfront', pool: 'Pool', luxury: 'Luxury',
        newBuild: 'New Build', balcony: 'Balcony', terrace: 'Terrace', garden: 'Garden',
        parking: 'Parking', nearBeach: 'Near Beach', nearAirport: 'Near Airport',
        found: 'Found', propertiesLabel: 'properties',
        noResults: 'No properties match your criteria.',
        sort: 'Sort', searchPlaceholder: 'Search by ID or title...', search: 'Search',
        resetFilters: 'Reset filters',
    },
    cz: {
        filter: 'Filtrovat', country: 'Země', type: 'Typ', bedrooms: 'Ložnice', price: 'Cena',
        features: 'Vlastnosti',
        seaView: 'Výhled na moře', firstLine: 'První linie', pool: 'Bazén', luxury: 'Luxusní',
        newBuild: 'Novostavba', balcony: 'Balkón', terrace: 'Terasa', garden: 'Zahrada',
        parking: 'Parkování', nearBeach: 'Blízko pláže', nearAirport: 'Blízko letiště',
        found: 'Nalezeno', propertiesLabel: 'nemovitostí',
        noResults: 'Žádné nemovitosti neodpovídají vašim kritériím.',
        sort: 'Seřadit', searchPlaceholder: 'Hledat podle ID nebo názvu...', search: 'Hledat',
        resetFilters: 'Zrušit filtry',
    },
};

export default function PropertiesContent({ lang, properties }: PropertiesContentProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const l = labels[lang];

    // Compute price bounds from actual data
    const priceStats = useMemo(() => {
        const prices = properties.map(p => p.price).filter(p => p > 0);
        if (prices.length === 0) return { min: 0, max: 500000 };
        // Round min down to nearest 5k, max up to nearest 5k
        return {
            min: Math.floor(Math.min(...prices) / 5000) * 5000,
            max: Math.ceil(Math.max(...prices) / 5000) * 5000,
        };
    }, [properties]);

    // Get localized filter options (static, no DB)
    const filterOptions = useMemo(() => getFilterOptions(lang), [lang]);
    const { countries, propertyTypes, bedroomOptions, sortOptions } = filterOptions;

    // Get initial filter values from URL (supports AI search redirect params)
    const initialCountry = searchParams.get("country") || "all";
    const initialType = searchParams.get("type") || "all";
    const initialSort = searchParams.get("sort") || "featured";
    const urlPriceMin = searchParams.get("priceMin");
    const urlPriceMax = searchParams.get("priceMax");

    const [filters, setFilters] = useState({
        country: initialCountry,
        propertyType: initialType,
        bedrooms: searchParams.get("beds") || "all",
        seaView: searchParams.get("seaView") === "true",
        firstLine: searchParams.get("firstLine") === "true",
        pool: searchParams.get("pool") === "true",
        newBuild: searchParams.get("newBuild") === "true",
        newProject: searchParams.get("newProject") === "true",
        luxury: searchParams.get("luxury") === "true",
        golf: searchParams.get("golf") === "true",
        mountains: searchParams.get("mountains") === "true",
        balcony: searchParams.get("balcony") === "true",
        terrace: searchParams.get("terrace") === "true",
        garden: searchParams.get("garden") === "true",
        parking: searchParams.get("parking") === "true",
        nearBeach: searchParams.get("nearBeach") === "true",
        nearAirport: searchParams.get("nearAirport") === "true",
    });
    const [priceRange, setPriceRange] = useState<[number, number]>([
        urlPriceMin ? Math.max(Number(urlPriceMin), priceStats.min) : priceStats.min,
        urlPriceMax ? Math.min(Number(urlPriceMax), priceStats.max) : priceStats.max,
    ]);
    const isPriceFiltered = priceRange[0] !== priceStats.min || priceRange[1] !== priceStats.max;
    const [sortBy, setSortBy] = useState(initialSort);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("searchQuery") || "");
    const [featuresExpanded, setFeaturesExpanded] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const openMobileFilters = useCallback(() => {
        setMobileFiltersOpen(true);
        document.body.style.overflow = "hidden";
    }, []);
    const closeMobileFilters = useCallback(() => {
        setMobileFiltersOpen(false);
        document.body.style.overflow = "";
    }, []);
    useEffect(() => () => { document.body.style.overflow = ""; }, []);

    // Search by ID or keyword
    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        const q = searchQuery.trim();
        // Check for exact external ID match
        const match = properties.find(p => p.propertyIdExternal === q);
        if (match) {
            router.push(`/${lang}/properties/${match.id}`);
            return;
        }
    };

    // Filter and sort properties
    const filteredProperties = useMemo(() => {
        let result = [...properties];

        // Keyword search filter
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                (p.propertyIdExternal && p.propertyIdExternal.toLowerCase().includes(q))
            );
        }

        if (filters.country !== "all") {
            result = result.filter(p => p.country === filters.country);
        }
        if (filters.propertyType !== "all") {
            result = result.filter(p => p.type === filters.propertyType);
        }
        if (filters.bedrooms !== "all") {
            const minBeds = parseInt(filters.bedrooms);
            result = result.filter(p => p.beds >= minBeds);
        }
        if (isPriceFiltered) {
            result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
        }
        if (filters.seaView) result = result.filter(p => p.seaView);
        if (filters.firstLine) result = result.filter(p => p.firstLine);
        if (filters.pool) result = result.filter(p => p.pool);
        if (filters.newBuild) result = result.filter(p => p.newBuild);
        if (filters.newProject) result = result.filter(p => p.newProject);
        if (filters.luxury) result = result.filter(p => p.luxury);
        if (filters.golf) result = result.filter(p => p.golf);
        if (filters.mountains) result = result.filter(p => p.mountains);
        if (filters.balcony) result = result.filter(p => p.balcony);
        if (filters.terrace) result = result.filter(p => p.terasa);
        if (filters.garden) result = result.filter(p => p.garden);
        if (filters.parking) result = result.filter(p => p.parkingSpot);
        if (filters.nearBeach) result = result.filter(p => p.nearBeach);
        if (filters.nearAirport) result = result.filter(p => p.nearAirport);

        switch (sortBy) {
            case "price-asc":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                result.sort((a, b) => b.price - a.price);
                break;
            case "newest":
                result.reverse();
                break;
            case "area-desc":
                result.sort((a, b) => b.area - a.area);
                break;
            default:
                result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        }

        return result;
    }, [filters, sortBy, searchQuery, properties, priceRange, isPriceFiltered]);

    const handleFilterChange = (key: string, value: string | boolean) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== "all" && v !== false).length + (isPriceFiltered ? 1 : 0);

    const resetFilters = () => {
        setFilters({
            country: "all", propertyType: "all", bedrooms: "all",
            seaView: false, firstLine: false, pool: false, newBuild: false, newProject: false,
            luxury: false, golf: false, mountains: false,
            balcony: false, terrace: false, garden: false, parking: false, nearBeach: false, nearAirport: false,
        });
        setPriceRange([priceStats.min, priceStats.max]);
        setSearchQuery("");
    };

    // Feature checkboxes config — ordered by most useful for buyers
    const featureCheckboxes: { key: string; label: string }[] = [
        { key: 'pool', label: l.pool },
        { key: 'seaView', label: l.seaView },
        { key: 'firstLine', label: l.firstLine },
        { key: 'nearBeach', label: l.nearBeach },
        { key: 'balcony', label: l.balcony },
        { key: 'terrace', label: l.terrace },
        { key: 'garden', label: l.garden },
        { key: 'parking', label: l.parking },
        { key: 'newBuild', label: l.newBuild },
        { key: 'nearAirport', label: l.nearAirport },
        { key: 'luxury', label: l.luxury },
    ];

    // Shared filter panel content — reused in sidebar and bottom sheet
    const filterPanelContent = (
        <>
            {/* Search by ID/keyword */}
            <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">{l.search}</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={l.searchPlaceholder}
                        className="flex-1 px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-[var(--color-secondary)]">{l.filter}</h3>
                {activeFilterCount > 0 && (
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[var(--color-teal)] bg-[var(--color-teal)]/10 hover:bg-[var(--color-teal)]/20 rounded-full border border-[var(--color-teal)]/20 transition-colors"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {l.resetFilters} ({activeFilterCount})
                    </button>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">{l.country}</label>
                <CustomSelect
                    options={countries}
                    value={filters.country}
                    onChange={(value) => handleFilterChange("country", value)}
                    searchable
                    alphabetical
                />
            </div>

            <div className="mb-5">
                <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">{l.type}</label>
                <CustomSelect
                    options={propertyTypes}
                    value={filters.propertyType}
                    onChange={(value) => handleFilterChange("propertyType", value)}
                    searchable
                />
            </div>

            <div className="mb-5">
                <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">{l.bedrooms}</label>
                <CustomSelect
                    options={bedroomOptions}
                    value={filters.bedrooms}
                    onChange={(value) => handleFilterChange("bedrooms", value)}
                />
            </div>

            <div className="mb-5">
                <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3">{l.price}</label>
                <PriceRangeSlider
                    min={priceStats.min}
                    max={priceStats.max}
                    step={5000}
                    value={priceRange}
                    onChange={setPriceRange}
                    lang={lang}
                />
            </div>

            {/* Feature checkboxes — collapsible */}
            <div className="border-t border-[var(--color-border)] pt-5">
                <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3">{l.features}</p>
                <div className="space-y-2.5">
                    {(featuresExpanded ? featureCheckboxes : featureCheckboxes.slice(0, INITIAL_FEATURES_SHOWN)).map(({ key, label: checkLabel }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={filters[key as keyof typeof filters] as boolean}
                                    onChange={(e) => handleFilterChange(key, e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="w-5 h-5 rounded border-2 border-[var(--color-border)] peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] transition-colors flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-teal)] transition-colors">{checkLabel}</span>
                        </label>
                    ))}
                </div>
                {featureCheckboxes.length > INITIAL_FEATURES_SHOWN && (
                    <button
                        onClick={() => setFeaturesExpanded(!featuresExpanded)}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-teal)] transition-colors"
                    >
                        <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresExpanded ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {featuresExpanded
                            ? (lang === 'en' ? 'Show less' : lang === 'cz' ? 'Zobrazit méně' : 'Zobraziť menej')
                            : (lang === 'en' ? `Show all (${featureCheckboxes.length})` : lang === 'cz' ? `Zobrazit vše (${featureCheckboxes.length})` : `Zobraziť všetky (${featureCheckboxes.length})`)}
                    </button>
                )}
            </div>

            {/* Reset filters */}
            {activeFilterCount > 0 && (
                <button
                    onClick={resetFilters}
                    className="mt-5 w-full py-2.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-teal)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-teal)]/30 transition-colors"
                >
                    {l.resetFilters} ({activeFilterCount})
                </button>
            )}
        </>
    );

    const filtersLabel = lang === 'en' ? 'Filters' : lang === 'cz' ? 'Filtry' : 'Filtre';
    const showResultsLabel = lang === 'en' ? `Show ${filteredProperties.length} results` : lang === 'cz' ? `Zobrazit ${filteredProperties.length} výsledků` : `Zobraziť ${filteredProperties.length} výsledkov`;

    return (
        <section className="py-[clamp(2rem,4vw,4rem)]">
            <div className="container-custom">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Desktop Sidebar — hidden on mobile */}
                    <aside className="hidden lg:block lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] sticky top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain scrollbar-thin">
                            <div className="p-6">
                                {filterPanelContent}
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Top bar: result count + sort */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm sm:text-base text-[var(--color-muted)]">
                                {l.found} <span className="font-medium text-[var(--color-secondary)]">{filteredProperties.length}</span> {l.propertiesLabel}
                            </p>
                            <div className="w-36 sm:w-48">
                                <CustomSelect
                                    options={sortOptions}
                                    value={sortBy}
                                    onChange={setSortBy}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[clamp(1rem,3vw,1.5rem)]">
                            {filteredProperties.map((property, index) => (
                                <PropertyCard
                                    key={property.id}
                                    id={property.id}
                                    title={property.title}
                                    location={property.location}
                                    price={property.priceFormatted}
                                    beds={property.beds}
                                    baths={property.baths}
                                    area={property.area}
                                    images={property.images}
                                    featured={property.featured}
                                    previewTags={property.previewTags}
                                    lang={lang}
                                    distanceFromSea={property.distanceFromSea}
                                    propertyIdExternal={property.propertyIdExternal}
                                    priority={index === 0}
                                />
                            ))}
                        </div>

                        {filteredProperties.length === 0 && (
                            <div className="text-center py-16">
                                <svg className="w-16 h-16 mx-auto text-[var(--color-muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <p className="text-[var(--color-muted)] mb-4">{l.noResults}</p>
                                <button
                                    onClick={resetFilters}
                                    className="px-6 py-3 border border-[var(--color-teal)] text-[var(--color-teal)] font-medium rounded-lg hover:bg-[var(--color-teal)] hover:text-white transition-colors"
                                >
                                    {l.resetFilters}
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile: Sticky bottom filter button */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
                <button
                    onClick={openMobileFilters}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white text-sm font-medium rounded-full shadow-lg active:scale-95 transition-transform"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                    {filtersLabel}
                    {activeFilterCount > 0 && (
                        <span className="ml-0.5 w-5 h-5 flex items-center justify-center bg-white text-[var(--color-primary)] text-[10px] font-bold rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Mobile: Bottom sheet filter drawer */}
            {mobileFiltersOpen && (
                <div className="lg:hidden fixed inset-0 z-50" onClick={closeMobileFilters}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    {/* Sheet */}
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle + Header */}
                        <div className="flex-shrink-0 pt-3 pb-4 px-6 border-b border-[var(--color-border)]">
                            <div className="w-10 h-1 bg-[var(--color-border-dark)] rounded-full mx-auto mb-4" />
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-[var(--color-secondary)] text-base">{filtersLabel}</h3>
                                <button
                                    onClick={closeMobileFilters}
                                    className="w-8 h-8 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-secondary)] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Scrollable filter content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain p-6">
                            {filterPanelContent}
                        </div>

                        {/* Sticky bottom CTA */}
                        <div className="flex-shrink-0 p-4 border-t border-[var(--color-border)] bg-white safe-area-inset-bottom">
                            <button
                                onClick={closeMobileFilters}
                                className="w-full py-3 bg-[var(--color-teal)] text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-transform"
                            >
                                {showResultsLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
