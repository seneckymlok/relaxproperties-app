import { Suspense } from "react";

// This page redirects to the localized version or is dynamically rendered
// Wrapping the client component content in Suspense to satisfy Next.js requirements
import PropertiesPageContent from "@/components/pages/PropertiesPageContent";

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <section className="relative h-64 md:h-80 bg-[var(--color-primary)]">
                <div className="container-custom h-full flex items-center justify-center">
                    <div className="text-center text-white">
                        <h1 className="font-serif text-4xl md:text-5xl font-medium">Nehnuteľnosti</h1>
                    </div>
                </div>
            </section>
            <section className="py-[clamp(2rem,4vw,4rem)]">
                <div className="container-custom">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-48"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
                                    <div className="h-56 bg-gray-200"></div>
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-5 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
import { getPropertiesServer } from "@/lib/data-access";

export default async function PropertiesPage() {
    // For the unlocalized fallback, we use the default language 'sk'
    const properties = await getPropertiesServer('sk');

    return (
        <Suspense fallback={<LoadingFallback />}>
            <PropertiesPageContent properties={properties} />
        </Suspense>
    );
}
