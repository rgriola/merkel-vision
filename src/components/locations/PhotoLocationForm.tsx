"use client";

import { useState, useEffect } from "react";
import { SaveLocationForm } from "./SaveLocationForm";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { PhotoMetadata } from "@/lib/photo-utils";

interface PhotoLocationFormProps {
    initialData: {
        placeId: string;
        name: string;
        address?: string;
        lat: number;
        lng: number;
        street?: string;
        number?: string;
        city?: string;
        state?: string;
        zipcode?: string;
    };
    photoFile: File;
    photoMetadata: PhotoMetadata;
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * Wrapper around SaveLocationForm for photo-based location creation
 * Pre-fills form with GPS/EXIF data from photo
 * Uploads photo to ImageKit when user saves
 */
export function PhotoLocationForm({
    initialData,
    photoFile,
    photoMetadata,
    onSuccess,
    onCancel,
}: PhotoLocationFormProps) {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>("");

    // Create browser preview URL (no server upload)
    useEffect(() => {
        const objectUrl = URL.createObjectURL(photoFile);
        setPhotoPreviewUrl(objectUrl);

        // Cleanup
        return () => URL.revokeObjectURL(objectUrl);
    }, [photoFile]);

    const handleSubmit = async (data: any) => {
        if (!user) {
            toast.error('User not authenticated');
            return;
        }

        setIsSaving(true);

        try {
            console.log('📸 Starting photo upload and location save...');

            // Step 1: Upload photo to ImageKit
            console.log('📤 Step 1: Uploading photo to ImageKit...');

            // Get ImageKit auth
            const authResponse = await fetch('/api/imagekit/auth');
            if (!authResponse.ok) {
                throw new Error('Failed to get ImageKit authentication');
            }
            const authData = await authResponse.json();

            // Upload to ImageKit
            const formData = new FormData();
            formData.append('file', photoFile);
            formData.append('fileName', photoFile.name.replace(/\s+/g, '-'));
            formData.append('folder', `/users/${user.id}/locations/${initialData.placeId}`);
            formData.append('publicKey', authData.publicKey);
            formData.append('signature', authData.signature);
            formData.append('expire', authData.expire.toString());
            formData.append('token', authData.token);

            const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.text();
                console.error('❌ ImageKit upload failed:', error);
                throw new Error('Failed to upload photo to ImageKit');
            }

            const uploadResult = await uploadResponse.json();
            console.log('✅ Photo uploaded to ImageKit:', uploadResult.fileId);

            // Step 2: Prepare photo data with GPS/EXIF metadata
            const photoData = {
                fileId: uploadResult.fileId,
                filePath: uploadResult.filePath,
                name: photoFile.name,
                size: photoFile.size,
                type: photoFile.type,
                width: uploadResult.width,
                height: uploadResult.height,
                url: uploadResult.url,
                thumbnailUrl: uploadResult.thumbnailUrl,
                // GPS/EXIF metadata
                gpsLatitude: photoMetadata.hasGPS && photoMetadata.lat ? Number(photoMetadata.lat) : null,
                gpsLongitude: photoMetadata.hasGPS && photoMetadata.lng ? Number(photoMetadata.lng) : null,
                gpsAltitude: photoMetadata.altitude ? Number(photoMetadata.altitude) : null,
                hasGpsData: Boolean(photoMetadata.hasGPS),
                cameraMake: photoMetadata.camera?.make || null,
                cameraModel: photoMetadata.camera?.model || null,
                dateTaken: photoMetadata.dateTaken ? photoMetadata.dateTaken.toISOString() : null,
                iso: photoMetadata.iso ? Number(photoMetadata.iso) : null,
                focalLength: photoMetadata.focalLength || null,
                aperture: photoMetadata.aperture || null,
                shutterSpeed: photoMetadata.exposureTime || null,
                orientation: photoMetadata.orientation ? Number(photoMetadata.orientation) : null,
                colorSpace: photoMetadata.colorSpace || null,
                uploadSource: 'photo_gps',
            };

            // Step 3: Save location with photo data
            console.log('📤 Step 2: Saving location with photo data...');

            const apiData = {
                ...data,
                latitude: data.lat,
                longitude: data.lng,
                photos: [photoData], // Include the uploaded photo
            };

            delete apiData.lat;
            delete apiData.lng;

            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ API Error:', error);
                throw new Error(error.error || 'Failed to save location');
            }

            const result = await response.json();
            console.log('✅ Location and photo saved successfully:', result);

            toast.success('Location created from photo!');
            onSuccess();
        } catch (error: any) {
            console.error('❌ Failed to save location:', error);
            toast.error(`Failed to save location: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* GPS Photo Preview */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold">Photo from GPS</h3>

                {/* Photo Preview */}
                {photoPreviewUrl && (
                    <div className="relative rounded-lg overflow-hidden border bg-muted">
                        <img
                            src={photoPreviewUrl}
                            alt="GPS Photo Preview"
                            className="w-full h-auto max-h-96 object-contain"
                        />
                    </div>
                )}

                {/* GPS Data Info */}
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-700 dark:text-green-300">
                        ✅ <strong>GPS coordinates detected!</strong> Location: {photoMetadata.lat.toFixed(6)}, {photoMetadata.lng.toFixed(6)}
                    </p>
                    {photoMetadata.dateTaken && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            📅 {photoMetadata.dateTaken.toLocaleString()}
                            {photoMetadata.camera?.make && ` • 📷 ${photoMetadata.camera.make} ${photoMetadata.camera.model || ''}`}
                        </p>
                    )}
                </div>
            </div>

            {/* Use existing SaveLocationForm (without ImageKitUploader section) */}
            <SaveLocationForm
                initialData={initialData}
                onSubmit={handleSubmit}
                isPending={isSaving}
                hidePhotoUpload={true} // ✅ Hide photo upload since we already have the GPS photo
            />

            <div className="flex gap-3">
                <button
                    type="submit"
                    form="save-location-form"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isSaving ? 'Saving Location...' : 'Save Location with GPS Photo'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-4 py-2 border border-input rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
