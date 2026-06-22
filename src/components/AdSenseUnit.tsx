import React, { useEffect } from 'react';

interface AdSenseUnitProps {
  slot?: string;
  format?: string;
  responsive?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  slot,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block', minHeight: '90px' },
  className = '',
}) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense element registration failed:', e);
    }
  }, [slot]);

  // If no explicit Slot is provided yet, show a beautiful, premium placeholder with helper guidelines.
  if (!slot) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 bg-gray-50/50 dark:bg-gray-800/20 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl ${className}`}>
        <p className="text-[10px] text-gray-400 font-medium italic text-center px-2 leading-tight">
          AdSense Ready<br/>
          <span className="text-[8px] opacity-70 font-mono">ca-pub-6792335595485897</span>
        </p>
        <span className="text-[8.5px] mt-2 text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/30">
          Awaiting Review Approved
        </span>
      </div>
    );
  }

  return (
    <div className={`adsense-wrapper overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-6792335595485897"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};
