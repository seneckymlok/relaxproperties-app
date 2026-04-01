export default function Loading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero skeleton */}
            <div className="h-[63svh] md:h-screen bg-[var(--color-secondary)] animate-pulse" />

            {/* Country banners skeleton */}
            <section className="py-[clamp(1.5rem,4vw,3.5rem)]">
                <div className="container-custom">
                    <div className="hidden md:grid grid-cols-4 gap-6">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-[clamp(13rem,35vw,20rem)] bg-gray-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                    <div className="md:hidden flex gap-3 overflow-hidden">
                        <div className="w-[75vw] h-52 bg-gray-200 rounded-2xl flex-shrink-0 animate-pulse" />
                        <div className="w-[75vw] h-52 bg-gray-200 rounded-2xl flex-shrink-0 animate-pulse" />
                    </div>
                </div>
            </section>

            {/* New offers skeleton */}
            <section className="py-[clamp(2rem,4vw,4rem)]">
                <div className="container-custom">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-72 mb-8 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[0, 1, 2, 3].map(i => (
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
