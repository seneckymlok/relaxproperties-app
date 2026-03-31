"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { PropertyRecord, PropertyImage } from "@/lib/property-store";
import type { GeoData } from "@/components/admin/AdminMapPicker";
import ImageUploader from "@/components/admin/ImageUploader";

const AdminMapPicker = dynamic(() => import("@/components/admin/AdminMapPicker"), { ssr: false });

// ============================================
// TYPES
// ============================================

interface PropertyFormData {
    // Basic Info
    title_sk: string;
    property_type: string;
    status: string;
    ownership: string;
    disposition: string;
    price: string;
    price_on_request: boolean;
    available_from: string;
    property_id_external: string;
    featured: boolean;

    // Location
    country: string;
    city: string;
    location_sk: string;
    location_type: string;
    distance_from_sea: string;
    latitude: string;
    longitude: string;
    map_zoom: string;

    // Specs
    beds: string;
    baths: string;
    area: string;
    land_area: string;
    floors: string;
    floor_number: string;
    year: string;
    parking: string;

    // Price
    offer_type: string;
    unit: string;

    // Building
    house_type: string;
    building_type: string;

    // Features
    pool: boolean;
    balcony: boolean;
    garden: boolean;
    sea_view: boolean;
    first_line: boolean;
    new_build: boolean;
    new_project: boolean;
    luxury: boolean;
    golf: boolean;
    mountains: boolean;

    // Additional amenities
    lodzia: boolean;
    terasa: boolean;
    cellar: boolean;
    garage: boolean;
    parking_spot: boolean;
    fireplace: boolean;
    near_airport: boolean;
    billiard_room: boolean;
    near_beach: boolean;
    near_golf: boolean;
    yoga_room: boolean;
    grand_garden: boolean;

    // Media
    images: { url: string; alt: string; order: number }[];
    hero_image_index: number;
    video_url: string;
    pdf_images: number[];

    // Description & SEO
    description_sk: string;
    location_description_sk: string;
    meta_title_sk: string;
    meta_description_sk: string;
    tags: string[];
    preview_tags: string[];

    // Publishing
    publish_status: string;

    // Export
    export_target: string;
}

interface PropertyFormProps {
    initialData?: PropertyRecord;
    mode: "create" | "edit";
}

// ============================================
// CONSTANTS
// ============================================

const COUNTRY_OPTIONS = [
    { value: "bulgaria", label: "Bulharsko" },
    { value: "croatia", label: "Chorvátsko" },
    { value: "spain", label: "Španielsko" },
    { value: "greece", label: "Grécko" },
    { value: "slovakia", label: "Slovensko" },
    { value: "italy", label: "Taliansko" },
];

const TYPE_OPTIONS = [
    { value: "studio_apartment_flat", label: "Štúdio / Apartmán / Byt" },
    { value: "family_house_villa", label: "Rodinný dom / Vila" },
    { value: "luxury_property", label: "Luxusná nehnuteľnosť" },
];

const STATUS_OPTIONS = [
    { value: "", label: "— Nezadané —" },
    { value: "novostavba", label: "Novostavba" },
    { value: "povodny_stav", label: "Pôvodný stav" },
    { value: "po_vystavbe", label: "Po výstavbe" },
    { value: "po_rekonstrukcii", label: "Po rekonštrukcii" },
    { value: "vo_faze_projektovania", label: "Vo fáze projektovania" },
];

const OWNERSHIP_OPTIONS = [
    { value: "", label: "— Nezadané —" },
    { value: "osobne", label: "Osobné" },
    { value: "druzstevne", label: "Družstevné" },
    { value: "statna_vseobecna", label: "Štátna / Všeobecná" },
    { value: "podielove", label: "Podielové" },
];

const DISPOSITION_OPTIONS = [
    { value: "", label: "— Nezadané —" },
    { value: "studio", label: "Štúdiový apartmán" },
    { value: "2kk", label: "Dvojizbový apartmán (2+kk)" },
    { value: "3kk", label: "Trojizbový apartmán (3+kk)" },
    { value: "4kk", label: "Štvorizbový apartmán (4+kk)" },
    { value: "5kk", label: "Piatich a viac izbový apartmán" },
];

const LOCATION_TYPE_OPTIONS = [
    { value: "", label: "— Nezadané —" },
    { value: "pri_mori", label: "Pri mori" },
    { value: "na_horach", label: "Na horách" },
    { value: "ostatne", label: "Ostatné" },
];

const UNIT_OPTIONS = [
    { value: "per_property", label: "Za nemovitosť" },
    { value: "per_m2", label: "Za m²" },
];

const HOUSE_TYPE_OPTIONS = [
    { value: "", label: "— Nezadané —" },
    { value: "prizemi", label: "Prízemí" },
    { value: "patrovy", label: "Patrový" },
];

const BUILDING_TYPE_OPTIONS = [
    { value: "", label: "— Nezadané —" },
    { value: "drevena", label: "Drevená" },
    { value: "tehlova", label: "Tehlová" },
    { value: "kamenna", label: "Kamenná" },
    { value: "montovana", label: "Montovaná" },
    { value: "panelova", label: "Panelová" },
    { value: "skeletova", label: "Skeletová" },
    { value: "zmiesana", label: "Zmiešaná" },
];

// ============================================
// FORM COMPONENTS
// ============================================

const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false, suffix = "", helpText = "" }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; suffix?: string; helpText?: string;
}) => (
    <div>
        <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm"
            />
            {suffix && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-muted)]">{suffix}</span>
            )}
        </div>
        {helpText && <p className="text-[11px] text-[var(--color-muted)] mt-1.5 font-medium">{helpText}</p>}
    </div>
);

