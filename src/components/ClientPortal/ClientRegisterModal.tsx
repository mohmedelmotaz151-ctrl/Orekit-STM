import React, { useState } from 'react';
import { 
  Building2, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Lock, 
  X, 
  CheckCircle2, 
  Sparkles,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { User, Site, SiteType, SAUDI_CITIES } from '../../types';
import { apiRegisterClient } from '../../utils/api';

interface ClientRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (newUser: User, createdSite?: Site) => void;
}

export const ClientRegisterModal: React.FC<ClientRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
}) => {
  // Form fields
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('1234');
  const [facilityName, setFacilityName] = useState('');
  const [siteType, setSiteType] = useState<SiteType>('مطعم');
  const [city, setCity] = useState<string>('الرياض');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  
  // Licensing & Maintenance Contract options
  const [hasLicense, setHasLicense] = useState<'yes' | 'no'>('yes');
  const [licenseType, setLicenseType] = useState('رخصة دفاع مدني / بلدي');
  const [hasContract, setHasContract] = useState<'yes' | 'no'>('no');
  const [contractCompany, setContractCompany] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');

  // Initial immediate request upon signup
  const [initialRequestType, setInitialRequestType] = useState<
    'none' | 'renewal' | 'regular_visit' | 'civil_defense' | 'urgent_fault'
  >('none');
  const [initialRequestNotes, setInitialRequestNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientName.trim() || !phone.trim() || !facilityName.trim()) {
      setErrorMsg('الرجاء إدخال اسم العميل والمنشأة ورقم الجوال');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRegisterClient({
        clientName: clientName.trim(),
        phone: phone.trim(),
        password: password.trim() || '1234',
        facilityName: facilityName.trim(),
        siteType,
        city,
        district: district.trim(),
        address: address.trim(),
        hasLicense,
        licenseType: hasLicense === 'yes' ? licenseType : '',
        hasContract,
        contractCompany: hasContract === 'yes' ? contractCompany : '',
        contractEndDate: hasContract === 'yes' ? contractEndDate : '',
        initialRequestType,
        initialRequestNotes: initialRequestNotes.trim(),
      });

      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      onRegisterSuccess(res.user, res.site);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-['Cairo',sans-serif]">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-5 sm:p-7 space-y-5 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/60 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                إنشاء حساب عميل جديد (بوابة المنشآت)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                سجل منشأتك لتتمكن فوراً من طلب الصيانة، تجديد العقد، وتحديد مواعيد الدفاع المدني
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Section 1: Client & Facility Basic Details */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
            <h3 className="font-bold text-orange-400 flex items-center gap-2 text-xs">
              <UserIcon className="w-4 h-4" />
              <span>بيانات العميل ومسؤول المنشأة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">اسم مسؤول المنشأة (العميل) *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="مثال: عبدالله السبيعي"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">رقم الجوال (اسم المستخدم للدخول) *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    required
                    dir="ltr"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono text-left"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">اسم المنشأة أو الشركة *</label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="مثال: مطعم أطايب الشرق، مجمع الشفاء الطبي..."
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">كلمة المرور *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="1234"
                    required
                    dir="ltr"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono text-left"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Location and Site Type */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
            <h3 className="font-bold text-orange-400 flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4" />
              <span>الموقع ونوع المنشأة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">نوع الموقع / النشاط *</label>
                <select
                  value={siteType}
                  onChange={(e) => setSiteType(e.target.value as SiteType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="مطعم">مطعم / مقهى</option>
                  <option value="فندق">فندق / شقق مفروشة</option>
                  <option value="مستشفى">مستشفى / مجمع طبي</option>
                  <option value="مستودع">مستودع / مخزن</option>
                  <option value="مصنع">مصنع / ورشة</option>
                  <option value="مجمع تجاري">مجمع تجاري / مول</option>
                  <option value="مكتب">مكتب / شركة</option>
                  <option value="مدرسة">مدرسة / منشأة تعليمية</option>
                  <option value="محطة وقود">محطة وقود</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">المدينة *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                  {SAUDI_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">الحي *</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="مثال: العليا، النزهة، الخالدية..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">العنوان التفصيلي / الشارع (اختياري)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: طريق الملك فهد، بجوار مصرف الراجحي"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Section 3: Licensing & Maintenance Contract Status */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
            <h3 className="font-bold text-orange-400 flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>حالة الترخيص وعقد صيانة السلامة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Has License ? */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <label className="font-bold text-slate-200 block text-xs">
                  هل يوجد ترخيص ساري للمنشأة؟
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasLicense('yes')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition text-xs ${
                      hasLicense === 'yes'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    نعم، يوجد ترخيص
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasLicense('no')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition text-xs ${
                      hasLicense === 'no'
                        ? 'bg-rose-900 text-white border-rose-600 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    لا يوجد / قيد الاستخراج
                  </button>
                </div>
                {hasLicense === 'yes' && (
                  <input
                    type="text"
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    placeholder="نوع الترخيص (بلدي / صناعي / دفاع مدني)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px] placeholder-slate-500 mt-2 focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>

              {/* Has Maintenance Contract ? */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <label className="font-bold text-slate-200 block text-xs">
                  هل يوجد عقد صيانة سلامة ساري؟
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasContract('yes')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition text-xs ${
                      hasContract === 'yes'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    نعم، يوجد عقد
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasContract('no')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition text-xs ${
                      hasContract === 'no'
                        ? 'bg-amber-800 text-white border-amber-600 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    لا يوجد عقد صيانة
                  </button>
                </div>

                {hasContract === 'yes' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="text"
                      value={contractCompany}
                      onChange={(e) => setContractCompany(e.target.value)}
                      placeholder="اسم شركة الصيانة"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-[11px] placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="date"
                      value={contractEndDate}
                      onChange={(e) => setContractEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-[11px] focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Initial Service Request (Immediate Action upon registration) */}
          <div className="space-y-3 bg-gradient-to-br from-orange-950/30 via-slate-950/80 to-slate-950 p-4 rounded-2xl border border-orange-900/50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-orange-400 flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
                <span>طلبك الفوري عند إنشاء الحساب (اختياري)</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">باشر طلبك من أول لحظة</span>
            </div>

            <p className="text-[11px] text-slate-400">
              يمكنك اختيار الخدمة التي ترغب بطلبها مباشرة فور إنشاء حسابك، وسيقوم فريق أوريكيت بمتابعتها فوراً:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'renewal', label: 'طلب تجديد عقد صيانة', icon: '📄', color: 'border-orange-500 bg-orange-950/60' },
                { id: 'regular_visit', label: 'طلب زيارة فحص دوري', icon: '🔍', color: 'border-blue-500 bg-blue-950/60' },
                { id: 'civil_defense', label: 'تحديد موعد دفاع مدني', icon: '🚨', color: 'border-amber-500 bg-amber-950/60' },
                { id: 'urgent_fault', label: 'زيارة طارئة لعطل', icon: '⚠️', color: 'border-red-500 bg-red-950/60' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setInitialRequestType(initialRequestType === opt.id ? 'none' : (opt.id as any))}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                    initialRequestType === opt.id
                      ? `${opt.color} text-white font-bold shadow-lg scale-102`
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-[11px] leading-snug">{opt.label}</span>
                </button>
              ))}
            </div>

            {initialRequestType !== 'none' && (
              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-300 block text-xs">
                  تفاصيل الطلب / العطل أو الموعد المرغوب:
                </label>
                <textarea
                  rows={2}
                  value={initialRequestNotes}
                  onChange={(e) => setInitialRequestNotes(e.target.value)}
                  placeholder="مثال: نرجو إرسال فني لمعاينة طفايات الحريق، أو العقد ينتهي قريباً ونطلب عرض سعر..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-xs"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-orange-950/60 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري إنشاء الحساب والموقع...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إنشاء الحساب والدخول للبوابة</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
