import React, { useState } from 'react';
import { 
  Flame, 
  Lock, 
  Phone, 
  ArrowLeft, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [phoneOrUsername, setPhoneOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInput = phoneOrUsername.trim().toLowerCase();
    const cleanPass = password.trim();

    // Find matching user by phone or username
    const matchedUser = users.find(
      (u) =>
        u.phone.trim().toLowerCase() === cleanInput ||
        u.username.trim().toLowerCase() === cleanInput
    );

    if (!matchedUser) {
      setErrorMsg('رقم الجوال أو اسم المستخدم غير مسجل بالنظام.');
      return;
    }

    if (!matchedUser.active) {
      setErrorMsg('هذا الحساب تم تعطيله من قبل الإدارة.');
      return;
    }

    // Check password
    if (matchedUser.password && matchedUser.password !== cleanPass) {
      setErrorMsg('كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.');
      return;
    }

    onLoginSuccess(matchedUser);
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
              بوابة تسجيل دخول المنظومة الميدانية
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">تسجيل الدخول</h2>
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
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-sm shadow-xl shadow-orange-950/60 flex items-center justify-center gap-2 transition transform active:scale-98 mt-2"
            >
              <span>دخول النظام</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center text-[11px] text-slate-500">
            ملاحظة: يتم إنشاء وتفعيل حسابات المندوبين حصرياً من قِبل إدارة الشركة.
          </div>
        </div>

      </div>
    </div>
  );
};
