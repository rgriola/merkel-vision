'use client';

import { useEffect } from 'react';

export function SentryInit() {
    useEffect(() => {
        // Import and initialize Sentry client-side  
        import('../../sentry.client.config').then(() => {
            console.log('[Sentry Init] Client-side Sentry initialized');
        });
    }, []);

    return null;
}
