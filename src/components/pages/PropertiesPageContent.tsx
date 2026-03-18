"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/ui/PropertyCard";
import PropertyFilters from "@/components/ui/PropertyFilters";
import Pagination from "@/components/ui/Pagination";
import { sortOptions, type PublicProperty } from "@/lib/data-access";

const ITEMS_PER_PAGE = 6;

interface PropertiesPageContentProps {
    properties: PublicProperty[];
}

export default function PropertiesPageContent({ properties }: PropertiesPageContentProps) {
    const searchParams = useSearchParams();

    // Initialize filters from URL params
    const [filters, setFilters] = useState({
        country: searchParams.get("country") || "all",
        type: searchParams.get("type") || "all",
        priceRange: searchParams.get("price") || "all",
        beds: searchParams.get("beds") || "all",
    });

    const [sortBy, setSortBy] = useState("featured");
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    // Filter and sort properties
    const filteredProperties = useMemo(() => {
        let result = [...properties];

        if (filters.country !== "all") {
            result = result.filter((p) => p.country === filters.country);
        }
        if (filters.type !== "all") {
            result = result.filter((p) => p.type === filters.type);
        }
        if (filters.priceRange !== "all") {
            const [min, max] = filters.priceRange.split("-").map((v) => {
                if (v.endsWith("+")) return Infinity;
                return parseInt(v);
            });
            result = result.filter((p) => p.price >= min && p.price <= (max || Infinity));
        }
        if (filters.beds !== "all") {
            const minBeds = parseInt(filters.beds);
            result = result.filter((p) => p.beds >= minBeds);
        }

        switch (sortBy) {
            case "price-asc":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                result.sort((a, b) => b.price - a.price);
                break;
            case "newest":
                result.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            case "area-desc":
                result.sort((a, b) => b.area - a.area);
                break;
            case "featured":
            default:
                result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
                break;
        }

        return result;
    }, [filters, sortBy]);

    // Pagination logic
    const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
    const paginatedProperties = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProperties.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProperties, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length;

    return (
        <>
            {/* Hero Banner */}
            <section className="relative h-64 md:h-80 bg-[var(--color-primary)]">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80')",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)] via-transparent to-transparent" />
                <div className="relative container-custom h-full flex flex-col justify-center items-center text-center text-white pt-16">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sand-light)] mb-3">
                        Ponuka nehnuteľností
                    </p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white">
                        Nehnuteľnosti
                    </h1>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-12 md:py-16 bg-[var(--color-background)]">
                <div className="container-custom">
                    {/* Top Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <p className="text-[var(--color-foreground)]">
                                <span className="font-medium">{filteredProperties.length}</span>{" "}
                                <span className="text-[var(--color-muted)]">
                                    {filteredProperties.length === 1 ? "nehnuteľnosť" : "nehnuteľností"}
                                </span>
                            </p>

                            <button
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-foreground)] hover:border-[var(--color-primary)] transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filtre
                                {activeFilterCount > 0 && (
                                    <span className="w-5 h-5 flex items-center justify-center bg-[var(--color-primary)] text-white text-xs rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-[var(--color-muted)]">Zoradiť:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="h-10 px-4 pr-10 border border-[var(--color-border)] rounded-lg bg-white text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filters Sidebar */}
                        <aside className="hidden lg:block w-72 flex-shrink-0">
                            <div className="sticky top-24">
                                <PropertyFilters filters={filters} onFilterChange={handleFilterChange} />
                            </div>
                        </aside>

                        {/* Mobile Filters */}
                        {showMobileFilters && (
                            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileFilters(false)}>
                                <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                                        <h2 className="text-lg font-medium text-[var(--color-secondary)]">Filtre</h2>
                                        <button onClick={() => setShowMobileFilters(false)} className="p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <PropertyFilters filters={filters} onFilterChange={handleFilterChange} />
                                    </div>
                                    <div className="p-4 border-t border-[var(--color-border)]">
                                        <button
                                            onClick={() => setShowMobileFilters(false)}
                                            className="w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                                        >
                                            Zobraziť {filteredProperties.length} výsledkov
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Properties Grid */}
                        <div className="flex-1">
                            {filteredProperties.length === 0 ? (
                                <div className="text-center py-16">
                                    <svg className="w-16 h-16 mx-auto text-[var(--color-muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <h3 className="text-xl font-medium text-[var(--color-secondary)] mb-2">Žiadne výsledky</h3>
                                    <p className="text-[var(--color-muted)] mb-6">Skúste upraviť filtre pre zobrazenie viac nehnuteľností.</p>
                                    <button
                                        onClick={() => {
                                            setFilters({
                                                country: "all",
                                                type: "all",
                                                priceRange: "all",
                                                beds: "all",
                                            });
                                        }}
                                        className="px-6 py-3 border border-[var(--color-primary)] text-[var(--color-primary)] font-medium rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                                    >
                                        Zrušiť filtre
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {paginatedProperties.map((property) => (
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

                                    {totalPages > 1 && (
                                        <div className="mt-12">
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                onPageChange={handlePageChange}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
