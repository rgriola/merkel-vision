'use client';

import { useState, useEffect, useRef } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getOptimizedAvatarUrl, IMAGEKIT_URL_ENDPOINT, getImageKitFolder } from '@/lib/imagekit';
import Image from 'next/image';
import { ImageEditor } from './ImageEditor';

interface AvatarUploadProps {
    currentAvatar?: string | null;
}

// ImageKit authenticator
const authenticator = async () => {
    try {
        console.log('Fetching ImageKit auth...');
        const response = await fetch('/api/imagekit/auth');

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Auth response error:', response.status, errorText);
            throw new Error(`Authentication failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('ImageKit auth successful:', { ...data, signature: '***' });
        return data;
    } catch (error) {
        console.error('ImageKit auth error:', error);
        throw error;
    }
};

export function AvatarUpload({ currentAvatar }: AvatarUploadProps) {
    const { user, refetchUser } = useAuth();
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
    const [imageError, setImageError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const ikUploadRef = useRef<HTMLInputElement | null>(null);

    // Sync preview with prop changes
    useEffect(() => {
        setPreviewUrl(currentAvatar || null);
        setImageError(false);
    }, [currentAvatar]);

    const onError = (err: any) => {
        console.error('ImageKit upload error:', err);
        console.error('Error type:', typeof err);
        console.error('Error keys:', Object.keys(err || {}));
        console.error('Error details:', JSON.stringify(err, null, 2));
        console.error('Error message:', err?.message);
        console.error('Error response:', err?.response);
        console.error('Error help:', err?.help);

        // Determine error message
        let errorMessage = 'Failed to upload image';
        
        if (err?.message) {
            errorMessage = err.message;
        } else if (err?.help) {
            errorMessage = err.help;
        } else if (err?.response?.data?.message) {
            errorMessage = err.response.data.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        toast.error(errorMessage);
        setIsUploading(false);
    };

    const onSuccess = async (res: any) => {
        console.log('ImageKit upload success:', res);

        try {
            // Update user's avatar in database
            const response = await fetch('/api/auth/avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    avatarUrl: res.url,
                    fileId: res.fileId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to update avatar');
                return;
            }

            toast.success('Avatar updated successfully');
            setPreviewUrl(res.url);

            // Refresh user data
            await refetchUser();
        } catch (error) {
            console.error('Avatar update error:', error);
            toast.error('Failed to update avatar');
        } finally {
            setIsUploading(false);
        }
    };

    const onUploadStart = () => {
        setIsUploading(true);
        toast.info('Uploading image...');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }

            setSelectedFile(file);
            setEditorOpen(true);
        }
    };

    const handleEditorSave = async (croppedBlob: Blob, fileName: string) => {
        try {
            // Convert blob to file
            const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });

            // Trigger ImageKit upload programmatically
            if (ikUploadRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                ikUploadRef.current.files = dataTransfer.files;

                // Trigger change event to start upload
                const event = new Event('change', { bubbles: true });
                ikUploadRef.current.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Error uploading edited image:', error);
            toast.error('Failed to upload edited image');
        }
    };

    return (
        <>
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                <div className="relative h-[200px] md:h-[240px]">
                    {/* Background Image / Banner */}
                    <div className="absolute inset-0">
                        {previewUrl && !imageError ? (
                            <Image
                                src={getOptimizedAvatarUrl(previewUrl, 256) || previewUrl}
                                alt="Profile banner"
                                fill
                                className="object-cover"
                                priority
                                onError={() => {
                                    setImageError(true);
                                }}
                                unoptimized={previewUrl.startsWith('data:')}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
                        )}
                        {/* Overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                    </div>

                    {/* Content Overlay */}
                    <div className="relative h-full flex items-center px-6 md:px-8">
                        {/* User Info - Centered */}
                        <div className="text-white space-y-1 z-10 flex-1">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                                {user?.firstName && user?.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user?.username}
                            </h2>
                            <p className="text-base md:text-lg font-medium opacity-90">
                                @{user?.username}
                            </p>
                            <p className="text-sm md:text-base opacity-80">
                                {user?.email}
                            </p>
                        </div>

                        {/* Hover-triggered upload - Avatar-style circular area on right */}
                        <label
                            htmlFor="avatar-file-select"
                            className={`relative group flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer z-10 ${
                                isUploading ? 'cursor-not-allowed' : ''
                            }`}
                            title="Change profile image"
                        >
                            {/* Avatar preview */}
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 relative">
                                {previewUrl && !imageError ? (
                                    <Image
                                        src={getOptimizedAvatarUrl(previewUrl, 256) || previewUrl}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                        priority
                                        onError={() => setImageError(true)}
                                        unoptimized={previewUrl.startsWith('data:')}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                                    </div>
                                )}

                                {/* Hover overlay with camera icon */}
                                <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
                                    isUploading ? 'opacity-100' : ''
                                }`}>
                                    <Camera className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                            </div>

                            {/* Hidden file input for initial selection */}
                            <input
                                id="avatar-file-select"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </label>

                        {/* Hidden ImageKit upload component (triggered after editing) */}
                        <IKContext
                            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''}
                            urlEndpoint={IMAGEKIT_URL_ENDPOINT}
                            authenticator={authenticator}
                        >
                            <IKUpload
                                ref={ikUploadRef}
                                fileName={`avatar-${user?.id}-${Date.now()}`}
                                folder={getImageKitFolder(`users/${user?.id}/avatars`)}
                                tags={['avatar', 'profile']}
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
                                            value: 'w-400,h-400,c-at_max',
                                        },
                                    ],
                                }}
                            />
                        </IKContext>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Image Editor Modal */}
        <ImageEditor
            open={editorOpen}
            onClose={() => {
                setEditorOpen(false);
                setSelectedFile(null);
            }}
            imageFile={selectedFile}
            onSave={handleEditorSave}
        />
        </>
    );
}
