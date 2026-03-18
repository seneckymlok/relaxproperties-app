"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import BlogForm from "@/components/admin/BlogForm";
import type { BlogPostRecord } from "@/lib/blog-store";

export default function EditBlogPostPage() {
    const params = useParams();
    const id = params?.id as string;
    const [post, setPost] = useState<BlogPostRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/admin/blog/${id}`);
                if (!res.ok) throw new Error("Failed to load post");
                const data = await res.json();
                setPost(data.post);
            } catch (err: any) {
                setError(err.message || "Error loading post");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <svg className="w-8 h-8 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <p className="text-red-700 mb-2 font-medium">Chyba</p>
                <p className="text-red-600 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-3xl font-serif text-[var(--color-secondary)]">Upraviť článok</h1>
                <p className="text-sm text-[var(--color-muted)] mt-1">{post?.title_sk || "Bez názvu"}</p>
            </div>
            {post && <BlogForm initialData={post} />}
        </>
    );
}
