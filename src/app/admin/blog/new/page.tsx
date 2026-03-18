"use client";

import BlogForm from "@/components/admin/BlogForm";

export default function NewBlogPostPage() {
    return (
        <>
            <div className="mb-6">
                <h1 className="text-3xl font-serif text-[var(--color-secondary)]">Nový článok</h1>
                <p className="text-sm text-[var(--color-muted)] mt-1">Vytvorte nový blogový príspevok</p>
            </div>
            <BlogForm />
        </>
    );
}
