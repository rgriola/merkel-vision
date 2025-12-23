"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSaveLocation } from "@/hooks/useSaveLocation";
import { SaveLocationForm } from "@/components/locations/SaveLocationForm";

interface SaveLocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
}

export function SaveLocationDialog({
    open,
    onOpenChange,
    initialData,
}: SaveLocationDialogProps) {
    const saveLocation = useSaveLocation();

    const handleSubmit = (data: any) => {
        saveLocation.mutate(data, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Save New Location</DialogTitle>
                    <DialogDescription>
                        Add a new location to your collection with details and notes.
                    </DialogDescription>
                </DialogHeader>

                <SaveLocationForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isPending={saveLocation.isPending}
                />

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saveLocation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="save-location-form"
                        disabled={saveLocation.isPending}
                    >
                        {saveLocation.isPending ? "Saving..." : "Save Location"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
