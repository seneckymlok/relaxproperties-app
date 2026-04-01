export default function PropertyDetailLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] pt-20">
            <div className="container-custom py-8">
                {/* Breadcrumb skeleton */}
                <div className="flex items-center gap-2 mb-6 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-12" />
                    <div className="h-3 bg-gray-200 rounded w-3" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                    <div className="h-3 bg-gray-200 rounded w-3" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main content — 2/3 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Gallery skeleton */}
                        <div className="w-full aspect-[16/10] bg-gray-200 rounded-2xl animate-pulse" />

                        {/* Badges + title + price */}
                        <div className="space-y-4 animate-pulse">
                            <div className="flex gap-2">
                                <div className="h-6 bg-gray-200 rounded-full w-20" />
                                <div className="h-6 bg-gray-200 rounded-full w-16" />
                            </div>
                            <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="h-7 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                                </div>
                                <div className="h-8 bg-gray-200 rounded w-32" />
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 animate-pulse">
                            <div className="h-10 bg-gray-200 rounded-full w-28" />
                            <div className="h-10 bg-gray-200 rounded-full w-32" />
                        </div>

                        {/* Stats bar */}
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 animate-pulse">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                        <div className="space-y-1">
                                            <div className="h-4 bg-gray-200 rounded w-12" />
                                            <div className="h-3 bg-gray-200 rounded w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Amenities skeleton */}
                        <div className="space-y-4 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-28" />
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-8 bg-gray-200 rounded-full w-24" />
                                ))}
                            </div>
                        </div>

                        {/* Description skeleton */}
                        <div className="space-y-3 animate-pulse border-t border-[var(--color-border)] pt-6">
                            <div className="h-5 bg-gray-200 rounded w-24" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded" />
                                <div className="h-4 bg-gray-200 rounded" />
                                <div className="h-4 bg-gray-200 rounded w-4/5" />
                                <div className="h-4 bg-gray-200 rounded w-3/5" />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar — 1/3 */}
                    <aside className="space-y-6">
                        {/* Contact form */}
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 animate-pulse sticky top-24">
                            <div className="h-6 bg-gray-200 rounded w-36 mb-6" />
                            <div className="space-y-4">
                                <div className="h-11 bg-gray-200 rounded-lg" />
                                <div className="h-11 bg-gray-200 rounded-lg" />
                                <div className="h-11 bg-gray-200 rounded-lg" />
                                <div className="h-24 bg-gray-200 rounded-lg" />
                                <div className="h-12 bg-gray-200 rounded-full" />
                            </div>
                            {/* Agent card */}
                            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                    <div className="space-y-1">
                                        <div className="h-4 bg-gray-200 rounded w-28" />
                                        <div className="h-3 bg-gray-200 rounded w-20" />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-36" />
                                    <div className="h-4 bg-gray-200 rounded w-40" />
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
