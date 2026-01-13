"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PhotoUploadWithGPS } from "@/components/photos/PhotoUploadWithGPS";
import { PhotoLocationForm } from "@/components/locations/PhotoLocationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, MapPin } from "lucide-react";
import type { PhotoMetadata } from "@/lib/photo-utils";

function CreateWithPhotoPageInner() {
    const router = useRouter();
    const [step, setStep] = useState<'upload' | 'location'>('upload');
    const [photoData, setPhotoData] = useState<{
        file: File;
        preview: string;
        gpsData: PhotoMetadata;
        addressData?: Record<string, unknown>;
    } | null>(null);

    // Generate stable placeId once on mount
    // eslint-disable-next-line react-hooks/purity
    const fallbackPlaceIdRef = useRef(`photo-${Date.now()}`);

    const handlePhotoProcessed = (data: {
        file: File;
        preview: string;
        gpsData: PhotoMetadata;
        addressData?: Record<string, unknown>;
    }) => {
        setPhotoData(data);
        setStep('location');
    };

    const handleLocationSaved = () => {
        // Success! Navigate to locations page
        router.push('/locations');
    };

    const handleBack = () => {
        if (step === 'location') {
            setStep('upload');
            setPhotoData(null);
        } else {
            router.push('/map');
        }
    };

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {step === 'upload' ? 'Back to Map' : 'Back to Upload'}
                </Button>

                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Snap & Save</h1>
                        <p className="text-muted-foreground">
                            {step === 'upload'
                                ? 'Upload a photo with GPS data to get started'
                                : 'Review and complete location details'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-primary' : 'text-green-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-primary text-white' : 'bg-green-600 text-white'}`}>
                            {step === 'location' ? '✓' : '1'}
                        </div>
                        <span className="text-sm font-medium">Upload Photo</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-800"></div>
                    <div className={`flex items-center gap-2 ${step === 'location' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'location' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
                            2
                        </div>
                        <span className="text-sm font-medium">Location Details</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            {step === 'upload' && (
                <PhotoUploadWithGPS
                    onPhotoProcessed={handlePhotoProcessed}
                    onCancel={() => router.push('/map')}
                />
            )}

            {step === 'location' && photoData && (
                <div className="space-y-6">
                    {/* Photo Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="w-5 h-5" />
                                Photo Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="relative w-full h-48">
                                <Image
                                    src={photoData.preview}
                                    alt="Location photo"
                                    fill
                                    className="rounded-lg object-cover"
                                />
                            </div>
                            <div className="space-y-3">
                                {photoData.gpsData.hasGPS && (
                                    <>
                                        <div>
                                            <p className="text-sm font-medium flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-green-600" />
                                                GPS Coordinates
                                            </p>
                                            <p className="text-sm text-muted-foreground font-mono">
                                                {photoData.gpsData.lat.toFixed(6)}, {photoData.gpsData.lng.toFixed(6)}
                                            </p>
                                        </div>
                                        {photoData.addressData && (
                                            <div>
                                                <p className="text-sm font-medium">Address</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {photoData.addressData.address as string}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                                {photoData.gpsData.dateTaken && (
                                    <div>
                                        <p className="text-sm font-medium">Photo Taken</p>
                                        <p className="text-sm text-muted-foreground">
                                            {photoData.gpsData.dateTaken.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Location Details</CardTitle>
                            <CardDescription>
                                Complete the information below to save this location
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PhotoLocationForm
                                initialData={{
                                    placeId: (photoData.addressData?.placeId as string) || fallbackPlaceIdRef.current,
                                    name: (photoData.addressData?.name as string) || 'Photo Location',
                                    address: photoData.addressData?.address as string,
                                    lat: photoData.gpsData.lat,
                                    lng: photoData.gpsData.lng,
                                    street: photoData.addressData?.street as string,
                                    number: photoData.addressData?.number as string,
                                    city: photoData.addressData?.city as string,
                                    state: photoData.addressData?.state as string,
                                    zipcode: photoData.addressData?.zipcode as string,
                                }}
                                photoMetadata={photoData.gpsData}
                                photoFile={photoData.file}
                                onSuccess={handleLocationSaved}
                                onCancel={() => setStep('upload')}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Help Text */}
            <Card className="mt-8 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <div className="text-blue-600">ℹ️</div>
                        <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
                            <p className="font-medium mb-1">How it works:</p>
                            <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
                                <li>Upload a photo with GPS EXIF data</li>
                                <li>We automatically extract the GPS coordinates</li>
                                <li>Preview the location and add details</li>
                                <li>Save to your locations with the photo attached</li>
                            </ol>
                            <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                                Note: If your photo doesn't have GPS data, you'll need to select the location manually on the map.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CreateWithPhotoPage() {
    return (
        <ProtectedRoute>
            <CreateWithPhotoPageInner />
        </ProtectedRoute>
    );
}
