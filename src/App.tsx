/// <reference types="react" />
import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { deleteCloud, firebaseConfigured, loadCloud, saveCloud, subscribeCloud } from './cloudStore';
import { enablePush, sendPush, startForegroundPushListener, unlockNotificationSound, playNotificationSound } from './push';
import AdminSearch from './AdminSearch';
import DocumentArchive from './DocumentArchive';
import AdminReports from './AdminReports';

type Site={id:string;client:string;facility:string;phone:string;address:string;contractEnd:string;extCount:number;email?:string;unified?:string;license?:string;notes?:string};
type ContractRecord={id:string;siteId?:string;facility?:string;client?:string;contractNo?:string;startDate?:string;endDate?:string;status?:string;value?:string;scope?:string;updatedAt?:number};
type Visit={id:string;siteId:string;date:string;status:string;notes:string;delegateId?:string};
type Maintenance={id:string;siteId:string;client?:string;date:string;expiryDate:string;service:string;count:number;technician:string;delegateId?:string};
type Delegate={id:string;name:string;phone:string;password:string;active:boolean};
type ServiceRequest={id:string;customerId:string;customerName:string;phone:string;service:string;facility:string;address:string;status:string;note:string;createdAt:number;updatedAt:number};
type CustomerRecord={id:string;name:string;phone:string;facility:string;address:string;updatedAt:number};
type Lead={id:string;client:string;facility:string;phone:string;address:string;createdAt:number};
type NotificationRecord={id:string;recipientType:'admin'|'customer';recipientId?:string;title:string;body:string;type:'new-request'|'status-change'|'expiry'|'system';createdAt:number;read:boolean;relatedId?:string};

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
function NotificationBell({items,title='الإشعارات',onSelect,onRead,onMarkAllRead}:{items:Array<string|NotificationRecord>;title?:string;onSelect?:(item:string)=>void;onRead?:(item:NotificationRecord)=>void;onMarkAllRead?:()=>void}){
 const [open,setOpen]=useState(false);
 const unread=items.filter(x=>typeof x!=='string'&&!x.read).length;
 return <div className="notificationWrap">
   <button type="button" className="notificationBell" onClick={()=>{unlockNotificationSound();setOpen(!open);void requestNotificationPermission()}} aria-label={title}>🔔{unread>0&&<span>{unread>99?'99+':unread}</span>}</button>
   {open&&<div className="notificationPanel"><div className="notificationHead"><strong>{title}</strong><div className="notificationHeadActions">{unread>0&&onMarkAllRead&&<button type="button" onClick={onMarkAllRead}>قراءة الكل</button>}<button type="button" onClick={()=>setOpen(false)}>×</button></div></div>{items.length?<>{items.slice(0,20).map((x,i)=>{const record:NotificationRecord|null=typeof x==='string'?null:x;const text:string=record?`${record.title}: ${record.body}`:String(x);return <button type="button" className={'notificationItem notificationItemButton'+(record&&!record.read?' notificationUnread':'')} key={record?.id||i} onClick={()=>{setOpen(false);if(record)onRead?.(record);onSelect?.(text)}}><span className="notificationItemText">{record?'🔔':'⚠️'} {text}</span><span className="notificationOpenHint">فتح ←</span><small>{record?new Date(record.createdAt).toLocaleString('ar-SA',{dateStyle:'short',timeStyle:'short'}):''}</small></button>})}</>:<div className="empty">لا توجد إشعارات.</div>}<small>إشعارات الهاتف تحتاج إلى السماح بها من إعدادات الجهاز.</small></div>}
 </div>
}


type MessageRecord={id:string;threadId:string;senderType:'admin'|'customer'|'delegate';senderId:string;senderName:string;recipientType:'admin'|'customer'|'delegate';recipientId:string;recipientName:string;body:string;createdAt:number;read:boolean};
type MessageContact={id:string;threadId:string;kind:'customer'|'delegate';name:string;phone?:string;facility?:string};

function MessageCenter({role,userId,userName,contacts=[]}:{role:'admin'|'customer'|'delegate';userId:string;userName:string;contacts?:MessageContact[]}){
 const [records,setRecords]=useState<MessageRecord[]>([]);
 const [selected,setSelected]=useState(contacts[0]?.threadId||'');
 const [body,setBody]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{if(role==='admin'&&contacts.length&&!contacts.some(c=>c.threadId===selected))setSelected(contacts[0].threadId)},[role,contacts,selected]);
 useEffect(()=>{let stopped=false;let unsub:(()=>void)|undefined;void subscribeCloud<MessageRecord>('messages',all=>{if(!stopped)setRecords(all.sort((a,b)=>a.createdAt-b.createdAt))},e=>{console.error('Message subscription failed',e);if(!stopped)setError('تعذر تحميل المحادثات. تحقق من اتصال قاعدة البيانات.')}).then(fn=>{if(stopped)fn();else unsub=fn});return()=>{stopped=true;unsub?.()}},[]);
 const threadId=role==='admin'?selected:`${role}:${userId}`;
 const current=records.filter(m=>m.threadId===threadId);
 const contact=contacts.find(c=>c.threadId===selected);
 const send=async(e:FormEvent)=>{e.preventDefault();const text=body.trim();if(!text||!threadId||busy)return;setBusy(true);setError('');const recipientType=role==='admin'?(contact?.kind||'customer'):'admin';const recipientId=role==='admin'?(contact?.id||''):'admin';const recipientName=role==='admin'?(contact?.name||''):'الإدارة';const msg:MessageRecord={id:uid(),threadId,senderType:role,senderId:userId,senderName:userName,recipientType,recipientId,recipientName,body:text,createdAt:Date.now(),read:false};setRecords(prev=>[...prev,msg]);setBody('');try{await saveCloud('messages',msg)}catch(e){console.error('Message send failed',e);setRecords(prev=>prev.filter(m=>m.id!==msg.id));setBody(text);setError('تعذر إرسال الرسالة. تحقق من الاتصال والصلاحيات ثم أعد المحاولة.')}finally{setBusy(false)}};
 const unread=role==='admin'?records.filter(m=>m.recipientType==='admin'&&!m.read).length:current.filter(m=>m.recipientId===userId&&!m.read).length;
 return <section className="panel messageCenter" dir="rtl"><div className="panelTitle"><div><h2>{role==='admin'?'مركز الرسائل':'الرسائل مع الإدارة'}</h2><small>{role==='admin'?'مراسلة العملاء والمناديب من داخل التطبيق':'يمكنك إرسال رسالة والرد على الإدارة'}</small></div><span>{unread?unread+' غير مقروءة':'محادثات مباشرة'}</span></div>{role==='admin'&&<label className="messageContactLabel">اختر العميل أو المندوب<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">اختر محادثة</option>{contacts.map(c=><option key={c.threadId} value={c.threadId}>{c.kind==='delegate'?'مندوب':'عميل'}: {c.name}{c.facility?' — '+c.facility:''}{records.some(m=>m.threadId===c.threadId&&m.recipientType==='admin'&&!m.read)?' • رسالة جديدة':''}</option>)}</select></label>}{role==='admin'&&!contact?<div className="emptyMini">أضف طلب عميل أو مندوبًا أولًا لبدء محادثة.</div>:<><div className="messageHistory" aria-live="polite">{current.map(m=><article key={m.id} className={'messageBubble '+(m.senderType===role?'messageMine':'messageTheirs')}><div className="messageSender">{m.senderName||'مستخدم'}</div><p>{m.body}</p><time>{new Date(m.createdAt).toLocaleString('ar-SA',{dateStyle:'short',timeStyle:'short'})}</time></article>)}{!current.length&&<div className="emptyMini">لا توجد رسائل في هذه المحادثة بعد.</div>}</div><form className="messageComposer" onSubmit={send}><textarea rows={2} maxLength={2000} value={body} onChange={e=>setBody(e.target.value)} placeholder="اكتب رسالتك هنا..." required/><button className="primary" disabled={busy||!body.trim()}>{busy?'جارٍ الإرسال…':'إرسال الرسالة'}</button></form></>}{error&&<p className="error">{error}</p>}</section>
}



