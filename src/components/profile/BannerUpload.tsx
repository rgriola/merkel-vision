'use client';

import { useState, useRef } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { IMAGEKIT_URL_ENDPOINT, getImageKitFolder } from '@/lib/imagekit';
import Image from 'next/image';

interface BannerUploadProps {
    currentBanner?: string | null;
}

// ImageKit authenticator
const authenticator = async () => {
    try {
        const response = await fetch('/api/imagekit/auth');
        if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('ImageKit auth error:', error);
        throw error;
    }
};

export function BannerUpload({ currentBanner }: BannerUploadProps) {
    const { user, refetchUser } = useAuth();
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentBanner || null);
    const [imageError, setImageError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const ikUploadRef = useRef<HTMLInputElement | null>(null);

    const onError = (err: unknown) => {
        console.error('Banner upload error:', err);
        let errorMessage = 'Failed to upload banner';
        if (err && typeof err === 'object' && 'message' in err) {
            errorMessage = String(err.message);
        }
        toast.error(errorMessage);
        setIsUploading(false);
    };

    const onSuccess = async (res: unknown) => {
        try {
            // Type guard for ImageKit upload response
            if (!res || typeof res !== 'object' || !('url' in res) || !('fileId' in res)) {
                toast.error('Invalid upload response');
                setIsUploading(false);
                return;
            }

            const uploadResult = res as { url: string; fileId: string };

            // Update user's banner in database
            const response = await fetch('/api/auth/banner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bannerUrl: uploadResult.url,
                    fileId: uploadResult.fileId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to update banner');
                return;
            }

            toast.success('Banner updated successfully');
            setPreviewUrl(uploadResult.url);
            await refetchUser();
        } catch (error) {
            console.error('Banner update error:', error);
            toast.error('Failed to update banner');
        } finally {
            setIsUploading(false);
        }
    };

    const onUploadStart = () => {
        setIsUploading(true);
        toast.info('Uploading banner...');
    };

    return (
        <div className="relative w-full h-[240px] md:h-[300px] group overflow-hidden rounded-t-lg">
            {/* Banner Image */}
            {previewUrl && !imageError ? (
                <Image
                    src={`${previewUrl}?tr=w-1200,h-400,c-at_max,fo-auto,q-85`}
                    alt="Profile banner"
                    fill
                    className="object-cover"
                    priority
                    onError={() => setImageError(true)}
                    unoptimized={previewUrl.startsWith('data:')}
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
            )}

            {/* Overlay for better visibility */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

            {/* Upload Button */}
            <IKContext
                publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''}
                urlEndpoint={IMAGEKIT_URL_ENDPOINT}
                authenticator={authenticator}
            >
                <div className="absolute bottom-4 right-4 z-10">
                    <label
                        htmlFor="banner-upload"
                        className={`flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg shadow-lg transition-all cursor-pointer ${
                            isUploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Change banner image"
                    >
                        <Camera className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {isUploading ? 'Uploading...' : 'Edit Banner'}
                        </span>
                    </label>
                    <IKUpload
                        id="banner-upload"
                        ref={ikUploadRef}
                        fileName={`banner-${user?.id}-${Date.now()}`}
                        folder={getImageKitFolder(`users/${user?.id}/banners`)}
                        tags={['banner', 'profile']}
                        useUniqueFileName={true}
                        onError={onError}
                        onSuccess={onSuccess}
                        onUploadStart={onUploadStart}
                        className="hidden"
                        accept="image/*"
                        transformation={{
                            post: [
                                {
                                    type: 'transformation',
                                    value: 'w-1200,h-400,c-at_max',
                                },
                            ],
                        }}
                    />
                </div>
            </IKContext>
        </div>
    );
}
