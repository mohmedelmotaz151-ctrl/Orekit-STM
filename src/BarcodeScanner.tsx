import { useEffect, useRef, useState } from 'react';

type Props = { onScan: (value: string) => void; onClose: () => void };

type ZXingControls = { stop: () => void };
type ZXingReader = {
  decodeFromVideoDevice: (
    deviceId: string | undefined,
    video: HTMLVideoElement,
    callback: (result?: { getText: () => string } | null, error?: unknown) => void
  ) => Promise<ZXingControls>;
};
type ZXingGlobal = { BrowserMultiFormatReader: new () => ZXingReader };

declare global {
  interface Window { ZXingBrowser?: ZXingGlobal }
}

function loadZXing(): Promise<ZXingGlobal> {
  if (window.ZXingBrowser?.BrowserMultiFormatReader) return Promise.resolve(window.ZXingBrowser);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-orkeit-zxing]');
    const script = existing || document.createElement('script');
    const timeout = window.setTimeout(() => reject(new Error('انتهت مهلة تحميل قارئ الباركود')), 12000);
    const cleanup = () => window.clearTimeout(timeout);
    script.addEventListener('load', () => {
      cleanup();
      if (window.ZXingBrowser?.BrowserMultiFormatReader) resolve(window.ZXingBrowser);
      else reject(new Error('تعذر تهيئة قارئ الباركود'));
    }, { once: true });
    script.addEventListener('error', () => { cleanup(); reject(new Error('تعذر تحميل قارئ الباركود')); }, { once: true });
    if (!existing) {
      script.src = 'https://unpkg.com/@zxing/browser@0.1.5/umd/index.min.js';
      script.async = true;
      script.dataset.orkeitZxing = 'true';
      document.head.appendChild(script);
    }
  });
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(true);
  const [status, setStatus] = useState('جارٍ تشغيل الكاميرا وتجهيز قارئ الباركود…');

  useEffect(() => {
    let stream: MediaStream | undefined;
    let timer = 0;
    let stopped = false;
    let zxingControls: ZXingControls | undefined;
    const finish = (value: string) => {
      if (stopped || !value.trim()) return;
      stopped = true;
      zxingControls?.stop();
      stream?.getTracks().forEach(track => track.stop());
      onScan(value.trim());
    };

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('افتح التطبيق عبر اتصال آمن HTTPS واسمح باستخدام الكاميرا.');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (!videoRef.current || stopped) { stream.getTracks().forEach(track => track.stop()); return; }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const Detector = (window as any).BarcodeDetector;
        if (Detector) {
          try {
            const supported = typeof Detector.getSupportedFormats === 'function'
              ? await Detector.getSupportedFormats()
              : ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'pdf417', 'data_matrix'];
            const wanted = ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'pdf417', 'data_matrix'];
            const formats = wanted.filter(format => supported.includes(format));
            if (formats.length) {
              const detector = new Detector({ formats });
              setStatus('وجّه الكاميرا إلى الباركود أو رمز QR وثبّت الهاتف لحظة.');
              const scan = async () => {
                if (stopped || !videoRef.current) return;
                try {
                  const codes = await detector.detect(videoRef.current);
                  const found = codes?.find((code: { rawValue?: string }) => code.rawValue?.trim());
                  if (found?.rawValue) { finish(found.rawValue); return; }
                } catch { /* Wait for the next camera frame. */ }
                if (!stopped) timer = window.setTimeout(scan, 180);
              };
              void scan();
              return;
            }
          } catch { /* Use the compatibility scanner below. */ }
        }

        setStatus('جارٍ تشغيل قارئ متوافق مع أنواع متعددة من الباركود…');
        // Release the first stream before the fallback reader opens its own camera stream.
        stream?.getTracks().forEach(track => track.stop());
        stream = undefined;
        if (videoRef.current) videoRef.current.srcObject = null;
        const zxing = await loadZXing();
        if (stopped || !videoRef.current) return;
        zxingControls = await new zxing.BrowserMultiFormatReader().decodeFromVideoDevice(
          undefined,
          videoRef.current,
          result => { if (result) finish(result.getText()); }
        );
        setStatus('وجّه الكاميرا إلى الباركود أو رمز QR وثبّت الهاتف لحظة.');
      } catch (e) {
        if (stopped) return;
        stream?.getTracks().forEach(track => track.stop());
        setRunning(false);
        setError(e instanceof Error && e.message.includes('HTTPS')
          ? e.message
          : 'تعذر تشغيل قارئ الكاميرا. تأكد من السماح بالكاميرا والاتصال بالإنترنت، أو أدخل محتوى الباركود يدويًا.');
      }
    };

    void start();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      zxingControls?.stop();
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [onScan]);

  return <div className="barcodeScanner">
    <div className="barcodeScannerHead"><strong>قارئ الباركود</strong><button type="button" onClick={onClose}>إغلاق ×</button></div>
    {running && <video ref={videoRef} className="barcodeVideo" playsInline muted autoPlay />}
    {status && running && <p className="muted" role="status">{status}</p>}
    {error && <p className="muted" role="alert">{error}</p>}
    <p className="muted">يدعم قارئ الكاميرا رموز QR والباركود الشائعة. إذا كان الرمز يحتوي على رابط أو بيانات، فسيتم تمرير النص المقروء إلى نموذج المنشأة.</p>
    <form onSubmit={e => { e.preventDefault(); if (manual.trim()) onScan(manual.trim()); }}>
      <label>إدخال محتوى الباركود يدويًا<input value={manual} onChange={e => setManual(e.target.value)} placeholder="رقم العقد أو نص/رابط الباركود" /></label>
      <button className="primary wide" type="submit" disabled={!manual.trim()}>استخدام البيانات</button>
    </form>
  </div>;
}
