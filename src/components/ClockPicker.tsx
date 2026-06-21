/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui';

interface ClockPickerProps {
  value: string; // HH:mm (24h format)
  onChange: (value: string) => void;
}

export const ClockPicker = ({ value, onChange, onDone }: ClockPickerProps & { onDone?: () => void }) => {
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse time from value prop (HH:mm 24h)
  const [hStr, mStr] = value.split(':');
  const h24 = parseInt(hStr);
  const m = parseInt(mStr);
  
  const period = h24 >= 12 ? 'PM' : 'AM';
  const displayH = h24 % 12 || 12;

  const updateTime = (newH: number, newM: number, newP: 'AM' | 'PM') => {
    let finalH = newH;
    if (newP === 'PM' && newH !== 12) finalH += 12;
    if (newP === 'AM' && newH === 12) finalH = 0;
    
    const formatted = `${finalH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
    onChange(formatted);
  };

  const handleDialInteraction = (e: any) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    
    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hours') {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      if (h > 12) h = 12;
      updateTime(h, m, period);
    } else {
      // Snap to minute as requested
      let nextM = Math.round(angle / 6);
      if (nextM === 60) nextM = 0;
      updateTime(displayH, nextM, period);
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    handleDialInteraction(e);
    
    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      handleDialInteraction(moveEvent);
    };
    
    const endHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
      
      if (mode === 'hours') {
        setTimeout(() => setMode('minutes'), 150);
      }
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);
  };

  return (
    <div className="flex flex-col items-center bg-white dark:bg-gray-900 rounded-3xl p-3 select-none shadow-sm border border-gray-100 dark:border-gray-800">
      {/* Time Display */}
      <div className="flex items-center gap-1 mb-4 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
        <button 
          type="button"
          onClick={() => setMode('hours')}
          className={cn(
            "text-4xl font-bold px-2.5 py-0.5 rounded-lg transition-all tabular-nums",
            mode === 'hours' ? "text-indigo-600 bg-white shadow-sm dark:text-indigo-400 dark:bg-gray-700" : "text-gray-300 dark:text-gray-600"
          )}
        >
          {displayH.toString().padStart(2, '0')}
        </button>
        <span className="text-3xl font-bold text-gray-200 dark:text-gray-700">:</span>
        <button 
          type="button"
          onClick={() => setMode('minutes')}
          className={cn(
            "text-4xl font-bold px-2.5 py-0.5 rounded-lg transition-all tabular-nums",
            mode === 'minutes' ? "text-indigo-600 bg-white shadow-sm dark:text-indigo-400 dark:bg-gray-700" : "text-gray-300 dark:text-gray-600"
          )}
        >
          {m.toString().padStart(2, '0')}
        </button>
        
        <div className="flex flex-col gap-0.5 ml-2 pr-1">
          <button 
            type="button"
            onClick={() => updateTime(displayH, m, 'AM')}
            className={cn(
              "text-[9px] font-black px-1.5 py-1 rounded-md transition-all",
              period === 'AM' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            AM
          </button>
          <button 
            type="button"
            onClick={() => updateTime(displayH, m, 'PM')}
            className={cn(
              "text-[9px] font-black px-1.5 py-1 rounded-md transition-all",
              period === 'PM' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            PM
          </button>
        </div>
      </div>

      {/* Clock Dial */}
      <div 
        ref={containerRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        className="relative w-48 h-48 sm:w-52 sm:h-52 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center cursor-pointer touch-none shadow-inner group"
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const val = i + 1;
          const label = mode === 'hours' ? val : (val * 5 === 60 ? 0 : val * 5);
          const angle = (val * 30 - 90) * (Math.PI / 180);
          const dist = mode === 'hours' ? 70 : 80;
          const x = dist * Math.cos(angle);
          const y = dist * Math.sin(angle);
          
          const isActive = mode === 'hours' ? displayH === val : m === label;

          return (
            <div 
              key={i}
              className={cn(
                "absolute text-[11px] font-bold w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10",
                isActive ? "text-white" : "text-gray-400 dark:text-gray-500"
              )}
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              {label.toString().padStart(2, '0')}
            </div>
          );
        })}

        {/* Hand */}
        <motion.div 
          className="absolute origin-bottom w-1 bg-indigo-600 dark:bg-indigo-500 rounded-full z-0"
          animate={{ 
            rotate: mode === 'hours' ? displayH * 30 : m * 6,
            height: mode === 'hours' ? '55px' : '70px'
          }}
          style={{ bottom: '50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center shadow-lg" />
        </motion.div>

        {/* Center */}
        <div className="absolute w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-500 rounded-full shadow-sm z-20" />
      </div>

      {onDone && (
        <Button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDone(); }}
          className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
        >
          Set Time
        </Button>
      )}
    </div>
  );
};
