export default function ContactLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero skeleton */}
            <section className="relative h-64 md:h-80 bg-[var(--color-secondary)] animate-pulse" />

            {/* Content skeleton */}
            <section className="py-[clamp(2rem,4vw,4rem)]">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                        {/* Left: Company info */}
                        <div className="space-y-6 animate-pulse">
                            <div className="h-7 bg-gray-200 rounded w-48" />
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-full" />
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                            </div>
                            <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                                <div className="h-4 bg-gray-200 rounded w-56" />
                                <div className="h-4 bg-gray-200 rounded w-48" />
                                <div className="h-4 bg-gray-200 rounded w-52" />
                            </div>
                        </div>

                        {/* Right: Contact form */}
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-36 mb-6" />
                            <div className="space-y-4">
                                <div className="h-11 bg-gray-200 rounded-lg" />
                                <div className="h-11 bg-gray-200 rounded-lg" />
                                <div className="h-11 bg-gray-200 rounded-lg" />
                                <div className="h-28 bg-gray-200 rounded-lg" />
                                <div className="h-12 bg-gray-200 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
