'use client';

import { useState, useRef, useEffect } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { IMAGEKIT_URL_ENDPOINT, getImageKitFolder } from '@/lib/imagekit';
import Image from 'next/image';
import { ImageEditor } from './ImageEditor';
import BannerEditor from './BannerEditor';

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

export function ProfileHeader() {
    const { user, refetchUser } = useAuth();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(user?.bannerImage || null);
    const [avatarError, setAvatarError] = useState(false);
    const [bannerError, setBannerError] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [bannerEditorOpen, setBannerEditorOpen] = useState(false);
    const avatarUploadRef = useRef<HTMLInputElement | null>(null);
    const bannerUploadRef = useRef<HTMLInputElement | null>(null);

    // Sync preview states with user data
    useEffect(() => {
        if (user?.avatar) {
            setAvatarPreview(user.avatar);
        }
        if (user?.bannerImage) {
            setBannerPreview(user.bannerImage);
        }
    }, [user?.avatar, user?.bannerImage]);

    // Avatar handlers
    const onAvatarError = (err: any) => {
        console.error('Avatar upload error:', err);
        toast.error(err?.message || 'Failed to upload avatar');
        setIsUploadingAvatar(false);
    };

    const onAvatarSuccess = async (res: any) => {
        try {
            const response = await fetch('/api/auth/avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarUrl: res.url, fileId: res.fileId }),
            });

            const result = await response.json();
            if (!response.ok) {
                toast.error(result.error || 'Failed to update avatar');
                return;
            }

            toast.success('Avatar updated successfully');
            setAvatarPreview(res.url);
            await refetchUser();
        } catch (error) {
            console.error('Avatar update error:', error);
            toast.error('Failed to update avatar');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
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
            const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
            if (avatarUploadRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                avatarUploadRef.current.files = dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                avatarUploadRef.current.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Error uploading edited image:', error);
            toast.error('Failed to upload edited image');
        }
    };

    // Banner handlers
    const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Image must be less than 10MB');
                return;
            }
            setSelectedBannerFile(file);
            setBannerEditorOpen(true);
        }
    };

    const handleBannerEditorSave = async (croppedBlob: Blob) => {
        try {
            const fileName = selectedBannerFile?.name || 'banner.jpg';
            const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
            if (bannerUploadRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                bannerUploadRef.current.files = dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                bannerUploadRef.current.dispatchEvent(event);
            }
            
            // Close the editor
            setBannerEditorOpen(false);
            setSelectedBannerFile(null);
        } catch (error) {
            console.error('Error uploading edited banner:', error);
            toast.error('Failed to upload edited banner');
        }
    };

    const onBannerError = (err: any) => {
        console.error('Banner upload error:', err);
        toast.error(err?.message || 'Failed to upload banner');
        setIsUploadingBanner(false);
    };

    const onBannerSuccess = async (res: any) => {
        try {
            const response = await fetch('/api/auth/banner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bannerUrl: res.url, fileId: res.fileId }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                toast.error(result.error || 'Failed to update banner');
                return;
            }

            toast.success('Banner updated successfully');
            setBannerPreview(res.url);
            await refetchUser();
        } catch (error) {
            console.error('Banner update error:', error);
            toast.error('Failed to update banner');
        } finally {
            setIsUploadingBanner(false);
        }
    };

    return (
        <>
            <Card className="overflow-hidden">
                {/* Banner Section */}
                <div className="relative w-full h-[240px] md:h-[300px] group">
                    {/* Banner Image */}
                    {bannerPreview && !bannerError ? (
                        <Image
                            src={`${bannerPreview}?tr=w-1200,h-400,c-at_max,fo-auto,q-85`}
                            alt="Profile banner"
                            fill
                            className="object-cover"
                            priority
                            onError={() => setBannerError(true)}
                            unoptimized={bannerPreview.startsWith('data:')}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                    )}

                    {/* Banner Overlay */}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />

                    {/* Banner Upload Button */}
                    <div className="absolute bottom-4 right-4 z-10">
                        <label
                            htmlFor="banner-file-select"
                            className={`flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg shadow-lg transition-all cursor-pointer ${
                                isUploadingBanner ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <Camera className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {isUploadingBanner ? 'Uploading...' : 'Edit Cover'}
                            </span>
                        </label>
                        
                        {/* Hidden file input for banner selection */}
                        <input
                            id="banner-file-select"
                            type="file"
                            accept="image/*"
                            onChange={handleBannerSelect}
                            className="hidden"
                            disabled={isUploadingBanner}
                        />
                        
                        {/* Hidden ImageKit upload (triggered after editing) */}
                        <IKContext
                            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''}
                            urlEndpoint={IMAGEKIT_URL_ENDPOINT}
                            authenticator={authenticator}
                        >
                            <IKUpload
                                ref={bannerUploadRef}
                                fileName={`banner-${user?.id}-${Date.now()}`}
                                folder={getImageKitFolder(`users/${user?.id}/banners`)}
                                tags={['banner', 'profile']}
                                useUniqueFileName={true}
                                onError={onBannerError}
                                onSuccess={onBannerSuccess}
                                onUploadStart={() => {
                                    setIsUploadingBanner(true);
                                    toast.info('Uploading banner...');
                                }}
                                className="hidden"
                                accept="image/*"
                                transformation={{
                                    post: [{ type: 'transformation', value: 'w-1200,h-400,c-at_max' }],
                                }}
                            />
                        </IKContext>
                    </div>
                </div>

                {/* Avatar and User Info Section */}
                <div className="relative px-6 md:px-8 pb-6">
                    {/* Avatar positioned overlapping the banner */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-background bg-background overflow-hidden shadow-xl">
                                {avatarPreview && !avatarError ? (
                                    <Image
                                        src={`${avatarPreview}?tr=w-400,h-400,c-at_max,fo-auto,q-90`}
                                        alt={user?.username || 'Avatar'}
                                        fill
                                        className="object-cover"
                                        onError={() => setAvatarError(true)}
                                        unoptimized={avatarPreview.startsWith('data:')}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                                        <span className="text-5xl font-bold text-white">
                                            {user?.username?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                    </div>
                                )}

                                {/* Avatar upload overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            {/* Hidden file input for avatar selection */}
                            <input
                                id="avatar-file-select"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarSelect}
                                className="hidden"
                                disabled={isUploadingAvatar}
                            />

                            {/* Avatar upload button */}
                            <label
                                htmlFor="avatar-file-select"
                                className={`absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all ${
                                    isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <Camera className="w-5 h-5 text-white" />
                            </label>

                            {/* Hidden ImageKit upload (triggered after editing) */}
                            <IKContext
                                publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''}
                                urlEndpoint={IMAGEKIT_URL_ENDPOINT}
                                authenticator={authenticator}
                            >
                                <IKUpload
                                    ref={avatarUploadRef}
                                    fileName={`avatar-${user?.id}-${Date.now()}`}
                                    folder={getImageKitFolder(`users/${user?.id}/avatars`)}
                                    tags={['avatar', 'profile']}
                                    useUniqueFileName={true}
                                    onError={onAvatarError}
                                    onSuccess={onAvatarSuccess}
                                    onUploadStart={() => {
                                        setIsUploadingAvatar(true);
                                        toast.info('Uploading avatar...');
                                    }}
                                    className="hidden"
                                    accept="image/*"
                                    transformation={{
                                        post: [{ type: 'transformation', value: 'w-400,h-400,c-at_max' }],
                                    }}
                                />
                            </IKContext>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 sm:mb-4">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                                {user?.firstName && user?.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user?.username}
                            </h2>
                            <p className="text-base md:text-lg text-muted-foreground mt-1">
                                @{user?.username}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                        </div>
                    </div>
                </div>
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
            
            {/* Banner Editor Modal */}
            {selectedBannerFile && (
                <BannerEditor
                    isOpen={bannerEditorOpen}
                    onClose={() => {
                        setBannerEditorOpen(false);
                        setSelectedBannerFile(null);
                    }}
                    imageUrl={URL.createObjectURL(selectedBannerFile)}
                    onSave={handleBannerEditorSave}
                />
            )}
        </>
    );
}
