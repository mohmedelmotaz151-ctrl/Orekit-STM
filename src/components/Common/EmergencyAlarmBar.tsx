import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Flame, 
  ShieldAlert, 
  Clock, 
  Radio, 
  X,
  CheckCircle2
} from 'lucide-react';
import { soundNotifier } from '../../utils/soundNotifications';

interface EmergencyAlarmBarProps {
  expiringContractsCount: number;
  urgentMaintenanceCount: number;
  civilDefenseVisitsCount: number;
  onOpenAlerts?: (target?: 'contracts' | 'maintenance' | 'civil_defense') => void;
}

export const EmergencyAlarmBar: React.FC<EmergencyAlarmBarProps> = ({
  expiringContractsCount,
  urgentMaintenanceCount,
  civilDefenseVisitsCount,
  onOpenAlerts,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundNotifier.isSoundEnabled());
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [isPlayingSiren, setIsPlayingSiren] = useState(false);

  const totalCriticalCount = expiringContractsCount + urgentMaintenanceCount + civilDefenseVisitsCount;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
      if (Notification.permission === 'default' && totalCriticalCount > 0) {
        setShowPromptBanner(true);
      }
    }
  }, [totalCriticalCount]);

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
  };

  // Triggers siren only for real critical alerts (Expiring contracts, urgent maintenance, or civil defense visits)
  const handleTriggerAlarmForRealAlerts = () => {
    if (totalCriticalCount === 0) return;
    soundNotifier.initAudio();
    setIsPlayingSiren(true);

    const parts: string[] = [];
    if (urgentMaintenanceCount > 0) parts.push(`${urgentMaintenanceCount} صيانة عاجلة`);
    if (expiringContractsCount > 0) parts.push(`${expiringContractsCount} عقود قاربت على الانتهاء`);
    if (civilDefenseVisitsCount > 0) parts.push(`${civilDefenseVisitsCount} زيارات دفاع مدني`);

    soundNotifier.sendEmergencyNotification({
      title: '🚨 إنذار طوارئ: تنبيهات ميدانية حرجة تتطلب المتابعة!',
      body: parts.join(' • '),
      urgent: true,
      tag: 'critical_emergency_alarm',
    });

    setTimeout(() => {
      setIsPlayingSiren(false);
    }, 4500);
  };

  return (
    <div className="w-full">
      {/* 1. Request Permission Banner (only shown if there are real critical alerts pending) */}
      {showPromptBanner && notificationStatus === 'default' && totalCriticalCount > 0 && (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-b border-red-800/80 px-4 py-2.5 text-xs text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 animate-pulse">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-red-300 block">
                تفعيل الإشعارات وإنذار الطوارئ خارج التطبيق:
              </span>
              <span className="text-[11px] text-slate-300">
                اسمح بالإشعارات لتصلك صفارة الإنذار الميداني وتنبيهات العقود والصيانة العاجلة حتى عندما يكون التطبيق مغلقاً.
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

      {/* 2. Emergency Alarm Bar */}
      {totalCriticalCount > 0 ? (
        /* ACTIVE ALARM: Triggers and displays ONLY with real critical alerts */
        <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/80 border-b border-red-700/70 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-200 shadow-md">
          {/* Left: Alert Badges Breakdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 font-black text-rose-300 text-xs shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span>إنذار الحالات الحرجة ({totalCriticalCount}):</span>
            </span>

            {/* Urgent Maintenance Badge */}
            {urgentMaintenanceCount > 0 && (
              <button
                onClick={() => onOpenAlerts?.('maintenance')}
                className="px-2.5 py-1 rounded-xl bg-rose-950/90 text-rose-300 border border-rose-700/80 font-bold text-[11px] flex items-center gap-1 hover:bg-rose-900 transition active:scale-95 shadow-sm"
                title="عرض مواقع وبلاغات الصيانة العاجلة"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                <span>{urgentMaintenanceCount} صيانة عاجلة</span>
              </button>
            )}

            {/* Expiring Contracts Badge */}
            {expiringContractsCount > 0 && (
              <button
                onClick={() => onOpenAlerts?.('contracts')}
                className="px-2.5 py-1 rounded-xl bg-amber-950/90 text-amber-300 border border-amber-700/80 font-bold text-[11px] flex items-center gap-1 hover:bg-amber-900 transition active:scale-95 shadow-sm"
                title="عرض العقود التي قاربت على الانتهاء"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{expiringContractsCount} عقود قاربت على الانتهاء</span>
              </button>
            )}

            {/* Civil Defense Visits Badge */}
            {civilDefenseVisitsCount > 0 && (
              <button
                onClick={() => onOpenAlerts?.('civil_defense')}
                className="px-2.5 py-1 rounded-xl bg-blue-950/90 text-blue-300 border border-blue-700/80 font-bold text-[11px] flex items-center gap-1 hover:bg-blue-900 transition active:scale-95 shadow-sm"
                title="عرض مواعيد زيارات وتفتيش الدفاع المدني"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                <span>{civilDefenseVisitsCount} زيارات دفاع مدني</span>
              </button>
            )}
          </div>

          {/* Right: Sound Trigger for Real Critical Alerts & Sound Mute Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Trigger siren for real critical alerts (Hidden as requested) */}
            <button
              onClick={handleTriggerAlarmForRealAlerts}
              disabled={isPlayingSiren}
              className="hidden"
              style={{ display: 'none' }}
              title="إطلاق صفارة إنذار الطوارئ لهذه الحالات الميدانية الحرجة"
            >
              <Radio className="w-3.5 h-3.5 shrink-0" />
              <span>{isPlayingSiren ? 'صفارة الإنذار نشطة 🔊' : 'تشغيل صفارة الإنذار 🚨'}</span>
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
      ) : (
        /* QUIET STANDBY: When all contracts, maintenance, and civil defense visits are in order */
        <div className="bg-slate-900/60 border-b border-slate-800/60 px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
            <span className="text-[11px] text-slate-300 font-medium">
              نظام إنذار السلامة: مستقر — لا توجد عقود قاربت على الانتهاء أو صيانة عاجلة أو زيارات دفاع مدني حالياً
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSound}
              className={`p-1 rounded-lg border transition flex items-center gap-1 text-[10px] font-medium ${
                soundEnabled
                  ? 'bg-slate-900 text-emerald-400 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'كتم صوت التنبيهات' : 'تفعيل صوت التنبيهات'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">جاهز للتنبيه</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">مكتوم</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
