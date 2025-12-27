/**
 * Centralized Icon Configuration
 * 
 * This file provides a single place to manage all custom icons in the application.
 * To change an icon throughout the app, simply update it here.
 * 
 * Usage:
 * import { AppIcons } from '@/config/icons';
 * <AppIcons.Home className="w-6 h-6" />
 */

import {
    Home,
    Camera,
    MapPin,
    Navigation,
    Search,
    Map,
    Upload,
    X,
    User,
    Settings,
    Bell,
    Globe,
    Clock,
    AlertCircle,
    ArrowLeft,
    // Add more icons as needed
} from 'lucide-react';

/**
 * Application-wide icon registry
 * 
 * To change an icon:
 * 1. Import the new icon from lucide-react (or another library)
 * 2. Update the mapping below
 * 3. All usages throughout the app will automatically update!
 */
export const AppIcons = {
    // Location & Map Icons
    Home: Home,              // Home location marker
    MapPin: MapPin,          // General location pin
    Map: Map,                // Map interface
    Navigation: Navigation,  // GPS/navigation

    // Media Icons
    Camera: Camera,          // Photo capture/upload
    Upload: Upload,          // File upload

    // User Interface Icons
    User: User,              // User avatar/profile
    Settings: Settings,      // Settings/preferences
    Bell: Bell,              // Notifications
    Globe: Globe,            // Language/internationalization
    Clock: Clock,            // Time/timezone
    Search: Search,          // Search functionality

    // Action Icons
    X: X,                    // Close/dismiss
    ArrowLeft: ArrowLeft,    // Back/return
    AlertCircle: AlertCircle, // Warning/alert

    // Add more icons as your app grows
} as const;

/**
 * Icon color palette
 * Centralized color scheme for icons
 */
export const IconColors = {
    homeLocation: 'text-orange-600',
    savedLocation: 'text-blue-600',
    userLocation: 'text-blue-500',
    camera: 'text-gray-600',
    navigation: 'text-indigo-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    success: 'text-green-600',
} as const;

/**
 * Icon sizes
 * Standardized size classes
 */
export const IconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
} as const;

/**
 * Type exports for TypeScript
 */
export type IconName = keyof typeof AppIcons;
export type IconColor = keyof typeof IconColors;
export type IconSize = keyof typeof IconSizes;
