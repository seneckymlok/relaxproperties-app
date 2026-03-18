
import Link from "next/link";
import Image from "next/image";

export default function AboutTeaser() {
    return (
        <section className="py-20 bg-white">
            <div className="container-custom">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="relative h-[500px] bg-gray-100 rounded-lg overflow-hidden order-2 md:order-1">
                        <Image
                            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop"
                            alt="Relax Properties Team"
                            fill
                            className="object-cover"
                        />
                    </div>

                    <div className="order-1 md:order-2">
                        <h4 className="text-[var(--color-primary)] font-medium tracking-wider uppercase mb-4">
                            Who We Are
                        </h4>
                        <h2 className="text-3xl md:text-5xl font-serif font-bold text-[var(--color-secondary)] mb-6">
                            Your Trusted Partner for Mediterranean Living
                        </h2>
                        <p className="text-[var(--color-foreground)] text-lg leading-relaxed mb-6">
                            At Relax Properties, we specialize in helping you find your perfect vacation home or investment property along the stunning Adriatic and Mediterranean coasts.
                        </p>
                        <p className="text-[var(--color-muted)] mb-8 leading-relaxed">
                            With years of experience and deep local knowledge, we guide you through every step of the buying process, ensuring a smooth and enjoyable journey to owning your piece of paradise.
                        </p>
                        <Link
                            href="/about"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-secondary)] text-white font-medium rounded hover:bg-[var(--color-secondary-light)] transition-colors"
                        >
                            More About Us
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
