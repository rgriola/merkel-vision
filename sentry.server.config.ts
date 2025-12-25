import * as Sentry from "@sentry/nextjs";

// Debug: Check if DSN is loaded (server-side)
const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
console.log('[Sentry Server Debug] DSN loaded:', sentryDSN ? 'YES' : 'NO');
console.log('[Sentry Server Debug] Environment:', process.env.NODE_ENV);

Sentry.init({
    dsn: sentryDSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps

    // Filter out development noise
    beforeSend(event, hint) {
        console.log('[Sentry Server Debug] beforeSend called:', {
            level: event.level,
            message: event.message,
            exception: event.exception,
            environment: process.env.NODE_ENV,
        });

        if (process.env.NODE_ENV === 'development') {
            // Only send error and fatal level events in development
            const shouldSend = event.level === 'error' || event.level === 'fatal';
            console.log('[Sentry Server Debug] Should send?', shouldSend);
            return shouldSend ? event : null;
        }
        return event;
    },

    // Integration-specific options
    integrations: [
        // Disable automatic breadcrumbs in development to reduce noise
        ...(process.env.NODE_ENV === 'development'
            ? []
            : [Sentry.replayIntegration()]
        ),
    ],
});

console.log('[Sentry Server Debug] Initialization complete');
