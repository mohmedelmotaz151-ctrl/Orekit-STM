/// <reference types="react" />
import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { deleteCloud, firebaseConfigured, loadCloud, saveCloud, subscribeCloud } from './cloudStore';
import { enablePush, sendPush, startForegroundPushListener, unlockNotificationSound, playNotificationSound } from './push';

type Site={id:string;client:string;facility:string;phone:string;address:string;contractEnd:string;extCount:number};
type Visit={id:string;siteId:string;date:string;status:string;notes:string};
type Maintenance={id:string;siteId:string;client?:string;date:string;expiryDate:string;service:string;count:number;technician:string};
type Delegate={id:string;name:string;phone:string;password:string;active:boolean};
type ServiceRequest={id:string;customerId:string;customerName:string;phone:string;service:string;facility:string;address:string;status:string;note:string;createdAt:number;updatedAt:number};
type CustomerRecord={id:string;name:string;phone:string;facility:string;address:string;updatedAt:number};
type Lead={id:string;client:string;facility:string;phone:string;address:string;createdAt:number};

const KEY='orkeit-civil-defense-v1';
const AUTH_KEY='orkeit-civil-defense-auth';
const CUSTOMER_AUTH_KEY='orkeit-customer-auth';
const CUSTOMER_ACCOUNTS_KEY='orkeit-customer-accounts';
const USERNAME='0555334577';
const PASSWORD='5520';
const uid=()=>crypto.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2);
const load=<T,>(key:string, fallback:T):T=>{try{const raw=localStorage.getItem(KEY+key);return raw?JSON.parse(raw):fallback}catch{return fallback}};
const save=(key:string,value:unknown)=>localStorage.setItem(KEY+key,JSON.stringify(value));

const daysUntil=(date:string)=>Math.ceil((new Date(date+'T23:59:59').getTime()-Date.now())/86400000);
const expiryLabel=(days:number)=>{
 if(days<0)return 'منتهية';
 if(days<=3)return 'حرجة — قبل 3 أيام';
 if(days<=7)return 'إنذار أخير — قبل 7 أيام';
 if(days<=15)return 'إنذار — قبل 15 يومًا';
 if(days<=30)return 'تنبيه — قبل 30 يومًا';
 return '';
};
const exportCsv=(filename:string,rows:string[][])=>{
  const csv='\\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
};

const notifyOutside=(title:string,body:string)=>{playNotificationSound();if(typeof window!=='undefined' && 'Notification' in window && Notification.permission==='granted'){try{new Notification(title,{body,icon:'/pwa-192x192.png',tag:title})}catch{}}};
const requestNotificationPermission=async()=>{
 if(typeof window!=='undefined' && 'Notification' in window && Notification.permission==='default'){
   try{await Notification.requestPermission()}catch{}
 }
};
function NotificationBell({items,title='الإشعارات',onSelect}:{items:string[];title?:string;onSelect?:(item:string)=>void}){
 const [open,setOpen]=useState(false);
 const count=items.length;
 return <div className="notificationWrap">
   <button type="button" className="notificationBell" onClick={()=>{unlockNotificationSound();setOpen(!open);void requestNotificationPermission()}} aria-label={title}>🔔{count>0&&<span>{count>99?'99+':count}</span>}</button>
   {open&&<div className="notificationPanel"><div className="notificationHead"><strong>{title}</strong><button onClick={()=>setOpen(false)}>×</button></div>{count?<>{items.slice(0,12).map((x,i)=><button type="button" className="notificationItem notificationItemButton" key={i} onClick={()=>{setOpen(false);onSelect?.(x)}}>⚠️ {x}<span className="notificationOpenHint">فتح ←</span></button>)}</>:<div className="empty">لا توجد إشعارات جديدة.</div>}<small>اضغط الجرس للسماح بإشعارات الجهاز.</small></div>}
 </div>
}



