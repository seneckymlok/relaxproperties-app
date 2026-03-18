// Centralized mock data for properties
// This will be replaced with CMS/database data in production

export interface Property {
    id: number;
    title: string;
    location: string;
    country: string;
    price: number;
    priceFormatted: string;
    beds: number;
    baths: number;
    area: number;
    type: "villa" | "apartment" | "house" | "land";
    images: string[];
    featured: boolean;
    year?: number;
    parking?: number;
    pool?: boolean;
    balcony?: boolean;
    garden?: boolean;
    description?: string;
    // Advanced filter fields
    seaView?: boolean;
    firstLine?: boolean;
    newBuild?: boolean;
    newProject?: boolean;
    luxury?: boolean;
    golf?: boolean;
    mountains?: boolean;
}

export const properties: Property[] = [
    {
        id: 1,
        title: "Luxusná Villa s bazénom",
        location: "Split, Chorvátsko",
        country: "croatia",
        price: 850000,
        priceFormatted: "€ 850,000",
        beds: 4,
        baths: 3,
        area: 280,
        type: "villa",
        images: [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
        ],
        featured: true,
        year: 2022,
        parking: 2,
        pool: true,
        balcony: true,
        garden: true,
        description: "Nádherná moderná vila s panoramatickým výhľadom na more. Táto nehnuteľnosť ponúka luxusné bývanie v jednej z najžiadanejších lokalít Chorvátska.",
        seaView: true,
        firstLine: true,
        luxury: true,
    },
    {
        id: 2,
        title: "Apartmán s výhľadom na more",
        location: "Marbella, Španielsko",
        country: "spain",
        price: 425000,
        priceFormatted: "€ 425,000",
        beds: 2,
        baths: 2,
        area: 120,
        type: "apartment",
        images: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
        ],
        featured: false,
        year: 2020,
        parking: 1,
        pool: false,
        balcony: true,
        garden: false,
        description: "Elegantný apartmán v prestížnej lokalite s priamym výhľadom na Stredozemné more.",
        seaView: true,
        golf: true,
    },
    {
        id: 3,
        title: "Moderný byt pri pláži",
        location: "Slnečné pobrežie, Bulharsko",
        country: "bulgaria",
        price: 95000,
        priceFormatted: "€ 95,000",
        beds: 1,
        baths: 1,
        area: 55,
        type: "apartment",
        images: [
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
        ],
        featured: true,
        year: 2019,
        parking: 0,
        pool: false,
        balcony: true,
        garden: false,
        description: "Kompaktný apartmán ideálny na dovolenku alebo investíciu. Len pár minút od pláže.",
    },
    {
        id: 4,
        title: "Historická vila v Toskánsku",
        location: "Firenze, Taliansko",
        country: "italy",
        price: 1200000,
        priceFormatted: "€ 1,200,000",
        beds: 6,
        baths: 4,
        area: 450,
        type: "villa",
        images: [
            "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
        ],
        featured: true,
        year: 1890,
        parking: 4,
        pool: true,
        balcony: true,
        garden: true,
        description: "Historická vila s moderným interiérom v srdci Toskánska. Ideálna pre milovníkov architektúry a talianskej kultúry.",
    },
    {
        id: 5,
        title: "Penthouse s terasou",
        location: "Dubrovník, Chorvátsko",
        country: "croatia",
        price: 680000,
        priceFormatted: "€ 680,000",
        beds: 3,
        baths: 2,
        area: 180,
        type: "apartment",
        images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
        ],
        featured: false,
        year: 2021,
        parking: 2,
        pool: false,
        balcony: true,
        garden: false,
        description: "Luxusný penthouse s veľkou terasou a výhľadom na historické centrum Dubrovníka.",
    },
    {
        id: 6,
        title: "Rodinný dom pri mori",
        location: "Burgas, Bulharsko",
        country: "bulgaria",
        price: 185000,
        priceFormatted: "€ 185,000",
        beds: 4,
        baths: 2,
        area: 220,
        type: "house",
        images: [
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
            "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        ],
        featured: false,
        year: 2018,
        parking: 2,
        pool: false,
        balcony: false,
        garden: true,
        description: "Priestranný rodinný dom s veľkou záhradou, ideálny pre rodinu s deťmi.",
    },
    {
        id: 7,
        title: "Moderná vila s infinity bazénom",
        location: "Costa Brava, Španielsko",
        country: "spain",
        price: 1450000,
        priceFormatted: "€ 1,450,000",
        beds: 5,
        baths: 4,
        area: 380,
        type: "villa",
        images: [
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
        ],
        featured: true,
        year: 2023,
        parking: 3,
        pool: true,
        balcony: true,
        garden: true,
        description: "Architektonický skvost s infinity bazénom a panoramatickým výhľadom na more.",
    },
    {
        id: 8,
        title: "Apartmán v centre mesta",
        location: "Zadar, Chorvátsko",
        country: "croatia",
        price: 220000,
        priceFormatted: "€ 220,000",
        beds: 2,
        baths: 1,
        area: 75,
        type: "apartment",
        images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
        ],
        featured: false,
        year: 2017,
        parking: 1,
        pool: false,
        balcony: true,
        garden: false,
        description: "Útulný apartmán v historickom centre Zadaru, pešia dostupnosť ku všetkým atrakciám.",
    },
    {
        id: 9,
        title: "Luxusná vila na ostrove",
        location: "Hvar, Chorvátsko",
        country: "croatia",
        price: 2100000,
        priceFormatted: "€ 2,100,000",
        beds: 6,
        baths: 5,
        area: 520,
        type: "villa",
        images: [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
        ],
        featured: true,
        year: 2022,
        parking: 4,
        pool: true,
        balcony: true,
        garden: true,
        description: "Exkluzívna vila na prestížnom ostrove Hvar s priamym prístupom k moru.",
    },
];

export const countries = [
    { value: "all", label: "Všetky krajiny" },
    { value: "bulgaria", label: "Bulharsko" },
    { value: "greece", label: "Grécko" },
    { value: "spain", label: "Španielsko" },
    { value: "croatia", label: "Chorvátsko" },
];

export const propertyTypes = [
    { value: "all", label: "Všetky typy" },
    { value: "villa", label: "Vila" },
    { value: "apartment", label: "Apartmán" },
    { value: "house", label: "Dom" },
    { value: "land", label: "Pozemok" },
];

export const priceRanges = [
    { value: "all", label: "Akákoľvek cena" },
    { value: "0-100000", label: "do €100,000" },
    { value: "100000-300000", label: "€100,000 - €300,000" },
    { value: "300000-500000", label: "€300,000 - €500,000" },
    { value: "500000-1000000", label: "€500,000 - €1,000,000" },
    { value: "1000000+", label: "nad €1,000,000" },
];

export const bedroomOptions = [
    { value: "all", label: "Všetky" },
    { value: "1", label: "1+ izieb" },
    { value: "2", label: "2+ izieb" },
    { value: "3", label: "3+ izieb" },
    { value: "4", label: "4+ izieb" },
    { value: "5", label: "5+ izieb" },
];

export const sortOptions = [
    { value: "newest", label: "Najnovšia ponuka" },
    { value: "price-asc", label: "Cena od najnižšej" },
    { value: "price-desc", label: "Cena od najvyššej" },
];
