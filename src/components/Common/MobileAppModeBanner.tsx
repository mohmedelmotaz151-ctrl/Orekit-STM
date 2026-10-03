import React, { useState, useEffect } from 'react';
import { Maximize2, Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const MobileAppModeBanner: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAndroidTip, setShowAndroidTip] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // If already running in installed standalone mode or in fullscreen, hide the prompt
  if (isInstalled || isFullscreen || isDismissed) {
    return null;
  }

  const handleEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
      // Fallback: trigger install or show tips
      if (isInstallable) {
        install();
      } else {
        setShowAndroidTip(true);
      }
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowAndroidTip(true);
      }
    } else {
      setShowAndroidTip(true);
    }
  };

  return (
    <>
      <div className="bg-[#10172B] border-b border-[#1E2945] px-3 py-2 text-xs text-[#F5F7FF] flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#20A9FF]/15 text-[#20A9FF] flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-[11px] sm:text-xs text-[#F5F7FF] block truncate">
              وضع الجوال المستقل (إخفاء شريط الرابط)
            </span>
            <span className="text-[10px] text-[#8992AA] block truncate">
              افتح التطبيق كبرنامج مستقل بدون متصفح Chrome
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Fullscreen Button */}
          <button
            onClick={handleEnterFullscreen}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#20A9FF] hover:bg-[#1E9BEB] text-[#070B1C] font-bold text-[11px] shadow-sm transition active:scale-95"
            title="تفعيل وضع ملء الشاشة لإخفاء شريط العنوان فورًا"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>ملء الشاشة</span>
          </button>

          {/* Quick Install to Home Screen */}
          <button
            onClick={handleInstallClick}
            className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1E2945] hover:bg-[#2A395C] text-[#F5F7FF] font-medium text-[11px] transition"
            title="تثبيت التطبيق على الشاشة الرئيسية للهاتف"
          >
            <Download className="w-3.5 h-3.5 text-[#20A9FF]" />
            <span>تثبيت</span>
          </button>

          {/* Dismiss */}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-[#8992AA] hover:text-[#F5F7FF] transition"
            title="إخفاء التنبيه"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Android PWA Install Guidance Modal */}
      {showAndroidTip && (
        <div 
          className="fixed inset-0 z-50 bg-[#070B1C]/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAndroidTip(false)}
        >
          <div 
            className="bg-[#10172B] border border-[#1E2945] rounded-2xl p-5 max-w-sm w-full text-right space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2945]">
              <div className="flex items-center gap-2">
                <span className="text-lg">📱</span>
                <h3 className="font-bold text-sm text-[#F5F7FF]">تشغيل التطبيق بدون شريط رابط المتصفح</h3>
              </div>
              <button 
                onClick={() => setShowAndroidTip(false)}
                className="text-[#8992AA] hover:text-[#F5F7FF] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8992AA] leading-relaxed">
              لفتح تطبيق <strong className="text-[#20A9FF]">ORKEIT</strong> كبرنامج هاتف أصيل بدون شريط عنوان Chrome أو رابط oriket.site:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#070B1C] border border-[#1E2945] flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#20A9FF] text-[#070B1C] font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <span className="font-bold text-[#F5F7FF] block">افتح قائمة خيارات متصفح Chrome:</span>
                  <span className="text-[11px] text-[#8992AA]">اضغط على النقاط الثلاث (⋮) في أعلى زاوية المتصفح.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#070B1C] border border-[#1E2945] flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#20A9FF] text-[#070B1C] font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <span className="font-bold text-[#F5F7FF] block">اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة":</span>
                  <span className="text-[11px] text-[#8992AA]">اضغط على <strong className="text-[#20A9FF]">"تثبيت التطبيق" (Install app)</strong> أو "الإضافة إلى الشاشة الرئيسية".</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#070B1C] border border-[#1E2945] flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#19C7A0] text-[#070B1C] font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <span className="font-bold text-[#F5F7FF] block">افتح التطبيق من شاشة الهاتف:</span>
                  <span className="text-[11px] text-[#8992AA]">سيفتح التطبيق مباشرة في وضع الجوال المستقل (Standalone) بدون أي شريط روابط.</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleEnterFullscreen}
                className="flex-1 py-2.5 rounded-xl bg-[#20A9FF] text-[#070B1C] font-bold text-xs transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="w-4 h-4" />
                <span>تشغيل ملء الشاشة الآن</span>
              </button>
              <button
                onClick={() => setShowAndroidTip(false)}
                className="px-4 py-2.5 rounded-xl bg-[#070B1C] border border-[#1E2945] text-[#8992AA] hover:text-[#F5F7FF] text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
