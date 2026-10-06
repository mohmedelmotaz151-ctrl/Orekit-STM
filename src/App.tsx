import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { deleteCloud, firebaseConfigured, loadCloud, saveCloud } from './cloudStore';

type Site={id:string;client:string;facility:string;phone:string;address:string;contractEnd:string;extCount:number};
type Visit={id:string;siteId:string;date:string;status:string;notes:string};
type Maintenance={id:string;siteId:string;date:string;service:string;count:number;technician:string};
type Delegate={id:string;name:string;phone:string;active:boolean};

const KEY='orkeit-civil-defense-v1';
const AUTH_KEY='orkeit-civil-defense-auth';
const USERNAME='0555334577';
const PASSWORD='5520';
const uid=()=>crypto.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2);
const load=<T,>(key:string, fallback:T):T=>{try{const raw=localStorage.getItem(KEY+key);return raw?JSON.parse(raw):fallback}catch{return fallback}};
const save=(key:string,value:unknown)=>localStorage.setItem(KEY+key,JSON.stringify(value));

export default function App(){
 const [loggedIn,setLoggedIn]=useState(()=>localStorage.getItem(AUTH_KEY)==='1');
 if(!loggedIn) return <Login onLogin={()=>setLoggedIn(true)}/>;
 return <Dashboard onLogout={()=>{localStorage.removeItem(AUTH_KEY);setLoggedIn(false)}}/>;
}
function Login({onLogin}:{onLogin:()=>void}){
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('');
 const submit=(e:FormEvent)=>{e.preventDefault();if(username.trim()===USERNAME&&password===PASSWORD){localStorage.setItem(AUTH_KEY,'1');onLogin()}else setError('اسم المستخدم أو كلمة المرور غير صحيحة.')};
 return <div className="loginPage"><div className="loginCard"><div className="loginLogo">O</div><p className="eyebrow">ORKEIT SAFETY</p><h1>تسجيل الدخول</h1><p className="loginHint">نظام زيارات الدفاع المدني</p><form onSubmit={submit}><label>اسم المستخدم<input inputMode="numeric" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/></label><label>كلمة المرور<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="error">{error}</div>}<button className="primary wide">دخول إلى النظام</button></form></div></div>;
}
function Dashboard({onLogout}:{onLogout:()=>void}){
 const [sites,setSites]=useState<Site[]>(()=>load('/sites',[]));
 const [visits,setVisits]=useState<Visit[]>(()=>load('/visits',[]));
 const [maintenance,setMaintenance]=useState<Maintenance[]>(()=>load('/maintenance',[]));
 const [delegates,setDelegates]=useState<Delegate[]>(()=>load('/delegates',[]));
 const [cloudReady,setCloudReady]=useState(false);
 useEffect(()=>{let cancelled=false;(async()=>{if(!firebaseConfigured){setCloudReady(true);return}try{
   const [cloudSites,cloudVisits,cloudMaintenance,cloudDelegates]=await Promise.all([
    loadCloud<Site>('sites'),loadCloud<Visit>('visits'),loadCloud<Maintenance>('maintenance'),loadCloud<Delegate>('delegates')
   ]);
   if(cancelled)return;
   if(cloudSites.length)setSites(cloudSites),save('/sites',cloudSites);
   if(cloudVisits.length)setVisits(cloudVisits),save('/visits',cloudVisits);
   if(cloudMaintenance.length)setMaintenance(cloudMaintenance),save('/maintenance',cloudMaintenance);
   if(cloudDelegates.length)setDelegates(cloudDelegates),save('/delegates',cloudDelegates);
 }catch(err){console.error('Firebase load failed',err)}finally{if(!cancelled)setCloudReady(true)}})();return()=>{cancelled=true}},[]);
 const [page,setPage]=useState<'home'|'sites'|'visits'|'maintenance'|'delegates'>('home');
 const [open,setOpen]=useState<string|null>(null),[menu,setMenu]=useState(false),[editing,setEditing]=useState<any>(null);
 const update=(setter:any,key:string,kind:'sites'|'visits'|'maintenance'|'delegates')=>(value:any)=>{
   setter(value);save(key,value);
   if(firebaseConfigured){const previous=value as any[];previous.forEach(item=>{void saveCloud(kind,item).catch(err=>console.error('Firebase save failed',err))})}
 };
 const removeCloudRecord=(kind:'sites'|'visits'|'maintenance'|'delegates',id:string)=>{if(firebaseConfigured)void deleteCloud(kind,id).catch(err=>console.error('Firebase delete failed',err))};
 const setSitesSafe=update(setSites,'/sites','sites'),setVisitsSafe=update(setVisits,'/visits','visits'),setMaintenanceSafe=update(setMaintenance,'/maintenance','maintenance'),setDelegatesSafe=update(setDelegates,'/delegates','delegates');
 const expiring=useMemo(()=>{const now=Date.now();return sites.filter(s=>s.contractEnd && (new Date(s.contractEnd).getTime()-now)<=30*86400000).length},[sites]);
 const nav=[['home','الرئيسية'],['sites','المواقع والمنشآت'],['visits','الزيارات'],['maintenance','صيانة الطفايات'],['delegates','المناديب']] as const;
 const go=(p:any)=>{setPage(p);setMenu(false);setOpen(null);setEditing(null)};
 const add=(kind:string)=>{setEditing(null);setOpen(kind)};
 const remove=(kind:string,id:string)=>{if(!confirm('هل تريد حذف السجل؟'))return;if(kind==='site'){setSitesSafe(sites.filter(x=>x.id!==id));removeCloudRecord('sites',id)}if(kind==='visit'){setVisitsSafe(visits.filter(x=>x.id!==id));removeCloudRecord('visits',id)}if(kind==='maintenance'){setMaintenanceSafe(maintenance.filter(x=>x.id!==id));removeCloudRecord('maintenance',id)}if(kind==='delegate'){setDelegatesSafe(delegates.filter(x=>x.id!==id));removeCloudRecord('delegates',id)}};
 return <div className="app">
  <header><button className="menuBtn" onClick={()=>setMenu(!menu)}>☰</button><div className="logo"><b>O</b><span><strong>ORKEIT</strong><small>زيارات الدفاع المدني</small></span></div><div className="headerTag">{firebaseConfigured&&cloudReady?"متصل بقاعدة البيانات":"وضع محلي — أكمل إعداد Firebase"}</div><button className="logout" onClick={onLogout}>خروج</button></header>
  {menu&&<><div className="backdrop" onClick={()=>setMenu(false)}/><aside>{nav.map(([k,l])=><button className={page===k?'active':''} key={k} onClick={()=>go(k)}>{l}</button>)}</aside></>}
  <main>
   {page==='home'&&<><section className="hero"><div><p className="eyebrow">ORKEIT SAFETY</p><h1>إدارة زيارات الدفاع المدني</h1><p>منشآت، زيارات، صيانة طفايات ومناديب في نظام واحد.</p></div><button className="primary" onClick={()=>add('site')}>＋ إضافة منشأة</button></section><div className="stats"><Stat n={sites.length} t="المنشآت"/><Stat n={visits.length} t="الزيارات"/><Stat n={maintenance.length} t="الصيانة"/><Stat n={expiring} t="تنبيهات قريبة"/></div><section className="panel"><h2>الوصول السريع</h2><div className="quick">{nav.slice(1).map(([k,l])=><button key={k} onClick={()=>go(k)}>{l}<span>›</span></button>)}</div></section></>}
   {page==='sites'&&<ListPage title="المواقع والمنشآت" add={()=>add('site')}><div className="grid">{sites.map(s=><Card key={s.id} title={s.facility||'منشأة'} lines={[s.client,s.phone,s.address,s.contractEnd?'انتهاء العقد: '+s.contractEnd:'']} badge={'الطفايات: '+s.extCount} del={()=>remove('site',s.id)}/>)}</div>{!sites.length&&<Empty/>}</ListPage>}
   {page==='visits'&&<ListPage title="الزيارات" add={()=>add('visit')}><div className="grid">{visits.map(v=>{const s=sites.find(x=>x.id===v.siteId);return <Card key={v.id} title={s?.facility||'موقع محذوف'} lines={[v.date,v.status,v.notes]} del={()=>remove('visit',v.id)}/>})}</div>{!visits.length&&<Empty/>}</ListPage>}
   {page==='maintenance'&&<ListPage title="صيانة الطفايات" add={()=>add('maintenance')}><div className="grid">{maintenance.map(m=><Card key={m.id} title={sites.find(s=>s.id===m.siteId)?.facility||'منشأة'} lines={[m.service,m.date,'الفني: '+m.technician]} badge={'العدد: '+m.count} del={()=>remove('maintenance',m.id)}/>)}</div>{!maintenance.length&&<Empty/>}</ListPage>}
   {page==='delegates'&&<ListPage title="المناديب" add={()=>add('delegate')}><div className="grid">{delegates.map(d=><Card key={d.id} title={d.name} lines={[d.phone,d.active?'نشط':'موقوف']} del={()=>remove('delegate',d.id)}/>)}</div>{!delegates.length&&<Empty/>}</ListPage>}
  </main>
  {open==='site'&&<SiteForm initial={editing} close={()=>setOpen(null)} onSave={x=>{setSitesSafe([x,...sites.filter(s=>s.id!==x.id)]);setOpen(null)}}/>}
  {open==='visit'&&<VisitForm sites={sites} initial={editing} close={()=>setOpen(null)} onSave={x=>{setVisitsSafe([x,...visits.filter(v=>v.id!==x.id)]);setOpen(null)}}/>}
  {open==='maintenance'&&<MaintenanceForm sites={sites} initial={editing} close={()=>setOpen(null)} onSave={x=>{setMaintenanceSafe([x,...maintenance.filter(m=>m.id!==x.id)]);setOpen(null)}}/>}
  {open==='delegate'&&<DelegateForm initial={editing} close={()=>setOpen(null)} onSave={x=>{setDelegatesSafe([x,...delegates.filter(d=>d.id!==x.id)]);setOpen(null)}}/>}
 </div>
}
function Stat({n,t}:{n:number;t:string}){return <div className="stat"><strong>{n}</strong><span>{t}</span></div>}
function ListPage({title,add,children}:{title:string;add:()=>void;children:any}){return <section><div className="pageTitle"><h1>{title}</h1><button className="primary" onClick={add}>＋ إضافة</button></div>{children}</section>}
function Card({title,lines,badge,del}:{title:string;lines:string[];badge?:string;del:()=>void}){return <article className="card"><h3>{title}</h3>{lines.filter(Boolean).map((x,i)=><p key={i}>{x}</p>)}{badge&&<span className="badge">{badge}</span>}<button className="delete" onClick={del}>حذف</button></article>}
function Empty(){return <div className="empty">لا توجد سجلات حتى الآن.</div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:any}){return <div className="modalBg"><div className="modal"><div className="modalHead"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>}
function Input({label,value,onChange,type='text',required=false}:{label:string;value:any;onChange:(v:string)=>void;type?:string;required?:boolean}){return <label>{label}<input type={type} value={value??''} onChange={e=>onChange(e.target.value)} required={required}/></label>}
function SiteForm({initial,close,onSave}:{initial?:Site|null;close:()=>void;onSave:(x:Site)=>void}){const [x,setX]=useState<Site>(initial||{id:uid(),client:'',facility:'',phone:'',address:'',contractEnd:'',extCount:0});return <Modal title="إضافة منشأة" close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,extCount:Number(x.extCount||0)})}}><Input label="اسم العميل" value={x.client} onChange={v=>setX({...x,client:v})} required/><Input label="اسم المنشأة" value={x.facility} onChange={v=>setX({...x,facility:v})} required/><Input label="رقم الجوال" value={x.phone} onChange={v=>setX({...x,phone:v})}/><Input label="العنوان" value={x.address} onChange={v=>setX({...x,address:v})}/><Input label="تاريخ انتهاء العقد" value={x.contractEnd} onChange={v=>setX({...x,contractEnd:v})} type="date"/><Input label="عدد الطفايات" value={x.extCount} onChange={v=>setX({...x,extCount:v as any})} type="number"/><button className="primary wide">حفظ المنشأة</button></form></Modal>}
function VisitForm({sites,initial,close,onSave}:{sites:Site[];initial?:Visit|null;close:()=>void;onSave:(x:Visit)=>void}){const [x,setX]=useState<Visit>(initial||{id:uid(),siteId:sites[0]?.id||'',date:new Date().toISOString().slice(0,10),status:'مجدولة',notes:''});return <Modal title="تسجيل زيارة" close={close}><form onSubmit={e=>{e.preventDefault();onSave(x)}}><label>المنشأة<select value={x.siteId} onChange={e=>setX({...x,siteId:e.target.value})}>{sites.map(s=><option key={s.id} value={s.id}>{s.facility}</option>)}</select></label><Input label="التاريخ" value={x.date} onChange={v=>setX({...x,date:v})} type="date" required/><Input label="الحالة" value={x.status} onChange={v=>setX({...x,status:v})}/><Input label="ملاحظات" value={x.notes} onChange={v=>setX({...x,notes:v})}/><button className="primary wide" disabled={!sites.length}>حفظ الزيارة</button></form></Modal>}
function MaintenanceForm({sites,initial,close,onSave}:{sites:Site[];initial?:Maintenance|null;close:()=>void;onSave:(x:Maintenance)=>void}){const [x,setX]=useState<Maintenance>(initial||{id:uid(),siteId:sites[0]?.id||'',date:new Date().toISOString().slice(0,10),service:'فحص وصيانة الطفايات',count:1,technician:''});return <Modal title="تسجيل صيانة" close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,count:Number(x.count||0)})}}><label>المنشأة<select value={x.siteId} onChange={e=>setX({...x,siteId:e.target.value})}>{sites.map(s=><option key={s.id} value={s.id}>{s.facility}</option>)}</select></label><Input label="الخدمة" value={x.service} onChange={v=>setX({...x,service:v})}/><Input label="التاريخ" value={x.date} onChange={v=>setX({...x,date:v})} type="date"/><Input label="عدد الطفايات" value={x.count} onChange={v=>setX({...x,count:v as any})} type="number"/><Input label="اسم الفني" value={x.technician} onChange={v=>setX({...x,technician:v})}/><button className="primary wide" disabled={!sites.length}>حفظ</button></form></Modal>}
function DelegateForm({initial,close,onSave}:{initial?:Delegate|null;close:()=>void;onSave:(x:Delegate)=>void}){const [x,setX]=useState<Delegate>(initial||{id:uid(),name:'',phone:'',active:true});return <Modal title="إضافة مندوب" close={close}><form onSubmit={e=>{e.preventDefault();onSave(x)}}><Input label="اسم المندوب" value={x.name} onChange={v=>setX({...x,name:v})} required/><Input label="رقم الجوال" value={x.phone} onChange={v=>setX({...x,phone:v})}/><label>الحالة<select value={x.active?'active':'inactive'} onChange={e=>setX({...x,active:e.target.value==='active'})}><option value="active">نشط</option><option value="inactive">موقوف</option></select></label><button className="primary wide">حفظ المندوب</button></form></Modal>}
