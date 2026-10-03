import React, { useState } from 'react';
import { User, Site } from '../../types';
import { 
  User as UserIcon, 
  Phone, 
  Mail, 
  Building2, 
  ClipboardList, 
  MapPin, 
  Settings, 
  Headphones, 
  LogOut, 
  ChevronLeft, 
  ShieldCheck, 
  Download,
  ExternalLink,
  Award,
  Layers,
  Flame,
  CheckCircle2,
  X
} from 'lucide-react';
import { ORIKET_COMPANY_PHONE, createWhatsAppUrl } from '../../utils/whatsapp';

interface AndroidProfileScreenProps {
  currentUser: User;
  sites: Site[];
  onLogout: () => void;
  onNavigateTab: (tab: 'home' | 'services' | 'orders' | 'notifications' | 'profile') => void;
  onOpenAdminCRM?: () => void;
}

export const AndroidProfileScreen: React.FC<AndroidProfileScreenProps> = ({
  currentUser,
  sites,
  onLogout,
  onNavigateTab,
  onOpenAdminCRM,
}) => {
  const [activeModal, setActiveModal] = useState<'account_details' | 'addresses' | 'about' | null>(null);

  const getRoleLabel = () => {
    switch (currentUser.role) {
      case 'admin':
        return 'إدارة النظام المركزية';
      case 'supervisor':
        return 'مشرف ميداني وعقود';
      case 'client':
        return 'مالك / مسؤول المنشأة';
      default:
        return 'مندوب تسويق ومبيعات ميداني';
    }
  };

  const userSites = sites.filter(
    (s) =>
      s.createdByAgentId === currentUser.id ||
      s.id === currentUser.siteId ||
      (currentUser.facilityName && s.name.toLowerCase().includes(currentUser.facilityName.toLowerCase()))
  );

  return (
    <div className="space-y-4 pb-24 w-full animate-fadeIn">
      
      {/* Top Profile Card: Avatar, Name, Phone, Role */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#10172B] via-[#0D1B36] to-[#070B1C] border border-[#1E2945] shadow-xl relative overflow-hidden space-y-4">
        <div className="flex items-center gap-3.5">
          {/* Avatar with Glow */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#20A9FF] to-[#0D6292] p-0.5 shadow-lg shadow-[#20A9FF]/20 shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#070B1C] flex items-center justify-center text-[#20A9FF] font-black text-xl">
              {currentUser.name.charAt(0)}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#19C7A0] border-2 border-[#070B1C] flex items-center justify-center text-[10px] text-[#070B1C] font-bold">
              ✓
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#F5F7FF] leading-tight">
                {currentUser.name}
              </h2>
            </div>
            <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#20A9FF]/20 text-[#20A9FF] border border-[#20A9FF]/30">
              {getRoleLabel()}
            </span>
            <div className="flex items-center gap-2 text-xs text-[#8992AA] pt-0.5 font-mono" dir="ltr">
              <Phone className="w-3 h-3 text-[#19C7A0]" />
              <span>{currentUser.username || '0555334577'}</span>
            </div>
          </div>
        </div>

        {/* Quick Facility / City Banner */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-[#070B1C]/80 p-3 rounded-2xl border border-[#1E2945]">
          <div>
            <span className="text-[10px] text-[#8992AA] block">المدينة / النطاق:</span>
            <span className="text-[#F5F7FF] font-bold">{currentUser.assignedCity || 'الرياض (المملكة)'}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8992AA] block">المنشآت المسجلة:</span>
            <span className="text-[#20A9FF] font-bold">{userSites.length || sites.length} موقع سلامة</span>
          </div>
        </div>
      </div>

      {/* Profile Menu List (Android Large Touch Target Style >= 48px) */}
      <div className="bg-[#10172B] rounded-3xl border border-[#1E2945] divide-y divide-[#1E2945]/70 overflow-hidden shadow-lg">
        
        {/* Item 1: بيانات الحساب والمنشأة */}
        <button
          type="button"
          onClick={() => setActiveModal('account_details')}
          className="w-full p-4 flex items-center justify-between text-right hover:bg-[#151F38] transition active:scale-[0.99] min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#20A9FF]/15 text-[#20A9FF] border border-[#20A9FF]/30 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#F5F7FF] block">
                بيانات الحساب والمنشأة
              </span>
              <span className="text-[10px] text-[#8992AA]">
                تعديل وتحديث بيانات المنشأة ومسؤول السلامة
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#8992AA]" />
        </button>

        {/* Item 2: سجل الطلبات */}
        <button
          type="button"
          onClick={() => onNavigateTab('orders')}
          className="w-full p-4 flex items-center justify-between text-right hover:bg-[#151F38] transition active:scale-[0.99] min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#19C7A0]/15 text-[#19C7A0] border border-[#19C7A0]/30 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#F5F7FF] block">
                سجل الطلبات وتتبع المعاملات
              </span>
              <span className="text-[10px] text-[#8992AA]">
                متابعة عروض الأسعار، الصيانة، وتراخيص الدفاع المدني
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#8992AA]" />
        </button>

        {/* Item 3: العناوين والمواقع المسجلة */}
        <button
          type="button"
          onClick={() => setActiveModal('addresses')}
          className="w-full p-4 flex items-center justify-between text-right hover:bg-[#151F38] transition active:scale-[0.99] min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#F5F7FF] block">
                العناوين والمواقع المسجلة
              </span>
              <span className="text-[10px] text-[#8992AA]">
                فروع المنشأة ومواقع التغطية الجغرافية
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#8992AA]" />
        </button>

        {/* Item 4: لوحة إدارة النظام (للمشرفين والإدارة) */}
        {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && onOpenAdminCRM && (
          <button
            type="button"
            onClick={onOpenAdminCRM}
            className="w-full p-4 flex items-center justify-between text-right bg-gradient-to-r from-[#20A9FF]/10 via-[#10172B] to-[#10172B] hover:bg-[#151F38] transition active:scale-[0.99] min-h-[52px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#20A9FF] text-[#070B1C] font-black flex items-center justify-center shrink-0 shadow-md shadow-[#20A9FF]/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#F5F7FF] block">
                    لوحة إدارة المنظومة الميدانية CRM
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#20A9FF] text-[#070B1C] font-black">
                    إدارة
                  </span>
                </div>
                <span className="text-[10px] text-[#8992AA]">
                  سجل المواقع، صيانة الطفايات، المندوبين، والتقارير
                </span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-[#20A9FF]" />
          </button>
        )}

        {/* Item 5: الدعم الفني وخدمة العملاء */}
        <a
          href={createWhatsAppUrl(
            ORIKET_COMPANY_PHONE,
            `السلام عليكم ورحمة الله،\nمعكم ${currentUser.name}\nأود التواصل مع خدمة عملاء شركة أوريكيت للسلامة.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-4 flex items-center justify-between text-right hover:bg-[#151F38] transition active:scale-[0.99] min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#19C7A0]/15 text-[#19C7A0] border border-[#19C7A0]/30 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#F5F7FF] block">
                الدعم الفني واستشارات السلامة
              </span>
              <span className="text-[10px] text-[#8992AA]">
                تواصل مباشر عبر واتساب أوريكيت 0555334577
              </span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-[#19C7A0]" />
        </a>

        {/* Item 6: شروط الاستخدام والتراخيص */}
        <button
          type="button"
          onClick={() => setActiveModal('about')}
          className="w-full p-4 flex items-center justify-between text-right hover:bg-[#151F38] transition active:scale-[0.99] min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#F5F7FF] block">
                تراخيص واعتمادات أوريكيت
              </span>
              <span className="text-[10px] text-[#8992AA]">
                معتمدون رسمياً لدى الدفاع المدني ومنصة سلامة
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#8992AA]" />
        </button>

        {/* Item 7: تسجيل الخروج */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full p-4 flex items-center justify-between text-right hover:bg-rose-950/20 text-[#EF3340] transition active:scale-[0.99] min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF3340]/15 text-[#EF3340] border border-[#EF3340]/30 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold block">
                تسجيل الخروج من الحساب
              </span>
              <span className="text-[10px] text-[#EF3340]/70">
                تسجيل الخروج والعودة لشاشة الدخول
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#EF3340]" />
        </button>

      </div>

      {/* Account Details Modal */}
      {activeModal === 'account_details' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#070B1C]/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full sm:max-w-lg bg-[#10172B] border-t sm:border border-[#1E2945] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2945]">
              <h3 className="font-bold text-sm text-[#F5F7FF]">بيانات الحساب والمنشأة</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#070B1C] border border-[#1E2945] space-y-1">
                <span className="text-[10px] text-[#8992AA] block">الاسم الكامل:</span>
                <span className="text-[#F5F7FF] font-bold text-sm">{currentUser.name}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#070B1C] border border-[#1E2945] space-y-1">
                <span className="text-[10px] text-[#8992AA] block">رقم الهاتف / اسم المستخدم:</span>
                <span className="text-[#F5F7FF] font-mono text-sm" dir="ltr">{currentUser.username}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#070B1C] border border-[#1E2945] space-y-1">
                <span className="text-[10px] text-[#8992AA] block">المنشأة المرتبطة:</span>
                <span className="text-[#20A9FF] font-bold text-sm">{currentUser.facilityName || 'شركة أوريكيت للسلامة'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#070B1C] border border-[#1E2945] space-y-1">
                <span className="text-[10px] text-[#8992AA] block">الرتبة في النظام:</span>
                <span className="text-[#19C7A0] font-bold">{getRoleLabel()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Addresses / Registered Sites Modal */}
      {activeModal === 'addresses' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#070B1C]/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full sm:max-w-lg bg-[#10172B] border-t sm:border border-[#1E2945] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2945]">
              <h3 className="font-bold text-sm text-[#F5F7FF]">المواقع والفروع المسجلة</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {(userSites.length > 0 ? userSites : sites).slice(0, 5).map((site) => (
                <div key={site.id} className="p-3 rounded-2xl bg-[#070B1C] border border-[#1E2945] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F5F7FF]">{site.name}</span>
                    <span className="text-[10px] text-[#20A9FF]">{site.city}</span>
                  </div>
                  <p className="text-[#8992AA] text-[11px]">{site.district} · {site.type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About & Licenses Modal */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#070B1C]/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full sm:max-w-lg bg-[#10172B] border-t sm:border border-[#1E2945] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2945]">
              <h3 className="font-bold text-sm text-[#F5F7FF]">اعتمادات وتراخيص شركة أوريكيت</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-xl bg-[#070B1C] text-[#8992AA] hover:text-[#F5F7FF] border border-[#1E2945] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#8992AA] leading-relaxed">
              <p>
                شركة أوريكيت للمقاولات والأنظمة الأمنية والسلامة مرخصة رسمياً في المملكة العربية السعودية ومعتمدة لدى الإدارة العامة للدفاع المدني ومنصة سلامة الإلكترونية.
              </p>
              <div className="p-3 rounded-2xl bg-[#070B1C] border border-[#1E2945] space-y-2">
                <div className="flex items-center gap-2 text-[#19C7A0] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>عقود صيانة معتمدة لبلدي والدفاع المدني</span>
                </div>
                <div className="flex items-center gap-2 text-[#19C7A0] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>شهادات فحص كفاءة أنظمة الإنذار والإطفاء</span>
                </div>
                <div className="flex items-center gap-2 text-[#19C7A0] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>فريق هندسي وفنيين مؤهلين ومعتمدين</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
