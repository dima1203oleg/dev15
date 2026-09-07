import React from 'react';

interface GeminiSparkleProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const GeminiSparkle: React.FC<GeminiSparkleProps> = ({ 
  className = 'w-4 h-4', 
  size = 24,
  animated = false 
}) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size}
      className={`${className} ${animated ? 'animate-pulse' : ''}`}
      fill="url(#gemini-sparkle-gradient)"
    >
      <defs>
        <linearGradient id="gemini-sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="35%" stopColor="#818cf8" />
          <stop offset="70%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      {/* Signature 4-pointed Google Gemini star */}
      <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
    </svg>
  );
};

export const GeminiBadge: React.FC<{ text?: string; className?: string }> = ({ 
  text = "GEMINI ULTRA AI", 
  className = "" 
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-pink-500/15 border border-purple-400/30 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.2)] ${className}`}>
      <GeminiSparkle className="w-3.5 h-3.5" animated />
      <span className="text-[11px] font-semibold tracking-wider uppercase bg-gradient-to-r from-blue-300 via-purple-200 to-pink-300 bg-clip-text text-transparent">
        {text}
      </span>
    </div>
  );
};
