export default function Loading() {
    return (
        <div className="relative min-h-screen bg-[var(--color-background)]">
            {/* Skeleton behind the overlay — gives visual depth through the blur */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                {/* Hero area skeleton */}
                <div className="h-[63svh] md:h-screen bg-gray-100 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-200/60 to-gray-100/40" />
                </div>
                {/* Country banners skeleton */}
                <div className="py-8">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="hidden md:grid grid-cols-4 gap-6">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="h-52 bg-gray-200/50 rounded-2xl" />
                            ))}
                        </div>
                        <div className="md:hidden flex gap-3 overflow-hidden">
                            <div className="w-[75vw] h-52 bg-gray-200/50 rounded-2xl flex-shrink-0" />
                            <div className="w-[75vw] h-52 bg-gray-200/50 rounded-2xl flex-shrink-0" />
                        </div>
                    </div>
                </div>
                {/* Property cards skeleton */}
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden">
                                <div className="h-48 bg-gray-200/50" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-200/50 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200/50 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Frosted glass overlay with logo */}
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-background)]/85 backdrop-blur-2xl">
                <div className="homepage-logo-entrance">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/relax-logo.png"
                        alt="Relax Properties"
                        width={260}
                        height={67}
                        className="h-[clamp(3rem,8vw,4.5rem)] w-auto"
                    />
                </div>
            </div>
        </div>
    );
}
