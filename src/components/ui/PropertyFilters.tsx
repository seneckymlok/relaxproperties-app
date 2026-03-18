"use client";

import { countries, propertyTypes, priceRanges, bedroomOptions } from "@/lib/data-access";
import CustomSelect from "@/components/ui/CustomSelect";

interface PropertyFiltersProps {
    filters: {
        country: string;
        type: string;
        priceRange: string;
        beds: string;
    };
    onFilterChange: (key: string, value: string) => void;
    className?: string;
}

export default function PropertyFilters({
    filters,
    onFilterChange,
    className = "",
}: PropertyFiltersProps) {
    return (
        <div className={`bg-white rounded-2xl border border-[var(--color-border)] p-6 ${className}`}>
            <h3 className="text-lg font-medium text-[var(--color-secondary)] mb-6">
                Filtrovať
            </h3>

            {/* Country Filter */}
            <div className="mb-6">
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                    Krajina
                </label>
                <CustomSelect
                    options={countries}
                    value={filters.country}
                    onChange={(value) => onFilterChange("country", value)}
                    placeholder="Všetky krajiny"
                />
            </div>

            {/* Property Type Filter */}
            <div className="mb-6">
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                    Typ
                </label>
                <CustomSelect
                    options={propertyTypes}
                    value={filters.type}
                    onChange={(value) => onFilterChange("type", value)}
                    placeholder="Všetky typy"
                />
            </div>

            {/* Bedrooms Filter */}
            <div className="mb-6">
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                    Spálne
                </label>
                <CustomSelect
                    options={bedroomOptions}
                    value={filters.beds}
                    onChange={(value) => onFilterChange("beds", value)}
                    placeholder="Všetky"
                />
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                    Cena
                </label>
                <CustomSelect
                    options={priceRanges}
                    value={filters.priceRange}
                    onChange={(value) => onFilterChange("priceRange", value)}
                    placeholder="Akákoľvek cena"
                />
            </div>

            {/* Reset Filters Button */}
            <button
                onClick={() => {
                    onFilterChange("country", "all");
                    onFilterChange("type", "all");
                    onFilterChange("priceRange", "all");
                    onFilterChange("beds", "all");
                }}
                className="w-full py-3 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors border-t border-[var(--color-border)] mt-2 pt-4"
            >
                Zrušiť filtre
            </button>
        </div>
    );
}
