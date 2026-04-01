export default function BuyingProcessLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero skeleton */}
            <section className="relative h-96 md:h-[500px] bg-[var(--color-secondary)] animate-pulse" />

            {/* Country cards skeleton */}
            <section className="py-[clamp(2rem,4vw,4rem)]">
                <div className="container-custom">
                    <div className="max-w-2xl mx-auto text-center mb-8 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-80 mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>

            {/* Process steps skeleton */}
            <section className="py-[clamp(2rem,4vw,4rem)] bg-[var(--color-surface)]">
                <div className="container-custom max-w-3xl">
                    <div className="h-6 bg-gray-200 rounded w-56 mb-8 animate-pulse" />
                    <div className="space-y-4">
                        {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl border border-[var(--color-border)] p-6 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                                    <div className="h-5 bg-gray-200 rounded w-48" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
