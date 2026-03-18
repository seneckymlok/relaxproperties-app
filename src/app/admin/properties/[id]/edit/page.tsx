import { notFound } from "next/navigation";
import { getPropertyById } from "@/lib/property-store";
import PropertyForm from "@/components/admin/PropertyForm";

interface EditPropertyPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
    const { id } = await params;

    let property = null;
    try {
        property = await getPropertyById(id);
    } catch {
        // Supabase not configured — show not found
    }

    if (!property) {
        notFound();
    }

    return <PropertyForm mode="edit" initialData={property} />;
}
