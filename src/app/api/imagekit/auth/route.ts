import { NextRequest } from 'next/server';
import ImageKit from 'imagekit';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';

/**
 * GET /api/imagekit/auth
 * Generate ImageKit authentication parameters for client-side uploads
 */
export async function GET(request: NextRequest) {
    try {
        // Verify user is authenticated
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        // Initialize ImageKit
        const imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
        });

        // Generate authentication parameters
        const authenticationParameters = imagekit.getAuthenticationParameters();

        return apiResponse({
            ...authenticationParameters,
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        });
    } catch (error: any) {
        console.error('Error generating ImageKit auth:', error);
        return apiError('Failed to generate authentication', 500, 'AUTH_ERROR');
    }
}
