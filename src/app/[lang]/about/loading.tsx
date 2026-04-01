export default function AboutLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero skeleton */}
            <section className="relative h-96 md:h-[500px] bg-[var(--color-secondary)] animate-pulse" />

            {/* Intro section skeleton */}
            <section className="py-[clamp(3rem,6vw,5rem)]">
                <div className="max-w-3xl mx-auto px-4 text-center space-y-4 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-20 mx-auto" />
                    <div className="h-7 bg-gray-200 rounded w-80 mx-auto" />
                    <div className="h-4 bg-gray-200 rounded w-full mx-auto" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                </div>
            </section>

            {/* Why us grid skeleton */}
            <section className="py-[clamp(2rem,4vw,4rem)] bg-[var(--color-primary)]">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="bg-white/5 rounded-2xl p-8 animate-pulse">
                                <div className="w-12 h-12 bg-white/10 rounded-full mb-4" />
                                <div className="h-5 bg-white/10 rounded w-40 mb-2" />
                                <div className="h-4 bg-white/10 rounded w-full" />
                                <div className="h-4 bg-white/10 rounded w-3/4 mt-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
