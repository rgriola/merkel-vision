"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSaveLocation } from "@/hooks/useSaveLocation";
import { MapPin, Tag, X, Zap } from "lucide-react";
import { ImageKitUploader } from "@/components/ui/ImageKitUploader";

const saveLocationSchema = z.object({
    placeId: z.string().min(1, "Place ID is required"),
    name: z.string().min(1, "Location name is required"),
    address: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    type: z.string().optional(),

    // Address components
    street: z.string().optional(),
    number: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipcode: z.string().optional(),

    // Production details
    productionNotes: z.string().max(500).optional(),
    entryPoint: z.string().optional(),
    parking: z.string().optional(),
    access: z.string().optional(),

    // User save details
    caption: z.string().max(200).optional(),
    isFavorite: z.boolean().optional(),
    personalRating: z.number().min(0).max(5).optional(),
    color: z.string().optional(),
});

type SaveLocationFormData = z.infer<typeof saveLocationSchema>;

interface SaveLocationPanelProps {
    initialData?: Partial<SaveLocationFormData>;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const LOCATION_TYPES = [
    "BROLL",
    "STORY",
    "INTERVIEW",
    "LIVE ANCHOR",
    "REPORTER LIVE",
    "STAKEOUT",
    "DRONE",
    "SCENE",
    "OTHER",
    "HQ",
    "BUREAU",
    "REMOTE STAFF",
];

const MARKER_COLORS = [
    { value: "#EF4444", label: "Red" },
    { value: "#F59E0B", label: "Orange" },
    { value: "#EAB308", label: "Yellow" },
    { value: "#22C55E", label: "Green" },
    { value: "#3B82F6", label: "Blue" },
    { value: "#8B5CF6", label: "Purple" },
    { value: "#EC4899", label: "Pink" },
];

export function SaveLocationPanel({
    initialData,
    onSuccess,
    onCancel,
}: SaveLocationPanelProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [photos, setPhotos] = useState<any[]>([]);

    const saveLocation = useSaveLocation();

    const form = useForm<SaveLocationFormData>({
        resolver: zodResolver(saveLocationSchema),
        defaultValues: {
            placeId: initialData?.placeId || "",
            name: initialData?.name || "",
            address: initialData?.address || "",
            lat: initialData?.lat || 0,
            lng: initialData?.lng || 0,
            type: initialData?.type || "",
            street: initialData?.street || "",
            number: initialData?.number || "",
            city: initialData?.city || "",
            state: initialData?.state || "",
            zipcode: initialData?.zipcode || "",
            isFavorite: initialData?.isFavorite || false,
            personalRating: initialData?.personalRating || 0,
            color: initialData?.color || "#EF4444",
            ...initialData,
        },
    });

    // Update form when initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset({
                placeId: initialData.placeId || "",
                name: initialData.name || "",
                address: initialData.address || "",
                lat: initialData.lat || 0,
                lng: initialData.lng || 0,
                type: initialData.type || "",
                street: initialData.street || "",
                number: initialData.number || "",
                city: initialData.city || "",
                state: initialData.state || "",
                zipcode: initialData.zipcode || "",
                isFavorite: initialData.isFavorite || false,
                personalRating: initialData.personalRating || 0,
                color: initialData.color || "#EF4444",
                ...initialData,
            });
        }
    }, [initialData, form]);

    const onSubmit = (data: SaveLocationFormData) => {
        saveLocation.mutate(
            {
                ...data,
                tags: tags.length > 0 ? tags : undefined,
                photos: photos.length > 0 ? photos : undefined,
            },
            {
                onSuccess: () => {
                    form.reset();
                    setTags([]);
                    setPhotos([]);
                    onSuccess?.();
                },
            }
        );
    };

    const handleQuickSave = () => {
        const data = form.getValues();
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
                    form.reset();
                    setTags([]);
                    setPhotos([]);
                    onSuccess?.();
                },
            }
        );
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 20) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        } else if (tags.length >= 20) {
            // Show error toast if needed
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    // Character count helpers
    const captionCount = form.watch("caption")?.length || 0;
    const productionNotesCount = form.watch("productionNotes")?.length || 0;

    return (
        <div className="flex flex-col h-full">
            {/* Form - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Location Fields */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="name">Location Name *</Label>
                                <Input
                                    id="name"
                                    {...form.register("name")}
                                    placeholder="e.g., Central Park"
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-destructive mt-1">
                                        {form.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="address">Full Address (from Google)</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        id="address"
                                        {...form.register("address")}
                                        placeholder="123 Main St, New York, NY 10001"
                                        className="pl-9"
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* Address Components - Hidden for now */}
                            {/* 
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="number">Street Number</Label>
                                    <Input
                                        id="number"
                                        {...form.register("number")}
                                        placeholder="123"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="street">Street Name</Label>
                                    <Input
                                        id="street"
                                        {...form.register("street")}
                                        placeholder="Main St"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        {...form.register("city")}
                                        placeholder="New York"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        {...form.register("state")}
                                        placeholder="NY"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="zipcode">ZIP Code</Label>
                                <Input
                                    id="zipcode"
                                    {...form.register("zipcode")}
                                    placeholder="10001"
                                    readOnly
                                />
                            </div>
                            */}

                            {/* GPS Coordinates Display */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-md border">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Latitude</Label>
                                    <p className="text-sm font-mono font-medium">
                                        {form.watch("lat")?.toFixed(6) || "0.000000"}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Longitude</Label>
                                    <p className="text-sm font-mono font-medium">
                                        {form.watch("lng")?.toFixed(6) || "0.000000"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue("type", value)}
                                        defaultValue={form.getValues("type")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LOCATION_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="color">Marker Color</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue("color", value)}
                                        defaultValue={form.getValues("color")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MARKER_COLORS.map((color) => (
                                                <SelectItem key={color.value} value={color.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded-full border"
                                                            style={{ backgroundColor: color.value }}
                                                        />
                                                        {color.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Production Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Production Details (Optional)</h3>

                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="entryPoint">Entry Point</Label>
                                <Input
                                    id="entryPoint"
                                    {...form.register("entryPoint")}
                                    placeholder="Main entrance"
                                />
                            </div>

                            <div>
                                <Label htmlFor="parking">Parking</Label>
                                <Input
                                    id="parking"
                                    {...form.register("parking")}
                                    placeholder="Parking info"
                                />
                            </div>

                            <div>
                                <Label htmlFor="access">Access</Label>
                                <Input
                                    id="access"
                                    {...form.register("access")}
                                    placeholder="How to access"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="productionNotes">Production Notes</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {productionNotesCount}/500 characters
                                    </span>
                                </div>
                                <Textarea
                                    id="productionNotes"
                                    {...form.register("productionNotes")}
                                    placeholder="Special considerations..."
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Personal Notes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Personal Notes</h3>

                        <div>
                            <div className="flex justify-between items-center">
                                <Label htmlFor="caption">Caption / Notes</Label>
                                <span className="text-xs text-muted-foreground">
                                    {captionCount}/200 characters
                                </span>
                            </div>
                            <Textarea
                                id="caption"
                                {...form.register("caption")}
                                placeholder="Add your notes..."
                                rows={2}
                                maxLength={200}
                            />
                        </div>

                        <div>
                            <Label htmlFor="tags">Tags (max 20)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    placeholder="Add tags..."
                                    maxLength={25}
                                />
                                <Button type="button" onClick={handleAddTag} variant="outline" size="icon">
                                    <Tag className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {tags.length}/20 tags • Max 25 characters per tag
                            </p>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="gap-1">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="personalRating">Rating</Label>
                                <Select
                                    onValueChange={(value) =>
                                        form.setValue("personalRating", parseInt(value))
                                    }
                                    defaultValue={form.getValues("personalRating")?.toString()}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Rate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">No rating</SelectItem>
                                        <SelectItem value="1">⭐</SelectItem>
                                        <SelectItem value="2">⭐⭐</SelectItem>
                                        <SelectItem value="3">⭐⭐⭐</SelectItem>
                                        <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                                        <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...form.register("isFavorite")}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm">Favorite</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Photos (Optional)</h3>
                        <ImageKitUploader
                            placeId={form.watch("placeId")}
                            onPhotosChange={setPhotos}
                            maxPhotos={20}
                            maxFileSize={1.5}
                        />
                    </div>
                </form>
            </div>

            {/* Footer with Actions */}
            <div className="p-4 border-t space-y-2">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={saveLocation.isPending}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={saveLocation.isPending}
                        className="flex-1"
                    >
                        {saveLocation.isPending ? "Saving..." : "Save"}
                    </Button>
                </div>

                {/* Quick Save Button */}
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleQuickSave}
                    disabled={saveLocation.isPending || !form.watch("name")}
                    className="w-full"
                >
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Save (Complete Later)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                    Quick save stores basic info. You'll get a reminder email to complete details.
                </p>
            </div>
        </div>
    );
}
