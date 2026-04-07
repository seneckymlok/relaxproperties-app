"use client";

import { useState } from "react";

interface PropertyActionsProps {
    title: string;
    shareLabel: string;
    pdfLabel: string;
    // PDF brochure data
    pdfData?: {
        images: string[];
        pdfImageIndices: number[];
        price: string;
        location: string;
        locationDescription?: string;
        propertyId?: string | null;
        beds: number;
        baths: number;
        area: number;
        year?: number | null;
        floors?: number | null;
        floorNumber?: number | null;
        landArea?: number | null;
        distanceFromSea?: number | null;
        parking?: number;
        description?: string;
        amenities: string[];
        lang: string;
    };
}

// ============================================
// COLORS & CONSTANTS
// ============================================

const COLORS = {
    primary: "#2B6E6E",
    accent: "#C4A882",
    dark: "#1C2B2D",
    text: "#2A3638",
    muted: "#7A8486",
    light: "#F3F2EE",
    white: "#ffffff",
    border: "#EAE8E4",
};

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ============================================
// HELPER: Load image as base64
// ============================================

async function loadImageAsBase64(url: string, retries = 2): Promise<string | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const result = await new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
            if (result) return result;
        } catch {
            if (attempt === retries) return null;
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
    }
    return null;
}

// ============================================
// HELPER: Load image dimensions
// ============================================

function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 1, height: 1 });
        img.src = base64;
    });
}

// ============================================
// HELPER: Strip HTML
// ============================================

function stripHtml(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
}

// ============================================
// HELPER: Word-wrap text
// ============================================

function wrapText(doc: InstanceType<typeof import("jspdf").jsPDF>, text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = doc.getTextWidth(testLine);
        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

// ============================================
// FOOTER
// ============================================

function drawFooter(doc: InstanceType<typeof import("jspdf").jsPDF>, pageNum: number, totalPages: number) {
    const footerY = PAGE_H - 10;
    // Divider line
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, footerY - 4, PAGE_W - MARGIN, footerY - 4);

    // Left: website
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.muted);
    doc.text("relaxproperties.sk", MARGIN, footerY);

    // Center: page
    doc.text(`${pageNum} / ${totalPages}`, PAGE_W / 2, footerY, { align: "center" });

    // Right: contact
    doc.text("info@relaxproperties.sk  |  +421 911 819 152", PAGE_W - MARGIN, footerY, { align: "right" });
}

// ============================================
// MAIN PDF GENERATOR
// ============================================

