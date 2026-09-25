import React, { useState } from 'react';
import { 
  Award, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  FileSpreadsheet, 
  Eye, 
  Save,
  Check
} from 'lucide-react';
import { User, Site, IncentiveSettings } from '../../types';
import { exportToCSV } from '../../utils/storage';
import { formatDateArabic } from '../../utils/date';

interface IncentivesManagementProps {
  currentUser: User;
  sites: Site[];
  agents: User[];
  settings: IncentiveSettings;
  onUpdateSettings: (settings: IncentiveSettings) => void;
  onApproveSite: (siteId: string, approved: boolean, reason?: string) => void;
  onSelectSite: (site: Site) => void;
}

export const IncentivesManagement: React.FC<IncentivesManagementProps> = ({
  currentUser,
  sites,
  agents,
  settings,
  onUpdateSettings,
  onApproveSite,
  onSelectSite,
}) => {
  // Rate config form
  const [currentRate, setCurrentRate] = useState<number>(settings.ratePerApprovedSiteSAR || 1.50);
  const [minTarget, setMinTarget] = useState<number>(settings.minTargetSites || 300);
  const [targetBonus, setTargetBonus] = useState<number>(settings.targetBonusSAR || 100);
  const [tier2Target, setTier2Target] = useState<number>(settings.tier2TargetSites || 500);
  const [tier2Bonus, setTier2Bonus] = useState<number>(settings.tier2BonusSAR || 250);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Rejection input modal
  const [rejectSiteId, setRejectSiteId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const pendingSites = sites.filter((s) => s.approvalStatus === 'pending');
  const approvedSites = sites.filter((s) => s.approvalStatus === 'approved');
  const totalApprovedSAR = approvedSites.reduce((sum, s) => sum + (s.incentiveAmount || currentRate), 0);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ratePerApprovedSiteSAR: Number(currentRate),
      minTargetSites: Number(minTarget),
      targetBonusSAR: Number(targetBonus),
      tier2TargetSites: Number(tier2Target),
      tier2BonusSAR: Number(tier2Bonus),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportIncentivesCSV = () => {
    const reportData = agents
      .filter((a) => a.role === 'agent')
      .map((agent) => {
        const agentSites = sites.filter((s) => s.createdByAgentId === agent.id);
        const approved = agentSites.filter((s) => s.approvalStatus === 'approved').length;
        const pending = agentSites.filter((s) => s.approvalStatus === 'pending').length;
        const baseSAR = approved * currentRate;
        const bonusSAR = approved >= minTarget ? targetBonus : 0;
        const totalSAR = baseSAR + bonusSAR;

        return {
          'اسم المندوب': agent.name,
          'رقم الجوال': agent.phone,
          'المدينة': agent.assignedCity,
          'المواقع المسجلة': agentSites.length,
          'المواقع المعتمدة': approved,
          'المواقع قيد المراجعة': pending,
          'قيمة الموقع (ر.س)': currentRate,
          'حافز المواقع الأساسي': baseSAR.toFixed(2),
          'مكافأة المستهدف (بونص)': bonusSAR,
          'إجمالي الحافز المستحق (ر.س)': totalSAR.toFixed(2),
        };
      });

    exportToCSV(`تقرير_حوافز_مندوبي_أوريكيت_${new Date().toISOString().split('T')[0]}`, reportData);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 p-5 rounded-3xl border border-orange-500/30">
        <div>
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">
            المنظومة المالية والتحفيزية
          </span>
          <h2 className="text-xl font-black text-white">إدارة الحوافز واعتماد المواقع الميدانية</h2>
          <p className="text-xs text-slate-300">
            مراجعة وتدقيق المواقع قبل إضافة الحافز لضمان الجودة ومصداقية بيانات السلامة
          </p>
        </div>

        <button
          onClick={handleExportIncentivesCSV}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>تصدير مسير الحوافز (Excel)</span>
        </button>
      </div>

      {/* 1. FLEXIBLE INCENTIVE SETTINGS FORM (Admin can change from 1.50 SAR to 2.00 SAR) */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-sm text-white">إعدادات وضبط معدلات الحوافز المرنة</h3>
          </div>
          <span className="text-xs text-slate-400">تعديل الإدارة ينعكس تلقائياً على كل الحسابات</span>
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-2xl border border-orange-500/30">
            <label className="block text-slate-300 font-bold mb-1">
              قيمة حافز الموقع المعتمد (ر.س)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.25"
                min="0.5"
                value={currentRate}
                onChange={(e) => setCurrentRate(parseFloat(e.target.value) || 1.5)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-orange-400 font-black text-lg text-center"
              />
              <span className="text-slate-400 font-medium">ر.س</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">الحالي: 1.50 ر.س (يمكن تغييره إلى 2.00)</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <label className="block text-slate-300 font-bold mb-1">
              مستهدف المستوى 1 (عدد المواقع)
            </label>
            <input
              type="number"
              value={minTarget}
              onChange={(e) => setMinTarget(parseInt(e.target.value) || 300)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-center"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">300 موقع = 450 ر.س</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <label className="block text-slate-300 font-bold mb-1">
              مكافأة بونص تحقيق المستوى 1
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={targetBonus}
                onChange={(e) => setTargetBonus(parseFloat(e.target.value) || 100)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-center"
              />
              <span className="text-slate-400">ر.س</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">تضاف فوق حافز الـ 300 موقع</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                مستهدف المستوى 2 (500 موقع)
              </label>
              <input
                type="number"
                value={tier2Bonus}
                onChange={(e) => setTier2Bonus(parseFloat(e.target.value) || 250)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-bold text-center"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center justify-center gap-1.5 shadow"
            >
              {isSaved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'تم حفظ التعديلات!' : 'تحديث إعدادات الحوافز'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. PENDING APPROVAL QUEUE (ANTI-FRAUD AUDIT) */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              طابور المراجعة والاعتماد الميداني ({pendingSites.length} موقع بانتظار الموافقة)
            </h3>
          </div>
          <span className="text-xs text-amber-300 font-medium">
            يجب تدقيق الموقع الجغرافي والصور قبل الصرف
          </span>
        </div>

        {pendingSites.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl text-slate-400 text-xs">
            🎉 تم تدقيق واعتماد جميع المواقع المسجلة! لا توجد طلبات معلقة حالياً.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSites.map((site) => (
              <div
                key={site.id}
                className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                    <img
                      src={site.sitePhoto || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{site.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {site.type}
                      </span>
                    </div>
                    <p className="text-slate-400">
                      📍 {site.city} ({site.district}) • المسؤول: {site.managerName} ({site.phone})
                    </p>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>المندوب: <strong className="text-orange-400">{site.createdByAgentName}</strong></span>
                      <span>•</span>
                      <span>سجل بتاريخ: {formatDateArabic(site.createdAt)}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold font-mono">الحافز: {site.incentiveAmount || currentRate} ر.س</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onSelectSite(site)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>فحص وتدقيق</span>
                  </button>
                  <button
                    onClick={() => onApproveSite(site.id, true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد وصرف الحافز</span>
                  </button>
                  <button
                    onClick={() => {
                      setRejectSiteId(site.id);
                      setRejectReason('');
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-950/70 text-rose-300 hover:bg-rose-900 font-bold border border-rose-800"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. AGENTS INCENTIVE SUMMARY TABLE */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">مسير حوافز المندوبين الشهري</h3>
          <span className="text-xs text-slate-400">إجمالي المعتمد المصروف: <strong className="text-orange-400">{totalApprovedSAR.toFixed(2)} ر.س</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-3">اسم المندوب</th>
                <th className="p-3">المدينة والمنطقة</th>
                <th className="p-3">المواقع المعتمدة</th>
                <th className="p-3">قيد المراجعة</th>
                <th className="p-3">المستهدف (300 موقع)</th>
                <th className="p-3">حافز المواقع</th>
                <th className="p-3">مكافأة الهدف</th>
                <th className="p-3 font-bold text-orange-400">إجمالي المستحق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {agents
                .filter((a) => a.role === 'agent')
                .map((agent) => {
                  const agentSites = sites.filter((s) => s.createdByAgentId === agent.id);
                  const approved = agentSites.filter((s) => s.approvalStatus === 'approved').length;
                  const pending = agentSites.filter((s) => s.approvalStatus === 'pending').length;
                  const baseSAR = approved * currentRate;
                  const bonusSAR = approved >= minTarget ? targetBonus : 0;
                  const grandTotal = baseSAR + bonusSAR;

                  return (
                    <tr key={agent.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-orange-600/20 text-orange-400 flex items-center justify-center text-xs">
                          {agent.name.charAt(0)}
                        </div>
                        <span>{agent.name}</span>
                      </td>
                      <td className="p-3">{agent.assignedCity}</td>
                      <td className="p-3 text-emerald-400 font-bold font-mono">{approved} موقع</td>
                      <td className="p-3 text-amber-400 font-mono">{pending} موقع</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-orange-500 h-full"
                              style={{ width: `${Math.min(100, Math.round((approved / minTarget) * 100))}%` }}
                            />
                          </div>
                          <span>{Math.round((approved / minTarget) * 100)}%</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono">{baseSAR.toFixed(2)} ر.س</td>
                      <td className="p-3 font-mono text-emerald-400">+{bonusSAR} ر.س</td>
                      <td className="p-3 font-black text-orange-400 font-mono text-sm">
                        {grandTotal.toFixed(2)} ر.س
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectSiteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-700/60 rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-white">تأكيد رفض الموقع وعدم احتساب الحافز</h3>
            <p className="text-xs text-slate-400">
              يرجى توضيح سبب الرفض ليظهر للمندوب (مثل: موقع مكرر، بيانات غير مكتملة، عدم مطابقة GPS)
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="اكتب سبب الرفض..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectSiteId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onApproveSite(rejectSiteId, false, rejectReason || 'موقع غير مطابق للشروط');
                  setRejectSiteId(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