export default function App(){
 const [loggedIn,setLoggedIn]=useState(()=>localStorage.getItem(AUTH_KEY)==='1');
 const [customerPortal,setCustomerPortal]=useState(false);
 const [delegateUser,setDelegateUser]=useState<Delegate|null>(()=>{try{return JSON.parse(localStorage.getItem('orkeit-delegate-auth')||'null')}catch{return null}});
 if(customerPortal) return <CustomerPortal onBack={()=>setCustomerPortal(false)}/>;
 if(delegateUser) return <DelegatePortal delegate={delegateUser} onLogout={()=>{localStorage.removeItem('orkeit-delegate-auth');setDelegateUser(null)}}/>;
 if(!loggedIn) return <Login onLogin={()=>setLoggedIn(true)} onCustomer={()=>setCustomerPortal(true)} onDelegate={d=>{localStorage.setItem('orkeit-delegate-auth',JSON.stringify(d));setDelegateUser(d)}}/>;
 return <Dashboard onLogout={()=>{localStorage.removeItem(AUTH_KEY);setLoggedIn(false)}}/>;
}
function Login({onLogin,onCustomer,onDelegate}:{onLogin:()=>void;onCustomer:()=>void;onDelegate?:(d:Delegate)=>void}){
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[mode,setMode]=useState<'admin'|'delegate'>('admin'),[busy,setBusy]=useState(false);
 const submit=async(e:FormEvent)=>{e.preventDefault();setError('');if(mode==='admin'){if(username.trim()===USERNAME&&password===PASSWORD){localStorage.setItem(AUTH_KEY,'1');onLogin()}else setError('اسم المستخدم أو كلمة المرور غير صحيحة.');return;}setBusy(true);try{const local=load<Delegate[]>('/delegates',[]);let all=local;if(firebaseConfigured){try{all=await loadCloud<Delegate>('delegates')}catch{}}const d=all.find(x=>x.active&&x.phone.replace(/\\s+/g,'')===username.trim().replace(/\\s+/g,'')&&x.password===password);if(d){if(onDelegate)onDelegate(d);else setError('دخول المندوب غير متاح من هذه الشاشة.')}else setError('بيانات المندوب غير صحيحة أو الحساب موقوف.')}catch{setError('تعذر التحقق من الحساب. حاول مرة أخرى.')}finally{setBusy(false)}};
 return <div className="loginPage"><div className="loginCard"><div className="loginLogo">O</div><p className="eyebrow">ORKEIT SAFETY</p><h1>{mode==='admin'?'تسجيل الدخول':'دخول المندوب'}</h1><p className="loginHint">{mode==='admin'?'نظام زيارات الدفاع المدني':'منصة المندوب للزيارات وصيانة الطفايات'}</p><div className="segmentedLogin"><button type="button" className={mode==='admin'?'active':''} onClick={()=>{setMode('admin');setError('')}}>الإدارة</button><button type="button" className={mode==='delegate'?'active':''} onClick={()=>{setMode('delegate');setError('')}}>دخول المندوب</button></div><form onSubmit={submit}><label>{mode==='admin'?'اسم المستخدم':'رقم جوال المندوب'}<input inputMode="numeric" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/></label><label>كلمة المرور<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="error">{error}</div>}<button className="primary wide" disabled={busy}>{busy?'جارٍ التحقق...':mode==='admin'?'دخول إلى النظام':'دخول إلى منصة المندوب'}</button></form><div className="customerGate"><span>عميل وتريد طلب خدمة؟</span><button type="button" className="customerButton" onClick={onCustomer}>اطلب خدمة</button></div></div></div>;
}
function DelegatePortal({delegate,onLogout}:{delegate:Delegate;onLogout:()=>void}){
 const [sites,setSites]=useState<Site[]>([]),[visits,setVisits]=useState<Visit[]>([]),[maintenance,setMaintenance]=useState<Maintenance[]>([]),[tab,setTab]=useState<'visits'|'maintenance'>('visits'),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let stopped=false;const unsubs:(()=>void)[]=[];const loadAll=async()=>{try{if(firebaseConfigured){const [ss,vv,mm]=await Promise.all([loadCloud<Site>('sites'),loadCloud<Visit>('visits'),loadCloud<Maintenance>('maintenance')]);if(!stopped){setSites(ss);setVisits(vv);setMaintenance(mm);setLoading(false)}for(const [kind,setter] of [['sites',setSites],['visits',setVisits],['maintenance',setMaintenance]] as const){const unsub=await subscribeCloud<any>(kind,(items)=>{if(!stopped)setter(items)},e=>{console.error(e);if(!stopped)setError('تعذر تحديث البيانات المباشرة.')});if(stopped)unsub();else unsubs.push(unsub)}}else{setSites(load('/sites',[]));setVisits(load('/visits',[]));setMaintenance(load('/maintenance',[]));setError('وضع محلي: قد لا تظهر بيانات الأجهزة الأخرى.');setLoading(false)}}catch(e){console.error(e);if(!stopped){setError('تعذر تحميل البيانات. تحقق من اتصال قاعدة البيانات.');setLoading(false)}}};void loadAll();return()=>{stopped=true;unsubs.forEach(f=>f())}},[]);
 const siteName=(id:string)=>sites.find(s=>s.id===id)?.facility||'منشأة غير محددة';
 return <div className="loginPage"><div className="servicesCard delegatePortal"><div className="serviceTop"><div><p className="eyebrow">ORKEIT SAFETY • DELEGATE</p><h1>منصة المندوب</h1><p>مرحبًا {delegate.name} — تابع الزيارات وصيانة الطفايات.</p></div><button className="switchAuth" onClick={onLogout}>تسجيل الخروج</button></div><div className="stats"><Stat n={visits.length} t="الزيارات"/><Stat n={maintenance.length} t="سجلات الصيانة"/><Stat n={sites.length} t="المنشآت"/></div><div className="segmentedLogin"><button type="button" className={tab==='visits'?'active':''} onClick={()=>setTab('visits')}>الزيارات</button><button type="button" className={tab==='maintenance'?'active':''} onClick={()=>setTab('maintenance')}>صيانة الطفايات</button></div>{error&&<div className="error">{error}</div>}{loading?<p>جارٍ تحميل بيانات المنصة...</p>:tab==='visits'?<div className="grid">{visits.map(v=><article className="card" key={v.id}><h3>{siteName(v.siteId)}</h3><p>تاريخ الزيارة: {v.date||'—'}</p><p>الحالة: {v.status||'—'}</p>{v.notes&&<p>ملاحظات: {v.notes}</p>}</article>)}{!visits.length&&<Empty/>}</div>:<div className="grid">{maintenance.map(m=><article className="card" key={m.id}><h3>{m.client||siteName(m.siteId)}</h3><p>الخدمة: {m.service||'صيانة طفايات'}</p><p>تاريخ الصيانة: {m.date||'—'}</p><p>تاريخ الانتهاء: {m.expiryDate||'—'}</p><p>عدد الطفايات: {m.count??0}</p><p>الفني: {m.technician||'—'}</p></article>)}{!maintenance.length&&<Empty/>}</div>}</div></div>
}
function CustomerPortal({onBack}:{onBack:()=>void}){
 const [user,setUser]=useState<any>(()=>{try{return JSON.parse(localStorage.getItem(CUSTOMER_AUTH_KEY)||'null')}catch{return null}});
 if(user) return <CustomerServices user={user} onLogout={()=>{localStorage.removeItem(CUSTOMER_AUTH_KEY);setUser(null)}}/>;
 return <CustomerAuth onBack={onBack} onLogin={u=>{localStorage.setItem(CUSTOMER_AUTH_KEY,JSON.stringify(u));setUser(u)}}/>;
}
function CustomerAuth({onBack,onLogin}:{onBack:()=>void;onLogin:(u:any)=>void}){
 const [mode,setMode]=useState<'login'|'register'>('login'),[name,setName]=useState(''),[phone,setPhone]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('');
 const get=()=>{try{return JSON.parse(localStorage.getItem(CUSTOMER_ACCOUNTS_KEY)||'[]')}catch{return []}};
 const submit=(e:FormEvent)=>{
   e.preventDefault();
   setError('');
   const normalizedPhone=phone.trim().replace(/\\s+/g,'');
   const list=get();
   if(mode==='register'){
     if(!name.trim()||!normalizedPhone||password.length<4){setError('أدخل البيانات المطلوبة وكلمة مرور لا تقل عن 4 أحرف.');return}
     if(list.some((x:any)=>x.phone===normalizedPhone)){setError('رقم الجوال مسجل مسبقًا.');return}
     const u={id:uid(),name:name.trim(),phone:normalizedPhone,password};
     localStorage.setItem(CUSTOMER_ACCOUNTS_KEY,JSON.stringify([u,...list]));
     onLogin({id:u.id,name:u.name,phone:u.phone});
     return;
   }
   if(normalizedPhone===USERNAME && password===PASSWORD){
     const existing=list.find((x:any)=>x.phone===USERNAME);
     const u=existing||{id:'orkeit-customer-main',name:'عميل Orkeit',phone:USERNAME,password:PASSWORD};
     if(!existing) localStorage.setItem(CUSTOMER_ACCOUNTS_KEY,JSON.stringify([u,...list]));
     onLogin({id:u.id,name:u.name,phone:u.phone});
     return;
   }
   const u=list.find((x:any)=>x.phone===normalizedPhone&&x.password===password);
   if(!u){setError('رقم الجوال أو كلمة المرور غير صحيحة.');return}
   onLogin({id:u.id,name:u.name,phone:u.phone});
 };
 return <div className="loginPage"><div className="loginCard"><button type="button" className="backLink" onClick={onBack}>← العودة</button><div className="loginLogo">O</div><p className="eyebrow">ORKEIT SAFETY</p><h1>{mode==='login'?'تسجيل دخول العميل':'إنشاء حساب عميل'}</h1><p className="loginHint">بعد الدخول ستظهر لك خدمات الدفاع المدني.</p>{mode==='register'&&<label>اسم العميل<input value={name} onChange={e=>setName(e.target.value)} required/></label>}<label>رقم الجوال<input inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} required/></label><label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="error">{error}</div>}<button type="button" className="primary wide" onClick={submit}>{mode==='login'?'دخول':'إنشاء الحساب'}</button><button type="button" className="switchAuth" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'ليس لديك حساب؟ إنشاء حساب':'لديك حساب؟ تسجيل الدخول'}</button></div></div>;
}
function CustomerServices({user,onLogout}:{user:any;onLogout:()=>void}){
 const services=['عقد صيانة أنظمة الدفاع المدني','فحص وصيانة طفايات الحريق','صيانة نظام إنذار الحريق','صيانة مضخات الحريق','توريد وتركيب معدات السلامة','طلب زيارة وفحص للمنشأة'];
 const [requests,setRequests]=useState<ServiceRequest[]>([]);
 const [loading,setLoading]=useState(true);
 const [selectedService,setSelectedService]=useState('');
 const [form,setForm]=useState({name:user.name||'',phone:user.phone||'',facility:'',address:''});
 const [noticeItems,setNoticeItems]=useState<string[]>([]);
 const previous=useRef<Record<string,string>>({});
 const firstSnapshot=useRef(true);
 useEffect(()=>{void requestNotificationPermission(); void enablePush(user.id,'customer').catch(e=>console.warn('Push setup:',e)); void startForegroundPushListener().catch(()=>{});},[user.id]);
 useEffect(()=>{
   let unsub:(()=>void)|undefined;
   const run=async()=>{
    try{
      if(firebaseConfigured){
       unsub=await subscribeCloud<ServiceRequest>('requests',all=>{
        const mine=all.filter(x=>x.customerId===user.id).sort((a,b)=>b.createdAt-a.createdAt);
        setRequests(mine);
        if(!firstSnapshot.current){
          mine.forEach(x=>{
            const old=previous.current[x.id];
            if(old && old!==x.status){
              const msg=`تم تحديث طلب ${x.id}: ${x.status}`;
              setNoticeItems(n=>[msg,...n].slice(0,20));
              notifyOutside('Orkeit — تحديث طلبك',msg);
            }
          });
        }
        previous.current=Object.fromEntries(mine.map(x=>[x.id,x.status]));
        if(firstSnapshot.current){setNoticeItems(mine.slice(0,12).map(x=>'طلب '+x.id+': '+x.status));}
        firstSnapshot.current=false;
       },e=>console.error('Customer realtime error',e));
      }
    }catch(e){console.error(e)}
    finally{setLoading(false)}
   };
   void run();
   return()=>{unsub?.()};
 },[user.id]);
 const order=async()=>{
   const name=form.name.trim(),phone=form.phone.trim().replace(/\\s+/g,'');
   if(!selectedService||!name||!phone||!form.facility.trim()||!form.address.trim()){
     alert('أكمل الاسم ورقم الجوال واسم المنشأة وموقعها.');return;
   }
   const now=Date.now();
   const req:ServiceRequest={
    id:'ORK-'+new Date().getFullYear()+'-'+Math.floor(100000+Math.random()*900000),
    customerId:user.id,customerName:name,phone,service:selectedService,
    facility:form.facility.trim(),address:form.address.trim(),
    status:'جديد',note:'تم استلام طلبك وسيتم مراجعته من الإدارة.',createdAt:now,updatedAt:now
   };
   const customer:CustomerRecord={id:user.id,name,phone,facility:req.facility,address:req.address,updatedAt:now};
   try{
    if(firebaseConfigured){
      // Save the request first so a customer-profile write cannot block the service request.
      await saveCloud('requests',req);
      try{ await saveCloud('customers',customer); }catch(customerError){ console.warn('Customer profile save failed:',customerError); }
    } else {
      console.warn('Firebase is not configured; request kept locally only.');
    }
    setRequests(x=>[req,...x]);setSelectedService('');setForm({name,phone,facility:'',address:''});
    void sendPush({role:'admin'},'Orkeit — طلب خدمة جديد',`خدمة جديدة: ${req.service} — ${req.customerName} — ${req.facility}`,{requestId:req.id});
    alert('تم إرسال الطلب بنجاح. رقم المتابعة: '+req.id);
   }catch(e){
    console.error('Service request save failed:',e);
    const err=e as {code?:string;message?:string};
    const detail=err?.code ? `رمز الخطأ: ${err.code}` : (err?.message || 'خطأ غير معروف');
    alert('تعذر إرسال الطلب.\\n\\n'+detail+'\\n\\nتأكد من اتصال Firebase وFirestore ثم حاول مرة أخرى.');
   }
 };
 const steps=['جديد','قيد المراجعة','تم التسعير','تم اعتماد الطلب','جاري التنفيذ','مكتمل'];
 return <div className="loginPage"><div className="servicesCard">
  <div className="serviceTop"><div><p className="eyebrow">ORKEIT SAFETY</p><h1>خدمات الدفاع المدني</h1><p>مرحبًا {user.name}، اختر الخدمة المطلوبة.</p></div><div className="serviceActions"><NotificationBell items={noticeItems} title="تحديثات طلباتك" onSelect={item=>{const id=item.match(/ORK-\d{4}-\d+/)?.[0];if(id){document.getElementById('request-'+id)?.scrollIntoView({behavior:'smooth',block:'center'});}}}/><button className="switchAuth" onClick={onLogout}>خروج</button></div></div>
  {!selectedService?<><div className="serviceGrid">{services.map((x,i)=><button className="serviceItem" key={x} onClick={()=>setSelectedService(x)}><span>{String(i+1).padStart(2,'0')}</span><strong>{x}</strong><b>طلب الخدمة ←</b></button>)}</div></>:
  <section className="requestFormCard"><button className="backLink" type="button" onClick={()=>setSelectedService('')}>← العودة للخدمات</button><h2>إكمال إجراءات الطلب</h2><p>الخدمة المطلوبة: <b>{selectedService}</b></p>
   <label>اسم العميل<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
   <label>رقم الجوال<input inputMode="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></label>
   <label>اسم المنشأة<input value={form.facility} onChange={e=>setForm({...form,facility:e.target.value})} required/></label>
   <label>موقع المنشأة / العنوان<textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} rows={3} required/></label>
   <button className="primary wide" type="button" onClick={()=>void order()}>إرسال طلب الخدمة</button>
  </section>}
  <div className="requestSection"><h2>متابعة طلباتي</h2>{loading&&<p>جاري تحميل الطلبات...</p>}{!loading&&!requests.length&&<div className="empty">لا توجد طلبات حتى الآن.</div>}
   {requests.map(r=><article className="requestCard" id={'request-'+r.id} key={r.id}><div className="requestHead"><strong>{r.service}</strong><span>{r.id}</span></div><p><b>المنشأة:</b> {r.facility}</p><p><b>الموقع:</b> {r.address}</p><p>الحالة: <b>{r.status}</b></p><p>{r.note}</p><div className="timeline">{steps.map((s,i)=><span className={steps.indexOf(r.status)>=i?'done':''} key={s}>{s}</span>)}</div><small>آخر تحديث: {new Date(r.updatedAt).toLocaleString('ar-SA')}</small></article>)}
  </div>
 </div></div>;
}
function Dashboard({onLogout}:{onLogout:()=>void}){
 const [sites,setSites]=useState<Site[]>(()=>load('/sites',[]));
 const [visits,setVisits]=useState<Visit[]>(()=>load('/visits',[]));
 const [maintenance,setMaintenance]=useState<Maintenance[]>(()=>load('/maintenance',[]));
 const [delegates,setDelegates]=useState<Delegate[]>(()=>load('/delegates',[]));
 const [requests,setRequests]=useState<ServiceRequest[]>(()=>load('/requests',[]));
  const [leads,setLeads]=useState<Lead[]>(()=>load('/leads',[]));
 const [noticeItems,setNoticeItems]=useState<string[]>([]);
 const previousRequests=useRef<Record<string,number>>({});
 const firstRequestSnapshot=useRef(true);
 const [cloudReady,setCloudReady]=useState(false);
 const [pushReady,setPushReady]=useState(false);
 const activateAdminPush=async()=>{
   try{
     const ok=await enablePush('orkeit-admin','admin');
     setPushReady(ok);
     if(ok) alert('تم تفعيل إشعارات الإدارة على هذا الجهاز.');
     else alert('لم يتم تفعيل الإشعارات. اسمح بالإشعارات من إعدادات المتصفح ثم اضغط المحاولة مرة أخرى.');
   }catch(e){console.error(e);alert('تعذر تفعيل إشعارات الإدارة. تأكد من إعدادات Firebase وVercel.');}
 };
 useEffect(()=>{void requestNotificationPermission(); void enablePush('orkeit-admin','admin').then(setPushReady).catch(e=>console.warn('Admin push setup:',e)); void startForegroundPushListener().catch(()=>{});},[]);
 const [requestSyncError,setRequestSyncError]=useState('');
 const refreshRequests=async()=>{
   if(!firebaseConfigured){setRequestSyncError('Firebase غير مهيأ');return}
   try{
     const all=await loadCloud<ServiceRequest>('requests');
     const sorted=[...all].sort((a,b)=>b.updatedAt-a.updatedAt);
     setRequests(sorted);save('/requests',sorted);setRequestSyncError('');
   }catch(e){
     const err=e as {code?:string;message?:string};
     setRequestSyncError(err.code||err.message||'تعذر تحميل الطلبات');
   }
 };
 useEffect(()=>{let unsub:(()=>void)|undefined;(async()=>{
   try{
    if(firebaseConfigured){
      unsub=await subscribeCloud<ServiceRequest>('requests',all=>{
       const sorted=[...all].sort((a,b)=>b.updatedAt-a.updatedAt);
       setRequests(sorted);save('/requests',sorted);setRequestSyncError('');
       if(!firstRequestSnapshot.current){
        sorted.filter(x=>!previousRequests.current[x.id]).forEach(x=>{
         const msg=`طلب ${x.id} — خدمة جديدة: ${x.service} — ${x.customerName} — ${x.facility}`;
         setNoticeItems(n=>[msg,...n].slice(0,20));notifyOutside('Orkeit — طلب خدمة جديد',msg);
        });
       }
       previousRequests.current=Object.fromEntries(sorted.map(x=>[x.id,x.updatedAt]));
       if(firstRequestSnapshot.current){setNoticeItems(sorted.slice(0,12).map(x=>'طلب '+x.id+': '+x.status+' — '+x.customerName+' — '+x.facility));}
       firstRequestSnapshot.current=false;
      },e=>{
       console.error('Admin realtime error',e);
       const err=e as {code?:string;message?:string};
       setRequestSyncError(err.code||err.message||'تعذر الاتصال بطلبات العملاء');
       void refreshRequests();
      });
    }
   }catch(e){console.error(e);void refreshRequests()}
  })();return()=>{unsub?.()};},[]);
 useEffect(()=>{let cancelled=false;(async()=>{
   if(!firebaseConfigured){setCloudReady(false);return}
   try{
     const [cloudSites,cloudVisits,cloudMaintenance,cloudDelegates,cloudRequests]=await Promise.all([
       loadCloud<Site>('sites'),
       loadCloud<Visit>('visits'),
       loadCloud<Maintenance>('maintenance'),
       loadCloud<Delegate>('delegates'),
       loadCloud<ServiceRequest>('requests')
     ]);
     if(cancelled)return;

     const migrate = async <T extends {id:string}>(kind:'sites'|'visits'|'maintenance'|'delegates'|'requests', localKey:string, cloud:T[], local:T[], setState:(value:T[])=>void) => {
       if(cloud.length > 0){
         setState(cloud);
         save(localKey, cloud);
         return;
       }
       if(local.length > 0 && !localStorage.getItem('orkeit-firestore-migrated-'+kind)){
         await Promise.all(local.map(item => saveCloud(kind, item)));
         localStorage.setItem('orkeit-firestore-migrated-'+kind,'1');
         setState(local);
       } else {
         setState(cloud);
         save(localKey, cloud);
       }
     };

     await migrate('sites','/sites',cloudSites,sites,setSites);
     await migrate('visits','/visits',cloudVisits,visits,setVisits);
     await migrate('maintenance','/maintenance',cloudMaintenance,maintenance,setMaintenance);
     await migrate('delegates','/delegates',cloudDelegates,delegates,setDelegates);
     await migrate('requests','/requests',cloudRequests,requests,setRequests);
   }catch(err){
     console.error('Firebase load failed',err);
   }finally{
     if(!cancelled)setCloudReady(true);
   }
   })();return()=>{cancelled=true}},[]);
 const [page,setPage]=useState<'home'|'sites'|'visits'|'maintenance'|'delegates'|'requests'|'documents'|'invite'|'leads'>('home');
 const [requestSearch,setRequestSearch]=useState('');
 const [requestFilter,setRequestFilter]=useState('الكل');
 const [open,setOpen]=useState<string|null>(null),[menu,setMenu]=useState(false),[editing,setEditing]=useState<any>(null);
 const update=(setter:any,key:string,kind:'sites'|'visits'|'maintenance'|'delegates'|'requests'|'leads')=>(value:any)=>{
   setter(value);
   save(key,value);
   if(firebaseConfigured){
     const records=value as any[];
     void Promise.all(records.map(item=>saveCloud(kind,item))).catch(err=>console.error('Firebase save failed',err));
   }
 };
 const removeCloudRecord=(kind:'sites'|'visits'|'maintenance'|'delegates'|'requests'|'leads',id:string)=>{if(firebaseConfigured)void deleteCloud(kind,id).catch(err=>console.error('Firebase delete failed',err))};
 const setSitesSafe=update(setSites,'/sites','sites'),setVisitsSafe=update(setVisits,'/visits','visits'),setMaintenanceSafe=update(setMaintenance,'/maintenance','maintenance'),setDelegatesSafe=update(setDelegates,'/delegates','delegates'),setRequestsSafe=update(setRequests,'/requests','requests'),setLeadsSafe=update(setLeads,'/leads','leads');
 const expiryAlerts=useMemo(()=>{
   const alerts:string[]=[];
   sites.forEach(s=>{if(s.contractEnd){const d=daysUntil(s.contractEnd);const label=expiryLabel(d);if(label)alerts.push(`${label}: عقد ${s.facility||s.client} ينتهي في ${s.contractEnd}`)}});
   maintenance.forEach(m=>{if(m.expiryDate){const d=daysUntil(m.expiryDate);const label=expiryLabel(d);if(label)alerts.push(`${label}: صيانة طفايات ${sites.find(s=>s.id===m.siteId)?.facility||'منشأة'} تنتهي في ${m.expiryDate}`)}});
   return alerts;
 },[sites,maintenance]);
 const expiring=expiryAlerts.length;
 const nav=[['home','الرئيسية'],['leads','👤 عميل محتمل'],['sites','المواقع والمنشآت'],['visits','الزيارات'],['maintenance','صيانة الطفايات'],['delegates','المناديب'],['requests','طلبات العملاء'],['documents','إنشاء عقد ومشهد'],['invite','بوابة دعوة واتساب']] as const;
 const go=(p:any)=>{setPage(p);setMenu(false);setOpen(null);setEditing(null)};
 const add=(kind:string)=>{setEditing(null);setOpen(kind)};
 const remove=(kind:string,id:string)=>{if(!confirm('هل تريد حذف السجل؟'))return;if(kind==='site'){setSitesSafe(sites.filter(x=>x.id!==id));removeCloudRecord('sites',id)}if(kind==='visit'){setVisitsSafe(visits.filter(x=>x.id!==id));removeCloudRecord('visits',id)}if(kind==='maintenance'){setMaintenanceSafe(maintenance.filter(x=>x.id!==id));removeCloudRecord('maintenance',id)}if(kind==='delegate'){setDelegatesSafe(delegates.filter(x=>x.id!==id));removeCloudRecord('delegates',id)}};
 return <div className="app">
  <header><button className="menuBtn" onClick={()=>setMenu(!menu)}>☰</button><button type="button" className="logo logoButton" aria-label="الصفحة الرئيسية" onClick={()=>go("home")}><b>O</b><span><strong>ORKEIT</strong><small>زيارات الدفاع المدني</small></span></button><div className="headerTag">{firebaseConfigured&&cloudReady?"متصل بقاعدة البيانات":"وضع محلي — أكمل إعداد Firebase"}</div><NotificationBell items={[...noticeItems,...expiryAlerts]} title="تنبيهات النظام" onSelect={item=>{const id=item.match(/ORK-\d{4}-\d+/)?.[0];if(id){setRequestSearch(id);go('requests');}else if(item.includes('صيانة طفايات'))go('maintenance');else go('sites');}}/><button className="logout" onClick={onLogout}>خروج</button></header>
  {menu&&<><div className="backdrop" onClick={()=>setMenu(false)}/><aside>{nav.map(([k,l])=><button className={page===k?'active':''} key={k} onClick={()=>go(k)}>{l}</button>)}</aside></>}
  <main>
   {page==='documents'&&<DocumentsPage/>}
   {page==='invite'&&<WhatsAppInvitePage sites={sites}/>} 
   {page==='home'&&<><section className="hero"><div><p className="eyebrow">ORKEIT SAFETY • CONTROL CENTER</p><h1>إدارة زيارات الدفاع المدني</h1><p>لوحة تشغيل احترافية لمتابعة المنشآت والزيارات والصيانة وطلبات العملاء.</p></div><div className="heroActions"><button className="primary" onClick={()=>add('site')}>＋ إضافة منشأة</button><button className="heroGhost" onClick={()=>go('requests')}>طلبات العملاء</button></div></section><div className="stats"><Stat n={sites.length} t="المنشآت"/><Stat n={visits.length} t="الزيارات"/><Stat n={maintenance.length} t="الصيانة"/><Stat n={expiring} t="تنبيهات قريبة"/></div><section className="overviewGrid"><div className="panel"><div className="panelTitle"><h2>ملخص التشغيل</h2><span>مباشر</span></div><div className="miniStats"><div><strong>{requests.filter(x=>x.status==='جديد').length}</strong><small>طلبات جديدة</small></div><div><strong>{requests.filter(x=>x.status==='جاري التنفيذ').length}</strong><small>قيد التنفيذ</small></div><div><strong>{requests.filter(x=>x.status==='مكتمل').length}</strong><small>مكتملة</small></div></div></div><div className="panel"><div className="panelTitle"><h2>آخر الطلبات</h2><button className="textBtn" onClick={()=>go('requests')}>عرض الكل</button></div>{requests.slice(0,4).map(r=><button className="recentRequest" key={r.id} onClick={()=>go('requests')}><span><b>{r.service}</b><small>{r.customerName} • {r.facility}</small></span><em>{r.status}</em></button>)}{!requests.length&&<div className="emptyMini">لا توجد طلبات بعد.</div>}</div></section><section className="panel"><h2>الوصول السريع</h2><div className="quick">{nav.slice(1).map(([k,l])=><button key={k} onClick={()=>go(k)}>{l}<span>›</span></button>)}</div></section></>}
   {page==='leads'&&<ListPage title="العملاء المحتملون" add={()=>add('lead')}><div className="grid">{leads.map(l=><article className="card" key={l.id}><h3>{l.client}</h3><p>المنشأة: {l.facility}</p><p>الهاتف: {l.phone}</p><p>الموقع: {l.address}</p><div className="leadActions"><button type="button" className="primary" onClick={()=>{const digits=l.phone.replace(/[^0-9]/g,'');const wa=digits.startsWith('0')?'966'+digits.slice(1):digits;const message='السلام عليكم ورحمة الله وبركاته، معكم شركة أوريكيت للمقاولات العامة (Orkeit). نقدم خدمات السلامة والدفاع المدني، ومنها فحص وصيانة طفايات الحريق وأنظمة الإنذار والسلامة وزيارات الصيانة والمتابعة حسب احتياج منشأتكم. يسعدنا التواصل معكم لمعرفة احتياجكم وتقديم عرض مناسب. للتواصل: 0555334577';window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(message),'_blank')}}>مراسلة واتساب</button><button type="button" className="secondaryBtn" onClick={()=>{const site:Site={id:uid(),client:l.client,facility:l.facility,phone:l.phone,address:l.address,contractEnd:'',extCount:0};setSitesSafe([site,...sites]);setLeadsSafe(leads.filter(x=>x.id!==l.id));removeCloudRecord('leads',l.id);setPage('sites')}}>إضافة إلى المواقع والمنشآت</button><button type="button" className="delete" onClick={()=>{setLeadsSafe(leads.filter(x=>x.id!==l.id));removeCloudRecord('leads',l.id)}}>حذف</button></div></article>)}</div>{!leads.length&&<Empty/>}</ListPage>}\n   {page==='sites'&&<ListPage title="المواقع والمنشآت" add={()=>add('site')}><div className="grid">{sites.map(s=><Card key={s.id} title={s.facility||'منشأة'} lines={[s.client,s.phone,s.address,s.contractEnd?'انتهاء العقد: '+s.contractEnd:'']} badge={'الطفايات: '+s.extCount} edit={()=>{setEditing(s);setOpen('site')}} del={()=>remove('site',s.id)}/>)}</div>{!sites.length&&<Empty/>}</ListPage>}
   {page==='visits'&&<ListPage title="الزيارات" add={()=>add('visit')}><div className="grid">{visits.map(v=>{const s=sites.find(x=>x.id===v.siteId);return <Card key={v.id} title={s?.facility||'موقع محذوف'} lines={[v.date,v.status,v.notes]} del={()=>remove('visit',v.id)}/>})}</div>{!visits.length&&<Empty/>}</ListPage>}
   {page==='maintenance'&&<ListPage title="صيانة الطفايات" add={()=>add('maintenance')}><div className="grid">{maintenance.map(m=><Card key={m.id} title={m.client||sites.find(s=>s.id===m.siteId)?.facility||'منشأة'} lines={[m.client?'العميل: '+m.client:'',m.service,m.date,'الفني: '+m.technician]} badge={'العدد: '+m.count} del={()=>remove('maintenance',m.id)}/>)}</div>{!maintenance.length&&<Empty/>}</ListPage>}
{page==='requests'&&<ListPage title="طلبات العملاء" add={()=>{}}><div className="adminTools"><button className="secondaryBtn" onClick={()=>void activateAdminPush()}>{pushReady?'🔔 الإشعارات مفعلة':'🔕 تفعيل إشعارات الطلبات'}</button></div><div className="requestSyncBar"><span className={requestSyncError?'syncBad':'syncOk'}>{requestSyncError?'⚠ '+requestSyncError:'● الطلبات متزامنة مع Firebase'}</span><button className="secondaryBtn" onClick={()=>void refreshRequests()}>تحديث الآن</button></div><div className="requestToolbar"><input placeholder="بحث بالعميل أو المنشأة أو رقم الطلب..." value={requestSearch} onChange={e=>setRequestSearch(e.target.value)}/><select value={requestFilter} onChange={e=>setRequestFilter(e.target.value)}><option>الكل</option>{['جديد','قيد المراجعة','تم التسعير','تم اعتماد الطلب','جاري التنفيذ','مكتمل','مرفوض'].map(s=><option key={s}>{s}</option>)}</select><button className="secondaryBtn" onClick={()=>exportCsv('orkeit-service-requests.csv',[['رقم الطلب','العميل','الجوال','الخدمة','المنشأة','الحالة','تاريخ الإنشاء'],...requests.map(r=>[r.id,r.customerName,r.phone,r.service,r.facility,r.status,new Date(r.createdAt).toLocaleString('ar-SA')])])}>تصدير Excel/CSV</button></div><div className="grid">{requests.filter(r=>{const q=requestSearch.trim().toLowerCase();const hit=!q||[r.id,r.customerName,r.phone,r.service,r.facility,r.address].some(v=>String(v).toLowerCase().includes(q));return hit&&(requestFilter==='الكل'||r.status===requestFilter)}).sort((a,b)=>b.updatedAt-a.updatedAt).map(r=><RequestAdminCard key={r.id} request={r} onSave={x=>{setRequestsSafe(requests.map(q=>q.id===x.id?x:q))}} onDelete={()=>{setRequestsSafe(requests.filter(q=>q.id!==r.id));removeCloudRecord('requests',r.id)}}/>)}</div>{!requests.length&&<Empty/>}</ListPage>}
   {page==='delegates'&&<ListPage title="المناديب" add={()=>add('delegate')}><div className="grid">{delegates.map(d=><Card key={d.id} title={d.name} lines={[d.phone,d.active?'نشط':'موقوف']} del={()=>remove('delegate',d.id)}/>)}</div>{!delegates.length&&<Empty/>}</ListPage>}
  </main>
  {open==='lead'&&<LeadForm close={()=>setOpen(null)} onSave={x=>{setLeadsSafe([x,...leads.filter(l=>l.id!==x.id)]);setOpen(null)}}/>}\n  {open==='site'&&<SiteForm initial={editing} close={()=>setOpen(null)} onSave={x=>{setSitesSafe([x,...sites.filter(s=>s.id!==x.id)]);setOpen(null)}}/>}
  {open==='visit'&&<VisitForm sites={sites} initial={editing} close={()=>setOpen(null)} onSave={x=>{setVisitsSafe([x,...visits.filter(v=>v.id!==x.id)]);setOpen(null)}}/>}
  {open==='maintenance'&&<MaintenanceForm sites={sites} initial={editing} close={()=>setOpen(null)} onSave={x=>{setMaintenanceSafe([x,...maintenance.filter(m=>m.id!==x.id)]);setOpen(null)}}/>}
  {open==='delegate'&&<DelegateForm initial={editing} close={()=>setOpen(null)} onSave={x=>{setDelegatesSafe([x,...delegates.filter(d=>d.id!==x.id)]);setOpen(null)}}/>}
 </div>
}