async function generatePropertyPdf(title: string, data: NonNullable<PropertyActionsProps["pdfData"]>) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    // Determine which images to use in PDF
    const pdfImageUrls = data.pdfImageIndices.length > 0
        ? data.pdfImageIndices.filter(i => i < data.images.length).map(i => data.images[i])
        : data.images.slice(0, 6); // fallback: first 6

    // Preload all images
    const heroUrl = pdfImageUrls[0] || data.images[0];
    const additionalUrls = pdfImageUrls.slice(1);

    const [heroBase64, logoBase64, ...additionalBase64s] = await Promise.all([
        heroUrl ? loadImageAsBase64(heroUrl) : null,
        loadImageAsBase64("/images/relax-logo.png"),
        ...additionalUrls.map(url => loadImageAsBase64(url)),
    ]);

    // Translation helpers
    const lang = data.lang;
    const t = {
        beds: lang === "en" ? "Bedrooms" : lang === "cz" ? "Loznice" : "Spalne",
        baths: lang === "en" ? "Bathrooms" : lang === "cz" ? "Koupelny" : "Kupelne",
        area: lang === "en" ? "Area" : lang === "cz" ? "Plocha" : "Rozloha",
        year: lang === "en" ? "Year Built" : lang === "cz" ? "Rok vystavby" : "Rok vystavby",
        floors: lang === "en" ? "Floors" : lang === "cz" ? "Podlazi" : "Podlazia",
        floor: lang === "en" ? "Floor" : lang === "cz" ? "Patro" : "Poschodie",
        land: lang === "en" ? "Land Area" : lang === "cz" ? "Pozemek" : "Pozemok",
        sea: lang === "en" ? "To Sea" : lang === "cz" ? "K mori" : "K moru",
        parking: lang === "en" ? "Parking" : lang === "cz" ? "Parkovani" : "Parkovanie",
        amenities: lang === "en" ? "Amenities" : lang === "cz" ? "Vybaveni" : "Vybavenie",
        description: lang === "en" ? "Description" : "Popis",
        aboutLocation: lang === "en" ? "About the Location" : lang === "cz" ? "O lokalite" : "O lokalite",
        propertyDetails: lang === "en" ? "Property Details" : lang === "cz" ? "Detail nemovitosti" : "Detail nehnutelnosti",
        photoGallery: lang === "en" ? "Photo Gallery" : lang === "cz" ? "Fotogalerie" : "Fotogaleria",
        contact: lang === "en" ? "Contact" : "Kontakt",
    };

    // Count total pages
    const hasAdditionalPhotos = additionalBase64s.filter(Boolean).length > 0;
    const totalPages = 2 + (hasAdditionalPhotos ? 1 : 0);

    // ============================
    // PAGE 1 — HERO COVER
    // ============================

    // Full-page dark background
    doc.setFillColor(COLORS.dark);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");

    // Hero image - full width with aspect ratio preserved
    if (heroBase64) {
        const dims = await getImageDimensions(heroBase64);
        const imgAspect = dims.width / dims.height;
        const targetW = PAGE_W;
        const targetH = PAGE_H * 0.65;
        let drawW = targetW;
        let drawH = targetW / imgAspect;

        if (drawH < targetH) {
            drawH = targetH;
            drawW = targetH * imgAspect;
        }

        const drawX = (PAGE_W - drawW) / 2;
        doc.addImage(heroBase64, "JPEG", drawX, 0, drawW, drawH);

        // Gradient overlay at bottom of image
        const gradientSteps = 40;
        for (let i = 0; i < gradientSteps; i++) {
            const alpha = (i / gradientSteps) * 0.95;
            const y = drawH - (gradientSteps - i) * (drawH * 0.5 / gradientSteps);
            doc.setFillColor(26, 29, 39);
            doc.setGState(doc.GState({ opacity: alpha }));
            doc.rect(0, y, PAGE_W, drawH * 0.5 / gradientSteps + 0.5, "F");
        }
        doc.setGState(doc.GState({ opacity: 1 }));

        // Solid dark below image
        doc.setFillColor(COLORS.dark);
        doc.rect(0, drawH, PAGE_W, PAGE_H - drawH, "F");
    }

    // Logo top-left
    if (logoBase64) {
        // White semi-transparent pill behind logo
        doc.setFillColor(255, 255, 255);
        doc.setGState(doc.GState({ opacity: 0.9 }));
        doc.roundedRect(MARGIN - 2, MARGIN - 2, 44, 16, 3, 3, "F");
        doc.setGState(doc.GState({ opacity: 1 }));
        doc.addImage(logoBase64, "PNG", MARGIN, MARGIN, 40, 12);
    }

    // Property ID badge top-right
    if (data.propertyId) {
        doc.setFillColor(255, 255, 255);
        doc.setGState(doc.GState({ opacity: 0.15 }));
        const idText = `ID: ${data.propertyId}`;
        doc.setFontSize(8);
        const idW = doc.getTextWidth(idText) + 10;
        doc.roundedRect(PAGE_W - MARGIN - idW, MARGIN - 1, idW, 10, 2, 2, "F");
        doc.setGState(doc.GState({ opacity: 1 }));
        doc.setTextColor(COLORS.white);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(idText, PAGE_W - MARGIN - idW / 2, MARGIN + 5, { align: "center" });
    }

    // Property info block at bottom
    const infoStartY = PAGE_H - 80;

    // Accent line
    doc.setFillColor(COLORS.accent);
    doc.rect(MARGIN, infoStartY, 40, 1, "F");

    // Title
    doc.setTextColor(COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    const titleLines = wrapText(doc, title, CONTENT_W);
    let titleY = infoStartY + 10;
    for (const line of titleLines) {
        doc.text(line, MARGIN, titleY);
        titleY += 9;
    }

    // Location
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.accent);
    doc.text(data.location, MARGIN, titleY + 4);

    // Price
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(COLORS.accent);
    doc.text(data.price, MARGIN, titleY + 20);

    // Footer
    drawFooter(doc, 1, totalPages);

    // ============================
    // PAGE 2 — DETAILS & AMENITIES
    // ============================

    doc.addPage();
    doc.setFillColor(COLORS.white);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");

    let curY = MARGIN;

    // Section: Property Details
    doc.setFillColor(COLORS.primary);
    doc.rect(MARGIN, curY, 3, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(COLORS.primary);
    doc.text(t.propertyDetails, MARGIN + 8, curY + 10);
    curY += 22;

    // Stats grid
    const statsData: { label: string; value: string }[] = [];
    if (data.beds) statsData.push({ label: t.beds, value: data.beds.toString() });
    if (data.baths) statsData.push({ label: t.baths, value: data.baths.toString() });
    if (data.area) statsData.push({ label: t.area, value: `${data.area} m\u00B2` });
    if (data.year) statsData.push({ label: t.year, value: data.year.toString() });
    if (data.floors) statsData.push({ label: t.floors, value: data.floors.toString() });
    if (data.floorNumber != null) statsData.push({ label: t.floor, value: `${data.floorNumber}.` });
    if (data.landArea) statsData.push({ label: t.land, value: `${data.landArea} m\u00B2` });
    if (data.distanceFromSea) statsData.push({ label: t.sea, value: `${data.distanceFromSea} m` });
    if (data.parking && data.parking > 0) statsData.push({ label: t.parking, value: data.parking.toString() });

    // Draw stats in a clean grid: 3 columns
    const statCols = 3;
    const statColW = CONTENT_W / statCols;
    const statRowH = 22;

    // Background for stats area
    const statsRows = Math.ceil(statsData.length / statCols);
    doc.setFillColor(COLORS.light);
    doc.roundedRect(MARGIN, curY, CONTENT_W, statsRows * statRowH + 8, 3, 3, "F");

    statsData.forEach((stat, idx) => {
        const col = idx % statCols;
        const row = Math.floor(idx / statCols);
        const x = MARGIN + col * statColW + statColW / 2;
        const y = curY + 8 + row * statRowH;

        // Value
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(COLORS.primary);
        doc.text(stat.value, x, y + 6, { align: "center" });

        // Label
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(COLORS.muted);
        doc.text(stat.label.toUpperCase(), x, y + 12, { align: "center" });
    });

    curY += statsRows * statRowH + 16;

    // Amenities section
    if (data.amenities.length > 0) {
        // Section header
        doc.setFillColor(COLORS.accent);
        doc.rect(MARGIN, curY, 3, 12, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(COLORS.primary);
        doc.text(t.amenities, MARGIN + 8, curY + 8);
        curY += 18;

        // Amenity pills - 3 columns
        const pillCols = 3;
        const pillColW = CONTENT_W / pillCols;
        const pillRowH = 10;

        data.amenities.forEach((amenity, idx) => {
            const col = idx % pillCols;
            const row = Math.floor(idx / pillCols);
            const x = MARGIN + col * pillColW;
            const y = curY + row * pillRowH;

            // Checkmark
            doc.setFillColor(COLORS.accent);
            doc.circle(x + 3, y + 2.5, 2, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6);
            doc.setTextColor(COLORS.white);
            doc.text("\u2713", x + 3, y + 3.3, { align: "center" });

            // Label
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(COLORS.text);
            doc.text(amenity, x + 8, y + 3.5);
        });

        const amenityRows = Math.ceil(data.amenities.length / pillCols);
        curY += amenityRows * pillRowH + 10;
    }

    // Reserve space for contact bar on page 2 if no gallery page
    const bottomReserve = hasAdditionalPhotos ? 20 : 60;

    // Description section
    if (data.description) {
        const plainDesc = stripHtml(data.description);
        if (plainDesc.trim()) {
            doc.setFillColor(COLORS.primary);
            doc.rect(MARGIN, curY, 3, 12, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(COLORS.primary);
            doc.text(t.description, MARGIN + 8, curY + 8);
            curY += 16;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(COLORS.text);

            const descLines = wrapText(doc, plainDesc, CONTENT_W);
            const maxDescLines = Math.floor((PAGE_H - curY - bottomReserve) / 4.2);
            const truncatedLines = descLines.slice(0, maxDescLines);

            for (const line of truncatedLines) {
                doc.text(line, MARGIN, curY);
                curY += 4.2;
            }

            if (descLines.length > maxDescLines) {
                doc.text("...", MARGIN, curY);
                curY += 4.2;
            }
            curY += 6;
        }
    }

    // Location description
    if (data.locationDescription) {
        const remainingSpace = PAGE_H - curY - bottomReserve;
        if (remainingSpace > 30) {
            doc.setFillColor(COLORS.accent);
            doc.rect(MARGIN, curY, 3, 12, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(COLORS.primary);
            doc.text(t.aboutLocation, MARGIN + 8, curY + 8);
            curY += 16;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(COLORS.text);

            const locLines = wrapText(doc, data.locationDescription, CONTENT_W);
            const maxLocLines = Math.floor((PAGE_H - curY - bottomReserve) / 4.2);
            const truncatedLoc = locLines.slice(0, maxLocLines);

            for (const line of truncatedLoc) {
                doc.text(line, MARGIN, curY);
                curY += 4.2;
            }
        }
    }

    // Contact bar on page 2 if no photo gallery page
    const validAdditional = additionalBase64s.filter(Boolean) as string[];
    if (validAdditional.length === 0) {
        const contactY = PAGE_H - 50;
        doc.setFillColor(COLORS.primary);
        doc.roundedRect(MARGIN, contactY, CONTENT_W, 32, 3, 3, "F");

        if (logoBase64) {
            doc.addImage(logoBase64, "PNG", MARGIN + 6, contactY + 4, 32, 9.6);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(COLORS.white);
        doc.text(t.contact, MARGIN + 6, contactY + 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(COLORS.accent);
        doc.text("+421 911 819 152  |  +421 911 989 895", MARGIN + 6, contactY + 26);

        doc.setTextColor(COLORS.white);
        doc.text("info@relaxproperties.sk", PAGE_W - MARGIN - 6, contactY + 20, { align: "right" });
        doc.text("relaxproperties.sk", PAGE_W - MARGIN - 6, contactY + 26, { align: "right" });
    }

    drawFooter(doc, 2, totalPages);

    // ============================
    // PAGE 3 — PHOTO GALLERY (if additional photos exist)
    // ============================
    if (validAdditional.length > 0) {
        doc.addPage();
        doc.setFillColor(COLORS.white);
        doc.rect(0, 0, PAGE_W, PAGE_H, "F");

        let photoY = MARGIN;

        // Section header
        doc.setFillColor(COLORS.primary);
        doc.rect(MARGIN, photoY, 3, 14, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(COLORS.primary);
        doc.text(t.photoGallery, MARGIN + 8, photoY + 10);
        photoY += 22;

        // Photo grid: 2 columns
        const photoCols = 2;
        const gutter = 4;
        const photoColW = (CONTENT_W - gutter) / photoCols;
        const photoRowH = photoColW * 0.67; // ~3:2 aspect ratio

        for (let idx = 0; idx < validAdditional.length && idx < 8; idx++) {
            const col = idx % photoCols;
            const row = Math.floor(idx / photoCols);
            const x = MARGIN + col * (photoColW + gutter);
            const y = photoY + row * (photoRowH + gutter);

            // Check if we'd overflow the page
            if (y + photoRowH > PAGE_H - 20) break;

            // Rounded clip background
            doc.setFillColor(COLORS.light);
            doc.roundedRect(x, y, photoColW, photoRowH, 2, 2, "F");

            // Draw image covering the cell
            const img = validAdditional[idx];
            const dims = await getImageDimensions(img);
            const imgAspect = dims.width / dims.height;
            const cellAspect = photoColW / photoRowH;

            let drawW: number, drawH: number, drawX: number, drawY: number;
            if (imgAspect > cellAspect) {
                drawH = photoRowH;
                drawW = photoRowH * imgAspect;
                drawX = x - (drawW - photoColW) / 2;
                drawY = y;
            } else {
                drawW = photoColW;
                drawH = photoColW / imgAspect;
                drawX = x;
                drawY = y - (drawH - photoRowH) / 2;
            }

            doc.addImage(img, "JPEG", drawX, drawY, drawW, drawH);

            // Subtle border
            doc.setDrawColor(COLORS.border);
            doc.setLineWidth(0.3);
            doc.roundedRect(x, y, photoColW, photoRowH, 2, 2, "S");
        }

        // Contact section at bottom of photo page
        const contactY = PAGE_H - 50;
        doc.setFillColor(COLORS.primary);
        doc.roundedRect(MARGIN, contactY, CONTENT_W, 32, 3, 3, "F");

        // Logo in contact bar
        if (logoBase64) {
            doc.addImage(logoBase64, "PNG", MARGIN + 6, contactY + 4, 32, 9.6);
        }

        // Contact info
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(COLORS.white);
        doc.text(t.contact, MARGIN + 6, contactY + 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(COLORS.accent);
        doc.text("+421 911 819 152  |  +421 911 989 895", MARGIN + 6, contactY + 26);

        doc.setTextColor(COLORS.white);
        doc.text("info@relaxproperties.sk", PAGE_W - MARGIN - 6, contactY + 20, { align: "right" });
        doc.text("relaxproperties.sk", PAGE_W - MARGIN - 6, contactY + 26, { align: "right" });

        drawFooter(doc, 3, totalPages);
    }

    // ============================
    // SAVE
    // ============================

    const filename = title.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-") + ".pdf";
    doc.save(filename);
}

// ============================================
// COMPONENT
// ============================================

export default function PropertyActions({ title, shareLabel, pdfLabel, pdfData }: PropertyActionsProps) {
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePdf = async () => {
        if (generating || !pdfData) return;
        setGenerating(true);

        try {
            await generatePropertyPdf(title, pdfData);
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex items-center gap-3 mt-4">
            <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-teal)] bg-[var(--color-surface)] rounded-full border border-[var(--color-border)] hover:border-[var(--color-teal)]/30 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                {copied ? "Copied!" : shareLabel}
            </button>
            <button
                onClick={handlePdf}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-teal)] bg-[var(--color-surface)] rounded-full border border-[var(--color-border)] hover:border-[var(--color-teal)]/30 transition-colors disabled:opacity-50"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                {generating
                    ? (pdfData?.lang === "en" ? "Generating..." : pdfData?.lang === "cz" ? "Generuji..." : "Generujem...")
                    : pdfLabel
                }
            </button>
        </div>
    );
}
