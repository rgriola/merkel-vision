import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
    try {
        // Throw a test error
        throw new Error('🧪 Test Server Error - Sentry API route is working!');
    } catch (error) {
        // Capture the error in Sentry
        Sentry.captureException(error);

        // Return error response
        return NextResponse.json(
            { error: 'Test error captured by Sentry' },
            { status: 500 }
        );
    }
}
