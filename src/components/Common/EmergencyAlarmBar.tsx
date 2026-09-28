import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Flame, 
  Check, 
  X, 
  Smartphone,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { soundNotifier } from '../../utils/soundNotifications';

interface EmergencyAlarmBarProps {
  urgentAlertsCount: number;
  onOpenAlerts?: () => void;
}

export const EmergencyAlarmBar: React.FC<EmergencyAlarmBarProps> = ({
  urgentAlertsCount,
  onOpenAlerts,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundNotifier.isSoundEnabled());
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
      if (Notification.permission === 'default') {
        setShowPromptBanner(true);
      }
    }
  }, []);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundNotifier.setSoundEnabled(newState);
    if (newState) {
      soundNotifier.playChime();
    } else {
      soundNotifier.stopAlarm();
    }
  };

  const handleRequestPermission = async () => {
    soundNotifier.initAudio();
    const perm = await soundNotifier.requestNotificationPermission();
    setNotificationStatus(perm);
    setShowPromptBanner(false);
    if (perm === 'granted') {
      soundNotifier.sendEmergencyNotification({
        title: '🚨 تفعيل إنذارات وإشعارات أوريكيت الميدانية',
        body: 'تم تفعيل التنبيهات الصوتية وإنذارات الطوارئ بنجاح! ستصلك التنبيهات خارج التطبيق حتى عند قفل الشاشة.',
        urgent: true,
      });
    }
  };

  const handleTestAlarm = () => {
    soundNotifier.initAudio();
    setIsPlayingTest(true);
    soundNotifier.sendEmergencyNotification({
      title: '🚨 تجربة إنذار الطوارئ - شركة أوريكيت للسلامة',
      body: 'هذا فحص صوتي واختبار لصفارة الإنذار الميدانية وإشعارات النظام خارج التطبيق.',
      urgent: true,
    });
    setTimeout(() => {
      setIsPlayingTest(false);
    }, 4000);
  };

  return (
    <div className="w-full">
      {/* 1. Request Permission Banner if not decided yet */}
      {showPromptBanner && notificationStatus === 'default' && (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-b border-red-800/80 px-4 py-2.5 text-xs text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 animate-pulse">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-red-300 block">
                تفعيل الإشعارات الصوتية وإنذار الطوارئ خارج التطبيق:
              </span>
              <span className="text-[11px] text-slate-300">
                اسمح بالإشعارات لتصلك صفارة إنذار الدفاع المدني وتنبيهات الأعطال والعقود حتى عندما يكون التطبيق مغلقاً.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>السماح وتشغيل الإنذار</span>
            </button>
            <button
              onClick={() => setShowPromptBanner(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Compact Sound Control Strip (Header or Dashboard) */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-slate-200">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <span>نظام إنذار الطوارئ الصوتي:</span>
          </span>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              notificationStatus === 'granted'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${notificationStatus === 'granted' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            {notificationStatus === 'granted' ? 'مفعل خارج التطبيق' : 'يحتاج إذن إشعارات'}
          </span>

          {urgentAlertsCount > 0 && (
            <span
              onClick={onOpenAlerts}
              className="cursor-pointer text-[10px] px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-bold animate-pulse hover:bg-red-900 transition"
            >
              🚨 {urgentAlertsCount} تنبيه طوارئ نشط
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Test Alarm Sound Button */}
          <button
            onClick={handleTestAlarm}
            disabled={isPlayingTest}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 ${
              isPlayingTest
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="تجربة صوت صفارة إنذار الحريق وإشعار النظام"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>{isPlayingTest ? 'جاري إطلاق الإنذار...' : 'تجربة الإنذار 🔊'}</span>
          </button>

          {/* Mute / Unmute Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-[11px] font-bold ${
              soundEnabled
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80 hover:bg-emerald-900'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">الصوت مفعل</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">الصوت مكتوم</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
