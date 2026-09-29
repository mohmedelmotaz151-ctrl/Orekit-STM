import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold shadow-md transition active:scale-95 border border-orange-400/40 ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
        }`}
        title="تثبيت تطبيق أوريكيت على هاتفك أو جهازك"
      >
        <Download className="w-3.5 h-3.5 shrink-0 animate-bounce" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold border border-slate-700 transition active:scale-95 ${
            compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
          }`}
          title="طريقة تثبيت التطبيق على الآيفون والآيباد"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>تثبيت على الآيفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📲</span>
                  <span>تثبيت التطبيق على iOS (iPhone/iPad)</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-white block">اضغط على زر المشاركة:</span>
                    <span className="text-slate-400">في شريط متصفح سفاري السفلي اضغط على أيقونة المشاركة (Share <Share className="w-3 h-3 inline text-orange-400" />).</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-white block">إضافة إلى الشاشة الرئيسية:</span>
                    <span className="text-slate-400">مرر للأسفل في القائمة واضغط على <strong className="text-white">"إضافة إلى الشاشة الرئيسية" (Add to Home Screen <PlusSquare className="w-3 h-3 inline text-orange-400" />)</strong>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-white block">تأكيد الإضافة:</span>
                    <span className="text-slate-400">اضغط على "إضافة" (Add) في الزاوية العلوية لتظهر أيقونة أوريكيت فوراً مع تطبيقات هاتفك.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition"
              >
                فهمت، شكراً
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers before prompt fires
  return null;
};
