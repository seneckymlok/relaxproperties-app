"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BlogPostRecord } from "@/lib/blog-store";

const statusColors: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    draft: "bg-amber-100 text-amber-700 border border-amber-200",
    archived: "bg-gray-100 text-gray-700 border border-gray-200",
};

const statusLabels: Record<string, string> = {
    published: "Publikované",
    draft: "Koncept",
    archived: "Archivované",
};

export default function BlogListPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<BlogPostRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch("/api/admin/blog");
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts || []);
            }
        } catch (err) {
            console.error("Error fetching blog posts:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Naozaj chcete vymazať "${title}"?`)) return;

        try {
            const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPosts(prev => prev.filter(p => p.id !== id));
            }
        } catch (err) {
            console.error("Error deleting:", err);
        }
    };

    const filtered = posts.filter(p => {
        if (filter !== "all" && p.publish_status !== filter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                p.title_sk.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.author.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-serif text-[var(--color-secondary)]">Blog</h1>
                    <p className="text-sm text-[var(--color-muted)] mt-1">{posts.length} článkov celkovo</p>
                </div>
                <Link
                    href="/admin/blog/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-xl transition-colors shadow-sm self-start sm:self-auto"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nový článok
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Status Filter */}
                <div className="flex bg-white border border-[var(--color-border)] rounded-xl p-1 shadow-sm">
                    {[
                        { key: "all", label: "Všetky" },
                        { key: "published", label: "Publikované" },
                        { key: "draft", label: "Koncepty" },
                        { key: "archived", label: "Archivované" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${filter === f.key
                                ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm"
                                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px] shadow-sm">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Hľadať podľa názvu, kategórie..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 text-sm">
                        <svg className="w-6 h-6 animate-spin mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Načítavam...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <p className="text-gray-500 text-sm">Žiadne články</p>
                        <Link
                            href="/admin/blog/new"
                            className="inline-block mt-3 text-sm text-[#C5A880] hover:underline"
                        >
                            Pridať prvý článok →
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                                    <th className="text-left text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider px-6 py-4">Článok</th>
                                    <th className="text-left text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider px-6 py-4">Kategória</th>
                                    <th className="text-left text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider px-6 py-4">Autor</th>
                                    <th className="text-left text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider px-6 py-4">Dátum</th>
                                    <th className="text-left text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider px-6 py-4">Stav</th>
                                    <th className="text-right text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider px-6 py-4">Akcie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)] bg-white">
                                {filtered.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-[var(--color-surface)] transition-colors cursor-pointer whitespace-nowrap group"
                                        onClick={() => router.push(`/admin/blog/${p.id}/edit`)}
                                    >
                                        <td className="px-6 py-4 whitespace-normal min-w-[250px]">
                                            <div className="flex items-center gap-4">
                                                {p.image ? (
                                                    <div
                                                        className="w-14 h-10 rounded-lg bg-cover bg-center flex-shrink-0 border border-[var(--color-border)] shadow-sm"
                                                        style={{ backgroundImage: `url(${p.image})` }}
                                                    />
                                                ) : (
                                                    <div className="w-14 h-10 rounded-lg bg-[var(--color-surface)] flex items-center justify-center flex-shrink-0 border border-[var(--color-border)]">
                                                        <svg className="w-5 h-5 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors">{p.title_sk || "Bez názvu"}</p>
                                                    {p.featured && (
                                                        <span className="text-[10px] text-[var(--color-accent)] font-semibold mt-0.5 block">★ Odporúčané</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--color-muted)]">
                                            {p.category || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--color-muted)]">
                                            {p.author}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--color-muted)]">
                                            {p.published_at
                                                ? new Date(p.published_at).toLocaleDateString("sk-SK")
                                                : new Date(p.created_at).toLocaleDateString("sk-SK")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusColors[p.publish_status] || statusColors.draft}`}>
                                                {statusLabels[p.publish_status] || p.publish_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Link
                                                    href={`/admin/blog/${p.id}/edit`}
                                                    className="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] rounded-lg transition-colors"
                                                    title="Upraviť"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(p.id, p.title_sk)}
                                                    className="p-2 text-[var(--color-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Vymazať"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
