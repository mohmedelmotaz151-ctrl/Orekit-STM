import { useMemo, useState } from 'react';

type FormState = {
  facility: string; activity: string; area: string; floors: string; rooms: string;
  height: string; people: string; risk: string; license: string; existing: string;
  exits: string; notes: string;
};
const initial: FormState = {
  facility: '', activity: 'تجاري / محلات', area: '', floors: '1', rooms: '', height: '',
  people: '', risk: 'عادي', license: 'غير محدد', existing: 'غير معروف', exits: '', notes: ''
};
const activities = ['تجاري / محلات','مكاتب إدارية','سكني','مستودع','مطعم / مطبخ','ورشة / صناعي','تعليمي','صحي','فندق / سكن جماعي','تجمع / قاعة','أخرى'];
const fmt = (v: number) => Number.isFinite(v) ? Math.ceil(v).toLocaleString('ar-SA') : '—';

export default function FireSafetyCalculator() {
  const [form, setForm] = useState<FormState>(initial);
  const [reviewed, setReviewed] = useState(false);
  const update = (key: keyof FormState, value: string) => { setForm(old => ({ ...old, [key]: value })); setReviewed(false); };
  const area = Math.max(0, Number(form.area) || 0);
  const rooms = Math.max(0, Number(form.rooms) || 0);
  const floors = Math.max(1, Number(form.floors) || 1);
  const people = Math.max(0, Number(form.people) || 0);
  const exits = Math.max(0, Number(form.exits) || 0);
  const result = useMemo(() => {
    const inputComplete = area > 0 && rooms > 0 && form.activity && form.height.trim() !== '';
    const highRisk = ['مستودع','ورشة / صناعي','مطعم / مطبخ'].includes(form.activity) || form.risk === 'مرتفع';
    return {
      inputComplete,
      floorArea: area / floors,
      smoke: rooms,
      thermal: highRisk ? Math.ceil(rooms * 0.25) : 0,
      extinguisherPlanning: Math.max(1, Math.ceil(area / 200)),
      alarmSounders: Math.max(1, floors),
      emergencyLights: Math.max(exits, floors * 2),
      exitSigns: Math.max(exits, floors),
      sprinkler: highRisk || area >= 500 || floors >= 3 ? 'يتطلب دراسة تصميم هيدروليكي وتحديد التغطية حسب الخطورة والتقسيمات' : 'يُحسم بعد تحديد تصنيف الإشغال ومتطلبات الكود',
      pump: highRisk || area >= 1000 || floors >= 4 ? 'يجب التحقق من الحاجة والسعة والضغط بتصميم هيدروليكي؛ لا يمكن حسابهما من المساحة وحدها' : 'تُحدد الحاجة بعد مراجعة مصدر المياه والارتفاع ومتطلبات النظام',
      fireAlarm: 'يلزم تحديد نوع النظام وتوزيع الأجهزة من المخططات ومتطلبات SBC 801',
      doors: exits > 0 ? exits : 'يحددها حمل الإشغال ومسافات الهروب وعرض المخارج؛ أدخل عدد المخارج القائمة للمراجعة',
      licensePath: form.license === 'فوري' ? 'المسار الفوري (تحقق من تصنيف النشاط في منصة سلامة)' : form.license === 'غير فوري' ? 'المسار غير الفوري (تحقق من تصنيف النشاط في منصة سلامة)' : 'غير محسوم — لا يُستنتج من المساحة فقط؛ راجع رمز النشاط ومتطلبات منصة سلامة',
      maintenance: form.existing === 'توجد أنظمة' ? 'تحقق من سريان عقد الصيانة وتغطيته لكل الأنظمة المطلوبة' : 'راجع متطلبات النشاط ومنصة سلامة لتحديد عقد الصيانة المطلوب',
      installation: form.existing === 'لا توجد أنظمة' ? 'قد تلزم شهادة إتمام تركيب معدات السلامة بعد التركيب وفق الخدمة والمتطلبات' : 'تحقق من الحاجة إلى شهادة إتمام التركيب حسب حالة المنشأة والخدمة المطلوبة'
    };
  }, [area, floors, rooms, form.activity, form.height, form.risk, form.license, form.existing, exits]);

  const exportReport = () => {
    const lines = [
      'تقرير تقديري أولي لمتطلبات السلامة — Orkeit STM',
      'اسم المنشأة: ' + (form.facility || 'غير مدخل'),
      'النشاط: ' + form.activity, 'المساحة: ' + form.area + ' م²',
      'عدد الأدوار: ' + form.floors, 'عدد الغرف: ' + form.rooms,
      'ارتفاع المبنى: ' + form.height + ' م', 'عدد الأشخاص: ' + (form.people || 'غير محدد'),
      'تصنيف الخطورة: ' + form.risk, 'مسار الترخيص المدخل: ' + form.license,
      '', 'نتائج أولية غير معتمدة:',
      'كواشف دخان: ' + fmt(result.smoke), 'كواشف حرارية (مؤشر أولي): ' + fmt(result.thermal),
      'طفايات (مؤشر تخطيطي فقط): ' + fmt(result.extinguisherPlanning),
      'أجراس/أجهزة تنبيه (حد أولي وليس تصميمًا): ' + fmt(result.alarmSounders),
      'لمبات طوارئ (حد أولي وليس تصميمًا): ' + fmt(result.emergencyLights),
      'لوحات إرشادية (حد أولي وليس تصميمًا): ' + fmt(result.exitSigns),
      'الرشاشات: ' + result.sprinkler, 'المضخات: ' + result.pump,
      'أبواب ومخارج الطوارئ: ' + result.doors, 'الإنذار: ' + result.fireAlarm,
      'عقد الصيانة: ' + result.maintenance, 'شهادة التركيب: ' + result.installation,
      '', 'ملاحظات المفتش: ' + (form.notes || '—'),
      'تنبيه: هذا التقرير أداة فرز وتخطيط أولي وليس اعتمادًا هندسيًا أو شهادة مطابقة. يلزم التحقق من SBC 801/201 والإصدار الساري، المخططات، تصنيف الإشغال والخطورة، ومتطلبات الدفاع المدني.'
    ];
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Orkeit-fire-safety-estimate.txt'; a.click(); URL.revokeObjectURL(url);
  };

  return <section className="fireCalcPage" dir="rtl">
    <style>{`.fireCalcPage{display:grid;gap:16px}.fireCalcNotice{border-right:4px solid #c62828;background:#fff8f8}.fireCalcNotice p{margin-bottom:0;line-height:1.8}.fireCalcForm,.fireCalcResults{padding:18px}.fireCalcGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:14px 0}.fireCalcGrid label,.fireCalcNotes{display:flex;flex-direction:column;gap:7px;font-weight:600}.fireCalcGrid input,.fireCalcGrid select,.fireCalcNotes textarea{width:100%;min-width:0;box-sizing:border-box;padding:11px;border:1px solid #d7dce5;border-radius:10px;background:#fff;font:inherit}.fireCalcNotes{margin:14px 0}.fireCalcItem{border:1px solid #e0e5ed;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;background:#fafbfc;min-width:0}.fireCalcItem strong{line-height:1.7;overflow-wrap:anywhere}.fireCalcItem small{line-height:1.7;color:#5e6878}.fireCalcReviewed{background:#f0f7f2;border-radius:8px;padding:10px}.fireCalcFootnote{line-height:1.8;color:#596579}.fireCalcFootnote a{color:#9f1d28;text-decoration:underline}@media(max-width:650px){.fireCalcGrid{grid-template-columns:1fr}.fireCalcForm,.fireCalcResults{padding:12px}}`}</style>
    <div className="hero"><div><p className="eyebrow">ORKEIT SAFETY • SBC 801</p><h1>حاسبة متطلبات السلامة والوقاية من الحريق</h1><p>أدخل بيانات المنشأة لإعداد قائمة أولية للمراجعة قبل التسعير أو الزيارة الفنية.</p></div></div>
    <div className="panel fireCalcNotice"><strong>تنبيه هندسي مهم</strong><p>الأعداد الأولية الظاهرة لا تمثل تصميمًا معتمدًا أو ضمان مطابقة للكود. لا يمكن تحديد الرشاشات أو سعة المضخات أو عدد المخارج نهائيًا من المساحة وعدد الغرف فقط؛ يلزم تصنيف الإشغال والخطورة والمخططات والحسابات الهندسية.</p></div>
    <form className="panel fireCalcForm" onSubmit={e => { e.preventDefault(); setReviewed(true); }}>
      <h2>١. بيانات المبنى والمنشأة</h2>
      <div className="fireCalcGrid">
        <label>اسم المنشأة<input value={form.facility} onChange={e=>update('facility',e.target.value)} placeholder="اسم المنشأة"/></label>
        <label>نشاط المنشأة<select value={form.activity} onChange={e=>update('activity',e.target.value)}>{activities.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>مساحة المبنى الإجمالية (م²)<input type="number" min="1" value={form.area} onChange={e=>update('area',e.target.value)} required placeholder="مثال: 650"/></label>
        <label>عدد الأدوار<input type="number" min="1" value={form.floors} onChange={e=>update('floors',e.target.value)} required/></label>
        <label>عدد الغرف / الفراغات<input type="number" min="1" value={form.rooms} onChange={e=>update('rooms',e.target.value)} required/></label>
        <label>ارتفاع المبنى (متر)<input type="number" min="0" step="0.1" value={form.height} onChange={e=>update('height',e.target.value)} required placeholder="الارتفاع الكلي"/></label>
        <label>العدد الأقصى المتوقع للأشخاص<input type="number" min="0" value={form.people} onChange={e=>update('people',e.target.value)} placeholder="إن توفر"/></label>
        <label>تصنيف الخطورة المبدئي<select value={form.risk} onChange={e=>update('risk',e.target.value)}><option>عادي</option><option>مرتفع</option><option>خاص / يحتاج تقييمًا</option></select></label>
        <label>مسار الترخيص في سلامة<select value={form.license} onChange={e=>update('license',e.target.value)}><option>غير محدد</option><option>فوري</option><option>غير فوري</option></select></label>
        <label>حالة أنظمة السلامة الحالية<select value={form.existing} onChange={e=>update('existing',e.target.value)}><option>غير معروف</option><option>توجد أنظمة</option><option>لا توجد أنظمة</option></select></label>
        <label>عدد مخارج / أبواب الطوارئ القائمة<input type="number" min="0" value={form.exits} onChange={e=>update('exits',e.target.value)} placeholder="إن وجد"/></label>
      </div>
      <label className="fireCalcNotes">ملاحظات المفتش<textarea rows={3} value={form.notes} onChange={e=>update('notes',e.target.value)} placeholder="نوع السقف، تقسيمات المبنى، القبو، المطبخ، المستودعات، مصدر المياه..."/></label>
      <button className="primary wide" type="submit">حساب القائمة الأولية</button>
    </form>
    {result.inputComplete && <section className="panel fireCalcResults">
      <div className="panelTitle"><h2>٢. قائمة التقدير الأولي</h2><button type="button" className="secondaryBtn" onClick={exportReport}>تصدير التقرير</button></div>
      {reviewed && <p className="fireCalcReviewed">تم تحديث القائمة بناءً على البيانات المدخلة؛ يلزم اعتمادها من مهندس مختص.</p>}
      <div className="fireCalcGrid">
        <article className="fireCalcItem"><b>كواشف الدخان</b><strong>{fmt(result.smoke)} نقطة مبدئية</strong><small>مؤشر مبدئي بعدد الغرف فقط، لا يحدد العدد النظامي.</small></article>
        <article className="fireCalcItem"><b>الكواشف الحرارية</b><strong>{fmt(result.thermal)} نقطة مبدئية</strong><small>مؤشر فرز أولي للمراجعة، وليس قاعدة توزيع معتمدة.</small></article>
        <article className="fireCalcItem"><b>طفايات الحريق</b><strong>{fmt(result.extinguisherPlanning)} وحدة تخطيطية</strong><small>افتراض داخلي أولي لكل 200 م²؛ يجب استبداله بالحساب المعتمد وفق نوع الخطر والمسافات والتصنيف.</small></article>
        <article className="fireCalcItem"><b>أجراس / أجهزة تنبيه</b><strong>{fmt(result.alarmSounders)} حد أولي</strong><small>العدد الفعلي حسب تصميم الإنذار والتغطية ومستوى الصوت.</small></article>
        <article className="fireCalcItem"><b>لمبات الطوارئ</b><strong>{fmt(result.emergencyLights)} حد أولي</strong><small>تحدد نهائيًا وفق مسارات الهروب ومخطط الإنارة.</small></article>
        <article className="fireCalcItem"><b>اللوحات الإرشادية</b><strong>{fmt(result.exitSigns)} حد أولي</strong><small>تحدد وفق اتجاهات ومسارات ومخارج الهروب.</small></article>
        <article className="fireCalcItem"><b>أبواب ومخارج الطوارئ</b><strong>{result.doors}</strong><small>يحدد العدد والسعة من حمل الإشغال ومسافات الهروب والأبعاد.</small></article>
        <article className="fireCalcItem"><b>الرشاشات الآلية</b><strong>{result.sprinkler}</strong><small>يتطلب تحديد تصنيف الخطورة وتوزيع الرؤوس وحسابات التصميم.</small></article>
        <article className="fireCalcItem"><b>مضخات الحريق وسعتها</b><strong>{result.pump}</strong><small>السعة والتدفق والضغط لا تُستنتج من المساحة فقط.</small></article>
        <article className="fireCalcItem"><b>نظام الإنذار</b><strong>{result.fireAlarm}</strong><small>تحديد لوحة التحكم والكواشف والأجراس والربط وفق المخططات.</small></article>
        <article className="fireCalcItem"><b>نوع مسار الترخيص</b><strong>{result.licensePath}</strong><small>المرجع النهائي رمز النشاط والنتيجة المعروضة في منصة سلامة.</small></article>
        <article className="fireCalcItem"><b>عقد الصيانة</b><strong>{result.maintenance}</strong></article>
        <article className="fireCalcItem"><b>شهادة إتمام التركيب</b><strong>{result.installation}</strong></article>
      </div>
      <p className="fireCalcFootnote">المرجع الفني: <a href="https://www.sbc.gov.sa/ar/BC/Pages/BuildingCode/BCDetails.aspx?codeId=801&year=2024" target="_blank" rel="noreferrer">الكود السعودي للحماية من الحرائق SBC 801 — إصدار 2024</a>. راجع كذلك SBC 201 والمتطلبات ذات الصلة حسب نوع المبنى. هذه الحاسبة لا تغني عن المخططات المعتمدة أو موافقة الجهة المختصة.</p>
    </section>}
  </section>;
}
