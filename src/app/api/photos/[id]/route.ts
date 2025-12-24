import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import ImageKit from 'imagekit';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';

/**
 * DELETE /api/photos/[id]
 * Delete a photo from both ImageKit and database
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const { id } = await params;
        const photoId = parseInt(id);

        if (isNaN(photoId)) {
            return apiError('Invalid photo ID', 400, 'VALIDATION_ERROR');
        }

        // Find the photo
        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
        });

        if (!photo) {
            return apiError('Photo not found', 404, 'NOT_FOUND');
        }

        // Check permissions - only the uploader can delete
        if (photo.userId !== user.id && !user.isAdmin) {
            return apiError('You do not have permission to delete this photo', 403, 'FORBIDDEN');
        }

        // Delete from ImageKit
        try {
            const imagekit = new ImageKit({
                publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
                privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
                urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
            });

            await imagekit.deleteFile(photo.imagekitFileId);
        } catch (error: any) {
            console.error('Error deleting from ImageKit:', error);
            // Continue with database deletion even if ImageKit deletion fails
        }

        // Delete from database
        await prisma.photo.delete({
            where: { id: photoId },
        });

        return apiResponse({ message: 'Photo deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting photo:', error);
        return apiError('Failed to delete photo', 500, 'DELETE_ERROR');
    }
}
