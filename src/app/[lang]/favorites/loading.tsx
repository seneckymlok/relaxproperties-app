export default function FavoritesLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] pt-20">
            <section className="py-[clamp(2rem,4vw,4rem)]">
                <div className="container-custom">
                    {/* Header */}
                    <div className="text-center mb-10 animate-pulse">
                        <div className="h-7 bg-gray-200 rounded w-48 mx-auto mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[0, 1, 2].map(i => (
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
                </div>
            </section>
        </div>
    );
}
