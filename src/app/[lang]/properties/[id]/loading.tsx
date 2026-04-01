export default function PropertyDetailLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] pt-20">
            <div className="container-custom py-8">
                {/* Breadcrumb skeleton */}
                <div className="h-4 bg-gray-200 rounded w-48 mb-6 animate-pulse" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Gallery skeleton */}
                        <div className="w-full aspect-[16/10] bg-gray-200 rounded-2xl animate-pulse" />

                        {/* Title & price skeleton */}
                        <div className="space-y-3 animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-3/4" />
                            <div className="h-6 bg-gray-200 rounded w-1/3" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>

                        {/* Description skeleton */}
                        <div className="space-y-2 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded" />
                            <div className="h-4 bg-gray-200 rounded" />
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
                            <div className="space-y-3">
                                <div className="h-10 bg-gray-200 rounded" />
                                <div className="h-10 bg-gray-200 rounded" />
                                <div className="h-24 bg-gray-200 rounded" />
                                <div className="h-12 bg-gray-200 rounded" />
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
