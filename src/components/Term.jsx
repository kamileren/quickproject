import { useState, useRef } from 'react';
import { HelpCircle } from 'lucide-react';

export function Term({ children, definition }) {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timerRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setIsHovered(false), 100);
  };

  return (
    <span className="relative inline-block group">
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="italic cursor-help border-b border-stone-200 hover:border-orange-400 transition-colors decoration-dotted"
      >
        {children}
      </span>
      {isHovered && (
        <span
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-white border border-stone-900 shadow-2xl rounded text-xs animate-in fade-in slide-in-from-bottom-1 block"
        >
          <span className="text-stone-700 leading-relaxed font-serif not-italic block text-left">
            {definition}
          </span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-stone-900 block" />
        </span>
      )}
    </span>
  );
}
