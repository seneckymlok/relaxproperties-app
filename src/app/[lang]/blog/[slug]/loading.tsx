export default function BlogPostLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero skeleton */}
            <section className="relative h-96 md:h-[500px] bg-[var(--color-secondary)] animate-pulse" />

            {/* Article content skeleton */}
            <article className="py-[clamp(2rem,4vw,4rem)]">
                <div className="max-w-3xl mx-auto px-4 space-y-6 animate-pulse">
                    {/* Lead excerpt */}
                    <div className="border-l-4 border-gray-200 pl-6 space-y-2">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-5/6" />
                    </div>

                    {/* Body paragraphs */}
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-4/5" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>

                    {/* Share buttons */}
                    <div className="flex gap-3 pt-6 border-t border-[var(--color-border)]">
                        <div className="h-9 w-9 bg-gray-200 rounded-full" />
                        <div className="h-9 w-9 bg-gray-200 rounded-full" />
                        <div className="h-9 w-9 bg-gray-200 rounded-full" />
                    </div>
                </div>
            </article>

            {/* Related posts skeleton */}
            <section className="py-[clamp(2rem,4vw,4rem)] bg-[var(--color-surface)]">
                <div className="container-custom">
                    <div className="h-6 bg-gray-200 rounded w-40 mb-8 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] animate-pulse">
                                <div className="aspect-[16/10] bg-gray-200" />
                                <div className="p-6 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-5/6" />
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
