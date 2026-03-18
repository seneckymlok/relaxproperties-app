'use client';

import { useState } from 'react';

interface SyncResult {
    success: boolean;
    propertiesCount?: number;
    softrealStatus?: number;
    softrealResponse?: string;
    syncedAt?: string;
    error?: string;
}

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={copy}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-lg transition-colors"
        >
            {copied ? (
                <>
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Skopírované
                </>
            ) : (
                <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                    Kopírovať
                </>
            )}
        </button>
    );
}

function FeedRow({ label, url, badge }: { label: string; url: string; badge: string }) {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-[var(--color-foreground)]">{label}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[#E5F0F0] text-[var(--color-primary)] rounded-full uppercase tracking-wide">{badge}</span>
                </div>
                <p className="text-xs text-[var(--color-muted)] font-mono truncate">{url}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-lg transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Otvoriť
                </a>
                <CopyButton value={url} />
            </div>
        </div>
    );
}

export default function SyncDashboard() {
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState<SyncResult | null>(null);

    const triggerCzechSync = async () => {
        setSyncing(true);
        setResult(null);
        try {
            const res = await fetch('/api/admin/sync/czech', { method: 'POST' });
            const data = await res.json();
            setResult(data);
        } catch {
            setResult({ success: false, error: 'Sieťová chyba pri pripájaní na Softreal.' });
        } finally {
            setSyncing(false);
        }
    };

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://relaxproperties.sk';

    return (
        <div className="space-y-5">
            {/* Slovak Feeds */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-[#E5F0F0] flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 3.75 3.75 0 0 1 3.827 5.099A4.5 4.5 0 0 1 17.25 19.5H6.75Z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Slovenský export — pull feedy</h3>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">Portály si sami sťahujú dáta z týchto URL adries</p>
                    </div>
                </div>

                <div>
                    <FeedRow
                        label="JSON Feed"
                        url={`${baseUrl}/json-loading-properties/`}
                        badge="JSON"
                    />
                    <FeedRow
                        label="XML Feed (RealSoft v1)"
                        url={`${baseUrl}/api/export/xml`}
                        badge="XML"
                    />
                </div>
            </div>

            {/* Czech Softreal Sync */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-[#FEF3E2] flex items-center justify-center flex-shrink-0">
                        <svg className="w-4.5 h-4.5 text-[#B8976A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Český export — push sync (Softreal)</h3>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">Odošle všetky publikované nehnuteľnosti do systému softreal.cz</p>
                    </div>
                </div>

                <div className="mb-4 p-3.5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-muted)] font-mono break-all">
                        POST → s1.system.softreal.cz/relaxproperties/softreal/publicImportApi/importXml/&#123;key&#125;
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={triggerCzechSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-colors shadow-sm"
                    >
                        {syncing ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Synchronizujem...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                Synchronizovať teraz
                            </>
                        )}
                    </button>

                    {result && (
                        <div className={`flex items-center gap-2 text-sm font-medium ${result.success ? 'text-green-700' : 'text-red-600'}`}>
                            {result.success ? (
                                <>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    Odoslaných {result.propertiesCount} nehnuteľností
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                    </svg>
                                    {result.error ?? `Chyba: HTTP ${result.softrealStatus}`}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {result && !result.success && result.softrealResponse && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-1">Odpoveď Softreal servera:</p>
                        <pre className="text-xs text-red-600 whitespace-pre-wrap break-all font-mono">{result.softrealResponse}</pre>
                    </div>
                )}

                {result?.success && result.softrealResponse && (
                    <details className="mt-3">
                        <summary className="text-xs text-[var(--color-muted)] cursor-pointer hover:text-[var(--color-foreground)]">Zobraziť odpoveď Softreal</summary>
                        <pre className="mt-2 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xs font-mono whitespace-pre-wrap break-all">{result.softrealResponse}</pre>
                    </details>
                )}
            </div>
        </div>
    );
}
