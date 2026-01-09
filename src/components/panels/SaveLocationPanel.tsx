"use client";

import { useEffect, useRef } from "react";
import { useSaveLocation } from "@/hooks/useSaveLocation";
import { SaveLocationForm } from "@/components/locations/SaveLocationForm";

interface SaveLocationPanelProps {
    initialData?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
    showPhotoUpload?: boolean;
    onSavingChange?: (isSaving: boolean) => void; // Callback to expose save state to parent
}

export function SaveLocationPanel({
    initialData,
    onSuccess,
    onCancel,
    showPhotoUpload = false,
    onSavingChange,
}: SaveLocationPanelProps) {
    const saveLocation = useSaveLocation();
    const formDataRef = useRef<any>(null);

    // Notify parent component when save state changes
    useEffect(() => {
        onSavingChange?.(saveLocation.isPending);
    }, [saveLocation.isPending, onSavingChange]);

    const handleSubmit = (data: any) => {
        // Store for quick save
        formDataRef.current = data;

        console.log('[SaveLocationPanel] Submitting data:', data);

        saveLocation.mutate(data, {
            onSuccess: () => {
                onSuccess?.();
            },
        });
    };

    const handleQuickSave = () => {
        if (!formDataRef.current) return;

        const data = formDataRef.current;
        saveLocation.mutate(
            {
                placeId: data.placeId,
                name: data.name,
                address: data.address,
                lat: data.lat,
                lng: data.lng,
                type: data.type,
                isPermanent: false,
            },
            {
                onSuccess: () => {
                    console.log("Quick save successful - reminder email queued");
                    onSuccess?.();
                },
            }
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Form - Full height scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">
                <SaveLocationForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isPending={saveLocation.isPending}
                    showPhotoUpload={showPhotoUpload}
                />
            </div>
        </div>
    );
}
