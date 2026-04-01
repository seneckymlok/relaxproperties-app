export default function BlogLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero skeleton */}
            <section className="relative h-40 sm:h-56 md:h-80 bg-[var(--color-primary)] animate-pulse" />

            <section className="py-[clamp(2rem,4vw,4rem)]">
                <div className="container-custom">
                    {/* Category filter skeleton */}
                    <div className="flex gap-3 mb-8 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-9 bg-gray-200 rounded-full w-24" />
                        ))}
                    </div>

                    {/* Grid skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                                <div className="h-56 bg-gray-200" />
                                <div className="p-6 space-y-3">
                                    <div className="h-3 bg-gray-200 rounded w-20" />
                                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
