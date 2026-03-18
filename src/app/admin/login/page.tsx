"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/admin");
                router.refresh();
            } else {
                setError("Nesprávne heslo");
            }
        } catch {
            setError("Chyba pripojenia");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
            <div className="w-full max-w-sm">
                {/* Logo / Brand */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-white border border-[var(--color-border)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <img src="/admin-logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--color-secondary)] font-serif mb-2">
                        Relax Properties
                    </h1>
                    <p className="text-sm font-medium text-[var(--color-muted)] uppercase tracking-wider">Administračný panel</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[var(--color-border)] p-8 shadow-sm">
                    <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-2">
                        Heslo administrátora
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Zadajte heslo..."
                        className="w-full px-5 py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm"
                        autoFocus
                    />

                    {error && (
                        <p className="mt-4 text-sm font-semibold text-red-500 flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full mt-6 px-5 py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                        {loading ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            "Vstúpiť do panela"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
