import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Award, 
  Building2, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Lock, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  X,
  Phone,
  Search,
  KeyRound
} from 'lucide-react';
import { User, Site, Visit, IncentiveSettings, UserRole, SAUDI_CITIES } from '../../types';
import { calculateAgentIncentives } from '../../utils/storage';

interface AgentsManagementProps {
  currentUser: User;
  agents: User[];
  sites: Site[];
  visits: Visit[];
  settings: IncentiveSettings;
  onSaveAgent: (agent: User) => void;
  onToggleAgentStatus: (agentId: string) => void;
  onSelectAgentForSites: (agentId: string) => void;
}

export const AgentsManagement: React.FC<AgentsManagementProps> = ({
  currentUser,
  agents,
  sites,
  visits,
  settings,
  onSaveAgent,
  onToggleAgentStatus,
  onSelectAgentForSites,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('1234');
  const [formRole, setFormRole] = useState<UserRole>('agent');
  const [formCity, setFormCity] = useState('الرياض');
  const [formTarget, setFormTarget] = useState(300);

  const openAddModal = () => {
    setEditingAgent(null);
    setFormName('');
    setFormUsername('');
    setFormPhone('');
    setFormPassword('1234');
    setFormRole('agent');
    setFormCity('الرياض');
    setFormTarget(300);
    setShowAddModal(true);
  };

  const openEditModal = (agent: User) => {
    setEditingAgent(agent);
    setFormName(agent.name);
    setFormUsername(agent.username);
    setFormPhone(agent.phone);
    setFormPassword(agent.password || '1234');
    setFormRole(agent.role);
    setFormCity(agent.assignedCity);
    setFormTarget(agent.targetSitesMonth || 300);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert('الرجاء إدخال الاسم ورقم الجوال');
      return;
    }

    const newAgent: User = {
      id: editingAgent ? editingAgent.id : `user_agent_${Date.now()}`,
      name: formName.trim(),
      username: formUsername.trim() || formPhone.trim(),
      phone: formPhone.trim(),
      password: formPassword.trim() || '1234',
      role: formRole,
      active: editingAgent ? editingAgent.active : true,
      assignedCity: formCity,
      targetSitesMonth: Number(formTarget) || 300,
      joinedDate: editingAgent ? editingAgent.joinedDate : new Date().toISOString().split('T')[0],
    };

    onSaveAgent(newAgent);
    setShowAddModal(false);
  };

  const filteredAgents = agents.filter((a) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        a.assignedCity.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">إدارة مناديب المبيعات والعمليات الميدانية</h2>
          <p className="text-xs text-slate-400">
            متابعة إنجاز المستهدف الشهري (300 موقع)، عدد الزيارات، والعقود المحولة، والحوافز المستحقة
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/50 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مندوب جديد</span>
        </button>
      </div>

      {/* Agents Performance Cards Grid */}
      {filteredAgents.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-3 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-white">لا يوجد مناديب مسجلين حالياً</h3>
          <p className="text-xs text-slate-400">
            تتم إضافة المندوبين حصرياً بواسطة إدارة الشركة، يمكنك إنشاء حساب مندوب جديد وتحديد رقم جواله وكلمة مروره ليتمكن من تسجيل الدخول وبدء الزيارات الميدانية.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-orange-950/50"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة أول مندوب الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const agentSites = sites.filter((s) => s.createdByAgentId === agent.id);
            const agentVisits = visits.filter((v) => v.agentId === agent.id);
            
            const recordedSitesCount = agentSites.length;
            const visitsCount = agentVisits.length;
            const potentialContractsCount = Math.round(recordedSitesCount * 0.25);
            const convertedContractsCount = Math.round(potentialContractsCount * 0.35);

            const inc = calculateAgentIncentives(agent.id, sites, settings);
            const totalIncentiveDisplay = inc.grandTotalSAR;

            return (
              <div
                key={agent.id}
                className={`bg-slate-900/90 rounded-2xl border p-4 space-y-4 shadow-xl transition relative overflow-hidden ${
                  agent.active ? 'border-slate-800' : 'border-rose-900/40 opacity-70'
                }`}
              >
                {/* Agent Top Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-base shadow">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{agent.name}</h3>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                          agent.active ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {agent.active ? 'حساب نشط' : 'معطل'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {agent.assignedCity} • {agent.role === 'admin' ? 'مدير' : agent.role === 'supervisor' ? 'مشرف' : 'مندوب ميداني'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(agent)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      title="تعديل بيانات المندوب"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleAgentStatus(agent.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold ${
                        agent.active ? 'bg-rose-950/70 text-rose-300 hover:bg-rose-900' : 'bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900'
                      }`}
                      title={agent.active ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                    >
                      {agent.active ? 'تعطيل' : 'تنشيط'}
                    </button>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-850 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">المواقع</span>
                    <strong className="text-white text-base font-bold font-mono">{recordedSitesCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">الزيارات</span>
                    <strong className="text-sky-400 text-base font-bold font-mono">{visitsCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">عقود محتملة</span>
                    <strong className="text-amber-400 text-base font-bold font-mono">{potentialContractsCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">تم تحويلها</span>
                    <strong className="text-emerald-400 text-base font-bold font-mono">{convertedContractsCount}</strong>
                  </div>
                </div>

                {/* Login Credentials Info for Admin */}
                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>بيانات الدخول:</span>
                  <span className="font-mono text-slate-200">
                    جوال: <strong className="text-white">{agent.phone}</strong> • كلمة المرور: <strong className="text-orange-400">{agent.password || '1234'}</strong>
                  </span>
                </div>

                {/* Incentive Result */}
                <div className="bg-gradient-to-r from-orange-950/40 to-slate-900 p-3 rounded-xl border border-orange-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-orange-300 block">إجمالي الحافز المحسوب:</span>
                    <div className="text-lg font-black text-orange-400 font-mono">
                      {totalIncentiveDisplay} ر.س
                    </div>
                  </div>
                  <div className="text-left text-[11px] text-slate-400">
                    <span>المستهدف: {agent.targetSitesMonth} موقع</span>
                    <span className="block text-emerald-400 font-bold">
                      {recordedSitesCount >= (agent.targetSitesMonth || 300) ? '🎉 محقق للمستهدف' : `${(agent.targetSitesMonth || 300) - recordedSitesCount} متبقٍ`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-1 flex items-center justify-between text-xs">
                  <a
                    href={`tel:${agent.phone}`}
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    dir="ltr"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{agent.phone}</span>
                  </a>

                  <button
                    onClick={() => onSelectAgentForSites(agent.id)}
                    className="text-orange-400 hover:text-orange-300 font-bold text-xs"
                  >
                    مشاهدة مواقع المندوب ←
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingAgent ? 'تعديل بيانات المندوب' : 'إضافة حساب مندوب جديد'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المندوب الثلاثي</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: تركي بن صالح العتيبي"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المستخدم للدخول</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="turki_sales"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الجوال (للدخول والتواصل)</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-left font-mono"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">كلمة المرور لدخول المندوب</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="مثال: 1234 أو رمز سري"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-left font-mono"
                  dir="ltr"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  سيستخدم المندوب رقم جواله وهذه الكلمة لتسجيل الدخول إلى تطبيق الجوال.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الصلاحية</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="agent">مندوب ميداني</option>
                    <option value="supervisor">مشرف عمليات</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">منطقة العمل / المدينة</label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold"
                  >
                    {SAUDI_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">المستهدف الشهري (عدد المواقع)</label>
                <input
                  type="number"
                  value={formTarget}
                  onChange={(e) => setFormTarget(parseInt(e.target.value) || 300)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  {editingAgent ? 'حفظ التعديلات' : 'إنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
