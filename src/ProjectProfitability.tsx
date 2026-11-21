import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { deleteCloud, firebaseConfigured, loadCloud, saveCloud } from './cloudStore';

type Project = { id: string; client: string; facility: string; contractNo?: string; contractEnd?: string };
type Contract = { id: string; siteId?: string; facility?: string; client?: string; value?: string; contractNo?: string };
type Entry = {
  id: string; projectId: string; kind: 'income' | 'expense'; amount: number;
  category: string; description: string; date: string;
  paymentStatus: 'paid' | 'pending'; createdAt: number; updatedAt: number;
};
const STORAGE_KEY = 'orkeit-project-finance-v1';
const makeId = () => globalThis.crypto?.randomUUID?.() || 'pf-' + Date.now() + '-' + Math.random().toString(36).slice(2);
const money = (value: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }).format(value);

export default function ProjectProfitability({ sites, contracts }: { sites: Project[]; contracts: Contract[] }) {
  const [entries, setEntries] = useState<Entry[]>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [editing, setEditing] = useState<string | null>(null);
  const [month, setMonth] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (firebaseConfigured) {
          const cloud = await loadCloud<Entry>('projectFinance');
          if (active) {
            const sorted = cloud.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
            setEntries(sorted);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
          }
        }
      } catch (e) {
        if (active) setError('تعذر تحميل حسابات المشاريع من قاعدة البيانات: ' + (e instanceof Error ? e.message : ''));
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => { if (!projectId && sites.length) setProjectId(sites[0].id); }, [sites, projectId]);
  const periodEntries = useMemo(() => entries.filter(x => (!month || x.date.startsWith(month)) && (selectedProject === 'all' || x.projectId === selectedProject)), [entries, month, selectedProject]);
  const income = periodEntries.filter(x => x.kind === 'income').reduce((s, x) => s + x.amount, 0);
  const expenses = periodEntries.filter(x => x.kind === 'expense').reduce((s, x) => s + x.amount, 0);
  const profit = income - expenses;
  const collected = periodEntries.filter(x => x.kind === 'income' && x.paymentStatus === 'paid').reduce((s, x) => s + x.amount, 0);
  const paidExpenses = periodEntries.filter(x => x.kind === 'expense' && x.paymentStatus === 'paid').reduce((s, x) => s + x.amount, 0);
  const cashNet = collected - paidExpenses;
  const margin = income > 0 ? profit / income * 100 : 0;
  const visible = [...periodEntries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const projectName = (id: string) => sites.find(s => s.id === id)?.facility || sites.find(s => s.id === id)?.client || 'مشروع غير مرتبط';
  const contractFor = (id: string) => contracts.find(c => c.siteId === id) || contracts.find(c => c.facility && c.facility === sites.find(s => s.id === id)?.facility);
  const reset = () => { setKind('expense'); setAmount(''); setCategory(''); setDescription(''); setDate(new Date().toISOString().slice(0, 10)); setPaymentStatus('paid'); setEditing(null); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    const value = Number(amount);
    if (!projectId) { setError('اختر المشروع أولاً.'); return; }
    if (!Number.isFinite(value) || value <= 0) { setError('أدخل مبلغاً صحيحاً أكبر من صفر.'); return; }
    if (!category.trim()) { setError('أدخل بند الحركة المالية.'); return; }
    const old = entries.find(x => x.id === editing);
    const now = Date.now();
    const record: Entry = { id: editing || makeId(), projectId, kind, amount: Math.round(value * 100) / 100, category: category.trim(), description: description.trim(), date, paymentStatus, createdAt: old?.createdAt || now, updatedAt: now };
    const next = [record, ...entries.filter(x => x.id !== record.id)].sort((a, b) => b.date.localeCompare(a.date));
    setSaving(true);
    try {
      if (firebaseConfigured) await saveCloud('projectFinance', record);
      setEntries(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); reset();
    } catch (e) { setError('لم يتم حفظ الحركة: ' + (e instanceof Error ? e.message : 'خطأ غير معروف')); }
    finally { setSaving(false); }
  };
  const edit = (x: Entry) => { setEditing(x.id); setProjectId(x.projectId); setKind(x.kind); setAmount(String(x.amount)); setCategory(x.category); setDescription(x.description); setDate(x.date); setPaymentStatus(x.paymentStatus); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const remove = async (x: Entry) => {
    if (!window.confirm('تأكيد حذف هذه الحركة المالية؟')) return;
    try {
      if (firebaseConfigured) await deleteCloud('projectFinance', x.id);
      const next = entries.filter(y => y.id !== x.id); setEntries(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) { setError('تعذر حذف الحركة: ' + (e instanceof Error ? e.message : '')); }
  };
  const exportCsv = () => {
    const rows = [['التاريخ','المشروع','النوع','التصنيف','البيان','المبلغ','حالة السداد'], ...visible.map(x => [x.date, projectName(x.projectId), x.kind === 'income' ? 'إيراد' : 'مصروف', x.category, x.description, String(x.amount), x.paymentStatus === 'paid' ? 'مسدد' : 'مستحق'])];
    const csv = '\uFEFF' + rows.map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'orkeit-project-finance.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return <section className="financePage" dir="rtl">
    <div className="pageTitle"><div><h1>📊 حسابات المشاريع والأرباح</h1><p>سجل مستقل لكل مشروع مع ملخص موحد لجميع مشاريع أوريكيت.</p></div><button className="secondaryBtn" type="button" onClick={exportCsv}>تصدير CSV</button></div>
    <div className="financeLedgerHead" style={{ marginBottom: 16 }}>
      <label>المشروع<select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}><option value="all">كل المشاريع — ملخص الشركة</option>{sites.map(s => <option key={s.id} value={s.id}>{s.facility || s.client}</option>)}</select></label>
      <label>الفترة<input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
    </div>
    <div className="financeSummary">
      <article className="financeStat incomeStat"><span>إجمالي الإيرادات</span><strong>{money(income)}</strong></article>
      <article className="financeStat expenseStat"><span>إجمالي المصروفات</span><strong>{money(expenses)}</strong></article>
      <article className={'financeStat ' + (profit < 0 ? 'negativeNet' : 'netStat')}><span>صافي الربح / الخسارة</span><strong>{money(profit)}</strong><small>هامش الربح: {margin.toFixed(1)}%</small></article>
      <article className="financeStat"><span>صافي السيولة الفعلية</span><strong>{money(cashNet)}</strong><small>المقبوض {money(collected)} − المدفوع {money(paidExpenses)}</small></article>
    </div>
    {selectedProject !== 'all' && (() => { const p = sites.find(s => s.id === selectedProject); const c = contractFor(selectedProject); return <div className="panel" style={{ marginBottom: 16 }}><h2>{p?.facility || p?.client || 'تفاصيل المشروع'}</h2><p>العميل: {p?.client || c?.client || '—'} · رقم العقد: {c?.contractNo || '—'}</p><p>قيمة العقد المسجلة: {c?.value ? money(Number(c.value) || 0) : 'غير مسجلة'} · نهاية العقد: {p?.contractEnd || '—'}</p></div>; })()}
    <div className="panel financeFormPanel"><h2>{editing ? 'تعديل حركة مالية' : 'تسجيل إيراد أو مصروف لمشروع'}</h2>
      <form className="financeForm" onSubmit={submit}>
        <label>المشروع<select required value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">اختر المشروع</option>{sites.map(s => <option key={s.id} value={s.id}>{s.facility || s.client}</option>)}</select></label>
        <div className="financeTypeSwitch"><button type="button" className={kind === 'income' ? 'selectedIncome' : ''} onClick={() => setKind('income')}>＋ إيراد</button><button type="button" className={kind === 'expense' ? 'selectedExpense' : ''} onClick={() => setKind('expense')}>− مصروف</button></div>
        <label>المبلغ (ريال سعودي)<input type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></label>
        <label>البند / التصنيف<input required value={category} onChange={e => setCategory(e.target.value)} placeholder={kind === 'income' ? 'دفعة عقد، أعمال إضافية، تحصيل' : 'أجور فنيين، طفايات، مواد، وقود'} /></label>
        <label>التاريخ<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
        <label>حالة السداد<select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as 'paid' | 'pending')}><option value="paid">تم السداد / التحصيل</option><option value="pending">مستحق ولم يسدد</option></select></label>
        <label>البيان / المرجع<input value={description} onChange={e => setDescription(e.target.value)} placeholder="اسم العميل أو رقم الفاتورة أو تفاصيل المصروف" /></label>
        <div className="financeFormActions"><button className="primary" disabled={saving || !sites.length}>{saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديل' : 'حفظ الحركة'}</button>{editing && <button type="button" className="secondaryBtn" onClick={reset}>إلغاء</button>}</div>
      </form>
      {!sites.length && <p className="financeWarning">أضف موقعاً أو منشأة أولاً حتى تتمكن من ربط الحركات المالية بالمشاريع.</p>}
    </div>
    <div className="panel financeLedger"><div className="financeLedgerHead"><h2>دفتر حركات المشاريع</h2><span>{visible.length} حركة</span></div>
      {error && <p className="financeError" role="alert">{error}</p>}
      {loading ? <p>جارٍ تحميل السجل المالي...</p> : visible.length === 0 ? <p className="emptyMini">لا توجد حركات مالية في الفترة المحددة.</p> : <div className="financeTableWrap"><table className="financeTable"><thead><tr><th>التاريخ</th><th>المشروع</th><th>النوع</th><th>البند والبيان</th><th>المبلغ</th><th>السداد</th><th>الإجراءات</th></tr></thead><tbody>{visible.map(x => <tr key={x.id}><td>{x.date}</td><td>{projectName(x.projectId)}</td><td><span className={'financeBadge ' + (x.kind === 'income' ? 'badgeIncome' : 'badgeExpense')}>{x.kind === 'income' ? 'إيراد' : 'مصروف'}</span></td><td><strong>{x.category}</strong>{x.description && <small>{x.description}</small>}</td><td className={x.kind === 'income' ? 'incomeText' : 'expenseText'}>{x.kind === 'income' ? '+' : '−'} {money(x.amount)}</td><td>{x.paymentStatus === 'paid' ? 'مسدد' : 'مستحق'}</td><td><div className="financeActions"><button type="button" className="secondaryBtn" onClick={() => edit(x)}>تعديل</button><button type="button" className="delete" onClick={() => void remove(x)}>حذف</button></div></td></tr>)}</tbody></table></div>}
    </div>
    {!firebaseConfigured && <p className="financeWarning">Firebase غير مهيأ؛ تحفظ الحركات على هذا الجهاز فقط ولن تتزامن مع بقية الأجهزة.</p>}
  </section>;
}
