import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Location } from '@/types/location';

interface SaveLocationData {
    placeId: string;
    name: string;
    address?: string;
    lat: number;
    lng: number;
    type?: string;
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    productionNotes?: string;
    entryPoint?: string;
    parking?: string;
    access?: string;
    isPermanent?: boolean;
    caption?: string;
    tags?: string[];
    isFavorite?: boolean;
    personalRating?: number;
    color?: string;
    photos?: any[]; // ImageKit photo data
}

export function useSaveLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: SaveLocationData) => {
            // Map frontend field names to API field names
            const apiData = {
                ...data,
                latitude: data.lat,  // API expects 'latitude'
                longitude: data.lng, // API expects 'longitude'
            };

            // Remove the original lat/lng fields to avoid confusion
            delete (apiData as any).lat;
            delete (apiData as any).lng;

            // Extract photos to handle separately
            const photos = data.photos;
            delete (apiData as any).photos;

            // Save location first
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(apiData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save location');
            }

            const result = await response.json();

            // Save photos if provided
            if (photos && photos.length > 0) {
                const photoPromises = photos.map(photo =>
                    fetch('/api/photos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            placeId: data.placeId,
                            ...photo,
                        }),
                    })
                );

                await Promise.all(photoPromises);
            }

            return result;
        },
        onSuccess: (data) => {
            // Invalidate and refetch locations
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location saved successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to save location');
        },
    });
}
