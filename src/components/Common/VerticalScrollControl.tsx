import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const VerticalScrollControl: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrollY(currentY);

      // Check if user is near the bottom of the page
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const distanceToBottom = docHeight - (currentY + windowHeight);
      setIsNearBottom(distanceToBottom < 220);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  // Only show when the document is scrollable (height > window height + 100px)
  const isScrollable = typeof document !== 'undefined' && document.documentElement.scrollHeight > window.innerHeight + 120;

  if (!isScrollable) return null;

  return (
    <div 
      className="fixed left-3 z-30 flex flex-col gap-1.5 transition-all duration-300"
      style={{
        bottom: 'max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom)))',
      }}
      aria-label="التحكم في التمرير العمودي"
    >
      {/* Scroll to Top Button */}
      {scrollY > 150 && (
        <button
          type="button"
          onClick={scrollToTop}
          className="w-10 h-10 rounded-2xl bg-[#10172B]/90 hover:bg-[#20A9FF] text-[#20A9FF] hover:text-[#070B1C] border border-[#1E2945] hover:border-[#20A9FF] backdrop-blur-md shadow-xl flex items-center justify-center transition-all duration-200 active:scale-90 group"
          title="الانتقال إلى أعلى الصفحة"
          aria-label="الانتقال إلى أعلى الصفحة"
        >
          <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
        </button>
      )}

      {/* Scroll to Bottom Button */}
      {!isNearBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="w-10 h-10 rounded-2xl bg-[#10172B]/90 hover:bg-[#20A9FF] text-[#8992AA] hover:text-[#070B1C] border border-[#1E2945] hover:border-[#20A9FF] backdrop-blur-md shadow-xl flex items-center justify-center transition-all duration-200 active:scale-90 group"
          title="الانتقال إلى أسفل الصفحة"
          aria-label="الانتقال إلى أسفل الصفحة"
        >
          <ArrowDown className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
        </button>
      )}
    </div>
  );
};
