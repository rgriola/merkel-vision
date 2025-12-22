import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';

/**
 * GET /api/photos?placeId=xxx
 * Get all photos for a specific location
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const searchParams = request.nextUrl.searchParams;
        const placeId = searchParams.get('placeId');

        if (!placeId) {
            return apiError('placeId is required', 400, 'VALIDATION_ERROR');
        }

        // Fetch photos for this location
        const photos = await prisma.photo.findMany({
            where: { placeId },
            orderBy: [
                { isPrimary: 'desc' },
                { uploadedAt: 'desc' },
            ],
        });

        return apiResponse({ photos });
    } catch (error: any) {
        console.error('Error fetching photos:', error);
        return apiError('Failed to fetch photos', 500, 'FETCH_ERROR');
    }
}

/**
 * POST /api/photos
 * Save photo metadata after ImageKit upload
 * Body: { placeId, imagekitFileId, imagekitFilePath, originalFilename, fileSize, mimeType, width, height, isPrimary?, caption? }
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const body = await request.json();

        const {
            placeId,
            imagekitFileId,
            imagekitFilePath,
            originalFilename,
            fileSize,
            mimeType,
            width,
            height,
            isPrimary,
            caption,
        } = body;

        // Validation
        if (!placeId || !imagekitFileId || !imagekitFilePath) {
            return apiError(
                'Missing required fields: placeId, imagekitFileId, imagekitFilePath',
                400,
                'VALIDATION_ERROR'
            );
        }

        // Create photo record
        const photo = await prisma.photo.create({
            data: {
                placeId,
                userId: user.id,
                imagekitFileId,
                imagekitFilePath,
                originalFilename,
                fileSize,
                mimeType,
                width,
                height,
                isPrimary: isPrimary || false,
                caption,
            },
        });

        return apiResponse({ photo }, 201);
    } catch (error: any) {
        console.error('Error saving photo:', error);
        return apiError('Failed to save photo', 500, 'SAVE_ERROR');
    }
}