const Select = ({ label, value, onChange, options, required = false }: {
    label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean;
}) => (
    <div>
        <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all appearance-none cursor-pointer shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em]"
        >
            {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    </div>
);

const Toggle = ({ label, checked, onChange, description = "", fullWidth = false, gapClass = "" }: {
    label: string; checked: boolean; onChange: (v: boolean) => void; description?: string; fullWidth?: boolean; gapClass?: string;
}) => (
    <label className={`flex items-center justify-between py-2 cursor-pointer group ${fullWidth ? 'w-full' : ''} ${gapClass}`}>
        <div>
            <span className="text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] font-medium transition-colors">{label}</span>
            {description && <p className="text-[11px] text-[var(--color-muted)] mt-0.5">{description}</p>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 border ${checked ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "bg-[var(--color-surface)] border-[var(--color-border)]"}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full shadow-sm transition-transform ${checked ? "translate-x-6 bg-white" : "translate-x-0 bg-[var(--color-muted)]"}`} style={{ height: '1.125rem', width: '1.125rem' }} />
        </button>
    </label>
);

const CollapsibleSection = ({ title, children, defaultOpen = true }: {
    title: string; children: React.ReactNode; defaultOpen?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[var(--color-surface)] transition-colors"
            >
                <span className="text-sm font-semibold text-[var(--color-secondary)]">{title}</span>
                <svg className={`w-5 h-5 text-[var(--color-muted)] transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-[var(--color-border)]">
                    {children}
                </div>
            )}
        </div>
    );
};

