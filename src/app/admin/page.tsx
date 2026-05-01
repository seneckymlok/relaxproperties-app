import Link from "next/link";
import { getPropertyCounts } from "@/lib/property-store";
import { getBlogPostCounts } from "@/lib/blog-store";
import SyncDashboard from "@/components/admin/SyncDashboard";

export default async function AdminDashboard() {
    let counts = { total: 0, published: 0, draft: 0, trashed: 0 };
    let blogCounts = { total: 0, published: 0, draft: 0, archived: 0 };

    try {
        counts = await getPropertyCounts();
    } catch {
        // Supabase not configured yet — show zeros
    }

    try {
        blogCounts = await getBlogPostCounts();
    } catch {
        // Blog table not yet created — show zeros
    }

    const statCards = [
        {
            label: "Celkom",
            value: counts.total,
            iconClass: "text-[var(--color-secondary)]",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
            ),
        },
        {
            label: "Publikované",
            value: counts.published,
            iconClass: "text-[var(--color-secondary)]",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            ),
        },
        {
            label: "Koncepty",
            value: counts.draft,
            iconClass: "text-[var(--color-secondary)]",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
            ),
        },
        {
            label: "V koši",
            value: counts.trashed,
            iconClass: "text-[var(--color-secondary)]",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
            ),
        },
    ];

    return (
        <>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-[var(--color-secondary)]">Prehľad</h1>
                <p className="text-sm text-[var(--color-muted)] mt-1">Vitajte v administračnom paneli</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-white border border-[var(--color-border)] rounded-2xl p-6 flex items-center justify-between"
                    >
                        <div className="flex flex-col items-start gap-1">
                            <p className="text-[32px] font-serif text-[var(--color-secondary)] leading-none mb-1 font-medium tracking-tight">{card.value}</p>
                            <p className="text-[14px] font-medium text-[var(--color-muted)]">{card.label}</p>
                        </div>
                        <div className={`opacity-80 ${card.iconClass}`}>
                            {card.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Blog Stat Cards */}
            <div className="mb-8">
                <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-5">Blog</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "Články celkom", value: blogCounts.total },
                        { label: "Publikované", value: blogCounts.published },
                        { label: "Koncepty", value: blogCounts.draft },
                    ].map((card) => (
                        <div
                            key={card.label}
                            className="bg-white border border-[var(--color-border)] rounded-2xl p-6 flex items-center justify-between"
                        >
                            <div className="flex flex-col items-start gap-1">
                                <p className="text-[32px] font-serif text-[#111827] leading-none mb-1 font-medium tracking-tight">{card.value}</p>
                                <p className="text-[14px] font-medium text-[#6B7280]">{card.label}</p>
                            </div>
                            <div className="opacity-80 text-[var(--color-secondary)]">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm mb-8">
                <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-5">Rýchle akcie</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        href="/admin/properties/new"
                        className="flex items-center gap-3 px-5 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl text-white text-sm font-medium transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Pridať nehnuteľnosť
                    </Link>
                    <Link
                        href="/admin/properties"
                        className="flex items-center gap-3 px-5 py-3.5 bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] text-sm font-medium transition-colors"
                    >
                        <svg className="w-5 h-5 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        Zobraziť všetky nehnuteľnosti
                    </Link>
                    <Link
                        href="/admin/blog/new"
                        className="flex items-center gap-3 px-5 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl text-white text-sm font-medium transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Pridať článok
                    </Link>
                    <Link
                        href="/admin/blog"
                        className="flex items-center gap-3 px-5 py-3.5 bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] text-sm font-medium transition-colors"
                    >
                        <svg className="w-5 h-5 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Zobraziť všetky články
                    </Link>
                    <Link
                        href="/admin/feeds"
                        className="flex items-center gap-3 px-5 py-3.5 bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] text-sm font-medium transition-colors"
                    >
                        <svg className="w-5 h-5 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                        </svg>
                        Importované feedy
                    </Link>
                </div>
            </div>

            {/* Export / Sync */}
            <div className="mb-2">
                <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-5">Export a synchronizácia</h2>
                <SyncDashboard />
            </div>
        </>
    );
}
