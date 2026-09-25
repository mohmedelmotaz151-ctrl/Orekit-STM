import { SiteStatus, SiteApprovalStatus } from '../types';

/**
 * Calculates days remaining until a given date string (YYYY-MM-DD)
 */
export function getDaysRemaining(targetDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats a date string to a clean Arabic date
 */
export function formatDateArabic(dateStr?: string): string {
  if (!dateStr) return 'غير محدد';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Categorizes contract expiry alert level
 */
export interface ExpiryAlertBadge {
  level: 'critical_7' | 'urgent_30' | 'warning_60' | 'notice_90' | 'expired' | 'valid';
  text: string;
  badgeClass: string;
  days: number;
}

export function getContractExpiryBadge(endDateStr?: string): ExpiryAlertBadge | null {
  const days = getDaysRemaining(endDateStr);
  if (days === null) return null;

  if (days < 0) {
    return {
      level: 'expired',
      text: `منتهي منذ ${Math.abs(days)} يوم`,
      badgeClass: 'bg-rose-950/80 text-rose-300 border border-rose-800',
      days,
    };
  }
  if (days <= 7) {
    return {
      level: 'critical_7',
      text: `ينتهي خلال ${days} أيام (عاجل جداً)`,
      badgeClass: 'bg-red-950/90 text-red-200 border border-red-700 animate-pulse',
      days,
    };
  }
  if (days <= 30) {
    return {
      level: 'urgent_30',
      text: `ينتهي خلال ${days} يوم (متابعة فورية)`,
      badgeClass: 'bg-amber-950/80 text-amber-200 border border-amber-700',
      days,
    };
  }
  if (days <= 60) {
    return {
      level: 'warning_60',
      text: `ينتهي خلال ${days} يوم`,
      badgeClass: 'bg-yellow-950/70 text-yellow-300 border border-yellow-800',
      days,
    };
  }
  if (days <= 90) {
    return {
      level: 'notice_90',
      text: `ينتهي خلال ${days} يوم (فرصة تجديد)`,
      badgeClass: 'bg-blue-950/70 text-blue-300 border border-blue-800',
      days,
    };
  }

  return {
    level: 'valid',
    text: `سارٍ (${days} يوم متبقٍ)`,
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border border-emerald-800',
    days,
  };
}

/**
 * Metadata for Site Status
 */
export const SITE_STATUS_MAP: Record<
  SiteStatus,
  { label: string; icon: string; colorClass: string; bgClass: string; description: string }
> = {
  new_opportunity: {
    label: 'فرصة جديدة',
    icon: '🟢',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/70 border-emerald-800 text-emerald-300',
    description: 'عميل جديد مهتم بخدمات السلامة والصيانة',
  },
  needs_followup: {
    label: 'يحتاج متابعة',
    icon: '🟡',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-950/70 border-yellow-800 text-yellow-300',
    description: 'تم تقديم العرض أو الزيارة وتنتظر الاتصال القادم',
  },
  competitor_contract: {
    label: 'لديه عقد مع شركة أخرى',
    icon: '🔵',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/70 border-blue-800 text-blue-300',
    description: 'مرتبط حالياً بعقد صيانة مع منافس حتى تاريخ محدد',
  },
  expiring_soon: {
    label: 'العقد قريب الانتهاء',
    icon: '🟠',
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-950/70 border-orange-800 text-orange-300',
    description: 'العقد ينتهي قريباً وفرصة تقديم عرض أوريكيت',
  },
  urgent_maintenance: {
    label: 'يحتاج صيانة عاجلة',
    icon: '🔴',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-950/70 border-rose-800 text-rose-300',
    description: 'أجهزة تالفة أو طفايات منتهية أو إنذار معطل',
  },
  no_opportunity: {
    label: 'لا توجد فرصة حاليًا',
    icon: '⚫',
    colorClass: 'text-slate-400',
    bgClass: 'bg-slate-800/80 border-slate-700 text-slate-300',
    description: 'المنشأة غير نشطة أو غير مهتمة حالياً',
  },
};

export const SITE_APPROVAL_MAP: Record<
  SiteApprovalStatus,
  { label: string; bgClass: string }
> = {
  pending: {
    label: 'قيد المراجعة الإدارية',
    bgClass: 'bg-amber-900/60 text-amber-200 border border-amber-700/60',
  },
  approved: {
    label: 'معتمد ومضاف للحافز',
    bgClass: 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/60',
  },
  rejected: {
    label: 'مرفوض / يحتاج تعديل',
    bgClass: 'bg-rose-900/60 text-rose-200 border border-rose-700/60',
  },
};
