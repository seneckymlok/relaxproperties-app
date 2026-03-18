"use client";

import { useCallback, useRef } from "react";
import {
    GoogleMap,
    Marker,
    useJsApiLoader,
} from "@react-google-maps/api";

const mapContainerStyle = {
    width: "100%",
    height: "380px",
    borderRadius: "1rem",
};

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    scrollwheel: false,
    styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
    ],
};

interface PropertyMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    title?: string;
}

export default function PropertyMap({ lat, lng, zoom = 14, title }: PropertyMapProps) {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

    const onMarkerClick = useCallback(
        (marker: google.maps.Marker) => {
            if (!title) return;
            if (infoWindowRef.current) {
                infoWindowRef.current.close();
            }
            const infoWindow = new google.maps.InfoWindow({
                content: `<div style="font-weight:600;font-size:13px;padding:2px 4px;">${title}</div>`,
            });
            infoWindow.open(marker.getMap(), marker);
            infoWindowRef.current = infoWindow;
        },
        [title]
    );

    if (!isLoaded) {
        return (
            <div className="w-full h-[380px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center">
                <svg className="w-6 h-6 animate-spin text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat, lng }}
                zoom={zoom}
                options={mapOptions}
            >
                <Marker
                    position={{ lat, lng }}
                    onClick={(e) => {
                        // Access the marker from the event
                        if (e.domEvent?.target) {
                            // Create info window at marker position
                            const map = (e as unknown as { map: google.maps.Map }).map;
                            if (title && map) {
                                const infoWindow = new google.maps.InfoWindow({
                                    content: `<div style="font-weight:600;font-size:13px;padding:2px 4px;">${title}</div>`,
                                    position: { lat, lng },
                                });
                                infoWindow.open(map);
                            }
                        }
                    }}
                />
            </GoogleMap>
        </div>
    );
}
