'use client';

import { OverlayView } from '@react-google-maps/api';
import { Home } from 'lucide-react';

interface HomeLocationMarkerProps {
    position: { lat: number; lng: number };
    name?: string;
}

export function HomeLocationMarker({ position }: HomeLocationMarkerProps) {
    return (
        <OverlayView
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div className="relative" style={{ transform: 'translate(-50%, -100%)' }}>
                {/* Perfect circle with centered house icon */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl border-4 border-white dark:border-gray-800 flex items-center justify-center">
                    <Home className="w-6 h-6 text-white" />
                </div>
            </div>
        </OverlayView>
    );
}