function WhatsAppInvitePage({sites}:{sites:Site[]}){
 const [owner,setOwner]=useState('');
 const [facility,setFacility]=useState('');
 const [phone,setPhone]=useState('');
 const [address,setAddress]=useState('');
 const [services,setServices]=useState<string[]>(['صيانة طفايات الحريق','فحص وصيانة أنظمة الإنذار','عقود صيانة دورية']);
 const [custom,setCustom]=useState('');
 const [intro,setIntro]=useState('يسعدنا في شركة أوريكيت للمقاولات العامة أن نكون شريككم في السلامة والوقاية.');
 const serviceOptions=['صيانة وتعبئة طفايات الحريق','فحص وصيانة أنظمة الإنذار','صيانة مضخات وشبكات الحريق','عقود صيانة دورية لأنظمة السلامة','فحص مخارج الطوارئ ولوحات الإرشاد','تجهيز متطلبات السلامة والدفاع المدني'];
 useEffect(()=>{if(!facility.trim())return;const found=sites.find(s=>s.facility.trim()===facility.trim());if(found){if(!owner&&found.client)setOwner(found.client);if(!phone&&found.phone)setPhone(found.phone);if(!address&&found.address)setAddress(found.address)}},[facility,sites]);
 const message=()=>{const chosen=[...services,...(custom.trim()?[custom.trim()]:[])];return `✨ *دعوة خاصة من شركة أوريكيت للمقاولات العامة* ✨
 
الأستاذ/ ${owner.trim()||'صاحب المنشأة'} المحترم
🏢 *المنشأة:* ${facility.trim()||'منشأتكم الكريمة'}
📍 *الموقع:* ${address.trim()||'حسب موقع المنشأة'}
 
${intro.trim()}
 
🛡️ *خدماتنا لكم:*
${chosen.map(s=>'• '+s).join('\n')}
 
نحرص على مساعدتكم في رفع جاهزية معدات وأنظمة السلامة، وتنظيم أعمال الفحص والصيانة الدورية، ومتابعة الملاحظات والاحتياجات الفنية باحترافية، وفق نطاق الخدمة والاشتراطات المعمول بها.
 
📞 يسعدنا التواصل معكم لتحديد احتياجات المنشأة وتقديم عرض مناسب.
*شركة أوريكيت للمقاولات العامة – ORKEIT*
خدمات الدفاع المدني والسلامة
${address.trim()?'📍 '+address.trim():''}
 
*يسعدنا خدمتكم، ونتطلع إلى تعاون مثمر يحافظ على سلامتكم وسلامة منشأتكم.*`.trim()};
 const wa=()=>{const digits=phone.replace(/[^0-9]/g,'');const url='https://wa.me/'+digits+(digits?'?text=':'?text=')+encodeURIComponent(message());window.open(url,'_blank','noopener,noreferrer')};
 const copy=async()=>{try{await navigator.clipboard.writeText(message());alert('تم نسخ نص الدعوة، يمكنك لصقه في واتساب.')}catch{alert(message())}};
 return <section className="invitePage">
  <div className="hero inviteHero"><div><p className="eyebrow">ORKEIT • CUSTOMER INVITATION</p><h1>بوابة دعوة العملاء عبر واتساب</h1><p>أنشئ دعوة شخصية باسم صاحب المنشأة واسم المنشأة، مع عرض خدمات أوريكيت برسالة أنيقة وجاهزة للإرسال.</p></div></div>
  <div className="inviteLayout"><section className="panel inviteForm"><div className="panelTitle"><h2>بيانات الدعوة</h2><span>رسالة مخصصة</span></div>
   <label>اسم صاحب المنشأة<input value={owner} onChange={e=>setOwner(e.target.value)} placeholder="مثال: الأستاذ محمد أحمد"/></label>
   <label>اسم المنشأة<input list="orkeit-invite-sites" value={facility} onChange={e=>setFacility(e.target.value)} placeholder="اسم المؤسسة أو الشركة"/><datalist id="orkeit-invite-sites">{sites.map(s=><option key={s.id} value={s.facility}>{s.client}</option>)}</datalist></label>
   <label>رقم واتساب<input inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="9665xxxxxxxx"/></label>
   <label>موقع المنشأة<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="المدينة أو الحي (اختياري)"/></label>
   <label>مقدمة الدعوة<textarea rows={3} value={intro} onChange={e=>setIntro(e.target.value)}/></label>
   <div className="formSectionTitle">اختر الخدمات التي تريد عرضها</div>
   <div className="inviteServices">{serviceOptions.map(s=><label key={s}><input type="checkbox" checked={services.includes(s)} onChange={e=>setServices(prev=>e.target.checked?[...prev,s]:prev.filter(x=>x!==s))}/><span>{s}</span></label>)}</div>
   <label>خدمة إضافية (اختياري)<input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="أضف خدمة أخرى"/></label>
   <div className="inviteActions"><button className="primary wide" type="button" onClick={wa}>🟢 فتح واتساب وإرسال الدعوة</button><button className="secondaryBtn wide" type="button" onClick={()=>void copy()}>نسخ نص الدعوة</button></div>
   <small className="muted">يفتح واتساب برسالة جاهزة للمراجعة والإرسال؛ لن تُرسل الرسالة تلقائيًا دون موافقتك.</small>
  </section><section className="panel invitePreview"><div className="panelTitle"><h2>معاينة الرسالة</h2><span>WhatsApp</span></div><div className="inviteMessage" dir="rtl">{message().split('\n').map((line,i)=><p key={i}>{line||' '}</p>)}</div></section></div>
 </section>
}

