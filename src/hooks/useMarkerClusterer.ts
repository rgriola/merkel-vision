'use client';

import { useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

interface UseMarkerClustererOptions {
    map: google.maps.Map | null;
    markers: google.maps.Marker[];
}

/**
 * Custom hook to manage marker clustering
 * Automatically creates/updates a MarkerClusterer when map or markers change
 */
export function useMarkerClusterer({ map, markers }: UseMarkerClustererOptions) {
    const clustererRef = useRef<MarkerClusterer | null>(null);

    useEffect(() => {
        if (!map) return;

        // Clean up existing clusterer
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }

        // Create new clusterer with custom styling
        clustererRef.current = new MarkerClusterer({
            map,
            markers,
            renderer: {
                render: ({ count, position }) => {
                    // Custom cluster marker styling
                    const color = count > 10 ? '#DC2626' : count > 5 ? '#F59E0B' : '#3B82F6';

                    return new google.maps.Marker({
                        position,
                        icon: {
                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                                    <!-- Outer circle -->
                                    <circle cx="30" cy="30" r="28" fill="${color}" opacity="0.3"/>
                                    <!-- Inner circle -->
                                    <circle cx="30" cy="30" r="22" fill="${color}" stroke="white" stroke-width="3"/>
                                    <!-- Count text -->
                                    <text x="30" y="36" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial">
                                        ${count}
                                    </text>
                                </svg>
                            `)}`,
                            scaledSize: new google.maps.Size(60, 60),
                            anchor: new google.maps.Point(30, 30),
                        },
                        label: undefined,
                        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
                    });
                },
            },
        });

        // Cleanup function
        return () => {
            if (clustererRef.current) {
                clustererRef.current.clearMarkers();
                clustererRef.current.setMap(null);
            }
        };
    }, [map, markers]);

    return clustererRef.current;
}
