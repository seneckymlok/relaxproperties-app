
import Link from "next/link";
import Image from "next/image";

// Placeholder data - replace with real data fetching later
const properties = [
    {
        id: 1,
        title: "Luxury Villa with Pool",
        location: "Zadar, Croatia",
        price: "€450,000",
        image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2670&auto=format&fit=crop",
        bedrooms: 4,
        bathrooms: 3,
        area: "250 m²"
    },
    {
        id: 2,
        title: "Modern Seafront Apartment",
        location: "Split, Croatia",
        price: "€280,000",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
        bedrooms: 2,
        bathrooms: 2,
        area: "85 m²"
    },
    {
        id: 3,
        title: "Stone House with Garden",
        location: "Istria, Croatia",
        price: "€320,000",
        image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=2070&auto=format&fit=crop",
        bedrooms: 3,
        bathrooms: 2,
        area: "150 m²"
    }
];

export default function FeaturedProperties() {
    return (
        <section className="py-[clamp(2.5rem,5vw,5rem)] bg-[var(--color-surface)]">
            <div className="container-custom">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)] mb-4">
                            Featured Properties
                        </h2>
                        <p className="text-[var(--color-foreground)] max-w-xl">
                            Explore our hand-picked selection of the finest properties in prime locations.
                        </p>
                    </div>
                    <Link
                        href="/properties"
                        className="hidden md:inline-flex items-center gap-2 text-[var(--color-primary)] font-medium hover:text-[var(--color-teal)] transition-colors mt-4 md:mt-0"
                    >
                        View all properties
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {properties.map((property) => (
                        <Link href={`/properties/${property.id}`} key={property.id} className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="relative h-64 overflow-hidden">
                                <Image
                                    src={property.image}
                                    alt={property.title}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-sm font-semibold text-[var(--color-primary)] rounded">
                                    {property.price}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {property.location}
                                </div>

                                <h3 className="text-xl font-serif font-semibold text-[var(--color-secondary)] mb-4 group-hover:text-[var(--color-teal)] transition-colors">
                                    {property.title}
                                </h3>

                                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)] text-sm text-[var(--color-foreground)]">
                                    <span className="flex items-center gap-1">
                                        <span className="font-semibold">{property.bedrooms}</span> Beds
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="font-semibold">{property.bathrooms}</span> Baths
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="font-semibold">{property.area}</span>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 text-center md:hidden">
                    <Link
                        href="/properties"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-primary)] font-medium hover:bg-[var(--color-surface)] transition-colors"
                    >
                        View all properties
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