function DocumentsPage(){
 const [kind,setKind]=useState<'contract'|'scene'|null>(null);
 const [stamp,setStamp]=useState<'company'|'inspection'|'approved'>('company');
 const [form,setForm]=useState({
  client:'',facility:'',phone:'',address:'',start:new Date().toISOString().slice(0,10),end:'',
  unified:'',contractNo:'ORK-CON-'+new Date().getFullYear()+'-'+Math.floor(100000+Math.random()*900000),
  price:'',payment:'',frequency:'ربع سنوي',response:'24 ساعة',equipment:'',inspector:'',
  visitType:'زيارة وفحص دوري',observations:'',recommendations:'',compliance:'تمت المعاينة وتسجيل الحالة',
  scope:'فحص وصيانة أنظمة ومعدات السلامة والدفاع المدني',notes:''
 });
 const update=(k:keyof typeof form,v:string)=>setForm(x=>({...x,[k]:v}));
 const print=()=>window.print();
 const reset=()=>{setKind(null);setForm(x=>({...x,contractNo:'ORK-CON-'+new Date().getFullYear()+'-'+Math.floor(100000+Math.random()*900000)}))};
 return <section className="documentsPage">
  <div className="pageTitle"><div><h1>إنشاء عقد ومشهد</h1><p className="docHint">مولد مستندات Orkeit الرسمي — ترويسة، ختم، بيانات منشأة، بنود وتفاصيل قابلة للطباعة.</p></div></div>
  {!kind?<div className="documentChoices">
   <button className="documentChoice" onClick={()=>setKind('contract')}><span>📄</span><strong>إنشاء عقد صيانة</strong><small>عقد كامل ببيانات العميل والمدة ونطاق العمل والأسعار والبنود والتوقيعات والأختام.</small></button>
   <button className="documentChoice" onClick={()=>setKind('scene')}><span>🛡️</span><strong>إنشاء مشهد سلامة</strong><small>مشهد زيارة وفحص مع حالة الأنظمة والملاحظات والتوصيات وخانات التوقيع والختم.</small></button>
  </div>:
  <><div className="documentEditor">
   <div className="panel"><div className="panelTitle"><h2>{kind==='contract'?'بيانات عقد الصيانة':'بيانات مشهد السلامة'}</h2><button className="textBtn" type="button" onClick={reset}>← اختيار المستند</button></div>
    <form className="docForm">
     <div className="formSectionTitle">بيانات العميل والمنشأة</div>
     <Input label="اسم العميل" value={form.client} onChange={v=>update('client',v)} required/>
     <Input label="اسم المنشأة" value={form.facility} onChange={v=>update('facility',v)} required/>
     <Input label="رقم الجوال" value={form.phone} onChange={v=>update('phone',v)}/>
     <Input label="العنوان / الموقع" value={form.address} onChange={v=>update('address',v)}/>
     <Input label="الرقم الموحد" value={form.unified} onChange={v=>update('unified',v)} placeholder="أدخل الرقم الموحد للمنشأة"/>
     <Input label="رقم المستند" value={form.contractNo} onChange={()=>{}}/>
     <div className="twoInputs"><Input label="تاريخ المستند" value={form.start} onChange={v=>update('start',v)} type="date"/><Input label={kind==='contract'?'تاريخ نهاية العقد':'تاريخ الزيارة'} value={form.end} onChange={v=>update('end',v)} type="date"/></div>
     {kind==='contract'?<><div className="formSectionTitle">تفاصيل العقد</div>
      <Input label="نطاق الأعمال" value={form.scope} onChange={v=>update('scope',v)}/>
      <div className="twoInputs"><Input label="قيمة العقد" value={form.price} onChange={v=>update('price',v)} placeholder="مثال: 5,000 ريال"/><Input label="طريقة السداد" value={form.payment} onChange={v=>update('payment',v)} placeholder="دفعة مقدمة / شهري / سنوي"/></div>
      <div className="twoInputs"><Input label="دورية الزيارة" value={form.frequency} onChange={v=>update('frequency',v)}/><Input label="زمن الاستجابة" value={form.response} onChange={v=>update('response',v)}/></div>
      <Input label="المعدات / الأنظمة المشمولة" value={form.equipment} onChange={v=>update('equipment',v)} placeholder="إنذار، طفايات، مضخات، رشاشات..."/>
     </>:<><div className="formSectionTitle">تفاصيل المشهد والفحص</div>
      <div className="twoInputs"><Input label="نوع الزيارة" value={form.visitType} onChange={v=>update('visitType',v)}/><Input label="اسم المفتش / الفني" value={form.inspector} onChange={v=>update('inspector',v)}/></div>
      <Input label="حالة الأنظمة / المعدات" value={form.compliance} onChange={v=>update('compliance',v)}/>
      <label>الملاحظات<textarea value={form.observations} onChange={e=>update('observations',e.target.value)} rows={4} placeholder="اكتب نتائج المعاينة والملاحظات..."/></label>
      <label>التوصيات والإجراءات المطلوبة<textarea value={form.recommendations} onChange={e=>update('recommendations',e.target.value)} rows={4} placeholder="اكتب التوصيات أو الأعمال المطلوب تنفيذها..."/></label>
     </>}
     <div className="formSectionTitle">الختم والتذييل</div>
     <label>نوع الختم<select value={stamp} onChange={e=>setStamp(e.target.value as typeof stamp)}><option value="company">ختم ORKEIT</option><option value="inspection">ختم تمت المعاينة</option><option value="approved">ختم الشركة / توقيع</option></select></label>
     <label>ملاحظات إضافية<textarea value={form.notes} onChange={e=>update('notes',e.target.value)} rows={3}/></label>
     <button type="button" className="primary wide" onClick={print}>🖨️ معاينة وطباعة / حفظ PDF</button>
    </form>
   </div>
   <DocumentPaper kind={kind} form={form} stamp={stamp}/>
  </div></>}
 </section>;
}
const contractClauses=[
 'يُعد هذا العقد اتفاقاً بين شركة اوريكيت للمقاولات العامة والطرف الثاني الموضح في بيانات العقد لتنفيذ نطاق الأعمال المتفق عليه.',
 'يلتزم الطرفان بصحة البيانات والمعلومات والمستندات المقدمة عند إبرام العقد.',
 'يشمل نطاق العقد أعمال الفحص والصيانة الوقائية والتصحيحية للأنظمة والمعدات المحددة في العقد فقط.',
 'تُنفذ الأعمال وفق التعليمات الفنية المعتمدة والاشتراطات النظامية ذات العلاقة ومتطلبات السلامة المطبقة على الموقع.',
 'تحدد دورية الزيارات حسب البيانات المدخلة في العقد، ويجوز تنسيق مواعيد إضافية عند الحاجة.',
 'يلتزم العميل بتمكين فريق Orkeit من دخول الموقع والوصول إلى الأنظمة والمعدات المطلوب فحصها.',
 'يلتزم العميل بإبلاغ الشركة بأي أعطال أو بلاغات أو تغييرات مؤثرة على أنظمة السلامة بالموقع.',
 'تُسجل نتائج الفحص والملاحظات والإجراءات المنفذة في محاضر أو تقارير الزيارة عند الحاجة.',
 'الأعمال الإضافية أو قطع الغيار أو الاستبدالات غير المشمولة في نطاق العقد تحتاج إلى اعتماد مستقل من العميل.',
 'تكون قيمة العقد وطريقة السداد وفق البيانات المثبتة في هذا المستند وأي عرض سعر أو ملحق معتمد.',
 'في حال تأخر السداد، يحق للشركة تعليق الأعمال غير الطارئة بعد إشعار العميل، مع مراعاة الأعمال اللازمة للسلامة بحسب الحالة.',
 'تلتزم الشركة بالمحافظة على سرية بيانات الموقع والمعلومات التي تطلع عليها أثناء تنفيذ الأعمال، في حدود ما يسمح به النظام.',
 'لا تتحمل الشركة مسؤولية الأعطال الناتجة عن سوء الاستخدام أو التعديلات غير المعتمدة أو العبث بالمعدات أو الحوادث الخارجة عن نطاق الصيانة.',
 'لا يشمل العقد الأعمال المدنية أو الكهربائية الرئيسية أو التعديلات الإنشائية إلا إذا نص عليها صراحة في عرض أو ملحق مستقل.',
 'تحدد قطع الغيار والمواد المطلوبة وفق نتائج الفحص وحالة المعدات، ويجوز تقديم عرض مستقل لها.',
 'يجب على العميل توفير بيئة عمل آمنة لفريق الصيانة وإبلاغه بالمخاطر المعروفة في الموقع.',
 'تُعتمد أي تعديلات على نطاق العقد أو مدته أو قيمته كتابةً من الطرفين.',
 'يجوز لأي طرف طلب إنهاء العقد وفق ما يتم الاتفاق عليه كتابياً، مع تسوية الأعمال والمستحقات المنفذة حتى تاريخ الإنهاء.',
 'تُحل الملاحظات والنزاعات المتعلقة بتنفيذ العقد ودياً أولاً، ثم وفق الأنظمة والجهات المختصة في المملكة العربية السعودية.',
 'يمثل هذا المستند وملحقاته المعتمدة كامل نطاق الاتفاق فيما يتعلق بالأعمال الموضحة فيه، وأي إضافة لاحقة يجب توثيقها واعتمادها.'
];
function DocumentPaper({kind,form,stamp}:{kind:'contract'|'scene';form:any;stamp:'company'|'inspection'|'approved'}){
 const title=kind==='contract'?'عقد صيانة أنظمة السلامة والدفاع المدني':'مشهد سلامة وفحص للمنشأة';
 const stampText=stamp==='company'?'ختم ORKEIT':stamp==='inspection'?'تمت المعاينة':'ORKEIT';
 return <div className="documentPaper">
  <div className="officialLetterhead">
   <div className="officialArabic"><strong>شركة أوريكيت</strong><b>للمقاولات العامة</b><span>الرقم الموحد: 754857775</span></div>
   <div className="officialLogo"><div className="officialLogoMark">O</div><strong>أوريكيت</strong><small>ORKIT</small></div>
   <div className="officialEnglish"><strong>ORKIT COMPANY</strong><b>For General Contracting</b><span>Unified No. 754857775</span></div>
  </div>
  <div className="officialLine"/>
  <div className="paperRule"/><div className="paperTitle"><h1>{title}</h1><div className="documentNumberLine"><b>رقم المستند:</b> {form.contractNo} &nbsp; | &nbsp; <b>التاريخ:</b> {form.start||'................'} &nbsp; | &nbsp; <b>{kind==='contract'?'مدة السريان حتى':'تاريخ الزيارة'}:</b> {form.end||'................'}</div></div>
  <div className="infoGrid"><div><b>العميل</b><span>{form.client||'................................'}</span></div><div><b>المنشأة</b><span>{form.facility||'................................'}</span></div><div><b>الجوال</b><span>{form.phone||'................................'}</span></div><div><b>الموقع</b><span>{form.address||'................................'}</span></div></div>
  {kind==='contract'?<div className="paperBody">
   <h3>أولاً: نطاق العقد</h3><p>{form.scope}</p>
   <h3>ثانياً: بيانات التنفيذ</h3><div className="detailsTable"><div><b>قيمة العقد</b><span>{form.price||'حسب العرض المعتمد'}</span></div><div><b>السداد</b><span>{form.payment||'حسب الاتفاق'}</span></div><div><b>دورية الزيارة</b><span>{form.frequency}</span></div><div><b>زمن الاستجابة</b><span>{form.response}</span></div><div><b>الأنظمة والمعدات</b><span>{form.equipment||'وفق نطاق العمل والتقرير الفني'}</span></div></div>
   <h3>ثالثاً: بنود وشروط العقد</h3><ol className="clauses">{contractClauses.map((x,i)=><li key={i}>{x}</li>)}</ol>
  </div>:<div className="paperBody">
   <h3>بيانات الزيارة</h3><div className="detailsTable"><div><b>نوع الزيارة</b><span>{form.visitType}</span></div><div><b>الفني / المفتش</b><span>{form.inspector||'................................'}</span></div><div><b>حالة الأنظمة</b><span>{form.compliance}</span></div></div>
   <h3>الأعمال والمعاينة</h3><p>تمت زيارة المنشأة الموضحة أعلاه لغرض الفحص والمعاينة وتقييم حالة أنظمة ومعدات السلامة والدفاع المدني ضمن نطاق الزيارة.</p>
   <h3>الملاحظات</h3><div className="sceneBox">{form.observations||'لا توجد ملاحظات مسجلة.'}</div>
   <h3>التوصيات والإجراءات المطلوبة</h3><div className="sceneBox">{form.recommendations||'لا توجد توصيات إضافية.'}</div>
  </div>}
  <div className="paperExtra"><b>ملاحظات إضافية:</b> {form.notes||'لا توجد ملاحظات إضافية.'}</div>
  <div className="paperSign"><div><b>العميل / المسؤول</b><span>الاسم: __________________</span><span>التوقيع: ________________</span></div><div className="officialStamp"><span>شركة أوريكيت</span><strong>{stampText}</strong><b>للمقاولات العامة</b><small>ORKIT</small></div><div><b>شركة اوريكيت</b><span>{kind==='scene'?'الفني / المفتش':'المسؤول المعتمد'}</span><span>التوقيع: ________________</span></div></div>
  <div className="paperFooter">شركة اوريكيت للمقاولات العامة • حي الضيافة • 0533137140 • الرقم الموحد: {form.unified||'—'}</div>
 </div>;
}
function RequestAdminCard({request,onSave,onDelete}:{request:ServiceRequest;onSave:(x:ServiceRequest)=>void;onDelete:()=>void}){
 const statuses=['جديد','قيد المراجعة','تم التسعير','تم اعتماد الطلب','جاري التنفيذ','مكتمل','مرفوض'];
 const [status,setStatus]=useState(request.status),[note,setNote]=useState(request.note),[saved,setSaved]=useState('');
 const saveIt=async()=>{const x={...request,status,note,updatedAt:Date.now()};onSave(x);try{if(firebaseConfigured)await saveCloud('requests',x);setSaved('تم التحديث بنجاح');void sendPush({userId:request.customerId},'Orkeit — تحديث طلبك',`تم تحديث الطلب ${request.id}: ${status}`,{requestId:request.id,status});}catch(e){console.error(e);setSaved('تم التحديث محليًا، تعذرت المزامنة');}};
 return <article className="card requestAdmin"><h3>{request.service}</h3><p><b>رقم الطلب:</b> {request.id}</p><p><b>العميل:</b> {request.customerName} · {request.phone}</p><label>حالة الطلب<select value={status} onChange={e=>{setStatus(e.target.value);setSaved('')}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>ملاحظة للعميل<textarea value={note} onChange={e=>{setNote(e.target.value);setSaved('')}} rows={3}/></label><button className="primary wide" onClick={()=>void saveIt()}>تحديث حالة الطلب</button>{saved&&<p className={saved.includes('بنجاح')?'saveSuccess':'saveWarning'} role="status">✓ {saved}</p>}<button className="delete" onClick={onDelete}>حذف الطلب</button></article>
}
function Stat({n,t}:{n:number;t:string}){return <div className="stat"><strong>{n}</strong><span>{t}</span></div>}
function ListPage({title,add,children}:{title:string;add:()=>void;children:any}){return <section><div className="pageTitle"><h1>{title}</h1><button className="primary" onClick={add}>＋ إضافة</button></div>{children}</section>}
function Card({title,lines,badge,del,edit}:{title:string;lines:string[];badge?:string;del:()=>void;edit?:()=>void}){return <article className="card"><h3>{title}</h3>{lines.filter(Boolean).map((x,i)=><p key={i}>{x}</p>)}{badge&&<span className="badge">{badge}</span>}{edit&&<button type="button" className="secondaryBtn" onClick={edit}>✏️ تعديل</button>}<button className="delete" onClick={del}>حذف</button></article>}
function Empty(){return <div className="empty">لا توجد سجلات حتى الآن.</div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:any}){return <div className="modalBg"><div className="modal"><div className="modalHead"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>}
function Input({label,value,onChange,type='text',required=false,placeholder}:{label:string;value:any;onChange:(v:string)=>void;type?:string;required?:boolean;placeholder?:string}){return <label>{label}<input type={type} value={value??''} onChange={e=>onChange(e.target.value)} required={required} placeholder={placeholder}/></label>}
function SiteForm({initial,close,onSave}:{initial?:Site|null;close:()=>void;onSave:(x:Site)=>void}){const [x,setX]=useState<Site>(initial||{id:uid(),client:'',facility:'',phone:'',address:'',contractEnd:'',extCount:0});return <Modal title={initial?'تعديل بيانات المنشأة':'إضافة منشأة'} close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,extCount:Number(x.extCount||0)})}}><Input label="اسم العميل" value={x.client} onChange={v=>setX({...x,client:v})} required/><Input label="اسم المنشأة" value={x.facility} onChange={v=>setX({...x,facility:v})} required/><Input label="رقم الجوال" value={x.phone} onChange={v=>setX({...x,phone:v})}/><Input label="العنوان" value={x.address} onChange={v=>setX({...x,address:v})}/><Input label="تاريخ انتهاء العقد" value={x.contractEnd} onChange={v=>setX({...x,contractEnd:v})} type="date"/><Input label="عدد الطفايات" value={x.extCount} onChange={v=>setX({...x,extCount:v as any})} type="number"/><button className="primary wide">حفظ المنشأة</button></form></Modal>}
function LeadForm({close,onSave}:{close:()=>void;onSave:(x:Lead)=>void}){const [x,setX]=useState<Lead>({id:uid(),client:'',facility:'',phone:'',address:'',createdAt:Date.now()});return <Modal title="إضافة عميل محتمل" close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,createdAt:Date.now()})}}><Input label="اسم العميل" value={x.client} onChange={v=>setX({...x,client:v})} required/><Input label="اسم المنشأة" value={x.facility} onChange={v=>setX({...x,facility:v})} required/><Input label="رقم الهاتف / واتساب" value={x.phone} onChange={v=>setX({...x,phone:v})} required/><Input label="الموقع / العنوان" value={x.address} onChange={v=>setX({...x,address:v})} required/><button className="primary wide">حفظ العميل المحتمل</button></form></Modal>}\nfunction VisitForm({sites,initial,close,onSave}:{sites:Site[];initial?:Visit|null;close:()=>void;onSave:(x:Visit)=>void}){const [x,setX]=useState<Visit>(initial||{id:uid(),siteId:sites[0]?.id||'',date:new Date().toISOString().slice(0,10),status:'مجدولة',notes:''});return <Modal title="تسجيل زيارة" close={close}><form onSubmit={e=>{e.preventDefault();onSave(x)}}><label>المنشأة<select value={x.siteId} onChange={e=>setX({...x,siteId:e.target.value})}>{sites.map(s=><option key={s.id} value={s.id}>{s.facility}</option>)}</select></label><Input label="التاريخ" value={x.date} onChange={v=>setX({...x,date:v})} type="date" required/><Input label="الحالة" value={x.status} onChange={v=>setX({...x,status:v})}/><Input label="ملاحظات" value={x.notes} onChange={v=>setX({...x,notes:v})}/><button className="primary wide" disabled={!sites.length}>حفظ الزيارة</button></form></Modal>}
function MaintenanceForm({sites,initial,close,onSave}:{sites:Site[];initial?:Maintenance|null;close:()=>void;onSave:(x:Maintenance)=>void}){const [x,setX]=useState<Maintenance>(initial||{id:uid(),siteId:sites[0]?.id||'',client:'',date:new Date().toISOString().slice(0,10),expiryDate:'',service:'فحص وصيانة الطفايات',count:1,technician:''});return <Modal title="تسجيل صيانة" close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,client:x.client?.trim()||'',count:Number(x.count||0)})}}><Input label="اسم العميل" value={x.client||''} onChange={v=>setX({...x,client:v})} required/><label>المنشأة<select value={x.siteId} onChange={e=>setX({...x,siteId:e.target.value})}>{sites.map(s=><option key={s.id} value={s.id}>{s.facility}</option>)}</select></label><Input label="الخدمة" value={x.service} onChange={v=>setX({...x,service:v})}/><Input label="التاريخ" value={x.date} onChange={v=>setX({...x,date:v})} type="date"/><Input label="تاريخ انتهاء الصيانة" value={x.expiryDate} onChange={v=>setX({...x,expiryDate:v})} type="date"/><Input label="عدد الطفايات" value={x.count} onChange={v=>setX({...x,count:v as any})} type="number"/><Input label="اسم الفني" value={x.technician} onChange={v=>setX({...x,technician:v})}/><button className="primary wide">حفظ</button></form></Modal>}
function DelegateForm({initial,close,onSave}:{initial?:Delegate|null;close:()=>void;onSave:(x:Delegate)=>void}){const [x,setX]=useState<Delegate>(initial||{id:uid(),name:'',phone:'',password:'',active:true});return <Modal title="إضافة مندوب" close={close}><form onSubmit={e=>{e.preventDefault();onSave(x)}}><Input label="اسم المندوب" value={x.name} onChange={v=>setX({...x,name:v})} required/><Input label="رقم الجوال (اسم الدخول)" value={x.phone} onChange={v=>setX({...x,phone:v})} required/><Input label="كلمة مرور المندوب" value={x.password} onChange={v=>setX({...x,password:v})} required/><label>الحالة<select value={x.active?'active':'inactive'} onChange={e=>setX({...x,active:e.target.value==='active'})}><option value="active">نشط</option><option value="inactive">موقوف</option></select></label><button className="primary wide">حفظ المندوب</button></form></Modal>}
