import { Site } from '../types';
import { SITE_STATUS_MAP } from './date';

// Central Company Contact Info for Oriket Safety
export const ORIKET_COMPANY_NAME = 'شركة أوريكيت للسلامة والحماية من الحريق';
export const ORIKET_COMPANY_PHONE = '0555335477';
export const ORIKET_COMPANY_INTERNATIONAL_PHONE = '966555335477';

/**
 * Normalizes any Saudi or international phone number into a valid WhatsApp wa.me phone number format.
 * Examples:
 *   "0555335477"      -> "966555335477"
 *   "555335477"       -> "966555335477"
 *   "+966555335477"   -> "966555335477"
 *   "00966555335477"  -> "966555335477"
 *   "055 533 5477"    -> "966555335477"
 */
export function formatSaudiWhatsAppNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  
  // Remove spaces, hyphens, parentheses, and any non-numeric characters except +
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // If starts with 05 and length is 10 (Saudi local format) -> change 05 to 9665
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '966' + cleaned.substring(1);
  } else if (cleaned.startsWith('5') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }

  // Filter out any lingering non-digits
  return cleaned.replace(/\D/g, '');
}

/**
 * Creates a direct WhatsApp link that opens WhatsApp application or web.
 */
export function createWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = formatSaudiWhatsAppNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export type SiteWhatsAppTemplate = 'general' | 'extinguishers' | 'contract' | 'civil_defense';

/**
 * Generates ready, professional Arabic WhatsApp messages addressed to the site manager.
 */
export function generateSiteWhatsAppMessage(
  site: Site,
  template: SiteWhatsAppTemplate = 'general',
  agentName?: string
): string {
  const statusLabel = SITE_STATUS_MAP[site.status]?.label || 'فرصة جديدة';
  const extCount = site.equipment?.extinguishers?.totalCount || 0;
  const expiryDate = site.extinguisherMaintenance?.expiryDate || site.contract?.endDate || '';

  switch (template) {
    case 'extinguishers':
      return [
        `السلام عليكم ورحمة الله وبركاته،`,
        `الأخ المحترم / مسؤول منشأة *${site.name}* (${site.managerName})،`,
        `تحية طيبة من شركة أوريكيت للسلامة والحماية من الحريق 🛡️`,
        ``,
        `نود إحاطتكم علماً بضرورة فحص وصيانة طفايات الحريق في منشأتكم لضمان جاهزيتها وامتثالها لاشتراطات الدفاع المدني السعودي:`,
        `📍 المنشأة: ${site.name} (${site.city} - ${site.district})`,
        `🧯 عدد الطفايات المسجلة: ${extCount} طفاية`,
        expiryDate ? `📅 موعد الصيانة / الانتهاء: ${expiryDate}` : `📅 الحالة: بحاجة لفحص وتعبئة دورية معتمدة`,
        ``,
        `خدماتنا تشمل:`,
        `• الفحص الهيدروستاتيكي وتعبئة طفايات (بودرة / CO2 / رغوة)`,
        `• تزويد المنشأة بملصقات وكروت الصيانة الرسمية المعتمدة`,
        `• إصدار شهادة الصيانة لتقديمها لمنصة سلامة وبلدي والدفاع المدني`,
        ``,
        `يسعدنا التنسيق معكم لإرسال فني متخصص لمعاينة وخدمة الموقع بأفضل الأسعار.`,
        agentName ? `المندوب الميداني: ${agentName}` : `فريق خدمة العملاء - شركة أوريكيت للسلامة`,
        `هاتف الإدارة: ${ORIKET_COMPANY_PHONE}`,
      ].join('\n');

    case 'contract':
      return [
        `السلام عليكم ورحمة الله وبركاته،`,
        `الأخ المحترم / مسؤول منشأة *${site.name}* (${site.managerName})،`,
        `تحية طيبة من شركة أوريكيت لأنظمة السلامة ومكافحة الحريق 🛡️`,
        ``,
        `بخصوص عقد صيانة أنظمة وأجهزة السلامة السنوي لمنشأتكم:`,
        `🏢 المنشأة: ${site.name} - ${site.city}`,
        site.contract?.endDate ? `📅 تاريخ انتهاء العقد الحالي: ${site.contract.endDate}` : `📋 الحالة: تجديد / إنشاء عقد صيانة سنوي معتمد`,
        ``,
        `نقدم لكم في أوريكيت عقود صيانة معتمدة رسمياً ومربوطة بنظام منصة سلامة للدفاع المدني، تشمل:`,
        `✓ زيارات فحص دورية منتظمة على مدار العام`,
        `✓ صيانة شاملة للإنذار والمضخات وشبكات الإطفاء والطفايات`,
        `✓ استخراج شهادة الصيانة السنوية لتجديد رخصة البلدية والدفاع المدني`,
        ``,
        `يسعدنا تزويدكم بعرض سعر تنافسي فوري يخدم متطلبات منشأتكم بدقة.`,
        `رقم التواصل المباشر: ${ORIKET_COMPANY_PHONE}`,
      ].join('\n');

    case 'civil_defense':
      return [
        `السلام عليكم ورحمة الله وبركاته،`,
        `الأخ المحترم / مسؤول منشأة *${site.name}* (${site.managerName})،`,
        `تحية طيبة من شركة أوريكيت للسلامة والحماية من الحريق 🛡️`,
        ``,
        `بخصوص استيفاء وتجهيز منشأتكم لاشتراطات الدفاع المدني ورخصة البلدية:`,
        `📍 المنشأة: ${site.name} (${site.type})`,
        `📍 الموقع: ${site.city} - ${site.district}`,
        ``,
        `نساعدكم في توفير وتأهيل جميع متطلبات التفتيش والسلامة:`,
        `• تركيب وفحص طفايات الحريق المعتمدة والمطابقة للمواصفات`,
        `• فحص لوحات وأنظمة الإنذار والتشغيل`,
        `• تجهيز المخططات والتقارير الفنية للرفع عبر منصة سلامة`,
        ``,
        `جاهزون للزيارة الميدانية الفورية وتفادي أي ملاحظات أو مخالفات.`,
        `مع تحيات: شركة أوريكيت للسلامة | هاتف: ${ORIKET_COMPANY_PHONE}`,
      ].join('\n');

    case 'general':
    default:
      return [
        `السلام عليكم ورحمة الله وبركاته،`,
        `الأخ المحترم / مسؤول منشأة *${site.name}* (${site.managerName})،`,
        `تحية طيبة من شركة أوريكيت للسلامة والحماية من الحريق 🛡️`,
        ``,
        `يسعدنا التواصل معكم بخصوص خدمات السلامة ومكافحة الحريق لمنشأتكم:`,
        `📍 المنشأة: ${site.name} (${site.type})`,
        `📍 العنوان: ${site.city} - ${site.district}`,
        `🧯 أجهزة السلامة المتوفرة: ${extCount} طفاية ${site.equipment?.alarmSystem?.exists ? '• نظام إنذار' : ''}`,
        `📊 تصنيف الحالة: ${statusLabel}`,
        ``,
        `نحن شركة متخصصة ومعتمدة في:`,
        `✓ توريد وصيانة وتعبئة كافة أنواع طفايات الحريق`,
        `✓ عقود الصيانة المعتمدة للمنشآت ورخص الدفاع المدني وبلدي`,
        `✓ أنظمة الإنذار والإطفاء الآلي والمضخات`,
        ``,
        `يسعدنا خدمتكم والتنسيق معكم لموعد زيارة فنية أو إرسال عرض سعر خاص.`,
        agentName ? `المندوب المنسق: ${agentName}` : `شركة أوريكيت للسلامة`,
        `هاتف الإدارة: ${ORIKET_COMPANY_PHONE}`,
      ].join('\n');
  }
}

