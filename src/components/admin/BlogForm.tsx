"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { BlogPostRecord } from "@/lib/blog-store";

// Load TipTap editor dynamically (no SSR — it uses DOM APIs)
const TipTapEditor = dynamic(() => import("@/components/admin/TipTapEditor"), { ssr: false });

// ============================================
// TYPES
// ============================================

interface BlogFormData {
    title_sk: string;
    title_en: string;
    title_cz: string;
    excerpt_sk: string;
    excerpt_en: string;
    excerpt_cz: string;
    content_sk: string;
    content_en: string;
    content_cz: string;
    category: string;
    author: string;
    read_time: string;
    image: string;
    video_url: string;
    meta_title_sk: string;
    meta_title_en: string;
    meta_title_cz: string;
    meta_description_sk: string;
    meta_description_en: string;
    meta_description_cz: string;
    featured: boolean;
    publish_status: string;
}

interface BlogFormProps {
    initialData?: BlogPostRecord;
}

const DEFAULT_CATEGORIES = [
    "Investície",
    "Sprievodca",
    "Cestovanie",
    "Praktické rady",
    "Dizajn",
    "Novinky",
    "Tipy a triky",
];

// ============================================
// COMPONENT
// ============================================

export default function BlogForm({ initialData }: BlogFormProps) {
    const router = useRouter();
    const isEditMode = !!initialData;
    const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    const [activeTab, setActiveTab] = useState("content");
    const [uploading, setUploading] = useState(false);
    const [translating, setTranslating] = useState(false);

    const [form, setForm] = useState<BlogFormData>({
        title_sk: initialData?.title_sk || "",
        title_en: initialData?.title_en || "",
        title_cz: initialData?.title_cz || "",
        excerpt_sk: initialData?.excerpt_sk || "",
        excerpt_en: initialData?.excerpt_en || "",
        excerpt_cz: initialData?.excerpt_cz || "",
        content_sk: initialData?.content_sk || "",
        content_en: initialData?.content_en || "",
        content_cz: initialData?.content_cz || "",
        category: initialData?.category || "",
        author: initialData?.author || "Relax Properties",
        read_time: String(initialData?.read_time ?? 5),
        image: initialData?.image || "",
        video_url: initialData?.video_url || "",
        meta_title_sk: initialData?.meta_title_sk || "",
        meta_title_en: initialData?.meta_title_en || "",
        meta_title_cz: initialData?.meta_title_cz || "",
        meta_description_sk: initialData?.meta_description_sk || "",
        meta_description_en: initialData?.meta_description_en || "",
        meta_description_cz: initialData?.meta_description_cz || "",
        featured: initialData?.featured ?? false,
        publish_status: initialData?.publish_status || "draft",
    });

    // ============================================
    // BUILD PAYLOAD
    // ============================================

    const buildPayload = useCallback(() => {
        return {
            title_sk: form.title_sk,
            title_en: form.title_en || null,
            title_cz: form.title_cz || null,
            excerpt_sk: form.excerpt_sk || null,
            excerpt_en: form.excerpt_en || null,
            excerpt_cz: form.excerpt_cz || null,
            content_sk: form.content_sk || null,
            content_en: form.content_en || null,
            content_cz: form.content_cz || null,
            category: form.category,
            author: form.author,
            read_time: parseInt(form.read_time) || 5,
            image: form.image,
            meta_title_sk: form.meta_title_sk || null,
            meta_title_en: form.meta_title_en || null,
            meta_title_cz: form.meta_title_cz || null,
            meta_description_sk: form.meta_description_sk || null,
            meta_description_en: form.meta_description_en || null,
            meta_description_cz: form.meta_description_cz || null,
            featured: form.featured,
            publish_status: form.publish_status,
            video_url: form.video_url || null,
        };
    }, [form]);

    // ============================================
    // AUTO-TRANSLATE (matches PropertyForm pattern)
    // ============================================

    const translateFields = async (payload: Record<string, unknown>) => {
        const translatableFields = [
            'title_sk', 'excerpt_sk', 'content_sk',
            'meta_title_sk', 'meta_description_sk'
        ];
        const textsToTranslate = translatableFields.map(f => (payload[f] as string) || '');

        // Translate to EN
        try {
            const enRes = await fetch('/api/admin/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts: textsToTranslate, targetLang: 'EN' }),
            });
            if (enRes.ok) {
                const { translations } = await enRes.json();
                payload.title_en = translations[0] || null;
                payload.excerpt_en = translations[1] || null;
                payload.content_en = translations[2] || null;
                payload.meta_title_en = translations[3] || null;
                payload.meta_description_en = translations[4] || null;
            }
        } catch (e) { console.error('EN translation failed:', e); }

        // Translate to CZ (Czech = CS in DeepL)
        try {
            const czRes = await fetch('/api/admin/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts: textsToTranslate, targetLang: 'CS' }),
            });
            if (czRes.ok) {
                const { translations } = await czRes.json();
                payload.title_cz = translations[0] || null;
                payload.excerpt_cz = translations[1] || null;
                payload.content_cz = translations[2] || null;
                payload.meta_title_cz = translations[3] || null;
                payload.meta_description_cz = translations[4] || null;
            }
        } catch (e) { console.error('CZ translation failed:', e); }

        return payload;
    };

    // ============================================
    // AUTO-SAVE (debounced, edit mode only)
    // ============================================

    useEffect(() => {
        if (!isEditMode) return;

        if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

        autoSaveTimeout.current = setTimeout(async () => {
            try {
                setSaveStatus("Ukladám...");
                const payload = buildPayload();
                const res = await fetch(`/api/admin/blog/${initialData.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (res.ok) {
                    setSaveStatus("Uložené");
                    setTimeout(() => setSaveStatus(""), 2000);
                }
            } catch {
                setSaveStatus("Chyba pri ukladaní");
            }
        }, 1500);

        return () => {
            if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
        };
    }, [form, isEditMode, initialData?.id, buildPayload]);

    // ============================================
    // ACTIONS
    // ============================================

    const handleCreate = async () => {
        setSaving(true);
        try {
            const payload = buildPayload();
            const res = await fetch("/api/admin/blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to create");
            const data = await res.json();
            router.push(`/admin/blog/${data.post.id}/edit`);
        } catch (err: any) {
            alert("Chyba pri vytváraní článku: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setSaving(true);
        try {
            const payload: Record<string, unknown> = buildPayload();

            // Auto-translate when publishing (matches PropertyForm)
            setTranslating(true);
            setSaveStatus("Prekladám do EN + CZ...");
            await translateFields(payload);
            setTranslating(false);

            const url = isEditMode
                ? `/api/admin/blog/${initialData.id}`
                : "/api/admin/blog";
            const method = isEditMode ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, save_mode: "publish" }),
            });

            if (!res.ok) throw new Error("Failed to publish");

            const data = await res.json();
            if (!isEditMode) {
                router.push(`/admin/blog/${data.post.id}/edit`);
            } else {
                // Update form with translated values
                setForm(prev => ({
                    ...prev,
                    publish_status: "published",
                    title_en: (payload.title_en as string) || prev.title_en,
                    title_cz: (payload.title_cz as string) || prev.title_cz,
                    excerpt_en: (payload.excerpt_en as string) || prev.excerpt_en,
                    excerpt_cz: (payload.excerpt_cz as string) || prev.excerpt_cz,
                    content_en: (payload.content_en as string) || prev.content_en,
                    content_cz: (payload.content_cz as string) || prev.content_cz,
                    meta_title_en: (payload.meta_title_en as string) || prev.meta_title_en,
                    meta_title_cz: (payload.meta_title_cz as string) || prev.meta_title_cz,
                    meta_description_en: (payload.meta_description_en as string) || prev.meta_description_en,
                    meta_description_cz: (payload.meta_description_cz as string) || prev.meta_description_cz,
                }));
                setSaveStatus("Publikované + preložené ✓");
                setTimeout(() => setSaveStatus(""), 3000);
            }
        } catch (err: any) {
            alert("Chyba pri publikovaní: " + err.message);
        } finally {
            setSaving(false);
            setTranslating(false);
        }
    };

    // ============================================
    // MANUAL TRANSLATE (for Translations tab)
    // ============================================

    const handleManualTranslate = async (targetLang: "en" | "cz") => {
        setTranslating(true);
        setSaveStatus(`Prekladám do ${targetLang === "en" ? "EN" : "CZ"}...`);
        try {
            const texts = [form.title_sk, form.excerpt_sk, form.content_sk];
            const res = await fetch("/api/admin/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texts, targetLang: targetLang === "cz" ? "CS" : "EN" }),
            });
            if (res.ok) {
                const { translations } = await res.json();
                setForm(prev => ({
                    ...prev,
                    [`title_${targetLang}`]: translations[0] || "",
                    [`excerpt_${targetLang}`]: translations[1] || "",
                    [`content_${targetLang}`]: translations[2] || "",
                }));
                setSaveStatus(`Preložené do ${targetLang === "en" ? "angličtiny" : "češtiny"} ✓`);
                setTimeout(() => setSaveStatus(""), 2000);
            }
        } catch (err) {
            console.error("Translation error:", err);
            alert("Chyba pri preklade");
        } finally {
            setTranslating(false);
        }
    };

    // ============================================
    // IMAGE UPLOAD
    // ============================================

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            setForm(prev => ({ ...prev, image: data.url }));
        } catch (err) {
            console.error("Upload error:", err);
            alert("Chyba pri nahrávaní obrázka");
        } finally {
            setUploading(false);
        }
    };

    // ============================================
    // HELPERS
    // ============================================

    const updateField = (field: keyof BlogFormData, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const tabs = [
        { key: "content", label: "Obsah", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
        { key: "image", label: "Obrázok", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M18 13.5a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" },
        { key: "translations", label: "Preklady", icon: "M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" },
        { key: "seo", label: "SEO", icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" },
    ];

    // ============================================
    // RENDER
    // ============================================

    const inputClass = "w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all";
    const labelClass = "block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2";
    const textareaClass = `${inputClass} resize-y`;

    return (
        <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between bg-white border border-[var(--color-border)] rounded-2xl px-6 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/admin/blog")}
                        className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Späť
                    </button>

                    {saveStatus && (
                        <span className={`text-xs px-3 py-1 rounded-full ${translating
                                ? "bg-blue-50 text-blue-600 border border-blue-200"
                                : "bg-[var(--color-surface)] text-[var(--color-muted)]"
                            }`}>
                            {translating && (
                                <svg className="w-3 h-3 animate-spin inline mr-1.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {saveStatus}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Featured toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={form.featured}
                            onChange={(e) => updateField("featured", e.target.checked)}
                            className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                        />
                        <span className="text-xs font-medium text-[var(--color-muted)]">★ Odporúčané</span>
                    </label>

                    {!isEditMode ? (
                        <>
                            <button
                                onClick={handleCreate}
                                disabled={saving || !form.title_sk}
                                className="px-5 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] text-sm font-medium rounded-xl hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
                            >
                                Uložiť koncept
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={saving || translating || !form.title_sk}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
                            >
                                {translating ? "Prekladám..." : "Publikovať"}
                            </button>
                        </>
                    ) : (
                        <>
                            {form.publish_status !== "published" && (
                                <button
                                    onClick={handlePublish}
                                    disabled={saving || translating}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {translating ? "Prekladám..." : saving ? "Publikujem..." : "Publikovať"}
                                </button>
                            )}
                            {form.publish_status === "published" && (
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        Publikované
                                    </span>
                                    <button
                                        onClick={handlePublish}
                                        disabled={saving || translating}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {translating ? "Prekladám..." : "Znovu publikovať"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-white border border-[var(--color-border)] rounded-2xl p-1.5 shadow-sm">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all flex-1 justify-center ${activeTab === tab.key
                                ? "bg-[var(--color-primary)] text-white shadow-sm"
                                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface)]"
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                        </svg>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 md:p-8 shadow-sm">

                {/* ===== CONTENT TAB ===== */}
                {activeTab === "content" && (
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>Názov článku (SK) *</label>
                            <input
                                type="text"
                                value={form.title_sk}
                                onChange={(e) => updateField("title_sk", e.target.value)}
                                placeholder="Zadajte názov článku..."
                                className={inputClass}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Kategória</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => updateField("category", e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Vyberte kategóriu</option>
                                    {DEFAULT_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Autor</label>
                                <input
                                    type="text"
                                    value={form.author}
                                    onChange={(e) => updateField("author", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Čas čítania (min)</label>
                                <input
                                    type="number"
                                    value={form.read_time}
                                    onChange={(e) => updateField("read_time", e.target.value)}
                                    min={1}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Perex / Úryvok (SK)</label>
                            <textarea
                                value={form.excerpt_sk}
                                onChange={(e) => updateField("excerpt_sk", e.target.value)}
                                placeholder="Krátky úryvok zobrazený v náhľade článku..."
                                rows={3}
                                className={textareaClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Obsah článku (SK)</label>
                            <TipTapEditor
                                content={form.content_sk}
                                onChange={(html) => updateField("content_sk", html)}
                                placeholder="Začnite písať obsah článku..."
                            />
                            <p className="text-[11px] text-[var(--color-muted)] mt-1.5">
                                Používajte panel nástrojov pre nadpisy, formátovanie textu, zoznamy a odkazy
                            </p>
                        </div>
                    </div>
                )}

                {/* ===== IMAGE TAB ===== */}
                {activeTab === "image" && (
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>Titulný obrázok</label>
                            {form.image ? (
                                <div className="space-y-4">
                                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[var(--color-border)]">
                                        <img
                                            src={form.image}
                                            alt="Cover"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => updateField("image", "")}
                                            className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={form.image}
                                        onChange={(e) => updateField("image", e.target.value)}
                                        placeholder="URL obrázka"
                                        className={inputClass}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-2xl p-12 cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-all">
                                        {uploading ? (
                                            <svg className="w-8 h-8 animate-spin text-[var(--color-primary)] mb-3" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-10 h-10 text-[var(--color-muted)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M18 13.5a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" />
                                            </svg>
                                        )}
                                        <p className="text-sm text-[var(--color-muted)]">
                                            {uploading ? "Nahrávam..." : "Kliknite pre nahranie obrázka"}
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    <div className="text-center text-xs text-[var(--color-muted)]">alebo</div>
                                    <input
                                        type="text"
                                        value={form.image}
                                        onChange={(e) => updateField("image", e.target.value)}
                                        placeholder="Vložte URL obrázka..."
                                        className={inputClass}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Video URL */}
                        <div>
                            <label className={labelClass}>Video URL (YouTube/Vimeo)</label>
                            <input
                                type="url"
                                value={form.video_url || ""}
                                onChange={(e) => updateField("video_url", e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className={inputClass}
                            />
                        </div>
                    </div>
                )}

                {/* ===== TRANSLATIONS TAB ===== */}
                {activeTab === "translations" && (
                    <div className="space-y-8">
                        {/* Auto-translate info */}
                        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-blue-800">Automatický preklad</p>
                                <p className="text-xs text-blue-600 mt-1">Preklady sa vytvoria automaticky pri publikovaní. Tu ich môžete manuálne upraviť alebo preložiť vopred.</p>
                            </div>
                        </div>

                        {/* English */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                                    🇬🇧 Angličtina
                                </h3>
                                <button
                                    onClick={() => handleManualTranslate("en")}
                                    disabled={translating || !form.title_sk}
                                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
                                >
                                    {translating ? (
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                                        </svg>
                                    )}
                                    Preložiť zo SK
                                </button>
                            </div>
                            <div className="space-y-4 pl-4 border-l-2 border-[var(--color-border)]">
                                <div>
                                    <label className={labelClass}>Názov (EN)</label>
                                    <input type="text" value={form.title_en} onChange={(e) => updateField("title_en", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Perex (EN)</label>
                                    <textarea value={form.excerpt_en} onChange={(e) => updateField("excerpt_en", e.target.value)} rows={2} className={textareaClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Obsah (EN)</label>
                                    <TipTapEditor
                                        content={form.content_en}
                                        onChange={(html) => updateField("content_en", html)}
                                        placeholder="English content..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Czech */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                                    🇨🇿 Čeština
                                </h3>
                                <button
                                    onClick={() => handleManualTranslate("cz")}
                                    disabled={translating || !form.title_sk}
                                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
                                >
                                    {translating ? (
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                                        </svg>
                                    )}
                                    Preložiť zo SK
                                </button>
                            </div>
                            <div className="space-y-4 pl-4 border-l-2 border-[var(--color-border)]">
                                <div>
                                    <label className={labelClass}>Názov (CZ)</label>
                                    <input type="text" value={form.title_cz} onChange={(e) => updateField("title_cz", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Perex (CZ)</label>
                                    <textarea value={form.excerpt_cz} onChange={(e) => updateField("excerpt_cz", e.target.value)} rows={2} className={textareaClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Obsah (CZ)</label>
                                    <TipTapEditor
                                        content={form.content_cz}
                                        onChange={(html) => updateField("content_cz", html)}
                                        placeholder="Český obsah..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== SEO TAB ===== */}
                {activeTab === "seo" && (
                    <div className="space-y-8">
                        {/* SK SEO */}
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2 mb-4">
                                🇸🇰 SEO — Slovenčina
                            </h3>
                            <div className="space-y-4 pl-4 border-l-2 border-[var(--color-border)]">
                                <div>
                                    <label className={labelClass}>Meta názov</label>
                                    <input type="text" value={form.meta_title_sk} onChange={(e) => updateField("meta_title_sk", e.target.value)} placeholder={form.title_sk || "Meta názov stránky"} className={inputClass} />
                                    <p className="text-[11px] text-[var(--color-muted)] mt-1">{(form.meta_title_sk || form.title_sk).length}/60 znakov</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Meta popis</label>
                                    <textarea value={form.meta_description_sk} onChange={(e) => updateField("meta_description_sk", e.target.value)} placeholder={form.excerpt_sk || "Meta popis stránky"} rows={2} className={textareaClass} />
                                    <p className="text-[11px] text-[var(--color-muted)] mt-1">{(form.meta_description_sk || form.excerpt_sk || "").length}/160 znakov</p>
                                </div>
                            </div>
                        </div>

                        {/* EN SEO */}
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2 mb-4">
                                🇬🇧 SEO — English
                            </h3>
                            <div className="space-y-4 pl-4 border-l-2 border-[var(--color-border)]">
                                <div>
                                    <label className={labelClass}>Meta Title</label>
                                    <input type="text" value={form.meta_title_en} onChange={(e) => updateField("meta_title_en", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Meta Description</label>
                                    <textarea value={form.meta_description_en} onChange={(e) => updateField("meta_description_en", e.target.value)} rows={2} className={textareaClass} />
                                </div>
                            </div>
                        </div>

                        {/* CZ SEO */}
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2 mb-4">
                                🇨🇿 SEO — Čeština
                            </h3>
                            <div className="space-y-4 pl-4 border-l-2 border-[var(--color-border)]">
                                <div>
                                    <label className={labelClass}>Meta názov</label>
                                    <input type="text" value={form.meta_title_cz} onChange={(e) => updateField("meta_title_cz", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Meta popis</label>
                                    <textarea value={form.meta_description_cz} onChange={(e) => updateField("meta_description_cz", e.target.value)} rows={2} className={textareaClass} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                            <p className="text-xs text-blue-600">SEO meta polia pre EN a CZ sa automaticky preložia pri publikovaní, ak sú vyplnené SK verzie.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
