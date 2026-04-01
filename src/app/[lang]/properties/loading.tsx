export default function PropertiesLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero skeleton */}
            <section className="relative h-40 sm:h-56 md:h-80 bg-[var(--color-primary)] animate-pulse" />

            <section className="py-[clamp(2rem,4vw,4rem)]">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar skeleton */}
                        <aside className="lg:w-72 flex-shrink-0">
                            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-24 mb-6" />
                                <div className="space-y-4">
                                    <div className="h-12 bg-gray-200 rounded" />
                                    <div className="h-12 bg-gray-200 rounded" />
                                    <div className="h-12 bg-gray-200 rounded" />
                                </div>
                            </div>
                        </aside>

                        {/* Grid skeleton */}
                        <main className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden animate-pulse">
                                        <div className="h-56 bg-gray-200" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                            <div className="h-5 bg-gray-200 rounded" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </main>
                    </div>
                </div>
            </section>
        </div>
    );
}
