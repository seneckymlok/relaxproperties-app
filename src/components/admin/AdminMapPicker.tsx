"use client";

import { useState, useCallback, useRef } from "react";
import {
    GoogleMap,
    Marker,
    Autocomplete,
    useJsApiLoader,
} from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
    width: "100%",
    height: "400px",
    borderRadius: "1rem",
};

const defaultCenter = { lat: 43.5, lng: 16.0 }; // Mediterranean default

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
    ],
};

// Country name → our internal slug mapping
const COUNTRY_SLUG_MAP: Record<string, string> = {
    "bulgaria": "bulgaria",
    "croatia": "croatia",
    "spain": "spain",
    "greece": "greece",
    "slovakia": "slovakia",
    "italy": "italy",
    "montenegro": "montenegro",
    // Common English names
    "republic of croatia": "croatia",
    "hellenic republic": "greece",
    "italian republic": "italy",
    "kingdom of spain": "spain",
    "republic of bulgaria": "bulgaria",
    "slovak republic": "slovakia",
};

export interface GeoData {
    country?: string;   // Our internal slug (e.g. "croatia")
    city?: string;      // Locality or area name
    area?: string;      // Region/county (administrative_area_level_1)
}

interface AdminMapPickerProps {
    lat: number | null;
    lng: number | null;
    zoom: number;
    onLocationChange: (lat: number, lng: number, geoData?: GeoData) => void;
    onZoomChange: (zoom: number) => void;
}

/**
 * Reverse-geocode coordinates using Google Maps Geocoder.
 * Extracts country, city, and area from address components.
 */
async function reverseGeocode(lat: number, lng: number): Promise<GeoData> {
    return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== "OK" || !results || results.length === 0) {
                resolve({});
                return;
            }

            let country: string | undefined;
            let city: string | undefined;
            let area: string | undefined;

            // Go through all results to find the best data
            for (const result of results) {
                for (const component of result.address_components) {
                    const types = component.types;

                    if (types.includes("country") && !country) {
                        // Try to match the country name to our known slugs
                        const name = component.long_name.toLowerCase();
                        const short = component.short_name.toLowerCase();
                        country = COUNTRY_SLUG_MAP[name] || COUNTRY_SLUG_MAP[short] || short;
                    }

                    if (types.includes("locality") && !city) {
                        city = component.long_name;
                    }

                    if (types.includes("administrative_area_level_2") && !city) {
                        // Fallback: use county/district as city
                        city = component.long_name;
                    }

                    if (types.includes("administrative_area_level_1") && !area) {
                        area = component.long_name;
                    }
                }
            }

            resolve({ country, city, area });
        });
    });
}

export default function AdminMapPicker({
    lat,
    lng,
    zoom,
    onLocationChange,
    onZoomChange,
}: AdminMapPickerProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(
        lat && lng ? { lat, lng } : null
    );
    const [geocoding, setGeocoding] = useState(false);

    const handleLocationChange = useCallback(
        async (newLat: number, newLng: number) => {
            setMarkerPos({ lat: newLat, lng: newLng });
            setGeocoding(true);

            try {
                const geoData = await reverseGeocode(newLat, newLng);
                onLocationChange(newLat, newLng, geoData);
            } catch {
                // If geocoding fails, still update coordinates
                onLocationChange(newLat, newLng);
            } finally {
                setGeocoding(false);
            }
        },
        [onLocationChange]
    );

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onMapClick = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            handleLocationChange(e.latLng.lat(), e.latLng.lng());
        },
        [handleLocationChange]
    );

    const onMarkerDragEnd = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            handleLocationChange(e.latLng.lat(), e.latLng.lng());
        },
        [handleLocationChange]
    );

    const onZoomChanged = useCallback(() => {
        if (mapRef.current) {
            onZoomChange(mapRef.current.getZoom() || 14);
        }
    }, [onZoomChange]);

    const onAutocompleteLoad = useCallback(
        (autocomplete: google.maps.places.Autocomplete) => {
            autocompleteRef.current = autocomplete;
        },
        []
    );

    const onPlaceChanged = useCallback(() => {
        if (!autocompleteRef.current) return;
        const place = autocompleteRef.current.getPlace();
        if (place.geometry?.location) {
            const newLat = place.geometry.location.lat();
            const newLng = place.geometry.location.lng();

            if (mapRef.current) {
                mapRef.current.panTo({ lat: newLat, lng: newLng });
                mapRef.current.setZoom(15);
            }

            handleLocationChange(newLat, newLng);
        }
    }, [handleLocationChange]);

    if (loadError) {
        return (
            <div className="w-full h-[400px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center">
                <p className="text-sm text-red-500">Chyba pri načítaní mapy</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-[400px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center">
                <svg className="w-6 h-6 animate-spin text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Google Places Autocomplete */}
            <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                    types: ["geocode", "establishment"],
                    fields: ["geometry", "name", "formatted_address"],
                }}
            >
                <input
                    type="text"
                    placeholder="Vyhľadať adresu, mesto alebo miesto..."
                    className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm"
                />
            </Autocomplete>

            {/* Map */}
            <div className="rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden relative">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={markerPos || defaultCenter}
                    zoom={zoom || 6}
                    onClick={onMapClick}
                    onLoad={onMapLoad}
                    onZoomChanged={onZoomChanged}
                    options={mapOptions}
                >
                    {markerPos && (
                        <Marker
                            position={markerPos}
                            draggable
                            onDragEnd={onMarkerDragEnd}
                        />
                    )}
                </GoogleMap>

                {/* Geocoding indicator */}
                {geocoding && (
                    <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-[var(--color-border)]">
                        <svg className="w-3.5 h-3.5 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-[11px] font-medium text-[var(--color-muted)]">Hľadám adresu…</span>
                    </div>
                )}
            </div>

            <p className="text-[11px] text-[var(--color-muted)] font-medium">
                Vyhľadajte adresu, kliknite na mapu alebo potiahnite pin pre spresnenie polohy. Krajina a mesto sa vyplnia automaticky.
            </p>
        </div>
    );
}
