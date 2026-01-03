import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import ImageKit from 'imagekit';
import { getUserRootFolder } from '@/lib/constants/upload';

// Runtime config for edge/node
export const runtime = 'nodejs';

// Initialize ImageKit only if we have the keys
function getImageKit() {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
    
    if (!publicKey || !privateKey || !urlEndpoint) {
        console.warn('[ImageKit] Missing environment variables, CDN deletion will be skipped');
        return null;
    }
    
    return new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
    });
}

/**
 * DELETE /api/auth/delete-account
 * Delete the authenticated user's own account and all associated data
 * User must be logged in
 */
export async function DELETE(req: NextRequest) {
    console.log('[DeleteAccount] Starting self-deletion request');
    
    // Check authorization
    const authResult = await requireAuth(req);
    console.log('[DeleteAccount] Auth result:', authResult.authorized);
    
    if (!authResult.authorized || !authResult.user) {
        console.log('[DeleteAccount] Unauthorized:', authResult.error);
        return apiError(authResult.error || 'Unauthorized', 401);
    }

    const user = authResult.user;
    const userId = user.id;

    console.log('[DeleteAccount] User self-deleting:', user.email, 'ID:', userId);

    try {
        // Fetch user with all related data
        const userData = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                uploadedPhotos: {
                    select: {
                        id: true,
                        imagekitFileId: true,
                        imagekitFilePath: true,
                    },
                },
                _count: {
                    select: {
                        sessions: true,
                        createdLocations: true,
                        uploadedPhotos: true,
                        savedLocations: true,
                    },
                },
            },
        });

        if (!userData) {
            return apiError('User not found', 404);
        }

        // Create audit log for self-deletion BEFORE deleting the user
        await prisma.securityLog.create({
            data: {
                userId: userId,
                eventType: 'USER_SELF_DELETED',
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
                success: true,
                metadata: {
                    deletedUserId: userData.id,
                    deletedUserEmail: userData.email,
                    deletedUserUsername: userData.username,
                    deletedUserName: userData.firstName && userData.lastName 
                        ? `${userData.firstName} ${userData.lastName}` 
                        : userData.firstName || userData.lastName || userData.username,
                    deletedCounts: userData._count,
                    deletedAt: new Date().toISOString(),
                },
            },
        });

        // Delete photos from ImageKit CDN
        const imagekit = getImageKit();
        if (imagekit && userData.uploadedPhotos.length > 0) {
            console.log(`[DeleteAccount] Deleting ${userData.uploadedPhotos.length} photos from ImageKit...`);
            
            // Delete individual photo files
            for (const photo of userData.uploadedPhotos) {
                try {
                    await imagekit.deleteFile(photo.imagekitFileId);
                    console.log(`[DeleteAccount] Deleted photo ${photo.id} from ImageKit`);
                } catch (error) {
                    console.error(`[DeleteAccount] Failed to delete photo ${photo.id} from ImageKit:`, error);
                    // Continue even if CDN deletion fails
                }
            }
            
            // Delete the user's entire folder from ImageKit
            // Uses environment-aware path: /production/users/{userId}/ or /development/users/{userId}/
            try {
                const userFolderPath = getUserRootFolder(userId);
                console.log(`[DeleteAccount] Attempting to delete user folder: ${userFolderPath}`);
                await imagekit.deleteFolder(userFolderPath);
                console.log(`[DeleteAccount] Deleted user folder ${userFolderPath} from ImageKit`);
            } catch (error) {
                console.error(`[DeleteAccount] Failed to delete user folder from ImageKit:`, error);
                // Continue even if folder deletion fails (might not exist or already empty)
            }
        }

        // Delete user (cascade will handle Sessions, Locations, Photos, Saves)
        await prisma.user.delete({
            where: { id: userId },
        });

        console.log(`[DeleteAccount] User ${userData.email} deleted their own account`);

        return apiResponse({
            success: true,
            message: `Account deleted successfully`,
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        
        // Log failed deletion attempt
        try {
            await prisma.securityLog.create({
                data: {
                    userId: userId,
                    eventType: 'USER_SELF_DELETE_FAILED',
                    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                    userAgent: req.headers.get('user-agent') || 'unknown',
                    success: false,
                    metadata: {
                        error: error instanceof Error ? error.message : 'Unknown error',
                    },
                },
            });
        } catch (logError) {
            console.error('Failed to log deletion error:', logError);
        }

        return apiError('Failed to delete account', 500);
    }
}
