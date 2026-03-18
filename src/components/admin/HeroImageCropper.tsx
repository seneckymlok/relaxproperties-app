"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

const HERO_ASPECT = 1920 / 500; // ~3.84:1

interface HeroImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

/**
 * Crop the selected area from the image using an offscreen canvas.
 */
async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Canvas toBlob failed"));
            },
            "image/jpeg",
            0.92
        );
    });
}

export default function HeroImageCropper({
    imageSrc,
    onCropComplete,
    onCancel,
}: HeroImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [saving, setSaving] = useState(false);

    const onCropChange = useCallback((_: unknown, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setSaving(true);
        try {
            const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
            onCropComplete(blob);
        } catch (error) {
            console.error("Crop error:", error);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-4xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--color-border)]">
                    <h2 className="text-lg font-semibold text-[var(--color-secondary)]">
                        Orezať hero obrázok
                    </h2>
                    <p className="text-sm text-[var(--color-muted)] mt-0.5">
                        Posuňte a priblížte obrázok pre výber časti, ktorú chcete použiť.
                    </p>
                </div>

                {/* Crop area */}
                <div className="relative w-full" style={{ height: "60vh" }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={HERO_ASPECT}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropChange}
                        showGrid
                        style={{
                            containerStyle: { background: "#1a1a1a" },
                        }}
                    />
                </div>

                {/* Zoom slider */}
                <div className="px-6 py-3 flex items-center gap-3 border-t border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">Priblíženie</span>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-[var(--color-primary)]"
                    />
                </div>

                {/* Actions */}
                <div className="px-6 py-4 flex justify-end gap-3 border-t border-[var(--color-border)]">
                    <button
                        onClick={onCancel}
                        disabled={saving}
                        className="px-5 py-2.5 text-sm font-medium text-[var(--color-muted)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
                    >
                        Zrušiť
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !croppedAreaPixels}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving && (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        Použiť orezaný obrázok
                    </button>
                </div>
            </div>
        </div>
    );
}
