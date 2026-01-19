'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle2, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoldToVerifyProps {
  /** Duration in milliseconds to hold (default: 3000) */
  duration?: number;
  /** Callback when verification completes */
  onVerified: (holdDuration: number) => void;
  /** Whether the verification has been completed */
  verified?: boolean;
  /** Reset the verification state */
  onReset?: () => void;
  /** Custom class name */
  className?: string;
}

export function HoldToVerify({
  duration = 3000,
  onVerified,
  verified = false,
  className,
}: HoldToVerifyProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Use effect to handle the animation loop
  useEffect(() => {
    if (!isHolding || completedRef.current) return;

    const animate = () => {
      if (!startTimeRef.current || completedRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        completedRef.current = true;
        setIsHolding(false);
        onVerified(elapsed);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHolding, duration, onVerified]);

  const handleStart = useCallback(() => {
    if (verified || completedRef.current) return;
    
    setIsHolding(true);
    setShowRetry(false);
    startTimeRef.current = Date.now();
  }, [verified]);

  const handleEnd = useCallback(() => {
    if (completedRef.current || verified) return;

    setIsHolding(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // If released before completion, show retry message
    if (progress < 100 && progress > 0) {
      setShowRetry(true);
      setProgress(0);
      startTimeRef.current = null;
      
      // Hide retry message after 2 seconds
      setTimeout(() => setShowRetry(false), 2000);
    }
  }, [progress, verified]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const displayTime = isHolding 
    ? ((progress / 100) * (duration / 1000)).toFixed(1)
    : '0.0';

  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Human Verification
      </div>
      
      {/* Hold Button */}
      <button
        type="button"
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        disabled={verified}
        className={cn(
          'relative w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-200',
          'flex items-center justify-center gap-3',
          'select-none touch-none',
          verified
            ? 'bg-green-600 cursor-default'
            : isHolding
            ? 'bg-blue-600 scale-[0.98]'
            : 'bg-gray-600 hover:bg-gray-700 active:scale-[0.98]',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          verified ? 'focus:ring-green-500' : 'focus:ring-blue-500'
        )}
      >
        {verified ? (
          <>
            <CheckCircle2 className="h-5 w-5" />
            <span>Verified!</span>
          </>
        ) : (
          <>
            <Fingerprint className={cn('h-5 w-5', isHolding && 'animate-pulse')} />
            <span>{isHolding ? 'Keep holding...' : 'Hold to verify you\'re human'}</span>
          </>
        )}
      </button>

      {/* Progress Bar */}
      <div className="relative h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-75 rounded-full',
            verified
              ? 'bg-green-500'
              : progress > 66
              ? 'bg-green-500'
              : progress > 33
              ? 'bg-yellow-500'
              : 'bg-blue-500'
          )}
          style={{ width: `${verified ? 100 : progress}%` }}
        />
      </div>

      {/* Timer / Status Text */}
      <div className="text-center text-sm">
        {verified ? (
          <span className="text-green-600 dark:text-green-400 font-medium">
            ✓ Verification complete
          </span>
        ) : showRetry ? (
          <span className="text-amber-600 dark:text-amber-400">
            Released too early! Try again.
          </span>
        ) : isHolding ? (
          <span className="text-blue-600 dark:text-blue-400 font-mono">
            {displayTime} / {(duration / 1000).toFixed(1)} seconds
          </span>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">
            Hold the button for {(duration / 1000).toFixed(0)} seconds
          </span>
        )}
      </div>
    </div>
  );
}
