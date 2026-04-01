export default function PrivacyPolicyLoading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] pt-20">
            <div className="max-w-4xl mx-auto px-4 py-[clamp(2rem,4vw,4rem)]">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 bg-gray-200 rounded w-56" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="border-b border-[var(--color-border)]" />
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-52" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-4/5" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