const Checkbox = ({ label, checked, onChange }: {
    label: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
    <label className="flex items-center gap-2.5 cursor-pointer group min-w-[180px]">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer accent-[var(--color-primary)]"
        />
        <span className="text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">{label}</span>
    </label>
);

// ============================================
// COMPONENT
// ============================================

export default function PropertyForm({ initialData, mode }: PropertyFormProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("basic");
    const [saving, setSaving] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [generatingSEO, setGeneratingSEO] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [draftId, setDraftId] = useState<string | null>(initialData?.id || null);
    const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [isDirty, setIsDirty] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Initialize form data
    const [form, setForm] = useState<PropertyFormData>(() => {
        if (initialData) {
            // If the property has pending draft edits, merge them over the published data
            const d = initialData.draft_data
                ? { ...initialData, ...(initialData.draft_data as Record<string, unknown>) }
                : initialData;

            return {
                title_sk: (d.title_sk as string) || "",
                property_type: (d.property_type as string) || "studio_apartment_flat",
                status: (d.status as string) || "",
                ownership: (d.ownership as string) || "",
                disposition: (d.disposition as string) || "",
                price: d.price?.toString() || "",
                price_on_request: (d.price_on_request as boolean) || false,
                available_from: (d.available_from as string) || "",
                property_id_external: (d.property_id_external as string) || "",
                featured: (d.featured as boolean) || false,
                country: (d.country as string) || "bulgaria",
                city: (d.city as string) || "",
                location_sk: (d.location_sk as string) || "",
                location_type: (d.location_type as string) || "",
                distance_from_sea: d.distance_from_sea?.toString() || "",
                latitude: d.latitude?.toString() || "",
                longitude: d.longitude?.toString() || "",
                map_zoom: d.map_zoom?.toString() || "14",
                beds: d.beds?.toString() || "",
                baths: d.baths?.toString() || "",
                area: d.area?.toString() || "",
                land_area: d.land_area?.toString() || "",
                floors: d.floors?.toString() || "1",
                floor_number: d.floor_number?.toString() || "1",
                year: d.year?.toString() || "",
                parking: d.parking?.toString() || "0",
                offer_type: (d.offer_type as string) || "sale",
                unit: (d.unit as string) || "per_property",
                house_type: (d.house_type as string) || "",
                building_type: (d.building_type as string) || "",
                pool: (d.pool as boolean) || false,
                balcony: (d.balcony as boolean) || false,
                garden: (d.garden as boolean) || false,
                sea_view: (d.sea_view as boolean) || false,
                first_line: (d.first_line as boolean) || false,
                new_build: (d.new_build as boolean) || false,
                new_project: (d.new_project as boolean) || false,
                luxury: (d.luxury as boolean) || false,
                golf: (d.golf as boolean) || false,
                mountains: (d.mountains as boolean) || false,
                lodzia: (d.lodzia as boolean) || false,
                terasa: (d.terasa as boolean) || false,
                cellar: (d.cellar as boolean) || false,
                garage: (d.garage as boolean) || false,
                parking_spot: (d.parking_spot as boolean) || false,
                fireplace: (d.fireplace as boolean) || false,
                near_airport: (d.near_airport as boolean) || false,
                billiard_room: (d.billiard_room as boolean) || false,
                near_beach: (d.near_beach as boolean) || false,
                near_golf: (d.near_golf as boolean) || false,
                yoga_room: (d.yoga_room as boolean) || false,
                grand_garden: (d.grand_garden as boolean) || false,
                images: (d.images as PropertyImage[]) || [],
                hero_image_index: (d.hero_image_index as number) ?? 0,
                video_url: (d.video_url as string) || "",
                pdf_images: (d.pdf_images as number[]) || [],
                description_sk: (d.description_sk as string) || "",
                location_description_sk: (d.location_description_sk as string) || "",
                meta_title_sk: (d.meta_title_sk as string) || "",
                meta_description_sk: (d.meta_description_sk as string) || "",
                tags: (d.tags as string[]) || [],
                preview_tags: (d.preview_tags as string[]) || [],
                publish_status: initialData.publish_status || "draft",
                export_target: (d.export_target as string) || "",
            };
        }
        return {
            title_sk: "", property_type: "studio_apartment_flat", status: "", ownership: "",
            disposition: "", price: "", price_on_request: false, available_from: "",
            property_id_external: "", featured: false, country: "bulgaria", city: "",
            location_sk: "", location_type: "", distance_from_sea: "", beds: "", baths: "", area: "",
            land_area: "", floors: "1", floor_number: "1", year: "", parking: "0",
            offer_type: "sale", unit: "per_property", house_type: "", building_type: "",
            pool: false, balcony: false, garden: false, sea_view: false, first_line: false,
            new_build: false, new_project: false, luxury: false, golf: false,
            mountains: false, lodzia: false, terasa: false, cellar: false, garage: false,
            parking_spot: false, fireplace: false, near_airport: false, billiard_room: false,
            near_beach: false, near_golf: false, yoga_room: false, grand_garden: false,
            images: [], hero_image_index: 0, video_url: "", pdf_images: [], description_sk: "", location_description_sk: "",
            meta_title_sk: "", meta_description_sk: "", tags: [], preview_tags: [], publish_status: "draft",
            latitude: "", longitude: "", map_zoom: "14", export_target: "",
        };
    });

    // ============================================
    // AUTO-SAVE (DATABASE)
    // ============================================

    useEffect(() => {
        if (!isDirty) return;

        // Skip saving if the form is completely empty
        if (!form.title_sk.trim() && !form.city.trim() && form.images.length === 0) return;

        const timer = setTimeout(async () => {
            setAutoSaveStatus("saving");

            const payload = {
                title_sk: form.title_sk || "Nový koncept (nepomenovaný)",
                property_type: form.property_type,
                status: form.status || null,
                ownership: form.ownership || null,
                disposition: form.disposition || null,
                price: parseInt(form.price) || 0,
                price_on_request: form.price_on_request,
                available_from: form.available_from || null,
                property_id_external: form.property_id_external || null,
                featured: form.featured,
                country: form.country,
                city: form.city || "Nezadané",
                location_sk: form.location_sk || "Nezadané",
                distance_from_sea: form.distance_from_sea ? parseInt(form.distance_from_sea) : null,
                beds: parseInt(form.beds) || 0,
                baths: parseInt(form.baths) || 0,
                area: parseInt(form.area) || 0,
                floors: form.floors ? parseInt(form.floors) : null,
                floor_number: form.floor_number ? parseInt(form.floor_number) : null,
                year: form.year ? parseInt(form.year) : null,
                parking: parseInt(form.parking) || 0,
                pool: form.pool,
                balcony: form.balcony,
                garden: form.garden,
                sea_view: form.sea_view,
                first_line: form.first_line,
                new_build: form.new_build,
                new_project: form.new_project,
                luxury: form.luxury,
                golf: form.golf,
                mountains: form.mountains,
                lodzia: form.lodzia,
                terasa: form.terasa,
                cellar: form.cellar,
                garage: form.garage,
                parking_spot: form.parking_spot,
                fireplace: form.fireplace,
                near_airport: form.near_airport,
                billiard_room: form.billiard_room,
                near_beach: form.near_beach,
                near_golf: form.near_golf,
                yoga_room: form.yoga_room,
                grand_garden: form.grand_garden,
                location_type: form.location_type || null,
                offer_type: form.offer_type,
                unit: form.unit,
                house_type: form.house_type || null,
                building_type: form.building_type || null,
                land_area: form.land_area ? parseFloat(form.land_area) : null,
                images: form.images,
                hero_image_index: form.hero_image_index,
                pdf_images: form.pdf_images,
                description_sk: form.description_sk || null,
                location_description_sk: form.location_description_sk || null,
                meta_title_sk: form.meta_title_sk || null,
                meta_description_sk: form.meta_description_sk || null,
                tags: form.tags,
                preview_tags: form.preview_tags,
                latitude: form.latitude ? parseFloat(form.latitude) : null,
                longitude: form.longitude ? parseFloat(form.longitude) : null,
                map_zoom: form.map_zoom ? parseInt(form.map_zoom) : 14,
                export_target: form.export_target || null,
                video_url: form.video_url || null,
                save_mode: "auto",
            };

            try {
                const url = draftId ? `/api/admin/properties/${draftId}` : "/api/admin/properties";
                const method = draftId ? "PUT" : "POST";

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.property?.id && !draftId) {
                        setDraftId(data.property.id);
                        window.history.replaceState(null, '', `/admin/properties/${data.property.id}/edit`);
                    }
                    setAutoSaveStatus("saved");
                    setIsDirty(false);
                    setTimeout(() => setAutoSaveStatus("idle"), 3000);
                } else {
                    setAutoSaveStatus("idle");
                }
            } catch (err) {
                setAutoSaveStatus("idle");
            }
        }, 3000); // 3 seconds debounce

        return () => clearTimeout(timer);
    }, [form, draftId, isDirty]);

    // ============================================
    // HELPERS
    // ============================================

    const updateField = (field: keyof PropertyFormData, value: unknown) => {
        setIsDirty(true);
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !form.tags.includes(tag)) {
            updateField("tags", [...form.tags, tag]);
        }
        setTagInput("");
    };

    const removeTag = (tag: string) => {
        updateField("tags", form.tags.filter(t => t !== tag));
    };

    // ============================================
    // DeepL TRANSLATION
    // ============================================

    const translateFields = async (payload: Record<string, unknown>) => {
        // Collect all translatable Slovak fields
        const translatableFields = [
            'title_sk', 'description_sk', 'location_sk',
            'location_description_sk', 'meta_title_sk', 'meta_description_sk'
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
                payload.description_en = translations[1] || null;
                payload.location_en = translations[2] || null;
                payload.location_description_en = translations[3] || null;
                payload.meta_title_en = translations[4] || null;
                payload.meta_description_en = translations[5] || null;
            }
        } catch (e) { console.error('EN translation failed:', e); }

        // Translate to CZ (Czech)
        try {
            const czRes = await fetch('/api/admin/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts: textsToTranslate, targetLang: 'CS' }),
            });
            if (czRes.ok) {
                const { translations } = await czRes.json();
                payload.title_cz = translations[0] || null;
                payload.description_cz = translations[1] || null;
                payload.location_cz = translations[2] || null;
                payload.location_description_cz = translations[3] || null;
                payload.meta_title_cz = translations[4] || null;
                payload.meta_description_cz = translations[5] || null;
            }
        } catch (e) { console.error('CZ translation failed:', e); }

        return payload;
    };

    // ============================================
    // AI DESCRIPTION
    // ============================================

    const generateAIDescription = async () => {
        setGeneratingAI(true);
        setError('');

        try {
            const res = await fetch('/api/admin/ai-describe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title_sk: form.title_sk,
                    property_type: form.property_type,
                    country: form.country,
                    city: form.city,
                    location_sk: form.location_sk,
                    beds: form.beds,
                    baths: form.baths,
                    area: form.area,
                    year: form.year,
                    floors: form.floors,
                    distance_from_sea: form.distance_from_sea,
                    disposition: form.disposition,
                    pool: form.pool,
                    garden: form.garden,
                    balcony: form.balcony,
                    sea_view: form.sea_view,
                    first_line: form.first_line,
                    luxury: form.luxury,
                    golf: form.golf,
                    mountains: form.mountains,
                    new_build: form.new_build,
                    parking: form.parking,
                }),
            });

            if (res.ok) {
                const { description } = await res.json();
                updateField('description_sk', description);
            } else {
                const err = await res.json();
                setError(err.error || 'AI generovanie zlyhalo');
            }
        } catch {
            setError('Chyba pri AI generovaní');
        } finally {
            setGeneratingAI(false);
        }
    };

    // ============================================
    // AI SEO GENERATION
    // ============================================

    const generateAISEO = async () => {
        setGeneratingSEO(true);
        setError('');

        try {
            const res = await fetch('/api/admin/ai-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title_sk: form.title_sk,
                    property_type: form.property_type,
                    country: form.country,
                    city: form.city,
                    location_sk: form.location_sk,
                    description_sk: form.description_sk,
                    beds: form.beds,
                    baths: form.baths,
                    area: form.area,
                    price: form.price,
                    price_on_request: form.price_on_request,
                    distance_from_sea: form.distance_from_sea,
                    pool: form.pool,
                    garden: form.garden,
                    balcony: form.balcony,
                    sea_view: form.sea_view,
                    first_line: form.first_line,
                    luxury: form.luxury,
                    golf: form.golf,
                    mountains: form.mountains,
                    new_build: form.new_build,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setIsDirty(true);
                setForm(prev => ({
                    ...prev,
                    meta_title_sk: data.meta_title || prev.meta_title_sk,
                    meta_description_sk: data.meta_description || prev.meta_description_sk,
                    tags: data.keywords?.length > 0
                        ? [...new Set([...prev.tags, ...data.keywords])]
                        : prev.tags,
                }));
            } else {
                const err = await res.json();
                setError(err.error || 'AI SEO generovanie zlyhalo');
            }
        } catch {
            setError('Chyba pri AI SEO generovaní');
        } finally {
            setGeneratingSEO(false);
        }
    };

    // ============================================
    // FORM SUBMISSION
    // ============================================

    const handleSave = async (publishStatus?: string) => {
        setSaving(true);
        setError("");

        // Basic validation
        if (!form.title_sk.trim()) {
            setError("Názov nehnuteľnosti je povinný");
            setSaving(false);
            return;
        }
        if (!form.price && !form.price_on_request) {
            setError("Cena je povinná (alebo zaškrtnite 'cena na vyžiadanie')");
            setSaving(false);
            return;
        }

        // Build payload
        const payload = {
            title_sk: form.title_sk,
            property_type: form.property_type,
            status: form.status || null,
            ownership: form.ownership || null,
            disposition: form.disposition || null,
            price: parseInt(form.price) || 0,
            price_on_request: form.price_on_request,
            available_from: form.available_from || null,
            property_id_external: form.property_id_external || null,
            featured: form.featured,
            country: form.country,
            city: form.city,
            location_sk: form.location_sk,
            distance_from_sea: form.distance_from_sea ? parseInt(form.distance_from_sea) : null,
            beds: parseInt(form.beds) || 0,
            baths: parseInt(form.baths) || 0,
            area: parseInt(form.area) || 0,
            floors: form.floors ? parseInt(form.floors) : null,
            floor_number: form.floor_number ? parseInt(form.floor_number) : null,
            year: form.year ? parseInt(form.year) : null,
            parking: parseInt(form.parking) || 0,
            pool: form.pool,
            balcony: form.balcony,
            garden: form.garden,
            sea_view: form.sea_view,
            first_line: form.first_line,
            new_build: form.new_build,
            new_project: form.new_project,
            luxury: form.luxury,
            golf: form.golf,
            mountains: form.mountains,
            lodzia: form.lodzia,
            terasa: form.terasa,
            cellar: form.cellar,
            garage: form.garage,
            parking_spot: form.parking_spot,
            fireplace: form.fireplace,
            near_airport: form.near_airport,
            billiard_room: form.billiard_room,
            near_beach: form.near_beach,
            near_golf: form.near_golf,
            yoga_room: form.yoga_room,
            grand_garden: form.grand_garden,
            location_type: form.location_type || null,
            offer_type: form.offer_type,
            unit: form.unit,
            house_type: form.house_type || null,
            building_type: form.building_type || null,
            land_area: form.land_area ? parseFloat(form.land_area) : null,
            images: form.images,
            hero_image_index: form.hero_image_index,
            description_sk: form.description_sk || null,
            location_description_sk: form.location_description_sk || null,
            meta_title_sk: form.meta_title_sk || null,
            meta_description_sk: form.meta_description_sk || null,
            tags: form.tags,
            preview_tags: form.preview_tags,
            publish_status: publishStatus || form.publish_status,
            latitude: form.latitude ? parseFloat(form.latitude) : null,
            longitude: form.longitude ? parseFloat(form.longitude) : null,
            map_zoom: form.map_zoom ? parseInt(form.map_zoom) : 14,
            export_target: form.export_target || null,
            video_url: form.video_url || null,
            save_mode: publishStatus === 'published' ? 'publish' : undefined,
        };

        try {
            // Auto-translate when publishing
            if (publishStatus === 'published') {
                setTranslating(true);
                await translateFields(payload);
                setTranslating(false);
            }

            const usePut = !!draftId || mode === "edit";
            const url = usePut
                ? `/api/admin/properties/${draftId || initialData?.id}`
                : "/api/admin/properties";
            const method = usePut ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Chyba pri ukladaní");
            }

            router.push("/admin/properties");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Neznáma chyba");
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/admin/properties")}
                        className="p-2.5 bg-white border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface)] rounded-xl transition-colors shadow-sm flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-serif text-[var(--color-secondary)]">
                                {mode === "create" ? "Nová nehnuteľnosť" : "Upraviť nehnuteľnosť"}
                            </h1>
                            {autoSaveStatus === "saving" && (
                                <span className="text-xs font-semibold text-[var(--color-muted)] flex items-center gap-1.5 bg-[var(--color-surface)] px-2 py-1 rounded-md border border-[var(--color-border)]">
                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Ukladanie...
                                </span>
                            )}
                            {autoSaveStatus === "saved" && (
                                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Uložené v konceptoch
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-[var(--color-muted)] mt-0.5">
                            Všetky texty zadávajte v slovenčine
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                        onClick={() => handleSave("draft")}
                        disabled={saving}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 text-center shadow-sm"
                    >
                        Uložiť koncept
                    </button>
                    <button
                        onClick={() => handleSave("published")}
                        disabled={saving}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                        {saving && (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        {translating ? 'Prekladám...' : saving ? 'Ukladám...' : 'Publikovať'}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-center gap-2 font-medium">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Success Msg (For Autosave Restore) */}
            {successMsg && (
                <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 flex items-center gap-2 font-medium">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {successMsg}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1.5 overflow-x-auto shadow-sm">
                {[
                    { id: "basic", label: "Základné info" },
                    { id: "area_price", label: "Rozloha & Cena" },
                    { id: "features", label: "Vlastnosti" },
                    { id: "media", label: "Médiá" },
                    { id: "description", label: "Popis & SEO" },
                    { id: "map_export", label: "Mapa & Export" },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${activeTab === tab.id
                            ? "bg-white text-[var(--color-primary)] shadow-sm"
                            : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)]/50"
                            }`}
                    >
                        {tab.label}
                        {tab.id === "media" && isUploading && activeTab !== "media" && (
                            <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" title="Nahrávanie prebieha..." />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white border border-[var(--color-border)] rounded-3xl p-6 md:p-8 shadow-sm">

                {/* ========== TAB: ZÁKLADNÉ INFO ========== */}
                {activeTab === "basic" && (
                    <div className="space-y-5">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <Input label="ID nehnuteľnosti" value={form.property_id_external} onChange={v => updateField("property_id_external", v)} required placeholder="napr. EXT-001" />
                            <Select label="Vlastníctvo" value={form.ownership} onChange={v => updateField("ownership", v)} options={OWNERSHIP_OPTIONS} required />
                            <Input label="K dispozícii od" value={form.available_from} onChange={v => updateField("available_from", v)} type="date" required />
                            <Select label="Typ nehnuteľnosti" value={form.property_type} onChange={v => updateField("property_type", v)} options={TYPE_OPTIONS} required />
                        </div>
                        {/* Row 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <Select label="Stav" value={form.status} onChange={v => updateField("status", v)} options={STATUS_OPTIONS} required />
                            <Select label="Dispozícia" value={form.disposition} onChange={v => updateField("disposition", v)} options={DISPOSITION_OPTIONS} required />
                            <Select label="Lokalita" value={form.location_type} onChange={v => updateField("location_type", v)} options={LOCATION_TYPE_OPTIONS} />
                            <Select label="Krajina" value={form.country} onChange={v => updateField("country", v)} options={COUNTRY_OPTIONS} required />
                        </div>
                        {/* Row 3 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <Input label="Počet podlaží" value={form.floors} onChange={v => updateField("floors", v)} type="number" required />
                            <Input label="Číslo podlažia" value={form.floor_number} onChange={v => updateField("floor_number", v)} type="number" required />
                            <Input label="Počet spální" value={form.beds} onChange={v => updateField("beds", v)} type="number" required />
                            <Input label="Počet kúpeľní" value={form.baths} onChange={v => updateField("baths", v)} type="number" required />
                        </div>
                        {/* Row 4 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <Input label="Vzdialenosť od mora (m)" value={form.distance_from_sea} onChange={v => updateField("distance_from_sea", v)} type="number" required suffix="m" />
                        </div>
                    </div>
                )}

                {/* ========== TAB: ROZLOHA & CENA ========== */}
                {activeTab === "area_price" && (
                    <div className="space-y-8">
                        {/* Area */}
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Informácie o rozlohe</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Input label="Obyvateľná plocha (m²)" value={form.area} onChange={v => updateField("area", v)} type="number" required helpText="Obyvateľná / úžitná plocha" suffix="m²" />
                                <Input label="Pozemok / podlahová plocha bytu (m²)" value={form.land_area} onChange={v => updateField("land_area", v)} type="number" required helpText="Plocha pozemku / parcely / podlahová plocha bytu" suffix="m²" />
                            </div>
                        </div>

                        {/* Price */}
                        <div className="pt-6 border-t border-[var(--color-border)]">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Cenová ponuka</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                                <Input label="Cena (€)" value={form.price} onChange={v => updateField("price", v)} type="number" required={!form.price_on_request} placeholder="850000" helpText={form.price ? `Zobrazenie: € ${parseInt(form.price).toLocaleString("en-US")}` : ""} />
                                <Select label="Jednotka" value={form.unit} onChange={v => updateField("unit", v)} options={UNIT_OPTIONS} required />
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-2">
                                        Typ ponuky <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)] shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => updateField("offer_type", "sale")}
                                            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${form.offer_type === "sale" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]"}`}
                                        >
                                            Na predaj
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateField("offer_type", "rent")}
                                            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${form.offer_type === "rent" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]"}`}
                                        >
                                            Na prenájom
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Toggle label="Cena na vyžiadanie" checked={form.price_on_request} onChange={v => updateField("price_on_request", v)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== TAB: VLASTNOSTI ========== */}
                {activeTab === "features" && (
                    <div className="space-y-8">
                        {/* House & Building Type */}
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Doplňujúce informácie</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Select label="Typ domu" value={form.house_type} onChange={v => updateField("house_type", v)} options={HOUSE_TYPE_OPTIONS} required />
                                <Select label="Druh objektu" value={form.building_type} onChange={v => updateField("building_type", v)} options={BUILDING_TYPE_OPTIONS} required />
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="pt-6 border-t border-[var(--color-border)]">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Ďalšie výhody</h3>
                            <div className="flex flex-wrap gap-x-6 gap-y-3">
                                <Checkbox label="Balkón" checked={form.balcony} onChange={v => updateField("balcony", v)} />
                                <Checkbox label="Lodžia" checked={form.lodzia} onChange={v => updateField("lodzia", v)} />
                                <Checkbox label="Terasa" checked={form.terasa} onChange={v => updateField("terasa", v)} />
                                <Checkbox label="Pivnica (sklep)" checked={form.cellar} onChange={v => updateField("cellar", v)} />
                                <Checkbox label="Garáž" checked={form.garage} onChange={v => updateField("garage", v)} />
                                <Checkbox label="Parkovacie státie" checked={form.parking_spot} onChange={v => updateField("parking_spot", v)} />
                                <Checkbox label="Krb" checked={form.fireplace} onChange={v => updateField("fireplace", v)} />
                                <Checkbox label="Bazén" checked={form.pool} onChange={v => updateField("pool", v)} />
                                <Checkbox label="Záhrada" checked={form.garden} onChange={v => updateField("garden", v)} />
                                <Checkbox label="Blízko letiska" checked={form.near_airport} onChange={v => updateField("near_airport", v)} />
                                <Checkbox label="Biliardová miestnosť" checked={form.billiard_room} onChange={v => updateField("billiard_room", v)} />
                                <Checkbox label="Blízko pláže" checked={form.near_beach} onChange={v => updateField("near_beach", v)} />
                                <Checkbox label="Blízko golfového ihriska" checked={form.near_golf} onChange={v => updateField("near_golf", v)} />
                                <Checkbox label="Miestnosť na jogu" checked={form.yoga_room} onChange={v => updateField("yoga_room", v)} />
                                <Checkbox label="Veľkolepá záhrada" checked={form.grand_garden} onChange={v => updateField("grand_garden", v)} />
                            </div>
                        </div>

                        {/* Filterable features */}
                        <div className="pt-6 border-t border-[var(--color-border)]">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Špeciálne vlastnosti (filtrovateľné na webe)</h3>
                            <div className="flex flex-wrap gap-x-6 gap-y-3">
                                <Checkbox label="Výhľad na more" checked={form.sea_view} onChange={v => updateField("sea_view", v)} />
                                <Checkbox label="Prvá línia" checked={form.first_line} onChange={v => updateField("first_line", v)} />
                                <Checkbox label="Novostavba" checked={form.new_build} onChange={v => updateField("new_build", v)} />
                                <Checkbox label="Nový projekt" checked={form.new_project} onChange={v => updateField("new_project", v)} />
                                <Checkbox label="Luxusná" checked={form.luxury} onChange={v => updateField("luxury", v)} />
                                <Checkbox label="Golf" checked={form.golf} onChange={v => updateField("golf", v)} />
                                <Checkbox label="Hory" checked={form.mountains} onChange={v => updateField("mountains", v)} />
                            </div>
                        </div>

                        {/* Preview Tags Picker */}
                        <div className="pt-6 border-t border-[var(--color-border)]">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-1">Štítky na náhľade (max. 3)</h3>
                            <p className="text-[11px] text-[var(--color-muted)] mb-4">Vyberte maximálne 3 vlastnosti, ktoré sa zobrazia na kartičke nehnuteľnosti v zozname.</p>
                            {(() => {
                                // Build list of available tags from enabled features
                                const availableTags: { key: string; label: string }[] = [];
                                if (form.pool) availableTags.push({ key: "pool", label: "Bazén" });
                                if (form.garden) availableTags.push({ key: "garden", label: "Záhrada" });
                                if (form.balcony) availableTags.push({ key: "balcony", label: "Balkón" });
                                if (form.terasa) availableTags.push({ key: "terrace", label: "Terasa" });
                                if (form.parking_spot) availableTags.push({ key: "parking", label: "Parkovanie" });
                                if (form.sea_view) availableTags.push({ key: "sea_view", label: "Výhľad na more" });
                                if (form.first_line) availableTags.push({ key: "first_line", label: "Prvá línia" });
                                if (form.new_build) availableTags.push({ key: "new_build", label: "Novostavba" });
                                if (form.new_project) availableTags.push({ key: "new_project", label: "Nový projekt" });
                                if (form.luxury) availableTags.push({ key: "luxury", label: "Luxus" });
                                if (form.golf) availableTags.push({ key: "golf", label: "Golf" });
                                if (form.mountains) availableTags.push({ key: "mountains", label: "Hory" });
                                if (form.near_airport) availableTags.push({ key: "near_airport", label: "Blízko letiska" });
                                if (form.near_beach) availableTags.push({ key: "near_beach", label: "Blízko pláže" });
                                if (form.lodzia) availableTags.push({ key: "loggia", label: "Lodžia" });
                                if (form.cellar) availableTags.push({ key: "cellar", label: "Pivnica" });
                                if (form.grand_garden) availableTags.push({ key: "grand_garden", label: "Veľká záhrada" });
                                if (form.near_golf) availableTags.push({ key: "near_golf", label: "Blízko golfu" });

                                if (availableTags.length === 0) {
                                    return <p className="text-xs text-[var(--color-muted)] italic">Najskôr zaškrtnite aspoň jednu vlastnosť vyššie.</p>;
                                }

                                return (
                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.map(({ key, label }) => {
                                            const isSelected = form.preview_tags.includes(key);
                                            const isMaxed = form.preview_tags.length >= 3 && !isSelected;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    disabled={isMaxed}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            updateField("preview_tags", form.preview_tags.filter((t: string) => t !== key));
                                                        } else {
                                                            updateField("preview_tags", [...form.preview_tags, key]);
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                                        isSelected
                                                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                                            : isMaxed
                                                                ? "bg-[var(--color-surface)] text-[var(--color-muted)]/50 border-[var(--color-border)] cursor-not-allowed opacity-40"
                                                                : "bg-white text-[var(--color-foreground)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                                    }`}
                                                >
                                                    {isSelected && <span className="mr-1">✓</span>}
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* ========== TAB: MÉDIÁ (always mounted so uploads persist) ========== */}
                <div style={{ display: activeTab === "media" ? "block" : "none" }}>
                    <ImageUploader
                        images={form.images}
                        onChange={(images) => updateField("images", images)}
                        onUploadingChange={setIsUploading}
                        heroImageIndex={form.hero_image_index}
                        onHeroImageIndexChange={(idx) => updateField("hero_image_index", idx)}
                        pdfImages={form.pdf_images}
                        onPdfImagesChange={(indices) => updateField("pdf_images", indices)}
                    />

                    {/* Video URL */}
                    <div className="mt-6">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                            Video URL (YouTube/Vimeo)
                        </label>
                        <input
                            type="url"
                            value={form.video_url || ""}
                            onChange={(e) => updateField("video_url", e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* ========== TAB: POPIS & SEO ========== */}
                {activeTab === "description" && (
                    <div className="space-y-8">
                        <Input label="Názov nehnuteľnosti" value={form.title_sk} onChange={v => updateField("title_sk", v)} required placeholder="napr. Luxusná Vila s bazénom" />

                        {/* Description */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                    Popis nehnuteľnosti <span className="text-red-500">*</span>
                                </label>
                                <span className="text-[11px] font-medium text-[var(--color-muted)]">Slovenčina</span>
                            </div>
                            <textarea
                                value={form.description_sk}
                                onChange={(e) => updateField("description_sk", e.target.value)}
                                rows={8}
                                placeholder="Napíšte popis nehnuteľnosti v slovenčine..."
                                className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-y shadow-sm"
                            />
                            <button
                                type="button"
                                disabled={generatingAI}
                                className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                                onClick={generateAIDescription}
                            >
                                {generatingAI ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                    </svg>
                                )}
                                {generatingAI ? 'Generujem...' : 'Vygenerovať popis pomocou AI'}
                            </button>
                        </div>

                        {/* Location info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Input label="Mesto / Oblasť" value={form.city} onChange={v => updateField("city", v)} placeholder="napr. Split" helpText="Voliteľné — vyplní sa automaticky z mapy" />
                            <Input label="Lokácia (zobrazovaná na webe)" value={form.location_sk} onChange={v => updateField("location_sk", v)} placeholder="napr. Split, Chorvátsko" helpText="Vyplní sa automaticky z mapy. Tento text sa zobrazí na karte nehnuteľnosti" />
                        </div>

                        {/* Location Description */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Popis lokality</label>
                                <span className="text-[11px] font-medium text-[var(--color-muted)]">Slovenčina</span>
                            </div>
                            <textarea
                                value={form.location_description_sk}
                                onChange={(e) => updateField("location_description_sk", e.target.value)}
                                rows={5}
                                placeholder="Opíšte okolie a lokalitu..."
                                className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-y shadow-sm"
                            />
                        </div>

                        {/* SEO Section */}
                        <div className="pt-6 mt-3 border-t border-[var(--color-border)]">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-bold text-[var(--color-secondary)]">SEO nastavenia</h3>
                                <button
                                    type="button"
                                    onClick={generateAISEO}
                                    disabled={generatingSEO}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50 text-[var(--color-muted)] text-xs font-semibold rounded-lg transition-all"
                                >
                                    {generatingSEO ? (
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                        </svg>
                                    )}
                                    {generatingSEO ? 'Generujem...' : 'Vygenerovať SEO pomocou AI'}
                                </button>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Meta titulok</label>
                                        <span className={`text-[11px] font-medium ${form.meta_title_sk.length > 60 ? "text-red-500" : "text-[var(--color-muted)]"}`}>
                                            {form.meta_title_sk.length}/60
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={form.meta_title_sk}
                                        onChange={(e) => updateField("meta_title_sk", e.target.value)}
                                        placeholder={form.title_sk || "Automaticky z názvu..."}
                                        className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Meta popis</label>
                                        <span className={`text-[11px] font-medium ${form.meta_description_sk.length > 160 ? "text-red-500" : "text-[var(--color-muted)]"}`}>
                                            {form.meta_description_sk.length}/160
                                        </span>
                                    </div>
                                    <textarea
                                        value={form.meta_description_sk}
                                        onChange={(e) => updateField("meta_description_sk", e.target.value)}
                                        rows={2}
                                        placeholder="Popis pre vyhľadávače..."
                                        className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-y shadow-sm"
                                    />
                                </div>
                                {/* Google Preview */}
                                <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">Google náhľad</p>
                                    <div className="space-y-1">
                                        <p className="text-balance sm:text-lg text-[var(--color-primary)] hover:underline cursor-pointer truncate font-medium">
                                            {form.meta_title_sk || form.title_sk || "Názov nehnuteľnosti"} | Relax Properties
                                        </p>
                                        <p className="text-sm text-green-700">relaxproperties.sk/sk/properties/...</p>
                                        <p className="text-sm text-[var(--color-foreground)] line-clamp-2">
                                            {form.meta_description_sk || form.description_sk?.slice(0, 160) || "Popis nehnuteľnosti..."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="pt-6 border-t border-[var(--color-border)]">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-2">Štítky (tags)</label>
                            <div className="flex gap-2.5 mb-4">
                                <input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                    placeholder="Pridať štítok..."
                                    className="flex-1 px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] shadow-sm"
                                />
                                <button type="button" onClick={addTag} className="px-5 py-3 bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-primary)] font-bold text-sm rounded-xl transition-colors shadow-sm">+</button>
                            </div>
                            {form.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2.5">
                                    {form.tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[var(--color-border)] shadow-sm rounded-full text-xs font-semibold text-[var(--color-secondary)]">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="text-[var(--color-muted)] hover:text-red-500 transition-colors">✕</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== TAB: MAPA & EXPORT ========== */}
                {activeTab === "map_export" && (
                    <div className="space-y-8">
                        {/* Map */}
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Poloha na mape</h3>
                            <AdminMapPicker
                                lat={form.latitude ? parseFloat(form.latitude) : null}
                                lng={form.longitude ? parseFloat(form.longitude) : null}
                                zoom={form.map_zoom ? parseInt(form.map_zoom) : 6}
                                onLocationChange={(lat, lng, geoData?: GeoData) => {
                                    setIsDirty(true);
                                    setForm(prev => {
                                        const updates: Partial<PropertyFormData> = {
                                            latitude: lat.toFixed(6),
                                            longitude: lng.toFixed(6),
                                        };

                                        if (geoData) {
                                            // Auto-fill country if we got a match
                                            if (geoData.country) {
                                                const match = COUNTRY_OPTIONS.find(c => c.value === geoData.country);
                                                if (match) {
                                                    updates.country = match.value;
                                                }
                                            }

                                            // Auto-fill city (locality or area)
                                            if (geoData.city) {
                                                updates.city = geoData.city;
                                            }

                                            // Auto-fill location display string
                                            const cityPart = geoData.city || geoData.area || '';
                                            const countrySlug = geoData.country || prev.country;
                                            const countryLabel = COUNTRY_OPTIONS.find(c => c.value === countrySlug)?.label || '';
                                            if (cityPart && countryLabel) {
                                                updates.location_sk = `${cityPart}, ${countryLabel}`;
                                            } else if (cityPart) {
                                                updates.location_sk = cityPart;
                                            } else if (countryLabel) {
                                                updates.location_sk = countryLabel;
                                            }
                                        }

                                        return { ...prev, ...updates };
                                    });
                                }}
                                onZoomChange={(z) => {
                                    setIsDirty(true);
                                    setForm(prev => ({ ...prev, map_zoom: z.toString() }));
                                }}
                            />
                            {form.latitude && form.longitude && (
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div className="px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                                        <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">Lat</span>
                                        <p className="text-sm font-mono text-[var(--color-foreground)]">{form.latitude}</p>
                                    </div>
                                    <div className="px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                                        <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">Lng</span>
                                        <p className="text-sm font-mono text-[var(--color-foreground)]">{form.longitude}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Export & Publishing */}
                        <div className="pt-6 border-t border-[var(--color-border)]">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Export & Publikovanie</h3>
                            <div className="space-y-5">
                                <Toggle label="Odporúčaná nehnuteľnosť" checked={form.featured} onChange={v => updateField("featured", v)} description="Zobrazí sa na hlavnej stránke a bude zvýraznená v zozname" />
                                <div>
                                    <label className="block text-[13px] font-semibold text-[var(--color-foreground)] mb-2">Export na portály</label>
                                    <div className="space-y-2">
                                        <Toggle
                                            label="SK portály (nehnuteľnosti.sk)"
                                            checked={form.export_target.split(',').filter(Boolean).includes('sk')}
                                            onChange={(checked) => {
                                                const current = new Set(form.export_target.split(',').filter(Boolean));
                                                if (checked) current.add('sk'); else current.delete('sk');
                                                updateField("export_target", Array.from(current).join(','));
                                            }}
                                        />
                                        <Toggle
                                            label="CZ portály (Softreal)"
                                            checked={form.export_target.split(',').filter(Boolean).includes('softreal')}
                                            onChange={(checked) => {
                                                const current = new Set(form.export_target.split(',').filter(Boolean));
                                                if (checked) current.add('softreal'); else current.delete('softreal');
                                                updateField("export_target", Array.from(current).join(','));
                                            }}
                                            description="Vyžaduje CZ preklad"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
