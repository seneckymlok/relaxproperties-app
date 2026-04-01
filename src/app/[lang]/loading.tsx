export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[var(--color-background)]">
            {/* Skeleton visible through the frost — gives visual depth */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                {/* Hero-height area */}
                <div className="h-[63svh] md:h-screen bg-gradient-to-b from-gray-200/40 via-gray-100/30 to-transparent" />
                {/* Country banners hint */}
                <div className="py-6 px-4 max-w-7xl mx-auto">
                    <div className="hidden md:grid grid-cols-4 gap-6">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-200/30 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Frosted glass + centered logo */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    backgroundColor: 'rgba(var(--color-background-rgb), 0.92)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                }}
            >
                <div className="intro-logo-entrance">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/relax-logo.png"
                        alt="Relax Properties"
                        width={280}
                        height={72}
                        className="h-[clamp(3.5rem,10vw,5rem)] w-auto"
                    />
                </div>
            </div>
        </div>
    );
}
