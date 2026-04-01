export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-secondary)]">
            <div className="homepage-logo-intro">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/relax-logo.png"
                    alt="Relax Properties"
                    width={180}
                    height={46}
                    className="h-[clamp(2rem,5vw,2.75rem)] w-auto brightness-0 invert"
                />
            </div>
        </div>
    );
}
