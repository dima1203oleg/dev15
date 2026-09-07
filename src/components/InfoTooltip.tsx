import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  theme?: 'light' | 'dark';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  content, 
  position = 'top',
  theme = 'light'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top': return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default: return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div 
      className="relative inline-flex items-center justify-center cursor-pointer ml-1.5" 
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <Info className={`w-3.5 h-3.5 transition-colors ${
        isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-blue-500'
      }`} />
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={`absolute z-50 w-56 p-3 text-xs leading-relaxed rounded-xl shadow-lg border animate-in fade-in zoom-in-95 duration-200 pointer-events-none ${
            isDark 
              ? 'bg-slate-800 border-slate-700 text-slate-300' 
              : 'bg-white border-slate-200 text-slate-600'
          } ${getPositionClasses()}`}
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
