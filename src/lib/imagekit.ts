/**
 * ImageKit Configuration
 * Centralized configuration for ImageKit CDN
 */

// ImageKit URL Endpoint - must match IMAGEKIT_URL_ENDPOINT in .env.local
export const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/rgriola';

/**
 * Constructs full ImageKit URL from file path
 * This is CLIENT-SAFE - no SDK initialization required
 * @param filePath - ImageKit file path (e.g., /locations/abc/photo.jpg)
 * @returns Full ImageKit URL
 */
export function getImageKitUrl(filePath: string): string {
    // Remove leading slash if present (ImageKit paths start with /)
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${IMAGEKIT_URL_ENDPOINT}${cleanPath}`;
}

/**
 * Optimize avatar URL with ImageKit transformations
 * This is CLIENT-SAFE - just URL manipulation
 * @param url - Full ImageKit URL
 * @param size - Desired size in pixels (32, 64, 128, or 256)
 * @returns Optimized ImageKit URL with transformations
 */
export function getOptimizedAvatarUrl(
    url: string | null | undefined,
    size: 32 | 64 | 128 | 256 = 128
): string | null {
    if (!url) return null;

    // ImageKit transformation parameters:
    // w-X,h-X = width and height
    // c-at_max = maintain aspect ratio, fit within bounds
    // fo-auto = auto format (WebP for modern browsers, fallback for others)
    // q-80 = 80% quality (excellent balance of quality vs size)
    return `${url}?tr=w-${size},h-${size},c-at_max,fo-auto,q-80`;
}

/**
 * Get ImageKit instance for SERVER-SIDE operations only
 * This lazy-loads the SDK to avoid client-side issues
 */
function getImageKitInstance() {
    // Dynamic import to ensure this only runs on server
    const ImageKit = require('imagekit');

    return new ImageKit({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
        urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });
}

/**
 * Upload file to ImageKit
 * SERVER-SIDE ONLY
 */
export async function uploadToImageKit({
    file,
    fileName,
    folder = '/',
    tags = [],
}: {
    file: Buffer | string;
    fileName: string;
    folder?: string;
    tags?: string[];
}): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
    try {
        const imagekit = getImageKitInstance();

        const result = await imagekit.upload({
            file,
            fileName,
            folder,
            tags,
            useUniqueFileName: true,
        });

        return {
            success: true,
            url: result.url,
            fileId: result.fileId,
        };
    } catch (error: any) {
        console.error('ImageKit upload error:', error);
        return {
            success: false,
            error: error.message || 'Upload failed',
        };
    }
}

/**
 * Delete file from ImageKit
 * SERVER-SIDE ONLY
 */
export async function deleteFromImageKit(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const imagekit = getImageKitInstance();
        await imagekit.deleteFile(fileId);
        return { success: true };
    } catch (error: any) {
        console.error('ImageKit delete error:', error);
        return {
            success: false,
            error: error.message || 'Delete failed',
        };
    }
}
