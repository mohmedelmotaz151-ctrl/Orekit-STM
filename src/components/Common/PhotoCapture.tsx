import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, CheckCircle2, RefreshCw, ZoomIn, X } from 'lucide-react';

interface PhotoCaptureProps {
  label: string;
  sublabel?: string;
  photoUrl?: string;
  onPhotoCaptured: (base64Photo: string) => void;
  onPhotoRemoved?: () => void;
  required?: boolean;
  className?: string;
}

/**
 * Resizes and compresses an image file to a lightweight Base64 JPEG (~70KB - 120KB)
 * to ensure fast Firestore storage, fast rendering, and no document size limit issues.
 */
function compressImage(file: File, maxDim = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  label,
  sublabel,
  photoUrl,
  onPhotoCaptured,
  onPhotoRemoved,
  required = false,
  className = '',
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await compressImage(file);
      onPhotoCaptured(compressed);
    } catch (err) {
      console.error('Failed to process photo:', err);
      alert('حدث خطأ أثناء معالجة الصورة، يرجى المحاولة مرة أخرى');
    } finally {
      setIsProcessing(false);
      // Reset input value so the same photo can be re-selected if desired
      e.target.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden file inputs for direct camera and gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {photoUrl && (
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تم التوثيق بالصورة</span>
          </span>
        )}
      </div>

      {sublabel && <p className="text-[11px] text-slate-400 -mt-1">{sublabel}</p>}

      {/* When Photo is Already Attached */}
      {photoUrl ? (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3">
          {/* Thumbnail */}
          <div
            onClick={() => setShowPreviewModal(true)}
            className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 group cursor-pointer shrink-0"
            title="انقر لتكبير الصورة"
          >
            <img src={photoUrl} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <ZoomIn className="w-6 h-6 text-white drop-shadow" />
            </div>
            <span className="absolute bottom-1 right-1 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              ✓ تم الحفظ
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex-1 w-full space-y-2">
            <div className="text-xs text-slate-300 font-medium line-clamp-1">
              تم التقاط الصورة وجاهزة للحفظ السحابي
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
                className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                <span>إعادة التقاط</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isProcessing}
                className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>تغيير من الاستديو</span>
              </button>
            </div>

            {onPhotoRemoved && (
              <button
                type="button"
                onClick={onPhotoRemoved}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف الصورة</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty State: Two Direct Buttons: Camera OR Studio */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* 1. Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-850 hover:from-slate-850 hover:to-slate-800 border-2 border-dashed border-orange-500/50 hover:border-orange-400 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition active:scale-98 group"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-white">التقاط بالكاميرا</span>
              <span className="block text-[10px] text-orange-300/80">فتح الكاميرا المباشرة</span>
            </div>
          </button>

          {/* 2. Studio / Gallery Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isProcessing}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-850 hover:from-slate-850 hover:to-slate-800 border-2 border-dashed border-slate-700 hover:border-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition active:scale-98 group"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-white">اختيار من الاستديو</span>
              <span className="block text-[10px] text-slate-400">معرض الصور / الألبوم</span>
            </div>
          </button>
        </div>
      )}

      {/* Processing Loader */}
      {isProcessing && (
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs text-amber-300">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span>جارٍ ضغط وتجهيز الصورة بجودة عالية...</span>
        </div>
      )}

      {/* Full Size Preview Modal */}
      {showPreviewModal && photoUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">{label}</h4>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-2xl border border-slate-800 bg-black flex items-center justify-center">
              <img src={photoUrl} alt={label} className="max-w-full max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
