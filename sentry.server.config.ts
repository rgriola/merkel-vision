import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Disable debug mode to reduce console noise
    debug: false,

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps

    // Filter out development noise
    beforeSend(event, hint) {
        if (process.env.NODE_ENV === 'development') {
            // Only send error and fatal level events in development
            return (event.level === 'error' || event.level === 'fatal') ? event : null;
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

