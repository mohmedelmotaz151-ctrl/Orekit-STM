import { useEffect, useRef, useState } from 'react';

type Props = { onScan: (value: string) => void; onClose: () => void };
export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let timer = 0;
    let stopped = false;
    const start = async () => {
      try {
        const Detector = (window as any).BarcodeDetector;
        if (!Detector) {
          setError('المتصفح لا يدعم قارئ الباركود المدمج. أدخل محتوى الباركود يدويًا في الحقل أدناه.');
          setRunning(false);
          return;
        }
        const detector = new Detector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'pdf417', 'data_matrix'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (!videoRef.current || stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const scan = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes?.length && codes[0].rawValue) {
              stopped = true;
              onScan(codes[0].rawValue);
              return;
            }
          } catch { /* keep scanning while camera frames are not ready */ }
          timer = window.setTimeout(scan, 250);
        };
        void scan();
      } catch (e) {
        setRunning(false);
        setError('تعذر تشغيل الكاميرا. اسمح للمتصفح باستخدام الكاميرا أو أدخل محتوى الباركود يدويًا.');
      }
    };
    void start();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [onScan]);

  return <div className="barcodeScanner">
    <div className="barcodeScannerHead"><strong>قارئ الباركود</strong><button type="button" onClick={onClose}>إغلاق ×</button></div>
    {running && <video ref={videoRef} className="barcodeVideo" playsInline muted />}
    {error && <p className="muted">{error}</p>}
    <p className="muted">وجّه الكاميرا إلى باركود العقد أو رمز QR.</p>
    <form onSubmit={e => { e.preventDefault(); if (manual.trim()) onScan(manual.trim()); }}>
      <label>إدخال محتوى الباركود يدويًا<input value={manual} onChange={e => setManual(e.target.value)} placeholder="رقم العقد أو نص/رابط الباركود" /></label>
      <button className="primary wide" type="submit" disabled={!manual.trim()}>استخدام البيانات</button>
    </form>
  </div>;
}
