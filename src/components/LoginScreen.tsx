import React, { useState } from 'react';
import { 
  Flame, 
  Lock, 
  Phone, 
  ArrowLeft, 
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { User, Site } from '../types';
import { apiLogin } from '../utils/api';
import { ClientRegisterModal } from './ClientPortal/ClientRegisterModal';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onRegisterClientSuccess?: (user: User, site?: Site) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
  onRegisterClientSuccess,
}) => {
  const [phoneOrUsername, setPhoneOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [successRegistrationMsg, setSuccessRegistrationMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessRegistrationMsg('');

    const cleanInput = phoneOrUsername.trim();
    const cleanPass = password.trim();

    if (!cleanInput || !cleanPass) {
      setErrorMsg('الرجاء إدخال رقم الجوال/اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const res = await apiLogin(cleanInput, cleanPass);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
        setLoading(false);
        return;
      }

      onLoginSuccess(res.user);
    } catch {
      setErrorMsg('حدث خطأ أثناء الاتصال بقاعدة البيانات المركزية.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCompleted = (newUser: User, newSite?: Site) => {
    if (onRegisterClientSuccess) {
      onRegisterClientSuccess(newUser, newSite);
    }
    // Auto-login into the client portal
    onLoginSuccess(newUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 font-['Cairo',sans-serif] selection:bg-orange-500 selection:text-white">
      
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-gradient-to-tr from-orange-600/10 via-red-600/10 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Company Header & Brand */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 flex items-center justify-center text-white shadow-2xl shadow-orange-950/80 border border-orange-400/30">
            <Flame className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              أوريكيت <span className="text-orange-500">ORIKET</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              شركة أوريكيت لأنظمة السلامة والوقاية من الحريق
            </p>
            <span className="inline-block mt-2 text-[11px] px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
              بوابة المنظومة الميدانية وبوابة عملاء المنشآت
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">تسجيل الدخول للمنظومة</h2>
            <p className="text-xs text-slate-400">
              أدخل رقم الجوال أو اسم المستخدم المسجل وكلمة المرور
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successRegistrationMsg && (
            <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successRegistrationMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            
            {/* Phone / Username */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300">
                رقم الجوال أو اسم المستخدم
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneOrUsername}
                  onChange={(e) => setPhoneOrUsername(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-left font-mono"
                  dir="ltr"
                  required
                />
                <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-300">كلمة المرور</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-left font-mono"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-60 text-white font-bold text-sm shadow-xl shadow-orange-950/60 flex items-center justify-center gap-2 transition transform active:scale-98 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من السيرفر...</span>
                </>
              ) : (
                <>
                  <span>دخول النظام</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* New Client Account Registration Button */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">
                هل أنت صاحب أو مسؤول منشأة وتريد طلب خدمات السلامة؟
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-orange-500/60 hover:border-orange-500 text-orange-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-orange-950/20 active:scale-98"
            >
              <Building2 className="w-4 h-4 text-orange-500" />
              <span>إنشاء حساب عميل جديد (تسجيل المنشأة)</span>
            </button>

            <div className="text-center text-[10px] text-slate-500 leading-relaxed">
              • حساب العميل يتيح لك: طلب تجديد عقد الصيانة، طلب زيارة فحص دوري، تحديد موعد زيارة دفاع مدني، أو بلاغ طارئ لعطل.
            </div>
          </div>
        </div>

      </div>

      {/* Register Client Modal */}
      <ClientRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={handleRegisterCompleted}
      />
    </div>
  );
};