export default function App(){
 const [loggedIn,setLoggedIn]=useState(()=>localStorage.getItem(AUTH_KEY)==='1');
 const [customerPortal,setCustomerPortal]=useState(false);
 const [delegateUser,setDelegateUser]=useState<Delegate|null>(()=>{try{return JSON.parse(localStorage.getItem('orkeit-delegate-auth')||'null')}catch{return null}});
 if(customerPortal) return <CustomerPortal onBack={()=>setCustomerPortal(false)}/>;
 if(delegateUser) return <DelegatePortal delegate={delegateUser} onLogout={()=>{localStorage.removeItem('orkeit-delegate-auth');setDelegateUser(null)}}/>;
 if(!loggedIn) return <Login onLogin={()=>setLoggedIn(true)} onCustomer={()=>setCustomerPortal(true)} onCustomerLogin={u=>{localStorage.setItem(CUSTOMER_AUTH_KEY,JSON.stringify(u));setCustomerPortal(true)}} onDelegate={d=>{localStorage.setItem('orkeit-delegate-auth',JSON.stringify(d));setDelegateUser(d)}}/>;
 return <Dashboard onLogout={()=>{localStorage.removeItem(AUTH_KEY);setLoggedIn(false)}}/>;
}
function Login({onLogin,onCustomer,onCustomerLogin,onDelegate}:{onLogin:()=>void;onCustomer:()=>void;onCustomerLogin:(u:any)=>void;onDelegate?:(d:Delegate)=>void}){
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const normalize=(value:string)=>value.trim().replace(/\\s+/g,'').replace(/[()\\-]/g,'');
 const submit=async(e:FormEvent)=>{
  e.preventDefault();setError('');
  const enteredUser=normalize(username);
  if(enteredUser===USERNAME&&password===PASSWORD){localStorage.setItem(AUTH_KEY,'1');onLogin();return;}
  setBusy(true);
  try{
   const localDelegates=load<Delegate[]>('/delegates',[]);
   let delegates=localDelegates;
   if(firebaseConfigured){try{delegates=await loadCloud<Delegate>('delegates')}catch{delegates=localDelegates}}
   const delegate=delegates.find(d=>d.active&&normalize(d.phone)===enteredUser&&d.password===password);
   if(delegate){if(onDelegate)onDelegate(delegate);else setError('تعذر فتح حساب المندوب.');return;}
   let customers:any[]=[];
   try{customers=JSON.parse(localStorage.getItem(CUSTOMER_ACCOUNTS_KEY)||'[]')}catch{customers=[]}
   const customer=customers.find(u=>normalize(String(u.phone||''))===enteredUser&&u.password===password);
   if(customer){onCustomerLogin({id:customer.id,name:customer.name,phone:customer.phone});return;}
   setError('اسم المستخدم أو رقم الجوال أو كلمة المرور غير صحيحة، أو أن الحساب موقوف.');
  }catch(err){console.error('Unified login failed',err);setError('تعذر التحقق من الحساب. تحقق من الاتصال ثم حاول مرة أخرى.');}
  finally{setBusy(false);}
 };
 return <div className="loginPage"><div className="loginCard"><div className="loginLogo">O</div><p className="eyebrow">ORKEIT SAFETY</p><h1>تسجيل الدخول</h1><p className="loginHint">أدخل اسم المستخدم أو رقم الجوال، وسيتعرف النظام تلقائيًا على نوع حسابك.</p><form onSubmit={submit}><label>اسم المستخدم / رقم الجوال<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/></label><label>كلمة المرور<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="error">{error}</div>}<button className="primary wide" disabled={busy}>{busy?'جارٍ التحقق من الحساب...':'دخول'}</button></form><div className="customerGate"><span>عميل جديد أو تريد طلب خدمة؟</span><button type="button" className="customerButton" onClick={onCustomer}>اطلب خدمة</button></div></div></div>;
}
function DelegatePortal({delegate,onLogout}:{delegate:Delegate;onLogout:()=>void}){
 const [sites,setSites]=useState<Site[]>([]),[visits,setVisits]=useState<Visit[]>([]),[maintenance,setMaintenance]=useState<Maintenance[]>([]),[tab,setTab]=useState<'visits'|'maintenance'>('visits'),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let stopped=false;const unsubs:(()=>void)[]=[];const loadAll=async()=>{try{if(firebaseConfigured){const [ss,vv,mm]=await Promise.all([loadCloud<Site>('sites'),loadCloud<Visit>('visits'),loadCloud<Maintenance>('maintenance')]);if(!stopped){setSites(ss);setVisits(vv);setMaintenance(mm);setLoading(false)}for(const [kind,setter] of [['sites',setSites],['visits',setVisits],['maintenance',setMaintenance]] as const){const unsub=await subscribeCloud<any>(kind,(items)=>{if(!stopped)setter(items)},e=>{console.error(e);if(!stopped)setError('تعذر تحديث البيانات المباشرة.')});if(stopped)unsub();else unsubs.push(unsub)}}else{setSites(load('/sites',[]));setVisits(load('/visits',[]));setMaintenance(load('/maintenance',[]));setError('وضع محلي: قد لا تظهر بيانات الأجهزة الأخرى.');setLoading(false)}}catch(e){console.error(e);if(!stopped){setError('تعذر تحميل البيانات. تحقق من اتصال قاعدة البيانات.');setLoading(false)}}};void loadAll();return()=>{stopped=true;unsubs.forEach(f=>f())}},[]);
 const siteName=(id:string)=>sites.find(s=>s.id===id)?.facility||'منشأة غير محددة';
 return <div className="loginPage"><div className="servicesCard delegatePortal"><div className="serviceTop"><div><p className="eyebrow">ORKEIT SAFETY • DELEGATE</p><h1>منصة المندوب</h1><p>مرحبًا {delegate.name} — تابع الزيارات وصيانة الطفايات.</p></div><button className="switchAuth" onClick={onLogout}>تسجيل الخروج</button></div><div className="stats"><Stat n={visits.length} t="الزيارات"/><Stat n={maintenance.length} t="سجلات الصيانة"/><Stat n={sites.length} t="المنشآت"/></div><div className="segmentedLogin"><button type="button" className={tab==='visits'?'active':''} onClick={()=>setTab('visits')}>الزيارات</button><button type="button" className={tab==='maintenance'?'active':''} onClick={()=>setTab('maintenance')}>صيانة الطفايات</button></div>{error&&<div className="error">{error}</div>}{loading?<p>جارٍ تحميل بيانات المنصة...</p>:tab==='visits'?<div className="grid">{visits.map(v=><article className="card" key={v.id}><h3>{siteName(v.siteId)}</h3><p>تاريخ الزيارة: {v.date||'—'}</p><p>الحالة: {v.status||'—'}</p>{v.notes&&<p>ملاحظات: {v.notes}</p>}</article>)}{!visits.length&&<Empty/>}</div>:<div className="grid">{maintenance.map(m=><article className="card" key={m.id}><h3>{m.client||siteName(m.siteId)}</h3><p>الخدمة: {m.service||'صيانة طفايات'}</p><p>تاريخ الصيانة: {m.date||'—'}</p><p>تاريخ الانتهاء: {m.expiryDate||'—'}</p><p>عدد الطفايات: {m.count??0}</p><p>الفني: {m.technician||'—'}</p></article>)}{!maintenance.length&&<Empty/>}</div>}<MessageCenter role="delegate" userId={delegate.id} userName={delegate.name}/></div></div>
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
 const [savedFacility,setSavedFacility]=useState({facility:'',address:''});
 const [isSubmitting,setIsSubmitting]=useState(false);
 const submittingRef=useRef(false);
 const [noticeItems,setNoticeItems]=useState<string[]>([]);
 const [notificationRecords,setNotificationRecords]=useState<NotificationRecord[]>([]);
 const previous=useRef<Record<string,string>>({});
 const firstSnapshot=useRef(true);
 useEffect(()=>{void requestNotificationPermission(); void enablePush(user.id,'customer').catch(e=>console.warn('Push setup:',e)); void startForegroundPushListener().catch(()=>{});},[user.id]);
 useEffect(()=>{
   let cancelled=false;
   const restoreProfile=async()=>{
    try{
      let profile:CustomerRecord|undefined;
      if(firebaseConfigured){
        const customers=await loadCloud<CustomerRecord>('customers');
        profile=customers.find(x=>x.id===user.id)||customers.find(x=>x.phone===user.phone);
        if(!profile){
          const priorRequests=await loadCloud<ServiceRequest>('requests');
          const previous=priorRequests.filter(x=>x.customerId===user.id||x.phone===user.phone).sort((a,b)=>b.createdAt-a.createdAt)[0];
          if(previous) profile={id:user.id,name:previous.customerName,phone:previous.phone,facility:previous.facility,address:previous.address,updatedAt:previous.updatedAt};
        }
      }
      if(!profile){
        try{const local=JSON.parse(localStorage.getItem(CUSTOMER_ACCOUNTS_KEY)||'[]');const found=local.find((x:any)=>x.id===user.id||x.phone===user.phone);if(found)profile=found;}catch{}
      }
      if(!cancelled&&profile){
        const facility=String(profile.facility||''),address=String(profile.address||'');
        setSavedFacility({facility,address});
        setForm(prev=>({...prev,name:prev.name||profile!.name||user.name||'',phone:prev.phone||profile!.phone||user.phone||'',facility:prev.facility||facility,address:prev.address||address}));
      }
    }catch(e){console.warn('Customer profile restore failed:',e)}
   };
   void restoreProfile();
   return()=>{cancelled=true};
 },[user.id,user.phone,user.name]);
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
 useEffect(()=>{
   let unsub:(()=>void)|undefined;
   void subscribeCloud<NotificationRecord>('notifications',all=>{
     const mine=all.filter(n=>n.recipientType==='customer'&&n.recipientId===user.id).sort((a,b)=>b.createdAt-a.createdAt).slice(0,30);
     setNotificationRecords(mine);
   },e=>console.warn('Customer notifications:',e)).then(fn=>{unsub=fn});
   return()=>unsub?.();
 },[user.id]);
 const markNotificationRead=async(n:NotificationRecord)=>{if(n.read)return;const updated={...n,read:true};setNotificationRecords(items=>items.map(x=>x.id===n.id?updated:x));try{await saveCloud('notifications',updated)}catch(e){console.warn('Could not mark notification read',e)}};
 const markAllNotificationsRead=async()=>{const unread=notificationRecords.filter(n=>!n.read);setNotificationRecords(items=>items.map(n=>({...n,read:true})));await Promise.all(unread.map(n=>saveCloud('notifications',{...n,read:true}).catch(e=>console.warn(e))))};
 const order=async()=>{
   if(submittingRef.current)return;
   submittingRef.current=true;
   setIsSubmitting(true);
   const name=form.name.trim(),phone=form.phone.trim().replace(/\\s+/g,'');
   if(!selectedService||!name||!phone||!form.facility.trim()||!form.address.trim()){
     alert('أكمل الاسم ورقم الجوال واسم المنشأة وموقعها.');
     submittingRef.current=false;setIsSubmitting(false);return;
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
    setRequests(x=>[req,...x.filter(old=>old.id!==req.id)]);setSelectedService('');setSavedFacility({facility:req.facility,address:req.address});setForm({name,phone,facility:req.facility,address:req.address});
    try{
      const accounts=JSON.parse(localStorage.getItem(CUSTOMER_ACCOUNTS_KEY)||'[]');
      const found=accounts.some((x:any)=>x.id===user.id||x.phone===phone);
      const updated=accounts.map((x:any)=>(x.id===user.id||x.phone===phone)?{...x,name,phone,facility:req.facility,address:req.address}:x);
      if(!found)updated.unshift({id:user.id,name,phone,facility:req.facility,address:req.address});
      localStorage.setItem(CUSTOMER_ACCOUNTS_KEY,JSON.stringify(updated));
    }catch{}
    void sendPush({role:'admin'},'Orkeit — طلب خدمة جديد',`خدمة جديدة: ${req.service} — ${req.customerName} — ${req.facility}`,{requestId:req.id,updatedAt:String(req.updatedAt)});
    alert('تم إرسال الطلب بنجاح. رقم المتابعة: '+req.id);
   }catch(e){
    console.error('Service request save failed:',e);
    const err=e as {code?:string;message?:string};
    const detail=err?.code ? `رمز الخطأ: ${err.code}` : (err?.message || 'خطأ غير معروف');
    alert('تعذر إرسال الطلب.\\n\\n'+detail+'\\n\\nتأكد من اتصال Firebase وFirestore ثم حاول مرة أخرى.');
   }finally{
    submittingRef.current=false;setIsSubmitting(false);
   }
 };
 const steps=['جديد','قيد المراجعة','تم التسعير','تم اعتماد الطلب','جاري التنفيذ','مكتمل'];
 return <div className="loginPage"><div className="servicesCard">
  <div className="serviceTop"><div><p className="eyebrow">ORKEIT SAFETY</p><h1>خدمات الدفاع المدني</h1><p>مرحبًا {user.name}، اختر الخدمة المطلوبة.</p></div><div className="serviceActions"><NotificationBell items={[...notificationRecords,...noticeItems]} title="تحديثات طلباتك" onRead={markNotificationRead} onMarkAllRead={()=>void markAllNotificationsRead()} onSelect={item=>{const id=item.match(/ORK-\d{4}-\d+/)?.[0];if(id){document.getElementById('request-'+id)?.scrollIntoView({behavior:'smooth',block:'center'});}}}/><button className="switchAuth" onClick={onLogout}>خروج</button></div></div>
  {!selectedService?<><div className="serviceGrid">{services.map((x,i)=><button className="serviceItem" key={x} onClick={()=>setSelectedService(x)}><span>{String(i+1).padStart(2,'0')}</span><strong>{x}</strong><b>طلب الخدمة ←</b></button>)}</div></>:
  <section className="requestFormCard"><button className="backLink" type="button" onClick={()=>setSelectedService('')}>← العودة للخدمات</button><h2>إكمال إجراءات الطلب</h2><p>الخدمة المطلوبة: <b>{selectedService}</b></p>
   <label>اسم العميل<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
   <label>رقم الجوال<input inputMode="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></label>
   <label>اسم المنشأة<input value={form.facility} onChange={e=>setForm({...form,facility:e.target.value})} required/></label>
   <label>موقع المنشأة / العنوان<textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} rows={3} required/></label>
   {savedFacility.facility&&<button className="switchAuth" type="button" onClick={()=>{if(form.facility===savedFacility.facility&&form.address===savedFacility.address){setForm({...form,facility:'',address:''})}else{setForm({...form,facility:savedFacility.facility,address:savedFacility.address})}}}>{form.facility===savedFacility.facility&&form.address===savedFacility.address?'＋ إضافة منشأة أخرى':'↩ استخدام المنشأة المحفوظة'}</button>}
   <button className="primary wide" type="button" disabled={isSubmitting} onClick={()=>void order()}>{isSubmitting?'جارٍ إرسال الطلب…':'إرسال طلب الخدمة'}</button>
  </section>}
  <div className="requestSection"><h2>متابعة طلباتي</h2>{loading&&<p>جاري تحميل الطلبات...</p>}{!loading&&!requests.length&&<div className="empty">لا توجد طلبات حتى الآن.</div>}
   {requests.map(r=><article className="requestCard" id={'request-'+r.id} key={r.id}><div className="requestHead"><strong>{r.service}</strong><span>{r.id}</span></div><p><b>المنشأة:</b> {r.facility}</p><p><b>الموقع:</b> {r.address}</p><p><b>تاريخ ووقت الطلب:</b> {new Date(r.createdAt||r.updatedAt||Date.now()).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'})}</p><p>الحالة: <b>{r.status}</b></p><p>{r.note}</p><div className="timeline">{steps.map((s,i)=><span className={steps.indexOf(r.status)>=i?'done':''} key={s}>{s}</span>)}</div><small>آخر تحديث: {new Date(r.updatedAt).toLocaleString('ar-SA')}</small></article>)}
  </div>
  <MessageCenter role="customer" userId={String(user.id)} userName={String(user.name||'العميل')}/>
 </div></div>;
}
function Dashboard({onLogout}:{onLogout:()=>void}){
 const [sites,setSites]=useState<Site[]>(()=>load('/sites',[]));
 const [visits,setVisits]=useState<Visit[]>(()=>load('/visits',[]));
 const [maintenance,setMaintenance]=useState<Maintenance[]>(()=>load('/maintenance',[]));
 const [contracts,setContracts]=useState<ContractRecord[]>(()=>load('/contracts',[]));
 const [profileSiteId,setProfileSiteId]=useState<string|null>(null);
 const [delegates,setDelegates]=useState<Delegate[]>(()=>load('/delegates',[]));
 const [requests,setRequests]=useState<ServiceRequest[]>(()=>load('/requests',[]));
  const [leads,setLeads]=useState<Lead[]>(()=>load('/leads',[]));
 const [noticeItems,setNoticeItems]=useState<string[]>([]);
 const [notificationRecords,setNotificationRecords]=useState<NotificationRecord[]>([]);
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
 useEffect(()=>{let unsub:(()=>void)|undefined;
   void subscribeCloud<NotificationRecord>('notifications',all=>{
     setNotificationRecords(all.filter(n=>n.recipientType==='admin').sort((a,b)=>b.createdAt-a.createdAt).slice(0,40));
   },e=>console.warn('Admin notifications:',e)).then(fn=>{unsub=fn});
   return()=>unsub?.();
 },[]);
 const markNotificationRead=async(n:NotificationRecord)=>{if(n.read)return;const updated={...n,read:true};setNotificationRecords(items=>items.map(x=>x.id===n.id?updated:x));try{await saveCloud('notifications',updated)}catch(e){console.warn('Could not mark notification read',e)}};
 const markAllNotificationsRead=async()=>{const unread=notificationRecords.filter(n=>!n.read);setNotificationRecords(items=>items.map(n=>({...n,read:true})));await Promise.all(unread.map(n=>saveCloud('notifications',{...n,read:true}).catch(e=>console.warn(e))))};
 useEffect(()=>{let cancelled=false;(async()=>{
   if(!firebaseConfigured){setCloudReady(false);return}
   try{
     const [cloudSites,cloudVisits,cloudMaintenance,cloudDelegates,cloudRequests,cloudContracts]=await Promise.all([
       loadCloud<Site>('sites'),
       loadCloud<Visit>('visits'),
       loadCloud<Maintenance>('maintenance'),
       loadCloud<Delegate>('delegates'),
       loadCloud<ServiceRequest>('requests'),
       loadCloud<ContractRecord>('contracts')
     ]);
     if(cancelled)return;

     const migrate = async <T extends {id:string}>(kind:'sites'|'visits'|'maintenance'|'delegates'|'requests'|'contracts', localKey:string, cloud:T[], local:T[], setState:(value:T[])=>void) => {
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
     await migrate('contracts','/contracts',cloudContracts,contracts,setContracts);
   }catch(err){
     console.error('Firebase load failed',err);
   }finally{
     if(!cancelled)setCloudReady(true);
   }
   })();return()=>{cancelled=true}},[]);
 const [page,setPage]=useState<'home'|'sites'|'siteProfile'|'visits'|'maintenance'|'delegates'|'requests'|'documents'|'invite'|'leads'|'messages'|'search'|'archive'|'reports'>('home');
 const [requestSearch,setRequestSearch]=useState('');
 const [requestFilter,setRequestFilter]=useState('الكل');
 const [open,setOpen]=useState<string|null>(null),[menu,setMenu]=useState(false),[editing,setEditing]=useState<any>(null);
 const update=(setter:any,key:string,kind:'sites'|'visits'|'maintenance'|'delegates'|'requests'|'leads'|'contracts')=>(value:any)=>{
   setter(value);
   save(key,value);
   if(firebaseConfigured){
     const records=value as any[];
     void Promise.all(records.map(item=>saveCloud(kind,item))).catch(err=>console.error('Firebase save failed',err));
   }
 };
 const removeCloudRecord=(kind:'sites'|'visits'|'maintenance'|'delegates'|'requests'|'leads'|'contracts',id:string)=>{if(firebaseConfigured)void deleteCloud(kind,id).catch(err=>console.error('Firebase delete failed',err))};
 const setSitesSafe=update(setSites,'/sites','sites'),setVisitsSafe=update(setVisits,'/visits','visits'),setMaintenanceSafe=update(setMaintenance,'/maintenance','maintenance'),setDelegatesSafe=update(setDelegates,'/delegates','delegates'),setRequestsSafe=update(setRequests,'/requests','requests'),setLeadsSafe=update(setLeads,'/leads','leads'),setContractsSafe=update(setContracts,'/contracts','contracts');
 const expiryAlerts=useMemo(()=>{
   const alerts:string[]=[];
   sites.forEach(s=>{if(s.contractEnd){const d=daysUntil(s.contractEnd);const label=expiryLabel(d);if(label)alerts.push(`${label}: عقد ${s.facility||s.client} ينتهي في ${s.contractEnd}`)}});
   maintenance.forEach(m=>{if(m.expiryDate){const d=daysUntil(m.expiryDate);const label=expiryLabel(d);if(label)alerts.push(`${label}: صيانة طفايات ${sites.find(s=>s.id===m.siteId)?.facility||'منشأة'} تنتهي في ${m.expiryDate}`)}});
   return alerts;
 },[sites,maintenance]);
 const expiring=expiryAlerts.length;
 const nowForDashboard=new Date();
 const todayKeyForDashboard=nowForDashboard.getFullYear()+'-'+String(nowForDashboard.getMonth()+1).padStart(2,'0')+'-'+String(nowForDashboard.getDate()).padStart(2,'0');
 const isVisitDone=(v:Visit)=>/مكتمل|منجز|تمت|completed/i.test(v.status||'');
 const todaysVisits=visits.filter(v=>v.date===todayKeyForDashboard);
 const overdueVisits=visits.filter(v=>v.date&&v.date<todayKeyForDashboard&&!isVisitDone(v));
 const newRequests=requests.filter(r=>/جديد|new/i.test(r.status||''));
 const inProgressRequests=requests.filter(r=>/قيد التنفيذ|جاري التنفيذ|تحت التنفيذ|in progress/i.test(r.status||''));
 const nearContracts=[...sites.filter(x=>x.contractEnd&&daysUntil(x.contractEnd)<=30).map(x=>({id:x.id,name:x.facility||x.client||'منشأة',date:x.contractEnd,kind:'عقد صيانة'})),...contracts.filter(x=>x.endDate&&daysUntil(x.endDate)<=30).map(x=>({id:x.id,name:x.facility||x.client||x.contractNo||'عقد',date:x.endDate!,kind:'عقد مسجل'}))];
 const dueMaintenance=maintenance.filter(m=>m.expiryDate&&daysUntil(m.expiryDate)<=30);
 const delegatePerformance=delegates.map(d=>({delegate:d,visits:visits.filter(v=>v.delegateId===d.id&&isVisitDone(v)).length,maintenance:maintenance.filter(m=>m.delegateId===d.id||(!m.delegateId&&m.technician===d.name)).length}));
 const messageContacts:MessageContact[]=[...new Map([...requests.map(r=>({id:r.customerId||r.phone,threadId:'customer:'+(r.customerId||r.phone),kind:'customer' as const,name:r.customerName||r.phone,phone:r.phone,facility:r.facility})),...delegates.map(d=>({id:d.id,threadId:'delegate:'+d.id,kind:'delegate' as const,name:d.name,phone:d.phone}))].filter(c=>c.id).map(c=>[c.threadId,c])).values()];
 const profileSite=sites.find(x=>x.id===profileSiteId)||null;
 const profileVisits=profileSite?visits.filter(v=>v.siteId===profileSite.id).sort((a,b)=>String(b.date).localeCompare(String(a.date))):[];
 const profileMaintenance=profileSite?maintenance.filter(m=>m.siteId===profileSite.id).sort((a,b)=>String(b.date).localeCompare(String(a.date))):[];
 const profileContracts=profileSite?contracts.filter(c=>c.siteId===profileSite.id||(!c.siteId&&String(c.facility||'').trim()===profileSite.facility.trim())).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)):[];
 const profileRequests=profileSite?requests.filter(r=>(r.facility||'').trim()===profileSite.facility.trim()||(profileSite.phone&&r.phone===profileSite.phone)).sort((a,b)=>b.updatedAt-a.updatedAt):[];
 const nav=[['home','الرئيسية'],['search','بحث شامل'],['archive','أرشيف المستندات'],['reports','التقارير الإدارية'],['messages','مركز الرسائل'],['leads','👤 عميل محتمل'],['sites','المواقع والمنشآت'],['visits','الزيارات'],['maintenance','صيانة الطفايات'],['delegates','المناديب'],['requests','طلبات العملاء'],['documents','إنشاء عقد ومشهد'],['invite','بوابة دعوة واتساب']] as const;
 const go=(p:any)=>{if(p==='documents'){window.location.href='https://contract-nine-sage.vercel.app/';return;}setPage(p);setMenu(false);setOpen(null);setEditing(null)};
 const add=(kind:string)=>{setEditing(null);setOpen(kind)};
 const verifyDeletePassword=()=>{const entered=window.prompt('أدخل كلمة سر الحذف للمتابعة:');if(entered===null)return false;if(entered!==('115'+'520')){window.alert('كلمة سر الحذف غير صحيحة. لم يتم حذف السجل.');return false;}return true};
  const remove=(kind:string,id:string)=>{if(!verifyDeletePassword())return;if(kind==='site'){setSitesSafe(sites.filter(x=>x.id!==id));removeCloudRecord('sites',id)}if(kind==='visit'){setVisitsSafe(visits.filter(x=>x.id!==id));removeCloudRecord('visits',id)}if(kind==='maintenance'){setMaintenanceSafe(maintenance.filter(x=>x.id!==id));removeCloudRecord('maintenance',id)}if(kind==='delegate'){setDelegatesSafe(delegates.filter(x=>x.id!==id));removeCloudRecord('delegates',id)}};
 return <div className="app">
  <header><button className="menuBtn" onClick={()=>setMenu(!menu)}>☰</button><button type="button" className="logo logoButton" aria-label="الصفحة الرئيسية" onClick={()=>go("home")}><b>O</b><span><strong>ORKEIT</strong><small>زيارات الدفاع المدني</small></span></button><div className="headerTag">{firebaseConfigured&&cloudReady?"متصل بقاعدة البيانات":"وضع محلي — أكمل إعداد Firebase"}</div><NotificationBell items={[...notificationRecords,...noticeItems,...expiryAlerts]} title="مركز إشعارات النظام" onRead={markNotificationRead} onMarkAllRead={()=>void markAllNotificationsRead()} onSelect={item=>{const id=item.match(/ORK-\d{4}-\d+/)?.[0];if(id){setRequestSearch(id);go('requests');}else if(item.includes('صيانة طفايات'))go('maintenance');else go('sites');}}/><button className="logout" onClick={onLogout}>خروج</button></header>
  {menu&&<><div className="backdrop" onClick={()=>setMenu(false)}/><aside>{nav.map(([k,l])=><button className={page===k?'active':''} key={k} onClick={()=>go(k)}>{l}</button>)}</aside></>}
  <main>
   {page==='messages'&&<MessageCenter role="admin" userId="admin" userName="إدارة Orkeit" contacts={messageContacts}/>}
   {page==='search'&&<AdminSearch sites={sites} visits={visits} maintenance={maintenance} contracts={contracts} requests={requests} delegates={delegates} onOpenSite={id=>{setProfileSiteId(id);setPage('siteProfile')}} onOpenRequests={()=>setPage('requests')}/>}
   {page==='archive'&&<DocumentArchive sites={sites}/>}
   {page==='reports'&&<AdminReports sites={sites} visits={visits} maintenance={maintenance} contracts={contracts} requests={requests} delegates={delegates}/>}
   {page==='documents'&&<DocumentsPage/>}
   {page==='invite'&&<WhatsAppInvitePage sites={sites}/>} 
   {page==='home'&&<><section className="hero"><div><p className="eyebrow">ORKEIT SAFETY • SMART CONTROL CENTER</p><h1>لوحة التحكم الذكية</h1><p>ملخص يومي للزيارات والطلبات والعقود والصيانة وأداء فريق العمل.</p></div><div className="heroActions"><button className="primary" onClick={()=>add('site')}>＋ إضافة منشأة</button><button className="heroGhost" onClick={()=>go('messages')}>✉ مركز الرسائل</button><button className="heroGhost" onClick={()=>go('requests')}>طلبات العملاء</button></div></section><div className="smartMetricGrid"><button className="smartMetric" onClick={()=>go('visits')}><span>زيارات اليوم</span><strong>{todaysVisits.length}</strong><small>زيارات مجدولة اليوم</small></button><button className={'smartMetric '+(overdueVisits.length?'metricDanger':'')} onClick={()=>go('visits')}><span>زيارات متأخرة</span><strong>{overdueVisits.length}</strong><small>تحتاج إلى متابعة</small></button><button className="smartMetric" onClick={()=>go('requests')}><span>طلبات جديدة</span><strong>{newRequests.length}</strong><small>بانتظار المعالجة</small></button><button className="smartMetric" onClick={()=>go('requests')}><span>قيد التنفيذ</span><strong>{inProgressRequests.length}</strong><small>طلبات نشطة</small></button><button className={'smartMetric '+(nearContracts.length?'metricWarn':'')} onClick={()=>go('sites')}><span>عقود قريبة الانتهاء</span><strong>{nearContracts.length}</strong><small>خلال 30 يومًا أو منتهية</small></button><button className={'smartMetric '+(dueMaintenance.length?'metricWarn':'')} onClick={()=>go('maintenance')}><span>طفايات تحتاج صيانة</span><strong>{dueMaintenance.length}</strong><small>مواعيد صيانة خلال 30 يومًا أو متأخرة</small></button></div><div className="stats"><Stat n={sites.length} t="المنشآت"/><Stat n={visits.length} t="إجمالي الزيارات"/><Stat n={maintenance.length} t="سجلات الصيانة"/><Stat n={expiring} t="تنبيهات قريبة"/></div><section className="overviewGrid"><div className="panel"><div className="panelTitle"><h2>الزيارات التي تحتاج متابعة</h2><button className="textBtn" onClick={()=>go('visits')}>عرض الزيارات</button></div>{[...overdueVisits,...todaysVisits].slice(0,6).map(v=><article className="dashboardLine" key={v.id}><b>{sites.find(x=>x.id===v.siteId)?.facility||'منشأة غير محددة'}</b><span>{v.date} · {v.status}</span></article>)}{!overdueVisits.length&&!todaysVisits.length&&<div className="emptyMini">لا توجد زيارات اليوم أو زيارات متأخرة.</div>}</div><div className="panel"><div className="panelTitle"><h2>آخر طلبات العملاء</h2><button className="textBtn" onClick={()=>go('requests')}>عرض الكل</button></div>{requests.slice(0,5).map(r=><button className="recentRequest" key={r.id} onClick={()=>go('requests')}><span><b>{r.service}</b><small>{r.customerName} • {r.facility}</small></span><em>{r.status}</em></button>)}{!requests.length&&<div className="emptyMini">لا توجد طلبات بعد.</div>}</div></section><section className="overviewGrid"><div className="panel"><div className="panelTitle"><h2>العقود والصيانة القريبة</h2><span>{nearContracts.length+dueMaintenance.length}</span></div>{nearContracts.slice(0,5).map(c=><article className="dashboardLine" key={c.kind+c.id}><b>{c.name}</b><span>{c.kind} · {c.date} · {daysUntil(c.date)<0?'منتهي':'متبقي '+daysUntil(c.date)+' يوم'}</span></article>)}{dueMaintenance.slice(0,5).map(m=><article className="dashboardLine" key={'m'+m.id}><b>{m.client||sites.find(x=>x.id===m.siteId)?.facility||'منشأة'}</b><span>صيانة طفايات · {m.expiryDate} · {daysUntil(m.expiryDate)<0?'متأخرة':'قريبة'}</span></article>)}{!nearContracts.length&&!dueMaintenance.length&&<div className="emptyMini">لا توجد عقود أو صيانة قريبة من الاستحقاق.</div>}</div><div className="panel"><div className="panelTitle"><h2>إنجازات المندوبين</h2><button className="textBtn" onClick={()=>go('delegates')}>إدارة الفريق</button></div>{delegatePerformance.map(x=><article className="delegateAchievement" key={x.delegate.id}><div><b>{x.delegate.name}</b><small>{x.delegate.active?'مندوب نشط':'حساب موقوف'}</small></div><span><strong>{x.visits}</strong> زيارات مكتملة</span><span><strong>{x.maintenance}</strong> عمليات صيانة</span></article>)}{!delegates.length&&<div className="emptyMini">أضف المناديب وعيّنهم للزيارات والصيانة لاحتساب الإنجازات.</div>}</div></section><section className="panel"><div className="panelTitle"><h2>الوصول السريع</h2><button className="textBtn" onClick={()=>go('messages')}>مركز الرسائل ←</button></div><div className="quick">{nav.slice(1).map(([k,l])=><button key={k} onClick={()=>go(k)}>{l}<span>›</span></button>)}</div></section><MessageCenter role="admin" userId="admin" userName="إدارة Orkeit" contacts={messageContacts}/></>}
   {page==='leads'&&<ListPage title="العملاء المحتملون" add={()=>add('lead')}><div className="grid">{leads.map(l=><article className="card" key={l.id}><h3>{l.client}</h3><p>المنشأة: {l.facility}</p><p>الهاتف: {l.phone}</p><p>الموقع: {l.address}</p><div className="leadActions"><button type="button" className="secondaryBtn" onClick={()=>{setEditing(l);setOpen('lead')}}>✏️ تعديل</button><button type="button" className="primary" onClick={()=>{const digits=l.phone.replace(/[^0-9]/g,'');const wa=digits.startsWith('0')?'966'+digits.slice(1):digits;const message='السلام عليكم ورحمة الله وبركاته، معكم شركة أوريكيت للمقاولات العامة (Orkeit). نقدم خدمات السلامة والدفاع المدني، ومنها فحص وصيانة طفايات الحريق وأنظمة الإنذار والسلامة وزيارات الصيانة والمتابعة حسب احتياج منشأتكم. يسعدنا التواصل معكم لمعرفة احتياجكم وتقديم عرض مناسب. للتواصل: 0555334577';window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(message),'_blank')}}>مراسلة واتساب</button><button type="button" className="secondaryBtn" onClick={()=>{const site:Site={id:uid(),client:l.client,facility:l.facility,phone:l.phone,address:l.address,contractEnd:'',extCount:0};setSitesSafe([site,...sites]);setLeadsSafe(leads.filter(x=>x.id!==l.id));removeCloudRecord('leads',l.id);setPage('sites')}}>إضافة إلى المواقع والمنشآت</button><button type="button" className="delete" onClick={()=>{if(!verifyDeletePassword())return;setLeadsSafe(leads.filter(x=>x.id!==l.id));removeCloudRecord('leads',l.id)}}>حذف</button></div></article>)}</div>{!leads.length&&<Empty/>}</ListPage>}\n   {page==='sites'&&<ListPage title="المواقع والمنشآت" add={()=>add('site')}><div className="grid">{sites.map(s=><article className="card siteSummaryCard" key={s.id}><h3>{s.facility||'منشأة'}</h3><p>العميل: {s.client||'—'}</p><p>الهاتف: {s.phone||'—'}</p><p>الموقع: {s.address||'—'}</p><p>الطفايات: {s.extCount||0}</p>{s.contractEnd&&<p>انتهاء العقد: {s.contractEnd}</p>}<div className="siteCardActions"><button className="primary" type="button" onClick={()=>{setProfileSiteId(s.id);setPage('siteProfile')}}>📂 فتح ملف المنشأة</button><button className="secondaryBtn" type="button" onClick={()=>{setEditing(s);setOpen('site')}}>✏️ تعديل</button><button className="delete" type="button" onClick={()=>remove('site',s.id)}>حذف</button></div></article>)}</div>{!sites.length&&<Empty/>}</ListPage>}
   {page==='siteProfile'&&<section className="siteProfilePage">{!profileSite?<div className="panel"><h2>لم يتم العثور على المنشأة</h2><button className="secondaryBtn" onClick={()=>setPage('sites')}>العودة إلى المنشآت</button></div>:<><div className="siteProfileHero"><button className="secondaryBtn" onClick={()=>setPage('sites')}>← العودة إلى المنشآت</button><div><p className="eyebrow">ORKEIT • FACILITY PROFILE</p><h1>{profileSite.facility||'ملف المنشأة'}</h1><p>{profileSite.client||'اسم العميل غير مسجل'} · {profileSite.phone||'لا يوجد رقم اتصال'}</p></div><div className="siteCardActions"><button className="primary" onClick={()=>{setEditing(profileSite);setOpen('site')}}>✏️ تعديل بيانات المنشأة</button><button className="secondaryBtn" onClick={()=>{setEditing({id:uid(),siteId:profileSite.id,date:new Date().toISOString().slice(0,10),status:'مجدولة',notes:''});setOpen('visit')}}>＋ تسجيل زيارة</button><button className="secondaryBtn" onClick={()=>{setOpen('maintenance');setEditing(null)}}>＋ تسجيل صيانة</button></div></div><div className="siteProfileStats"><div><strong>{profileVisits.length}</strong><span>الزيارات</span></div><div><strong>{profileContracts.length+(profileContracts.length===0&&profileSite.contractEnd?1:0)}</strong><span>العقود</span></div><div><strong>{profileMaintenance.length}</strong><span>عمليات الصيانة</span></div><div><strong>{profileRequests.length}</strong><span>الطلبات</span></div></div><div className="siteProfileGrid"><section className="panel"><div className="panelTitle"><h2>بيانات المنشأة</h2><span>الملف الأساسي</span></div><dl className="siteDetails"><div><dt>اسم المنشأة</dt><dd>{profileSite.facility||'—'}</dd></div><div><dt>اسم العميل / جهة الاتصال</dt><dd>{profileSite.client||'—'}</dd></div><div><dt>رقم الهاتف</dt><dd>{profileSite.phone||'—'}</dd></div><div><dt>البريد الإلكتروني</dt><dd>{profileSite.email||'غير مسجل'}</dd></div><div><dt>الرقم الموحد</dt><dd>{profileSite.unified||'غير مسجل'}</dd></div><div><dt>حالة الترخيص</dt><dd>{profileSite.license||'غير محددة'}</dd></div><div><dt>عدد الطفايات</dt><dd>{profileSite.extCount||0}</dd></div><div><dt>انتهاء العقد المسجل</dt><dd>{profileSite.contractEnd||'غير مسجل'}</dd></div><div className="siteAddress"><dt>الموقع / العنوان</dt><dd>{profileSite.address||'غير مسجل'}</dd></div></dl><div className="siteContactActions">{profileSite.phone&&<><a href={'tel:'+profileSite.phone}>اتصال بالعميل</a><a target="_blank" rel="noreferrer" href={'https://wa.me/'+profileSite.phone.replace(/[^0-9]/g,'')}>واتساب</a></>}{profileSite.address&&<a target="_blank" rel="noreferrer" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(profileSite.address)}>فتح الموقع على الخريطة</a>}</div></section><section className="panel"><div className="panelTitle"><h2>العقود</h2><span>{profileContracts.length+(profileSite.contractEnd?1:0)}</span></div>{profileSite.contractEnd&&<article className="profileRecord"><strong>عقد الصيانة المسجل للمنشأة</strong><p>تاريخ الانتهاء: {profileSite.contractEnd}</p><span className="profilePill">{daysUntil(profileSite.contractEnd)<0?'منتهي':daysUntil(profileSite.contractEnd)<=30?'قريب الانتهاء':'ساري'}</span></article>}{profileContracts.map(c=><article className="profileRecord" key={c.id}><strong>{c.contractNo||'عقد صيانة'}</strong><p>{c.scope||'نطاق العمل غير محدد'}</p><p>من {c.startDate||'—'} إلى {c.endDate||'—'}</p><span className="profilePill">{c.status||'مسجل'}</span></article>)}{!profileContracts.length&&!profileSite.contractEnd&&<p className="muted">لا توجد عقود مرتبطة بهذه المنشأة حتى الآن.</p>}</section><section className="panel"><div className="panelTitle"><h2>الزيارات السابقة</h2><span>{profileVisits.length}</span></div>{profileVisits.map(v=><article className="profileRecord" key={v.id}><strong>{v.date||'تاريخ غير محدد'}</strong><p>الحالة: {v.status||'—'}</p><p>{v.notes||'لا توجد ملاحظات مسجلة'}</p></article>)}{!profileVisits.length&&<p className="muted">لا توجد زيارات مسجلة لهذه المنشأة.</p>}</section><section className="panel"><div className="panelTitle"><h2>سجل الصيانة</h2><span>{profileMaintenance.length}</span></div>{profileMaintenance.map(m=><article className="profileRecord" key={m.id}><strong>{m.service||'صيانة'}</strong><p>التاريخ: {m.date||'—'} · العدد: {m.count||0}</p><p>الفني: {m.technician||'—'}</p><p>تاريخ انتهاء الصيانة: {m.expiryDate||'—'}</p></article>)}{!profileMaintenance.length&&<p className="muted">لا توجد سجلات صيانة مرتبطة بهذه المنشأة.</p>}</section><section className="panel profileRequestsPanel"><div className="panelTitle"><h2>طلبات العملاء</h2><span>{profileRequests.length}</span></div>{profileRequests.map(r=><article className="profileRecord" key={r.id}><strong>{r.service}</strong><p>رقم الطلب: {r.id}</p><p>الحالة: {r.status}</p><p>تاريخ الطلب: {new Date(r.createdAt||r.updatedAt).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'})}</p><p>{r.note}</p><button className="textBtn" onClick={()=>{setRequestSearch(r.id);setPage('requests')}}>فتح الطلب في الإدارة ←</button></article>)}{!profileRequests.length&&<p className="muted">لا توجد طلبات مرتبطة بهذه المنشأة. تتم المطابقة باسم المنشأة أو رقم الهاتف.</p>}</section></div></>}</section>}
   {page==='visits'&&<ListPage title="الزيارات" add={()=>add('visit')}><div className="grid">{visits.map(v=>{const s=sites.find(x=>x.id===v.siteId);return <Card key={v.id} title={s?.facility||'موقع محذوف'} lines={[v.date,v.status,v.notes]} del={()=>remove('visit',v.id)}/>})}</div>{!visits.length&&<Empty/>}</ListPage>}
   {page==='maintenance'&&<ListPage title="صيانة الطفايات" add={()=>add('maintenance')}><div className="grid">{maintenance.map(m=><Card key={m.id} title={m.client||sites.find(s=>s.id===m.siteId)?.facility||'منشأة'} lines={[m.client?'العميل: '+m.client:'',m.service,m.date,'الفني: '+m.technician,'انتهاء الصيانة: '+(m.expiryDate||'—')]} badge={'العدد: '+m.count} edit={()=>{setEditing(m);setOpen('maintenance')}} del={()=>remove('maintenance',m.id)}/>)}</div>{!maintenance.length&&<Empty/>}</ListPage>}
{page==='requests'&&<ListPage title="طلبات العملاء" add={()=>{}}><div className="adminTools"><button className="secondaryBtn" onClick={()=>void activateAdminPush()}>{pushReady?'🔔 الإشعارات مفعلة':'🔕 تفعيل إشعارات الطلبات'}</button></div><div className="requestSyncBar"><span className={requestSyncError?'syncBad':'syncOk'}>{requestSyncError?'⚠ '+requestSyncError:'● الطلبات متزامنة مع Firebase'}</span><button className="secondaryBtn" onClick={()=>void refreshRequests()}>تحديث الآن</button></div><div className="requestToolbar"><input placeholder="بحث بالعميل أو المنشأة أو رقم الطلب..." value={requestSearch} onChange={e=>setRequestSearch(e.target.value)}/><select value={requestFilter} onChange={e=>setRequestFilter(e.target.value)}><option>الكل</option>{['جديد','قيد المراجعة','تم التسعير','تم اعتماد الطلب','جاري التنفيذ','مكتمل','مرفوض'].map(s=><option key={s}>{s}</option>)}</select><button className="secondaryBtn" onClick={()=>exportCsv('orkeit-service-requests.csv',[['رقم الطلب','العميل','الجوال','الخدمة','المنشأة','الحالة','تاريخ الإنشاء'],...requests.map(r=>[r.id,r.customerName,r.phone,r.service,r.facility,r.status,new Date(r.createdAt).toLocaleString('ar-SA')])])}>تصدير Excel/CSV</button></div><div className="grid">{requests.filter(r=>{const q=requestSearch.trim().toLowerCase();const hit=!q||[r.id,r.customerName,r.phone,r.service,r.facility,r.address].some(v=>String(v).toLowerCase().includes(q));return hit&&(requestFilter==='الكل'||r.status===requestFilter)}).sort((a,b)=>b.updatedAt-a.updatedAt).map(r=><RequestAdminCard key={r.id} request={r} onSave={x=>{setRequestsSafe(requests.map(q=>q.id===x.id?x:q))}} onDelete={()=>{if(!verifyDeletePassword())return;setRequestsSafe(requests.filter(q=>q.id!==r.id));removeCloudRecord('requests',r.id)}}/>)}</div>{!requests.length&&<Empty/>}</ListPage>}
   {page==='delegates'&&<ListPage title="المناديب" add={()=>add('delegate')}><div className="grid">{delegates.map(d=><Card key={d.id} title={d.name} lines={[d.phone,d.active?'نشط':'موقوف']} del={()=>remove('delegate',d.id)}/>)}</div>{!delegates.length&&<Empty/>}</ListPage>}
  </main>
  {open==='lead'&&<LeadForm initial={editing} close={()=>setOpen(null)} onSave={x=>{setLeadsSafe([x,...leads.filter(l=>l.id!==x.id)]);setOpen(null)}}/>}\n  {open==='site'&&<SiteForm initial={editing} close={()=>setOpen(null)} onSave={x=>{setSitesSafe([x,...sites.filter(s=>s.id!==x.id)]);setOpen(null)}}/>}
  {open==='visit'&&<VisitForm sites={sites} delegates={delegates} initial={editing} close={()=>setOpen(null)} onSave={x=>{setVisitsSafe([x,...visits.filter(v=>v.id!==x.id)]);setOpen(null)}}/>}
  {open==='maintenance'&&<MaintenanceForm sites={sites} delegates={delegates} initial={editing} close={()=>setOpen(null)} onSave={x=>{setMaintenanceSafe([x,...maintenance.filter(m=>m.id!==x.id)]);setOpen(null)}}/>}
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
 const saveIt=async()=>{const x={...request,status,note,updatedAt:Date.now()};onSave(x);try{if(firebaseConfigured)await saveCloud('requests',x);setSaved('تم التحديث بنجاح');void sendPush({userId:request.customerId},'Orkeit — تحديث طلبك',`تم تحديث الطلب ${request.id}: ${status}`,{requestId:request.id,status,updatedAt:String(x.updatedAt)});}catch(e){console.error(e);setSaved('تم التحديث محليًا، تعذرت المزامنة');}};
 return <article className="card requestAdmin"><h3>{request.service}</h3><p><b>رقم الطلب:</b> {request.id}</p><p><b>تاريخ ووقت الطلب:</b> {new Date(request.createdAt||request.updatedAt||Date.now()).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'})}</p><p><b>العميل:</b> {request.customerName} · {request.phone}</p><label>حالة الطلب<select value={status} onChange={e=>{setStatus(e.target.value);setSaved('')}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>ملاحظة للعميل<textarea value={note} onChange={e=>{setNote(e.target.value);setSaved('')}} rows={3}/></label><button className="primary wide" onClick={()=>void saveIt()}>تحديث حالة الطلب</button>{saved&&<p className={saved.includes('بنجاح')?'saveSuccess':'saveWarning'} role="status">✓ {saved}</p>}<button className="delete" onClick={onDelete}>حذف الطلب</button></article>
}
function Stat({n,t}:{n:number;t:string}){return <div className="stat"><strong>{n}</strong><span>{t}</span></div>}
function ListPage({title,add,children}:{title:string;add:()=>void;children:any}){return <section><div className="pageTitle"><h1>{title}</h1><button className="primary" onClick={add}>＋ إضافة</button></div>{children}</section>}
function Card({title,lines,badge,del,edit}:{title:string;lines:string[];badge?:string;del:()=>void;edit?:()=>void}){return <article className="card"><h3>{title}</h3>{lines.filter(Boolean).map((x,i)=><p key={i}>{x}</p>)}{badge&&<span className="badge">{badge}</span>}{edit&&<button type="button" className="secondaryBtn" onClick={edit}>✏️ تعديل</button>}<button className="delete" onClick={del}>حذف</button></article>}
function Empty(){return <div className="empty">لا توجد سجلات حتى الآن.</div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:any}){return <div className="modalBg"><div className="modal"><div className="modalHead"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>}
function Input({label,value,onChange,type='text',required=false,placeholder}:{label:string;value:any;onChange:(v:string)=>void;type?:string;required?:boolean;placeholder?:string}){return <label>{label}<input type={type} value={value??''} onChange={e=>onChange(e.target.value)} required={required} placeholder={placeholder}/></label>}
function SiteForm({initial,close,onSave}:{initial?:Site|null;close:()=>void;onSave:(x:Site)=>void}){const [x,setX]=useState<Site>(initial||{id:uid(),client:'',facility:'',phone:'',address:'',contractEnd:'',extCount:0});return <Modal title={initial?'تعديل بيانات المنشأة':'إضافة منشأة'} close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,extCount:Number(x.extCount||0)})}}><Input label="اسم العميل" value={x.client} onChange={v=>setX({...x,client:v})} required/><Input label="اسم المنشأة" value={x.facility} onChange={v=>setX({...x,facility:v})} required/><Input label="رقم الجوال" value={x.phone} onChange={v=>setX({...x,phone:v})}/><Input label="البريد الإلكتروني" value={x.email||''} onChange={v=>setX({...x,email:v})}/><Input label="الرقم الموحد" value={x.unified||''} onChange={v=>setX({...x,unified:v})}/><Input label="حالة الترخيص" value={x.license||''} onChange={v=>setX({...x,license:v})}/><Input label="العنوان" value={x.address} onChange={v=>setX({...x,address:v})}/><Input label="تاريخ انتهاء العقد" value={x.contractEnd} onChange={v=>setX({...x,contractEnd:v})} type="date"/><Input label="عدد الطفايات" value={x.extCount} onChange={v=>setX({...x,extCount:v as any})} type="number"/><button className="primary wide">حفظ المنشأة</button></form></Modal>}
function LeadForm({initial,close,onSave}:{initial?:Lead|null;close:()=>void;onSave:(x:Lead)=>void}){const [x,setX]=useState<Lead>(initial||{id:uid(),client:'',facility:'',phone:'',address:'',createdAt:Date.now()});return <Modal title={initial?'تعديل العميل المحتمل':'إضافة عميل محتمل'} close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,createdAt:initial?.createdAt||Date.now()})}}><Input label="اسم العميل" value={x.client} onChange={v=>setX({...x,client:v})} required/><Input label="اسم المنشأة" value={x.facility} onChange={v=>setX({...x,facility:v})} required/><Input label="رقم الهاتف / واتساب" value={x.phone} onChange={v=>setX({...x,phone:v})} required/><Input label="الموقع / العنوان" value={x.address} onChange={v=>setX({...x,address:v})} required/><button className="primary wide">حفظ التعديلات</button></form></Modal>}
function VisitForm({sites,delegates,initial,close,onSave}:{sites:Site[];delegates:Delegate[];initial?:Visit|null;close:()=>void;onSave:(x:Visit)=>void}){const [x,setX]=useState<Visit>(initial||{id:uid(),siteId:sites[0]?.id||'',date:new Date().toISOString().slice(0,10),status:'مجدولة',notes:''});return <Modal title="تسجيل زيارة" close={close}><form onSubmit={e=>{e.preventDefault();onSave(x)}}><label>المنشأة<select value={x.siteId} onChange={e=>setX({...x,siteId:e.target.value})}>{sites.map(s=><option key={s.id} value={s.id}>{s.facility}</option>)}</select></label><label>المندوب المسؤول<select value={x.delegateId||''} onChange={e=>setX({...x,delegateId:e.target.value||undefined})}><option value="">غير محدد</option>{delegates.filter(d=>d.active).map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label><Input label="التاريخ" value={x.date} onChange={v=>setX({...x,date:v})} type="date" required/><Input label="الحالة" value={x.status} onChange={v=>setX({...x,status:v})}/><Input label="ملاحظات" value={x.notes} onChange={v=>setX({...x,notes:v})}/><button className="primary wide" disabled={!sites.length}>حفظ الزيارة</button></form></Modal>}
function MaintenanceForm({sites,delegates,initial,close,onSave}:{sites:Site[];delegates:Delegate[];initial?:Maintenance|null;close:()=>void;onSave:(x:Maintenance)=>void}){const [x,setX]=useState<Maintenance>(initial||{id:uid(),siteId:sites[0]?.id||'',client:'',date:new Date().toISOString().slice(0,10),expiryDate:'',service:'فحص وصيانة الطفايات',count:1,technician:''});return <Modal title={initial?'تعديل سجل الصيانة':'تسجيل صيانة'} close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,client:x.client?.trim()||'',count:Number(x.count||0)})}}><Input label="اسم العميل" value={x.client||''} onChange={v=>setX({...x,client:v})} required/><label>المنشأة<select value={x.siteId} onChange={e=>setX({...x,siteId:e.target.value})}>{sites.map(s=><option key={s.id} value={s.id}>{s.facility}</option>)}</select></label><label>المندوب / الفني المسؤول<select value={x.delegateId||''} onChange={e=>setX({...x,delegateId:e.target.value||undefined,technician:delegates.find(d=>d.id===e.target.value)?.name||x.technician})}><option value="">غير محدد</option>{delegates.filter(d=>d.active).map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label><Input label="الخدمة" value={x.service} onChange={v=>setX({...x,service:v})}/><Input label="التاريخ" value={x.date} onChange={v=>setX({...x,date:v})} type="date"/><Input label="تاريخ انتهاء الصيانة" value={x.expiryDate} onChange={v=>setX({...x,expiryDate:v})} type="date"/><Input label="عدد الطفايات" value={x.count} onChange={v=>setX({...x,count:v as any})} type="number"/><Input label="اسم الفني" value={x.technician} onChange={v=>setX({...x,technician:v})}/><button className="primary wide">حفظ سجل الصيانة</button></form></Modal>}
function DelegateForm({initial,close,onSave}:{initial?:Delegate|null;close:()=>void;onSave:(x:Delegate)=>void}){const [x,setX]=useState<Delegate>(initial||{id:uid(),name:'',phone:'',password:'',active:true});return <Modal title="إضافة مندوب" close={close}><form onSubmit={e=>{e.preventDefault();onSave(x)}}><Input label="اسم المندوب" value={x.name} onChange={v=>setX({...x,name:v})} required/><Input label="رقم الجوال (اسم الدخول)" value={x.phone} onChange={v=>setX({...x,phone:v})} required/><Input label="كلمة مرور المندوب" value={x.password} onChange={v=>setX({...x,password:v})} required/><label>الحالة<select value={x.active?'active':'inactive'} onChange={e=>setX({...x,active:e.target.value==='active'})}><option value="active">نشط</option><option value="inactive">موقوف</option></select></label><button className="primary wide">حفظ المندوب</button></form></Modal>}
