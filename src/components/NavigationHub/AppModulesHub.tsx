import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Flame,
  MapPin,
  ShieldAlert,
  Users,
  Award,
  FileSpreadsheet,
  PlusCircle,
  FileCheck2,
  MessageCircle,
  Search,
  ArrowRight,
  Compass,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Clock,
  Radio
} from 'lucide-react';
import { User, Site, UserRole } from '../../types';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../../utils/whatsapp';

export interface AppModulesHubProps {
  currentUser: User;
  onNavigate: (destination: {
    view?: 'admin_dashboard' | 'mobile_agent';
    adminTab?: 'dashboard' | 'sites' | 'extinguishers' | 'agents' | 'clients' | 'incentives' | 'reports' | 'alerts';
    mobileTab?: 'home' | 'sites' | 'map' | 'alerts' | 'profile';
    openNewVisit?: boolean;
    openFilter?: string;
  }) => void;
  onClose: () => void;
  sitesCount: number;
  criticalAlertsCount: number;
  expiringContractsCount: number;
}

interface ModuleItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'core' | 'operations' | 'safety' | 'analytics';
  categoryLabel: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge?: string;
  roles: UserRole[];
  action: () => void;
}

export const AppModulesHub: React.FC<AppModulesHubProps> = ({
  currentUser,
  onNavigate,
  onClose,
  sitesCount,
  criticalAlertsCount,
  expiringContractsCount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'core' | 'operations' | 'safety' | 'analytics'>('all');

  const modules: ModuleItem[] = [
    {
      id: 'dashboard',
      title: 'لوحة التحكم والعمليات',
      subtitle: 'Dashboard & Operations',
      description: 'نظرة شاملة ومباشرة على مؤشرات الأداء، زيارات اليوم، إحصائيات العقود، ونسب إنجاز المنظومة.',
      category: 'core',
      categoryLabel: 'الأنظمة الأساسية',
      icon: LayoutDashboard,
      iconBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400 group-hover:bg-orange-500 group-hover:text-white',
      iconColor: 'text-orange-400',
      badge: 'المركز الرئيسي',
      roles: ['admin', 'supervisor', 'agent'],
      action: () => {
        if (currentUser.role === 'admin') {
          onNavigate({ view: 'admin_dashboard', adminTab: 'dashboard' });
        } else {
          onNavigate({ view: 'mobile_agent', mobileTab: 'home' });
        }
      },
    },
    {
      id: 'sites',
      title: 'سجل المواقع والمنشآت (CRM)',
      subtitle: 'Facilities & Clients CRM',
      description: 'قاعدة بيانات المنشآت التجارية، مسؤولي السلامة، تحديث بيانات العقود، والكروكي الجغرافي.',
      category: 'core',
      categoryLabel: 'الأنظمة الأساسية',
      icon: Building2,
      iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400 group-hover:bg-amber-500 group-hover:text-white',
      iconColor: 'text-amber-400',
      badge: `${sitesCount} منشأة`,
      roles: ['admin', 'supervisor', 'agent'],
      action: () => {
        if (currentUser.role === 'admin') {
          onNavigate({ view: 'admin_dashboard', adminTab: 'sites' });
        } else {
          onNavigate({ view: 'mobile_agent', mobileTab: 'sites' });
        }
      },
    },
    {
      id: 'extinguishers',
      title: 'أجهزة ومعدات السلامة',
      subtitle: 'Fire Extinguishers & Systems',
      description: 'حصر ومتابعة طفايات الحريق، شبكات الإطفاء والإنذار، تواريخ الفحص والصيانة الدورية وتنبيهات التعبئة.',
      category: 'safety',
      categoryLabel: 'السلامة والوقاية',
      icon: Flame,
      iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400 group-hover:bg-rose-500 group-hover:text-white',
      iconColor: 'text-rose-400',
      badge: 'فحص دوري',
      roles: ['admin', 'supervisor'],
      action: () => {
        onNavigate({ view: 'admin_dashboard', adminTab: 'extinguishers' });
      },
    },
    {
      id: 'map',
      title: 'الخريطة الميدانية التفاعلية',
      subtitle: 'Interactive Field Map',
      description: 'رصد مواقع المنشآت بنظام GPS، توزيع المناديب على الأحياء، واحتساب مسافات الأمان والتغطية.',
      category: 'operations',
      categoryLabel: 'العمليات الميدانية',
      icon: MapPin,
      iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
      iconColor: 'text-emerald-400',
      badge: 'تغطية GPS',
      roles: ['admin', 'supervisor', 'agent'],
      action: () => {
        if (currentUser.role === 'admin') {
          onNavigate({ view: 'admin_dashboard', adminTab: 'sites' });
        } else {
          onNavigate({ view: 'mobile_agent', mobileTab: 'map' });
        }
      },
    },
    {
      id: 'alerts',
      title: 'تنبيهات الطوارئ والدفاع المدني',
      subtitle: 'Emergency & Civil Defense',
      description: 'متابعة حية للعقود القاربت على الانتهاء، بلاغات الصيانة العاجلة، وجدول زيارات وتفتيش الدفاع المدني.',
      category: 'safety',
      categoryLabel: 'السلامة والوقاية',
      icon: ShieldAlert,
      iconBg: 'bg-red-500/10 border-red-500/30 text-red-400 group-hover:bg-red-500 group-hover:text-white',
      iconColor: 'text-red-400',
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount} تنبيه حرج` : 'مستقر',
      roles: ['admin', 'supervisor', 'agent'],
      action: () => {
        if (currentUser.role === 'admin') {
          onNavigate({ view: 'admin_dashboard', adminTab: 'alerts' });
        } else {
          onNavigate({ view: 'mobile_agent', mobileTab: 'alerts' });
        }
      },
    },
    {
      id: 'new_visit',
      title: 'تسجيل زيارة ميدانية جديدة',
      subtitle: 'New Inspection & Field Visit',
      description: 'نموذج الفحص الميداني الفوري للمنشأة، حصر المعدات، التقاط إحداثيات الموقع، وتوقيع العميل.',
      category: 'operations',
      categoryLabel: 'العمليات الميدانية',
      icon: PlusCircle,
      iconBg: 'bg-gradient-to-tr from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-950/50',
      iconColor: 'text-white',
      badge: 'إجراء سريع',
      roles: ['admin', 'supervisor', 'agent'],
      action: () => {
        onNavigate({ openNewVisit: true });
      },
    },
    {
      id: 'agents',
      title: 'إدارة المناديب وفريق المبيعات',
      subtitle: 'Field Sales Agents',
      description: 'متابعة مسارات عمل المناديب، مستهدفات الزيارات، تدقيق الحوافز ومنع تكرار تسجيل المواقع.',
      category: 'operations',
      categoryLabel: 'العمليات الميدانية',
      icon: Users,
      iconBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400 group-hover:bg-sky-500 group-hover:text-white',
      iconColor: 'text-sky-400',
      roles: ['admin', 'supervisor'],
      action: () => {
        onNavigate({ view: 'admin_dashboard', adminTab: 'agents' });
      },
    },
    {
      id: 'clients',
      title: 'بوابة العملاء والمنشآت',
      subtitle: 'Client Portal & Requests',
      description: 'متابعة طلبات تجديد عقود الصيانة، بلاغات الأعطال الطارئة، وإدارة حسابات مسؤولي المنشآت.',
      category: 'operations',
      categoryLabel: 'العمليات الميدانية',
      icon: Compass,
      iconBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white',
      iconColor: 'text-indigo-400',
      roles: ['admin', 'supervisor', 'client'],
      action: () => {
        if (currentUser.role === 'admin') {
          onNavigate({ view: 'admin_dashboard', adminTab: 'clients' });
        } else {
          onClose();
        }
      },
    },
    {
      id: 'incentives',
      title: 'محفظة الحوافز والمكافآت',
      subtitle: 'Incentive Ledger & Rewards',
      description: 'نظام احتساب حوافز المناديب المعتمدة (1.5 ر.س عن كل موقع صالح)، ومراجعة الرصيد المالي.',
      category: 'analytics',
      categoryLabel: 'التقارير والمكافآت',
      icon: Award,
      iconBg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white',
      iconColor: 'text-yellow-400',
      roles: ['admin', 'supervisor', 'agent'],
      action: () => {
        if (currentUser.role === 'admin') {
          onNavigate({ view: 'admin_dashboard', adminTab: 'incentives' });
        } else {
          onNavigate({ view: 'mobile_agent', mobileTab: 'profile' });
        }
      },
    },
    {
      id: 'reports',
      title: 'التقارير التحليلية والتصدير',
      subtitle: 'Analytics & Export Engine',
      description: 'تصدير كشوفات المنشآت بصيغة Excel/CSV، تقارير الامتثال للدفاع المدني، ومعدلات الأداء الشهرية.',
      category: 'analytics',
      categoryLabel: 'التقارير والمكافآت',
      icon: FileSpreadsheet,
      iconBg: 'bg-teal-500/10 border-teal-500/30 text-teal-400 group-hover:bg-teal-500 group-hover:text-white',
      iconColor: 'text-teal-400',
      roles: ['admin', 'supervisor'],
      action: () => {
        onNavigate({ view: 'admin_dashboard', adminTab: 'reports' });
      },
    },
    {
      id: 'contracts_compliance',
      title: 'عقود الصيانة وسلامة المنشآت',
      subtitle: 'Maintenance Contracts & Safety',
      description: 'استعراض العقود السارية، شهادات التركيب المعتمدة، وسجلات الجاهزية لأنظمة الحريق والسلامة.',
      category: 'safety',
      categoryLabel: 'السلامة والوقاية',
      icon: FileCheck2,
      iconBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white',
      iconColor: 'text-cyan-400',
      badge: `${expiringContractsCount} للتجديد`,
      roles: ['admin', 'supervisor', 'agent', 'client'],
      action: () => {
        if (currentUser.role === 'admin') {
          onNavigate({ view: 'admin_dashboard', adminTab: 'sites' });
        } else {
          onNavigate({ view: 'mobile_agent', mobileTab: 'sites' });
        }
      },
    },
    {
      id: 'whatsapp_support',
      title: 'محادثة الإدارة والدعم الفني',
      subtitle: 'Direct WhatsApp Support',
      description: 'التواصل المباشر مع إدارة شركة أوريكيت ومسؤولي العمليات للحصول على الدعم الميداني العاجل.',
      category: 'operations',
      categoryLabel: 'العمليات الميدانية',
      icon: MessageCircle,
      iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
      iconColor: 'text-emerald-400',
      badge: '0555334577',
      roles: ['admin', 'supervisor', 'agent', 'client'],
      action: () => {
        const url = createWhatsAppUrl(
          ORIKET_COMPANY_PHONE,
          `السلام عليكم ورحمة الله وبركاته،\nمعكم ${currentUser.name}\nأرغب بالاستفسار عن خدمات وأنظمة شركة أوريكيت للسلامة.`
        );
        window.open(url, '_blank');
      },
    },
  ];

  // Filtering by search term and category
  const filteredModules = modules.filter((mod) => {
    // Role filter
    if (!mod.roles.includes(currentUser.role)) {
      return false;
    }
    // Category filter
    if (selectedCategory !== 'all' && mod.category !== selectedCategory) {
      return false;
    }
    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        mod.title.toLowerCase().includes(q) ||
        mod.subtitle.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.categoryLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
              <Sparkles className="w-4 h-4" />
              <span>دليل المنظومة الموحدة</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">شركة أوريكيت لأنظمة السلامة ومكافحة الحريق</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              بوابة أقسام ومنظومات التطبيق
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              اختر أي قسم للانتقال الفوري إليه. تم تصميم الأقسام لدعم دورك الحالي كـ{' '}
              <strong className="text-orange-400">
                {currentUser.role === 'admin'
                  ? 'مدير النظام العام'
                  : currentUser.role === 'supervisor'
                  ? 'مشرف ميداني'
                  : currentUser.role === 'agent'
                  ? 'مندوب مبيعات ميداني'
                  : 'عميل منشأة'}
              </strong>
              ، مع إتاحة الوصول المباشر لكافة عمليات السلامة والتقارير.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <span>العودة للشاشة السابقة</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن قسم، ميزة، أو أداة داخل المنظومة..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`py-2 px-3 rounded-xl font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              جميع الأقسام ({modules.filter((m) => m.roles.includes(currentUser.role)).length})
            </button>

            <button
              onClick={() => setSelectedCategory('core')}
              className={`py-2 px-3 rounded-xl font-bold whitespace-nowrap transition ${
                selectedCategory === 'core'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              الأساسية
            </button>

            <button
              onClick={() => setSelectedCategory('operations')}
              className={`py-2 px-3 rounded-xl font-bold whitespace-nowrap transition ${
                selectedCategory === 'operations'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              العمليات الميدانية
            </button>

            <button
              onClick={() => setSelectedCategory('safety')}
              className={`py-2 px-3 rounded-xl font-bold whitespace-nowrap transition ${
                selectedCategory === 'safety'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              السلامة والوقاية
            </button>

            <button
              onClick={() => setSelectedCategory('analytics')}
              className={`py-2 px-3 rounded-xl font-bold whitespace-nowrap transition ${
                selectedCategory === 'analytics'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              التقارير والمكافآت
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Professional Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredModules.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="group text-right bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/60 rounded-3xl p-5 shadow-lg transition-all duration-200 transform hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between relative overflow-hidden"
            >
              {/* Subtle top edge gradient bar on hover */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3.5">
                {/* Header row: Icon & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${item.iconBg}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {item.badge && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-orange-400 group-hover:border-orange-500/40 transition">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition flex items-center gap-1.5">
                    <span>{item.title}</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono tracking-wide block mt-0.5">
                    {item.subtitle}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* Bottom Card Action Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-white transition">
                <span className="text-[11px] text-slate-500">{item.categoryLabel}</span>
                <span className="flex items-center gap-1 font-bold text-orange-400 group-hover:translate-x-[-3px] transition-transform">
                  <span>فتح القسم</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">لم يتم العثور على أقسام مطابقة</h3>
          <p className="text-xs text-slate-400">
            جرب البحث بكلمات أخرى أو اختر "جميع الأقسام" لعرض المنظومة بالكامل.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="py-2 px-4 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 transition"
          >
            إعادة تعيين الفلترة
          </button>
        </div>
      )}

      {/* Quick Summary Strip */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">
            شركة أوريكيت للسلامة والوقاية من الحريق — المنظومة الرقمية الموحدة للمواقع والعمليات
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 text-[11px]">
          <span>الرياض، المملكة العربية السعودية</span>
          <span>·</span>
          <span>هاتف العمليات: 0555334577</span>
        </div>
      </div>

    </div>
  );
};
