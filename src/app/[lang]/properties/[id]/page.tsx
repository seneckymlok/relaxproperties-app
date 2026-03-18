import Link from "next/link";
import { notFound } from "next/navigation";
import PhotoGallery from "@/components/ui/PhotoGallery";
import ContactAgentForm from "@/components/ui/ContactAgentForm";
import PropertyCard from "@/components/ui/PropertyCard";
import PropertyMapSection from "@/components/ui/PropertyMapSection";
import PropertyActions from "@/components/ui/PropertyActions";
import { getPropertyByIdServer, getPropertiesServer, type Language } from "@/lib/data-access";
import { getDictionary } from "@/lib/dictionaries";

interface PropertyDetailPageProps {
    params: Promise<{ id: string; lang: string }>;
}

function getAgentContact(lang: Language) {
    if (lang === "sk") {
        return { name: "Vierka", phone: "+421 911 819 152", phoneRaw: "+421911819152" };
    }
    return { name: "Aleš", phone: "+421 911 989 895", phoneRaw: "+421911989895" };
}

function getYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
    const { id, lang: rawLang } = await params;
    const lang = (['sk', 'en', 'cz'].includes(rawLang) ? rawLang : 'sk') as Language;
    const property = await getPropertyByIdServer(id, lang);
    const dictionary = getDictionary(lang);

    if (!property) {
        notFound();
    }

    const agentContact = getAgentContact(lang);

    // Translations from dictionary + property detail keys
    const t = {
        home: lang === 'en' ? 'Home' : lang === 'cz' ? 'Domů' : 'Domov',
        properties: dictionary.nav.properties,
        beds: lang === 'en' ? 'Bedrooms' : lang === 'cz' ? 'Ložnice' : 'Spálne',
        baths: lang === 'en' ? 'Bathrooms' : lang === 'cz' ? 'Koupelny' : 'Kúpeľne',
        area: lang === 'en' ? 'Area' : lang === 'cz' ? 'Plocha' : 'Rozloha',
        yearBuilt: lang === 'en' ? 'Year Built' : lang === 'cz' ? 'Rok výstavby' : 'Rok výstavby',
        floors: lang === 'en' ? 'Floors' : lang === 'cz' ? 'Podlaží' : 'Podlažia',
        floorNumber: lang === 'en' ? 'Floor' : lang === 'cz' ? 'Patro' : 'Poschodie',
        landArea: lang === 'en' ? 'Land Area' : lang === 'cz' ? 'Plocha pozemku' : 'Plocha pozemku',
        distanceFromSea: lang === 'en' ? 'To Sea' : lang === 'cz' ? 'K moři' : 'K moru',
        parking: lang === 'en' ? 'Parking' : lang === 'cz' ? 'Parkování' : 'Parkovanie',
        amenities: lang === 'en' ? 'Amenities' : lang === 'cz' ? 'Vybavení' : 'Vybavenie',
        mainAmenities: lang === 'en' ? 'Main' : lang === 'cz' ? 'Hlavní' : 'Hlavné',
        additionalAmenities: lang === 'en' ? 'Additional' : lang === 'cz' ? 'Další' : 'Ďalšie',
        description: lang === 'en' ? 'Description' : lang === 'cz' ? 'Popis' : 'Popis',
        descriptionPlaceholder: lang === 'en' ? 'A detailed description will be added soon.' : lang === 'cz' ? 'Podrobný popis bude doplněn.' : 'Detailný popis nehnuteľnosti bude doplnený.',
        video: 'Video',
        featured: dictionary.common.featured,
        agentSubtitle: lang === 'en' ? 'Your Real Estate Partner' : lang === 'cz' ? 'Váš realitní partner' : 'Váš realitný partner',
        similarSubhead: lang === 'en' ? 'Similar properties' : lang === 'cz' ? 'Podobné nemovitosti' : 'Podobné nehnuteľnosti',
        similarTitle: lang === 'en' ? 'You might be interested' : lang === 'cz' ? 'Mohlo by vás zajímat' : 'Mohlo by vás zaujímať',
        viewAll: lang === 'en' ? 'View all' : lang === 'cz' ? 'Zobrazit vše' : 'Zobraziť všetky',
        share: lang === 'en' ? 'Share' : lang === 'cz' ? 'Sdílet' : 'Zdieľať',
        exportPdf: lang === 'en' ? 'Export PDF' : lang === 'cz' ? 'Exportovat PDF' : 'Exportovať PDF',
    };

    // Amenity labels per language
    const amenityLabels: Record<string, string> = {
        pool: lang === 'en' ? 'Pool' : 'Bazén',
        balcony: lang === 'en' ? 'Balcony' : 'Balkón',
        garden: lang === 'en' ? 'Garden' : lang === 'cz' ? 'Zahrada' : 'Záhrada',
        terasa: lang === 'en' ? 'Terrace' : 'Terasa',
        lodzia: lang === 'en' ? 'Loggia' : 'Lodžia',
        parking: lang === 'en' ? 'Parking' : lang === 'cz' ? 'Parkování' : 'Parkovanie',
        cellar: lang === 'en' ? 'Cellar' : lang === 'cz' ? 'Sklep' : 'Pivnica',
        garage: lang === 'en' ? 'Garage' : 'Garáž',
        parkingSpot: lang === 'en' ? 'Parking Spot' : lang === 'cz' ? 'Parkovací místo' : 'Parkovacie miesto',
        fireplace: lang === 'en' ? 'Fireplace' : 'Krb',
        nearAirport: lang === 'en' ? 'Near Airport' : lang === 'cz' ? 'Blízko letiště' : 'Blízko letiska',
        nearBeach: lang === 'en' ? 'Near Beach' : lang === 'cz' ? 'Blízko pláže' : 'Blízko pláže',
        nearGolf: lang === 'en' ? 'Near Golf' : lang === 'cz' ? 'Blízko golfu' : 'Blízko golfu',
        yogaRoom: lang === 'en' ? 'Yoga Room' : lang === 'cz' ? 'Jógová místnost' : 'Jógová miestnosť',
        billiardRoom: lang === 'en' ? 'Billiard Room' : lang === 'cz' ? 'Kulečníková místnost' : 'Biliardová miestnosť',
        grandGarden: lang === 'en' ? 'Large Garden' : lang === 'cz' ? 'Velká zahrada' : 'Veľká záhrada',
        seaView: lang === 'en' ? 'Sea View' : lang === 'cz' ? 'Výhled na moře' : 'Výhľad na more',
        firstLine: lang === 'en' ? 'Beachfront' : lang === 'cz' ? 'První linie' : 'Prvá línia',
        luxury: lang === 'en' ? 'Luxury' : 'Luxus',
        mountains: lang === 'en' ? 'Mountains' : 'Hory',
        golf: 'Golf',
        newBuild: lang === 'en' ? 'New Build' : 'Novostavba',
    };

    // Build amenities grouped
    const mainAmenities = [
        property.pool && 'pool',
        (property.parking && property.parking > 0) && 'parking',
        property.balcony && 'balcony',
        property.garden && 'garden',
        property.terasa && 'terasa',
        property.lodzia && 'lodzia',
        property.seaView && 'seaView',
        property.firstLine && 'firstLine',
    ].filter(Boolean) as string[];

    const additionalAmenities = [
        property.cellar && 'cellar',
        property.garage && 'garage',
        property.parkingSpot && 'parkingSpot',
        property.fireplace && 'fireplace',
        property.nearAirport && 'nearAirport',
        property.nearBeach && 'nearBeach',
        property.nearGolf && 'nearGolf',
        property.yogaRoom && 'yogaRoom',
        property.billiardRoom && 'billiardRoom',
        property.grandGarden && 'grandGarden',
        property.luxury && 'luxury',
        property.mountains && 'mountains',
        property.golf && 'golf',
        property.newBuild && 'newBuild',
    ].filter(Boolean) as string[];

    const allAmenities = [...mainAmenities, ...additionalAmenities];

    // Get similar properties (same country, excluding current)
    const allProperties = await getPropertiesServer(lang);
    const similarProperties = allProperties
        .filter((p) => p.country === property.country && p.id !== property.id)
        .slice(0, 3);

    // Stats bar items - conditionally show all available data
    const stats = [
        {
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            ),
            value: property.beds,
            label: t.beds,
        },
        {
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h18v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4zm2-3V6a2 2 0 012-2h2a2 2 0 012 2v4" />
                </svg>
            ),
            value: property.baths,
            label: t.baths,
        },
        {
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
            ),
            value: `${property.area} m²`,
            label: t.area,
        },
        ...(property.year ? [{
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
            ),
            value: property.year,
            label: t.yearBuilt,
        }] : []),
        ...(property.floors ? [{
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
            ),
            value: property.floors,
            label: t.floors,
        }] : []),
        ...(property.floorNumber != null ? [{
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V9" />
                </svg>
            ),
            value: `${property.floorNumber}.`,
            label: t.floorNumber,
        }] : []),
        ...(property.landArea ? [{
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0-8.25a1.5 1.5 0 113 0V15a1.5 1.5 0 01-3 0V6.75zM3.75 4.5h16.5" />
                </svg>
            ),
            value: `${property.landArea} m²`,
            label: t.landArea,
        }] : []),
        ...(property.distanceFromSea ? [{
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5c3-3 6 3 9 0s6 3 9 0M3 17.5c3-3 6 3 9 0s6 3 9 0" />
                </svg>
            ),
            value: `${property.distanceFromSea} m`,
            label: t.distanceFromSea,
        }] : []),
        ...(property.parking && property.parking > 0 ? [{
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
            ),
            value: property.parking,
            label: t.parking,
        }] : []),
    ];

    // YouTube video embed
    const videoId = property.videoUrl ? getYouTubeId(property.videoUrl) : null;

    return (
        <>
            {/* Breadcrumb */}
            <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]" style={{ paddingTop: '5.5rem' }}>
                <div className="container-custom px-4 sm:px-6">
                    <nav className="flex items-center gap-2 py-3.5 text-xs font-medium tracking-wide text-[var(--color-muted)] overflow-x-auto no-scrollbar">
                        <Link href={`/${lang}`} className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                            {t.home}
                        </Link>
                        <span className="text-[var(--color-border-dark)] font-light">/</span>
                        <Link href={`/${lang}/properties`} className="hover:text-[var(--color-primary)] transition-colors whitespace-nowrap">
                            {t.properties}
                        </Link>
                        <span className="text-[var(--color-border-dark)] font-light">/</span>
                        <span className="text-[var(--color-foreground)] truncate max-w-xs">{property.title}</span>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <section className="bg-[var(--color-background)]" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
                <div className="container-custom px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Left Column — Gallery & Details */}
                        <div className="lg:col-span-2">
                            {/* Photo Gallery */}
                            <PhotoGallery images={property.images} title={property.title} />

                            {/* Property Header */}
                            <div className="mt-8 pb-6 border-b border-[var(--color-border)]">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                                            {property.featured && (
                                                <span className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent)]/10 rounded-full">
                                                    {t.featured}
                                                </span>
                                            )}
                                            {property.propertyIdExternal && (
                                                <span className="inline-block px-3 py-1 text-xs font-medium text-[var(--color-muted)] bg-[var(--color-surface)] rounded-full border border-[var(--color-border)]">
                                                    ID: {property.propertyIdExternal}
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl text-[var(--color-secondary)] mb-2 leading-tight">
                                            {property.title}
                                        </h1>
                                        <p className="text-[var(--color-muted)] flex items-center gap-2">
                                            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                            </svg>
                                            {property.location}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-serif text-3xl md:text-4xl text-[var(--color-primary)]">
                                            {property.priceFormatted}
                                        </p>
                                    </div>
                                </div>

                                {/* Share + PDF Actions */}
                                <PropertyActions
                                    title={property.title}
                                    shareLabel={t.share}
                                    pdfLabel={t.exportPdf}
                                    pdfData={{
                                        images: property.images,
                                        pdfImageIndices: property.pdfImages || [],
                                        price: property.priceFormatted,
                                        location: property.location,
                                        locationDescription: property.locationDescription,
                                        propertyId: property.propertyIdExternal,
                                        beds: property.beds,
                                        baths: property.baths,
                                        area: property.area,
                                        year: property.year,
                                        floors: property.floors,
                                        floorNumber: property.floorNumber,
                                        landArea: property.landArea,
                                        distanceFromSea: property.distanceFromSea,
                                        parking: property.parking,
                                        description: property.description,
                                        amenities: allAmenities.map(key => amenityLabels[key] || key),
                                        lang,
                                    }}
                                />
                            </div>

                            {/* Stats Bar */}
                            <div className="py-6 border-b border-[var(--color-border)]">
                                <div className="bg-[var(--color-surface)] rounded-2xl p-6 sm:p-8">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                        {stats.map((stat, idx) => (
                                            <div key={idx} className="flex flex-col items-center text-center">
                                                <div className="w-11 h-11 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-2.5">
                                                    <span className="text-[var(--color-primary)] flex items-center justify-center">
                                                        {stat.icon}
                                                    </span>
                                                </div>
                                                <p className="text-xl font-semibold text-[var(--color-secondary)] leading-tight">{stat.value}</p>
                                                <p className="text-xs text-[var(--color-muted)] mt-1 font-medium">{stat.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Amenities */}
                            {allAmenities.length > 0 && (
                                <div className="py-6 border-b border-[var(--color-border)]">
                                    <h2 className="font-serif text-lg text-[var(--color-secondary)] mb-1">{t.amenities}</h2>
                                    <span className="block w-8 h-px bg-[var(--color-accent)] mb-4" />

                                    {mainAmenities.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">{t.mainAmenities}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {mainAmenities.map((key) => (
                                                    <span
                                                        key={key}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] rounded-full text-sm text-[var(--color-foreground)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                        {amenityLabels[key] || key}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {additionalAmenities.length > 0 && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">{t.additionalAmenities}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {additionalAmenities.map((key) => (
                                                    <span
                                                        key={key}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] rounded-full text-sm text-[var(--color-foreground)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                        {amenityLabels[key] || key}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            <div className="py-6 border-b border-[var(--color-border)]">
                                <h2 className="font-serif text-lg text-[var(--color-secondary)] mb-1">{t.description}</h2>
                                <span className="block w-8 h-px bg-[var(--color-accent)] mb-4" />
                                <div
                                    className="text-[var(--color-foreground)] leading-relaxed text-base prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: property.description || t.descriptionPlaceholder }}
                                />
                            </div>

                            {/* Location Description */}
                            {property.locationDescription && (
                                <div className="py-6 border-b border-[var(--color-border)]">
                                    <h2 className="font-serif text-lg text-[var(--color-secondary)] mb-1">
                                        {lang === 'en' ? 'About the Location' : lang === 'cz' ? 'O lokalitě' : 'O lokalite'}
                                    </h2>
                                    <span className="block w-8 h-px bg-[var(--color-accent)] mb-4" />
                                    <p className="text-[var(--color-foreground)] leading-relaxed text-base">
                                        {property.locationDescription}
                                    </p>
                                </div>
                            )}

                            {/* Video Embed */}
                            {videoId && (
                                <div className="py-6 border-b border-[var(--color-border)]">
                                    <h2 className="font-serif text-lg text-[var(--color-secondary)] mb-1">{t.video}</h2>
                                    <span className="block w-8 h-px bg-[var(--color-accent)] mb-4" />
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${videoId}`}
                                            title={`${property.title} - Video`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Map */}
                            <PropertyMapSection
                                lat={property.latitude}
                                lng={property.longitude}
                                zoom={property.mapZoom}
                                title={property.title}
                                location={property.location}
                            />
                        </div>

                        {/* Right Column — Sticky Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky" style={{ top: '5.5rem' }}>
                                <ContactAgentForm propertyTitle={property.title} lang={lang} />

                                {/* Agent Card — locale-aware */}
                                <div className="mt-5 bg-white rounded-2xl border border-[var(--color-border)] p-6">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-[var(--color-primary)] font-serif text-lg font-bold">RP</span>
                                        </div>
                                        <div>
                                            <p className="font-serif text-base text-[var(--color-secondary)]">Relax Properties</p>
                                            <p className="text-xs text-[var(--color-muted)]">{t.agentSubtitle}</p>
                                        </div>
                                    </div>
                                    <span className="block w-full h-px bg-[var(--color-border)] mb-4" />
                                    <div className="space-y-3">
                                        {/* Primary contact based on locale */}
                                        <a
                                            href={`tel:${agentContact.phoneRaw}`}
                                            className="flex items-center gap-3 text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors font-medium"
                                        >
                                            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                            </svg>
                                            {agentContact.name}: {agentContact.phone}
                                        </a>
                                        {/* Secondary contact */}
                                        <a
                                            href={lang === 'sk' ? 'tel:+421911989895' : 'tel:+421911819152'}
                                            className="flex items-center gap-3 text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                            </svg>
                                            {lang === 'sk' ? '+421 911 989 895' : '+421 911 819 152'}
                                        </a>
                                        <a
                                            href="mailto:info@relaxproperties.sk"
                                            className="flex items-center gap-3 text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                            </svg>
                                            info@relaxproperties.sk
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Similar Properties */}
                    {similarProperties.length > 0 && (
                        <div className="mt-16 pt-12 border-t border-[var(--color-border)]">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-2">
                                        {t.similarSubhead}
                                    </p>
                                    <h2 className="font-serif text-2xl md:text-3xl text-[var(--color-secondary)]">
                                        {t.similarTitle}
                                    </h2>
                                </div>
                                <Link
                                    href={`/${lang}/properties?country=${property.country}`}
                                    className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors"
                                >
                                    {t.viewAll}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {similarProperties.map((p) => (
                                    <PropertyCard
                                        key={p.id}
                                        id={p.id}
                                        title={p.title}
                                        location={p.location}
                                        price={p.priceFormatted}
                                        beds={p.beds}
                                        baths={p.baths}
                                        area={p.area}
                                        images={p.images}
                                        featured={p.featured}
                                        previewTags={p.previewTags}
                                        lang={lang}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
