import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Wrench, 
  AlertTriangle, 
  X, 
  ArrowLeft, 
  Sparkles, 
  MessageCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ClientIncident, ContractRenewalRequest, ClientInquiry } from '../../types';
import { soundNotifier } from '../../utils/soundNotifications';

export interface ClientUpdateAlert {
  id: string;
  type: 'technician_assigned' | 'in_progress' | 'resolved' | 'quote_sent' | 'answered' | 'note_added';
  title: string;
  message: string;
  technicianName?: string;
  adminNotes?: string;
  timestamp: string;
  incident?: ClientIncident;
  renewal?: ContractRenewalRequest;
  inquiry?: ClientInquiry;
}

interface ClientLiveNotificationBannerProps {
  incidents: ClientIncident[];
  renewals: ContractRenewalRequest[];
  inquiries: ClientInquiry[];
  onOpenTracker: (item: { incident?: ClientIncident; renewal?: ContractRenewalRequest; inquiry?: ClientInquiry }) => void;
}

export const ClientLiveNotificationBanner: React.FC<ClientLiveNotificationBannerProps> = ({
  incidents,
  renewals,
  inquiries,
  onOpenTracker,
}) => {
  const [activeAlerts, setActiveAlerts] = useState<ClientUpdateAlert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const previousStateRef = useRef<Map<string, { status: string; technician?: string; notes?: string; answer?: string; quote?: number }>>(new Map());
  const isInitializedRef = useRef(false);

  // Monitor updates made by Admin and trigger live alerts with audible chime
  useEffect(() => {
    const newAlerts: ClientUpdateAlert[] = [];

    // 1. Check Incidents updates
    incidents.forEach((inc) => {
      const prev = previousStateRef.current.get(inc.id);
      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

      if (isInitializedRef.current && prev) {
        // Did status change to in_progress or was technician assigned?
        if (inc.status === 'in_progress' && (prev.status !== 'in_progress' || (inc.assignedTechnician && !prev.technician))) {
          const alertId = `alert_tech_${inc.id}_${inc.assignedTechnician || inc.status}`;
          if (!dismissedAlertIds.has(alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'technician_assigned',
              title: `🛠️ تم توجيه فني صيانة لبلاغك!`,
              message: inc.assignedTechnician
                ? `قام مدير النظام بتكليف الفني (${inc.assignedTechnician}) لمباشرة منشأة (${inc.siteName}).`
                : `تم بدء المعالجة الميدانية لبلاغ (${inc.title}).`,
              technicianName: inc.assignedTechnician,
              adminNotes: inc.adminNotes,
              timestamp: now,
              incident: inc,
            });
          }
        }
        // Did status change to resolved?
        else if (inc.status === 'resolved' && prev.status !== 'resolved') {
          const alertId = `alert_res_${inc.id}`;
          if (!dismissedAlertIds.has(alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'resolved',
              title: `✓ تم إنجاز أعمال الصيانة بنجاح!`,
              message: `أفاد فريق شركة أوريكيت باكتمال صيانة وتدقيق أنظمة (${inc.siteName}).`,
              adminNotes: inc.adminNotes,
              timestamp: now,
              incident: inc,
            });
          }
        }
        // Did admin add notes?
        else if (inc.adminNotes && inc.adminNotes !== prev.notes) {
          const alertId = `alert_note_${inc.id}_${Date.now()}`;
          if (!dismissedAlertIds.has(alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'note_added',
              title: `📋 إفادة جديدة من إدارة السلامة`,
              message: `أضافت إدارة أوريكيت ملاحظات على طلبك: "${inc.adminNotes}"`,
              adminNotes: inc.adminNotes,
              timestamp: now,
              incident: inc,
            });
          }
        }
      }

      // Update ref state
      previousStateRef.current.set(inc.id, {
        status: inc.status,
        technician: inc.assignedTechnician,
        notes: inc.adminNotes,
      });
    });

    // 2. Check Renewal requests updates
    renewals.forEach((ren) => {
      const prev = previousStateRef.current.get(ren.id);
      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

      if (isInitializedRef.current && prev) {
        if (ren.status === 'quote_sent' && prev.status !== 'quote_sent') {
          const alertId = `alert_ren_${ren.id}`;
          if (!dismissedAlertIds.has(alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'quote_sent',
              title: `💰 تم إرسال عرض سعر تجديد العقد!`,
              message: ren.quotedPriceSAR
                ? `حددت الإدارة قيمة تجديد العقد بمبلغ ${ren.quotedPriceSAR.toLocaleString('ar-SA')} ريال.`
                : 'تم إعداد وإرسال عرض السعر المعتمد لتجديد عقد الصيانة.',
              timestamp: now,
              renewal: ren,
            });
          }
        } else if (ren.status === 'approved' && prev.status !== 'approved') {
          const alertId = `alert_ren_app_${ren.id}`;
          if (!dismissedAlertIds.has(alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'resolved',
              title: `🎉 تم اعتماد وتجديد عقد منشأتك!`,
              message: `تم اعتماد تجديد عقد الصيانة لمدة ${ren.requestedDurationYears} سنة بنجاح.`,
              timestamp: now,
              renewal: ren,
            });
          }
        }
      }

      previousStateRef.current.set(ren.id, {
        status: ren.status,
        quote: ren.quotedPriceSAR,
        notes: ren.adminResponse,
      });
    });

    // 3. Check Inquiries updates
    inquiries.forEach((inq) => {
      const prev = previousStateRef.current.get(inq.id);
      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

      if (isInitializedRef.current && prev) {
        if (inq.status === 'answered' && prev.status !== 'answered') {
          const alertId = `alert_inq_${inq.id}`;
          if (!dismissedAlertIds.has(alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'answered',
              title: `💬 تم الرد على استفسارك الفني!`,
              message: inq.answer
                ? `أجاب الاستشاري (${inq.answeredBy || 'مهندس السلامة'}): "${inq.answer.slice(0, 90)}..."`
                : 'تمت إفادتك بالرد الفني المعتمد من قِبل إدارة شركة أوريكيت.',
              timestamp: now,
              inquiry: inq,
            });
          }
        }
      }

      previousStateRef.current.set(inq.id, {
        status: inq.status,
        answer: inq.answer,
      });
    });

    if (newAlerts.length > 0) {
      setActiveAlerts((prev) => [...newAlerts, ...prev]);
      soundNotifier.playChime();
    }

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
  }, [incidents, renewals, inquiries, dismissedAlertIds]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, alertId]));
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4 animate-fadeIn">
      {activeAlerts.slice(0, 2).map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-2xl border shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden ${
            alert.type === 'resolved'
              ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-600/80 shadow-emerald-950/40'
              : alert.type === 'technician_assigned'
              ? 'bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border-blue-500/80 shadow-blue-950/40'
              : 'bg-gradient-to-r from-orange-950 via-slate-900 to-slate-950 border-orange-500/80 shadow-orange-950/40'
          }`}
        >
          {/* Pulsing indicator line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-emerald-400 to-blue-500 animate-pulse" />

          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                alert.type === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : alert.type === 'technician_assigned'
                  ? 'bg-blue-600 text-white shadow-lg animate-pulse'
                  : 'bg-orange-600 text-white shadow-lg'
              }`}
            >
              {alert.type === 'resolved' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : alert.type === 'technician_assigned' ? (
                <Wrench className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">{alert.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">({alert.timestamp})</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {alert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => {
                onOpenTracker({
                  incident: alert.incident,
                  renewal: alert.renewal,
                  inquiry: alert.inquiry,
                });
                handleDismiss(alert.id);
              }}
              className="py-1.5 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-950"
            >
              <span>متابعة الطلب</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleDismiss(alert.id)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
