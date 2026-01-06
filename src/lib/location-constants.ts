/**
 * Location Types and Color Mapping
 * Centralized configuration for location categories and their associated colors
 */

// Type-to-Color mapping - contrast compliant colors for map markers and UI
export const TYPE_COLOR_MAP: Record<string, string> = {
    "BROLL": "#3B82F6",        // Blue - general footage
    "STORY": "#EF4444",        // Red - primary story location
    "INTERVIEW": "#8B5CF6",    // Purple - interview subjects
    "LIVE ANCHOR": "#DC2626",  // Dark Red - live broadcast
    "REPORTER LIVE": "#F59E0B", // Orange - reporter on scene
    "STAKEOUT": "#6B7280",     // Gray - surveillance
    "DRONE": "#06B6D4",        // Cyan - aerial footage
    "SCENE": "#22C55E",        // Green - scene location
    "EVENT": "#84CC16",        // Lime - special events
    "BATHROOM": "#0EA5E9",     // Sky Blue - bathroom facilities
    "OTHER": "#64748B",        // Slate - miscellaneous
    "HQ": "#1E40AF",           // Dark Blue - headquarters (ADMIN ONLY)
    "BUREAU": "#7C3AED",       // Violet - bureau office (ADMIN ONLY)
    "REMOTE STAFF": "#EC4899", // Pink - remote workers (ADMIN ONLY)
    "STORAGE": "#78716C",      // Stone - storage facilities (ADMIN ONLY)
};

// Admin-only location types
export const ADMIN_ONLY_TYPES = [
    "HQ",
    "BUREAU",
    "REMOTE STAFF",
    "STORAGE",
];

// Ordered list of location types (derived from TYPE_COLOR_MAP keys)
export const LOCATION_TYPES = Object.keys(TYPE_COLOR_MAP);

// Get location types filtered by user role
export function getAvailableTypes(isAdmin: boolean): string[] {
    if (isAdmin) {
        return LOCATION_TYPES;
    }
    return LOCATION_TYPES.filter(type => !ADMIN_ONLY_TYPES.includes(type));
}

// Helper function to get color for a location type
export function getColorForType(type: string): string {
    return TYPE_COLOR_MAP[type] || TYPE_COLOR_MAP["OTHER"];
}