/**
 * Generates a complete operational WhatsApp dispatch report addressed to Oriket Company Management (0555335477).
 */
export function generateCompanyReportWhatsAppMessage(
  site: Site,
  agentName?: string
): string {
  const statusLabel = SITE_STATUS_MAP[site.status]?.label || 'فرصة جديدة';
  const extCount = site.equipment?.extinguishers?.totalCount || 0;
  const gmapsUrl = site.latitude && site.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`
    : 'غير متوفر';

  const extTypes = site.equipment?.extinguishers?.types?.length
    ? site.equipment.extinguishers.types
        .map((t) => (t === 'powder' ? 'بودرة' : t === 'co2' ? 'CO2' : t === 'foam' ? 'رغوة' : 'ماء'))
        .join('، ')
    : 'غير محدد';

  const lines = [
    `السلام عليكم ورحمة الله وبركاته،`,
    `إدارة شركة أوريكيت للسلامة والحماية من الحريق 🛡️`,
    ``,
    `📌 *تقرير منشأة ومتابعة عميل ميداني*:`,
    `🏢 *اسم المنشأة:* ${site.name}`,
    `🏷️ *النشاط:* ${site.type}`,
    `👤 *المسؤول:* ${site.managerName}`,
    `📞 *رقم الموقع (المسؤول):* ${site.phone}`,
    site.altPhone ? `📞 *رقم بديل:* ${site.altPhone}` : '',
    `📍 *المدينة والحي:* ${site.city} - ${site.district}`,
    `🏢 *العنوان التفصيلي:* ${site.address || 'غير محدد'}`,
    `🗺️ *رابط خرائط Google للموقع:*`,
    `${gmapsUrl}`,
    ``,
    `📊 *بيانات السلامة والفحص:*`,
    `• تصنيف الحالة: ${statusLabel}`,
    `• طفايات الحريق: ${extCount} طفاية (${extTypes})`,
    `• صيانة الطفايات: ${site.extinguisherMaintenance?.expiryDate ? `تنتهي في ${site.extinguisherMaintenance.expiryDate}` : 'تحتاج فحص'}`,
    `• نظام الإنذار: ${site.equipment?.alarmSystem?.exists ? (site.equipment?.alarmSystem?.working ? 'يعمل' : 'يحتاج صيانة') : 'غير متوفر'}`,
    `• عقد الصيانة: ${site.contract?.hasContract === 'yes' ? `معتمد حتى ${site.contract?.endDate}` : 'لا يوجد عقد'}`,
    site.notes ? `📝 *ملاحظات المندوب:* ${site.notes}` : '',
    ``,
    `👤 *المندوب المسجل:* ${agentName || site.createdByAgentName}`,
    `🕒 *تاريخ التسجيل:* ${site.createdAt ? site.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}`,
  ];

  return lines.filter(Boolean).join('\n');
}
