import * as Sentry from "@sentry/nextjs";

// Debug: Check if DSN is loaded
const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
console.log('[Sentry Debug] DSN loaded:', sentryDSN ? 'YES' : 'NO');
console.log('[Sentry Debug] Environment:', process.env.NODE_ENV);

Sentry.init({
    dsn: sentryDSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Filter out localhost errors in development
    beforeSend(event, hint) {
        console.log('[Sentry Debug] beforeSend called:', {
            level: event.level,
            message: event.message,
            environment: process.env.NODE_ENV,
        });

        if (process.env.NODE_ENV === 'development') {
            // Only send critical errors in development
            const shouldSend = event.level === 'error' || event.level === 'fatal';
            console.log('[Sentry Debug] Should send?', shouldSend);
            return shouldSend ? event : null;
        }
        return event;
    },

    // Ignore common browser errors
    ignoreErrors: [
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
    ],
});

console.log('[Sentry Debug] Initialization complete');
