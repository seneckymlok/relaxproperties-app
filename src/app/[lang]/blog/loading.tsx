export default function BlogLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero skeleton — matches the blog hero section */}
            <section className="relative h-96 md:h-[500px] bg-[var(--color-secondary)]">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4 animate-pulse">
                        <div className="h-3 bg-white/10 rounded w-20 mx-auto" />
                        <div className="h-8 bg-white/10 rounded w-64 mx-auto" />
                        <div className="h-4 bg-white/10 rounded w-80 mx-auto" />
                    </div>
                </div>
            </section>

            <section className="py-[clamp(2rem,4vw,4rem)]">
                <div className="container-custom">
                    {/* Featured posts skeleton — 2 col grid */}
                    <div className="mb-16 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-64 mb-8" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="relative rounded-2xl overflow-hidden">
                                    <div className="aspect-[16/10] bg-gray-200" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filter + heading row */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 animate-pulse">
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-200 rounded w-36" />
                            <div className="h-4 bg-gray-200 rounded w-56" />
                        </div>
                        <div className="flex gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-9 bg-gray-200 rounded-full w-24" />
                            ))}
                        </div>
                    </div>

                    {/* Blog post grid — 3 col */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] animate-pulse">
                                <div className="aspect-[16/10] bg-gray-200 relative">
                                    <div className="absolute top-3 left-3 h-5 bg-gray-300 rounded-full w-16" />
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-5/6" />
                                    <div className="h-4 bg-gray-200 rounded" />
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className="h-3 bg-gray-200 rounded w-20" />
                                        <div className="h-3 bg-gray-200 rounded w-16" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
