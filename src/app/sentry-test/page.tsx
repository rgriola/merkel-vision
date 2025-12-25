'use client';

import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function SentryTestPage() {
    const router = useRouter();

    const testClientError = () => {
        try {
            throw new Error('🧪 Test Client Error - Sentry is working!');
        } catch (error) {
            Sentry.captureException(error);
            alert('Error sent to Sentry! Check your Sentry dashboard.');
        }
    };

    const testServerError = async () => {
        try {
            const response = await fetch('/api/sentry-test-error');
            if (!response.ok) {
                alert('Server error sent to Sentry! Check your dashboard.');
            }
        } catch (error) {
            console.error('Error calling test endpoint:', error);
        }
    };

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Button onClick={() => router.push('/')} variant="outline">
                        ← Back to Home
                    </Button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold mb-4">🧪 Sentry Error Tracking Test</h1>

                    <p className="text-muted-foreground mb-8">
                        Use these buttons to test if Sentry is properly configured and capturing errors.
                        After clicking, check your Sentry dashboard to see the error appear.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                            <h2 className="text-xl font-semibold mb-2">Client-Side Error Test</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                This will throw and capture an error in the browser (React component).
                            </p>
                            <Button onClick={testClientError} variant="default">
                                Test Client Error
                            </Button>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h2 className="text-xl font-semibold mb-2">Server-Side Error Test</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                This will throw and capture an error in the API route (server-side).
                            </p>
                            <Button onClick={testServerError} variant="default">
                                Test Server Error
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-semibold mb-2">✅ What to Check:</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                            <li>Go to your Sentry dashboard: <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sentry.io</a></li>
                            <li>Click on your project</li>
                            <li>You should see the test errors appear within a few seconds</li>
                            <li>Errors will include full stack traces and context</li>
                        </ul>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <h3 className="font-semibold mb-2">⚠️ Note:</h3>
                        <p className="text-sm">
                            In development mode, Sentry is configured to only send error and fatal level events
                            to reduce noise. In production, all errors will be captured automatically.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
