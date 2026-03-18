
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SearchSection() {
    const router = useRouter();
    const [filters, setFilters] = useState({
        keyword: "",
        country: "",
        type: "",
        rooms: "",
        price: "",
        seaView: false,
    });

    const countries = ["Bulgaria", "Greece", "Spain", "Croatia"];
    const propertyTypes = ["Apartment", "House/Villa", "Studio", "Land/Plot"]; // Removed last 3, added Land/Plot
    const roomOptions = ["1", "2", "3", "4", "5+"];
    const priceRanges = ["Up to 100k", "100k - 200k", "200k - 500k", "500k+"];

    const handleSearch = () => {
        // Construct query parameter string
        const params = new URLSearchParams();
        if (filters.keyword) params.append("keyword", filters.keyword);
        if (filters.country) params.append("country", filters.country);
        if (filters.type) params.append("type", filters.type);
        if (filters.rooms) params.append("rooms", filters.rooms);
        if (filters.price) params.append("price", filters.price);
        if (filters.seaView) params.append("seaView", "true");

        router.push(`/properties?${params.toString()}`);
    };

    return (
        <div className="relative -mt-20 z-30 container-custom px-4 mb-20">
            <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                    {/* Keyword Search */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Kľúčové slovo</label>
                        <input
                            type="text"
                            placeholder="Lokalita, názov..."
                            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            value={filters.keyword}
                            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                        />
                    </div>

                    {/* Country */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Krajina</label>
                        <select
                            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] bg-white"
                            value={filters.country}
                            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                        >
                            <option value="">Všetky krajiny</option>
                            {countries.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Property Type */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Typ nehnuteľnosti</label>
                        <select
                            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] bg-white"
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="">Všetky typy</option>
                            {propertyTypes.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Rooms */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Počet izieb</label>
                        <select
                            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] bg-white"
                            value={filters.rooms}
                            onChange={(e) => setFilters({ ...filters, rooms: e.target.value })}
                        >
                            <option value="">Všetky</option>
                            {roomOptions.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Cena</label>
                        <select
                            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] bg-white"
                            value={filters.price}
                            onChange={(e) => setFilters({ ...filters, price: e.target.value })}
                        >
                            <option value="">Nerozhoduje</option>
                            {priceRanges.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bottom Row: Checkbox + Button */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.seaView ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-gray-300 group-hover:border-[var(--color-primary)]'}`}>
                            {filters.seaView && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={filters.seaView}
                            onChange={(e) => setFilters({ ...filters, seaView: e.target.checked })}
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-[var(--color-primary)] transition-colors">
                            Výhľad na more (Sea View)
                        </span>
                    </label>

                    <div className="flex gap-4 w-full md:w-auto">
                        <Link
                            href="/properties" // Link to detailed search page
                            className="flex-1 md:flex-none text-center px-6 py-3 text-sm font-medium text-gray-500 hover:text-[var(--color-primary)] transition-colors border border-transparent hover:border-gray-200 rounded"
                        >
                            Podrobné vyhľadávanie
                        </Link>
                        <button
                            onClick={handleSearch}
                            className="flex-1 md:flex-none bg-[var(--color-primary)] text-white px-8 py-3 rounded text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors shadow-lg uppercase tracking-wide"
                        >
                            Hľadať
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
