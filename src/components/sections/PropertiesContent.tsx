"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PropertyCard from "@/components/ui/PropertyCard";
import CustomSelect from "@/components/ui/CustomSelect";
import { getFilterOptions, type Language, type PublicProperty } from "@/lib/data-access";

interface PropertiesContentProps {
    lang: 'sk' | 'en' | 'cz';
    properties: PublicProperty[];
}

// Labels
const labels = {
    sk: { filter: 'Filtrovať', country: 'Krajina', type: 'Typ', bedrooms: 'Spálne', price: 'Cena', seaView: 'Výhľad na more', firstLine: 'Prvá línia', pool: 'Bazén', luxury: 'Luxusná', found: 'Nájdených', propertiesLabel: 'nehnuteľností', noResults: 'Žiadne nehnuteľnosti nezodpovedajú vašim kritériám.', sort: 'Zoradiť', searchPlaceholder: 'Hľadať podľa ID alebo názvu...', search: 'Hľadať' },
    en: { filter: 'Filter', country: 'Country', type: 'Type', bedrooms: 'Bedrooms', price: 'Price', seaView: 'Sea View', firstLine: 'Beachfront', pool: 'Pool', luxury: 'Luxury', found: 'Found', propertiesLabel: 'properties', noResults: 'No properties match your criteria.', sort: 'Sort', searchPlaceholder: 'Search by ID or title...', search: 'Search' },
    cz: { filter: 'Filtrovat', country: 'Země', type: 'Typ', bedrooms: 'Ložnice', price: 'Cena', seaView: 'Výhled na moře', firstLine: 'První linie', pool: 'Bazén', luxury: 'Luxusní', found: 'Nalezeno', propertiesLabel: 'nemovitostí', noResults: 'Žádné nemovitosti neodpovídají vašim kritériím.', sort: 'Seřadit', searchPlaceholder: 'Hledat podle ID nebo názvu...', search: 'Hledat' },
};

export default function PropertiesContent({ lang, properties }: PropertiesContentProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const l = labels[lang];

    // Get localized filter options (static, no DB)
    const filterOptions = useMemo(() => getFilterOptions(lang), [lang]);
    const { countries, propertyTypes, bedroomOptions, priceRanges, sortOptions } = filterOptions;

    // Get initial filter values from URL
    const initialCountry = searchParams.get("country") || "all";
    const initialType = searchParams.get("type") || "all";
    const initialSort = searchParams.get("sort") || "featured";

    const [filters, setFilters] = useState({
        country: initialCountry,
        propertyType: initialType,
        bedrooms: searchParams.get("beds") || "all",
        priceRange: "all",
        seaView: searchParams.get("seaView") === "true",
        firstLine: searchParams.get("firstLine") === "true",
        pool: searchParams.get("pool") === "true",
        newBuild: searchParams.get("newBuild") === "true",
        luxury: searchParams.get("luxury") === "true",
    });
    const [sortBy, setSortBy] = useState(initialSort);
    const [searchQuery, setSearchQuery] = useState("");

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
        if (filters.priceRange !== "all") {
            const [min, max] = filters.priceRange.split("-").map(Number);
            if (max) {
                result = result.filter(p => p.price >= min && p.price <= max);
            } else {
                result = result.filter(p => p.price >= min);
            }
        }
        if (filters.seaView) {
            result = result.filter(p => p.seaView);
        }
        if (filters.firstLine) {
            result = result.filter(p => p.firstLine);
        }
        if (filters.pool) {
            result = result.filter(p => p.pool);
        }
        if (filters.luxury) {
            result = result.filter(p => p.luxury);
        }

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
    }, [filters, sortBy, searchQuery, properties]);

    const handleFilterChange = (key: string, value: string | boolean) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <section className="py-12 md:py-16">
            <div className="container-custom">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 sticky top-24">
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

                            <h3 className="font-medium text-[var(--color-secondary)] mb-6">{l.filter}</h3>

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
                                <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">{l.price}</label>
                                <CustomSelect
                                    options={priceRanges}
                                    value={filters.priceRange}
                                    onChange={(value) => handleFilterChange("priceRange", value)}
                                />
                            </div>

                            <div className="border-t border-[var(--color-border)] pt-5 space-y-3">
                                {[
                                    { key: 'seaView', label: l.seaView },
                                    { key: 'firstLine', label: l.firstLine },
                                    { key: 'pool', label: l.pool },
                                    { key: 'luxury', label: l.luxury },
                                ].map(({ key, label: checkLabel }) => (
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
                                        <span className="text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">{checkLabel}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-[var(--color-muted)]">
                                {l.found} <span className="font-medium text-[var(--color-secondary)]">{filteredProperties.length}</span> {l.propertiesLabel}
                            </p>
                            <div className="w-48">
                                <CustomSelect
                                    options={sortOptions}
                                    value={sortBy}
                                    onChange={setSortBy}
                                    placeholder="Zoradiť"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredProperties.map((property) => (
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
                                />
                            ))}
                        </div>

                        {filteredProperties.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-[var(--color-muted)]">{l.noResults}</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </section>
    );
}
