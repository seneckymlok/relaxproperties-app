export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
            <div className="flex flex-col items-center gap-4">
                <svg className="w-10 h-10 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        </div>
    );
}
