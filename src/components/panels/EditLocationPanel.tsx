"use client";

import { Button } from "@/components/ui/button";
import { useUpdateLocation } from "@/hooks/useUpdateLocation";
import { UserSave, Location } from "@/types/location";
import { EditLocationForm } from "@/components/locations/EditLocationForm";

interface EditLocationPanelProps {
    locationId: number;
    location: Location;
    userSave: UserSave;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function EditLocationPanel({
    locationId,
    location,
    userSave,
    onSuccess,
    onCancel,
}: EditLocationPanelProps) {
    const updateLocation = useUpdateLocation();

    const handleSubmit = (data: any) => {
        console.log('[EditLocationPanel] Updating location:', data);

        updateLocation.mutate(data, {
            onSuccess: () => {
                onSuccess?.();
            },
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Form - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3">
                <EditLocationForm
                    locationId={locationId}
                    location={location}
                    userSave={userSave}
                    onSubmit={handleSubmit}
                    isPending={updateLocation.isPending}
                />
            </div>

            {/* Footer with Actions */}
            <div className="p-3 border-t">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={updateLocation.isPending}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="edit-location-form"
                        disabled={updateLocation.isPending}
                        className="flex-1"
                    >
                        {updateLocation.isPending ? "Updating..." : "Update"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
