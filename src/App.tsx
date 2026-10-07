import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { deleteCloud, firebaseConfigured, loadCloud, saveCloud, subscribeCloud } from './cloudStore';

type Site={id:string;client:string;facility:string;phone:string;address:string;contractEnd:string;extCount:number};
type Visit={id:string;siteId:string;date:string;status:string;notes:string};
type Maintenance={id:string;siteId:string;date:string;expiryDate:string;service:string;count:number;technician:string};
type Delegate={id:string;name:string;phone:string;active:boolean};
type ServiceRequest={id:string;customerId:string;customerName:string;phone:string;service:string;facility:string;address:string;status:string;note:string;createdAt:number;updatedAt:number};
type CustomerRecord={id:string;name:string;phone:string;facility:string;address:string;updatedAt:number};

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
const notifyOutside=(title:string,body:string)=>{
 if(typeof window!=='undefined' && 'Notification' in window && Notification.permission==='granted'){
   try{new Notification(title,{body,icon:'/pwa-192x192.png',tag:title})}catch{}
 }
};
const requestNotificationPermission=async()=>{
 if(typeof window!=='undefined' && 'Notification' in window && Notification.permission==='default'){
   try{await Notification.requestPermission()}catch{}
 }
};
function NotificationBell({items,title='الإشعارات'}:{items:string[];title?:string}){
 const [open,setOpen]=useState(false);
 const count=items.length;
 return <div className="notificationWrap">
   <button type="button" className="notificationBell" onClick={()=>{setOpen(!open);void requestNotificationPermission()}} aria-label={title}>🔔{count>0&&<span>{count>99?'99+':count}</span>}</button>
   {open&&<div className="notificationPanel"><div className="notificationHead"><strong>{title}</strong><button onClick={()=>setOpen(false)}>×</button></div>{count?<>{items.slice(0,12).map((x,i)=><div className="notificationItem" key={i}>⚠️ {x}</div>)}</>:<div className="empty">لا توجد إشعارات جديدة.</div>}<small>اضغط الجرس للسماح بإشعارات الجهاز.</small></div>}
 </div>
}



export default function App(){
 const [loggedIn,setLoggedIn]=useState(()=>localStorage.getItem(AUTH_KEY)==='1');
 const [customerPortal,setCustomerPortal]=useState(false);
 if(customerPortal) return <CustomerPortal onBack={()=>setCustomerPortal(false)}/>;
 if(!loggedIn) return <Login onLogin={()=>setLoggedIn(true)} onCustomer={()=>setCustomerPortal(true)}/>;
 return <Dashboard onLogout={()=>{localStorage.removeItem(AUTH_KEY);setLoggedIn(false)}}/>;
}
function Login({onLogin,onCustomer}:{onLogin:()=>void;onCustomer:()=>void}){
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('');
 const submit=(e:FormEvent)=>{e.preventDefault();if(username.trim()===USERNAME&&password===PASSWORD){localStorage.setItem(AUTH_KEY,'1');onLogin()}else setError('اسم المستخدم أو كلمة المرور غير صحيحة.')};
 return <div className="loginPage"><div className="loginCard"><div className="loginLogo">O</div><p className="eyebrow">ORKEIT SAFETY</p><h1>تسجيل الدخول</h1><p className="loginHint">نظام زيارات الدفاع المدني</p><form onSubmit={submit}><label>اسم المستخدم<input inputMode="numeric" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/></label><label>كلمة المرور<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="error">{error}</div>}<button className="primary wide">دخول إلى النظام</button></form><div className="customerGate"><span>عميل وتريد طلب خدمة؟</span><button type="button" className="customerButton" onClick={onCustomer}>اطلب خدمة</button></div></div></div>;
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
 useEffect(()=>{void requestNotificationPermission();},[]);
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
    if(firebaseConfigured){await saveCloud('customers',customer);await saveCloud('requests',req)}
    setRequests(x=>[req,...x]);setSelectedService('');setForm({name,phone,facility:'',address:''});
    alert('تم إرسال الطلب بنجاح. رقم المتابعة: '+req.id);
   }catch(e){console.error(e);alert('تعذر إرسال الطلب، حاول مرة أخرى.')}
 };
 const steps=['جديد','قيد المراجعة','تم التسعير','تم اعتماد الطلب','جاري التنفيذ','مكتمل'];
 return <div className="loginPage"><div className="servicesCard">
  <div className="serviceTop"><div><p className="eyebrow">ORKEIT SAFETY</p><h1>خدمات الدفاع المدني</h1><p>مرحبًا {user.name}، اختر الخدمة المطلوبة.</p></div><div className="serviceActions"><NotificationBell items={noticeItems} title="تحديثات طلباتك"/><button className="switchAuth" onClick={onLogout}>خروج</button></div></div>
  {!selectedService?<><div className="serviceGrid">{services.map((x,i)=><button className="serviceItem" key={x} onClick={()=>setSelectedService(x)}><span>{String(i+1).padStart(2,'0')}</span><strong>{x}</strong><b>طلب الخدمة ←</b></button>)}</div></>:
  <section className="requestFormCard"><button className="backLink" type="button" onClick={()=>setSelectedService('')}>← العودة للخدمات</button><h2>إكمال إجراءات الطلب</h2><p>الخدمة المطلوبة: <b>{selectedService}</b></p>
   <label>اسم العميل<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
   <label>رقم الجوال<input inputMode="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></label>
   <label>اسم المنشأة<input value={form.facility} onChange={e=>setForm({...form,facility:e.target.value})} required/></label>
   <label>موقع المنشأة / العنوان<textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} rows={3} required/></label>
   <button className="primary wide" type="button" onClick={()=>void order()}>إرسال طلب الخدمة</button>
  </section>}
  <div className="requestSection"><h2>متابعة طلباتي</h2>{loading&&<p>جاري تحميل الطلبات...</p>}{!loading&&!requests.length&&<div className="empty">لا توجد طلبات حتى الآن.</div>}
   {requests.map(r=><article className="requestCard" key={r.id}><div className="requestHead"><strong>{r.service}</strong><span>{r.id}</span></div><p><b>المنشأة:</b> {r.facility}</p><p><b>الموقع:</b> {r.address}</p><p>الحالة: <b>{r.status}</b></p><p>{r.note}</p><div className="timeline">{steps.map((s,i)=><span className={steps.indexOf(r.status)>=i?'done':''} key={s}>{s}</span>)}</div><small>آخر تحديث: {new Date(r.updatedAt).toLocaleString('ar-SA')}</small></article>)}
  </div>
 </div></div>;
}
function Dashboard({onLogout}:{onLogout:()=>void}){
 const [sites,setSites]=useState<Site[]>(()=>load('/sites',[]));
 const [visits,setVisits]=useState<Visit[]>(()=>load('/visits',[]));
 const [maintenance,setMaintenance]=useState<Maintenance[]>(()=>load('/maintenance',[]));
 const [delegates,setDelegates]=useState<Delegate[]>(()=>load('/delegates',[]));
 const [requests,setRequests]=useState<ServiceRequest[]>(()=>load('/requests',[]));
 const [noticeItems,setNoticeItems]=useState<string[]>([]);
 const previousRequests=useRef<Record<string,number>>({});
 const firstRequestSnapshot=useRef(true);
 const [cloudReady,setCloudReady]=useState(false);
 useEffect(()=>{void requestNotificationPermission();},[]);
 useEffect(()=>{let unsub:(()=>void)|undefined;(async()=>{try{if(firebaseConfigured){unsub=await subscribeCloud<ServiceRequest>('requests',all=>{
   const sorted=all.sort((a,b)=>b.updatedAt-a.updatedAt);
   setRequests(sorted);save('/requests',sorted);
   if(!firstRequestSnapshot.current){
    sorted.filter(x=>!previousRequests.current[x.id]).forEach(x=>{
      const msg=`خدمة جديدة: ${x.service} — ${x.customerName} — ${x.facility}`;
      setNoticeItems(n=>[msg,...n].slice(0,20));notifyOutside('Orkeit — طلب خدمة جديد',msg);
    });
   }
   previousRequests.current=Object.fromEntries(sorted.map(x=>[x.id,x.updatedAt]));
   firstRequestSnapshot.current=false;
 },e=>console.error('Admin realtime error',e));}}catch(e){console.error(e)}})();return()=>{unsub?.()};},[]);
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
 const [page,setPage]=useState<'home'|'sites'|'visits'|'maintenance'|'delegates'|'requests'>('home');
 const [open,setOpen]=useState<string|null>(null),[menu,setMenu]=useState(false),[editing,setEditing]=useState<any>(null);
 const update=(setter:any,key:string,kind:'sites'|'visits'|'maintenance'|'delegates'|'requests')=>(value:any)=>{
   setter(value);
   save(key,value);
   if(firebaseConfigured){
     const records=value as any[];
     void Promise.all(records.map(item=>saveCloud(kind,item))).catch(err=>console.error('Firebase save failed',err));
   }
 };
 const removeCloudRecord=(kind:'sites'|'visits'|'maintenance'|'delegates'|'requests',id:string)=>{if(firebaseConfigured)void deleteCloud(kind,id).catch(err=>console.error('Firebase delete failed',err))};
 const setSitesSafe=update(setSites,'/sites','sites'),setVisitsSafe=update(setVisits,'/visits','visits'),setMaintenanceSafe=update(setMaintenance,'/maintenance','maintenance'),setDelegatesSafe=update(setDelegates,'/delegates','delegates'),setRequestsSafe=update(setRequests,'/requests','requests');
 const expiryAlerts=useMemo(()=>{
   const alerts:string[]=[];
   sites.forEach(s=>{if(s.contractEnd){const d=daysUntil(s.contractEnd);const label=expiryLabel(d);if(label)alerts.push(`${label}: عقد ${s.facility||s.client} ينتهي في ${s.contractEnd}`)}});
   maintenance.forEach(m=>{if(m.expiryDate){const d=daysUntil(m.expiryDate);const label=expiryLabel(d);if(label)alerts.push(`${label}: صيانة طفايات ${sites.find(s=>s.id===m.siteId)?.facility||'منشأة'} تنتهي في ${m.expiryDate}`)}});
   return alerts;
 },[sites,maintenance]);
 const expiring=expiryAlerts.length;
 const nav=[['home','الرئيسية'],['sites','المواقع والمنشآت'],['visits','الزيارات'],['maintenance','صيانة الطفايات'],['delegates','المناديب'],['requests','طلبات العملاء']] as const;
 const go=(p:any)=>{setPage(p);setMenu(false);setOpen(null);setEditing(null)};
 const add=(kind:string)=>{setEditing(null);setOpen(kind)};
 const remove=(kind:string,id:string)=>{if(!confirm('هل تريد حذف السجل؟'))return;if(kind==='site'){setSitesSafe(sites.filter(x=>x.id!==id));removeCloudRecord('sites',id)}if(kind==='visit'){setVisitsSafe(visits.filter(x=>x.id!==id));removeCloudRecord('visits',id)}if(kind==='maintenance'){setMaintenanceSafe(maintenance.filter(x=>x.id!==id));removeCloudRecord('maintenance',id)}if(kind==='delegate'){setDelegatesSafe(delegates.filter(x=>x.id!==id));removeCloudRecord('delegates',id)}};
 return <div className="app">
  <header><button className="menuBtn" onClick={()=>setMenu(!menu)}>☰</button><div className="logo"><b>O</b><span><strong>ORKEIT</strong><small>زيارات الدفاع المدني</small></span></div><div className="headerTag">{firebaseConfigured&&cloudReady?"متصل بقاعدة البيانات":"وضع محلي — أكمل إعداد Firebase"}</div><NotificationBell items={[...noticeItems,...expiryAlerts]} title="تنبيهات النظام"/><button className="logout" onClick={onLogout}>خروج</button></header>
  {menu&&<><div className="backdrop" onClick={()=>setMenu(false)}/><aside>{nav.map(([k,l])=><button className={page===k?'active':''} key={k} onClick={()=>go(k)}>{l}</button>)}</aside></>}
  <main>
   {page==='home'&&<><section className="hero"><div><p className="eyebrow">ORKEIT SAFETY</p><h1>إدارة زيارات الدفاع المدني</h1><p>منشآت، زيارات، صيانة طفايات ومناديب في نظام واحد.</p></div><button className="primary" onClick={()=>add('site')}>＋ إضافة منشأة</button></section><div className="stats"><Stat n={sites.length} t="المنشآت"/><Stat n={visits.length} t="الزيارات"/><Stat n={maintenance.length} t="الصيانة"/><Stat n={expiring} t="تنبيهات قريبة"/></div><section className="panel"><h2>الوصول السريع</h2><div className="quick">{nav.slice(1).map(([k,l])=><button key={k} onClick={()=>go(k)}>{l}<span>›</span></button>)}</div></section></>}
   {page==='sites'&&<ListPage title="المواقع والمنشآت" add={()=>add('site')}><div className="grid">{sites.map(s=><Card key={s.id} title={s.facility||'منشأة'} lines={[s.client,s.phone,s.address,s.contractEnd?'انتهاء العقد: '+s.contractEnd:'']} badge={'الطفايات: '+s.extCount} del={()=>remove('site',s.id)}/>)}</div>{!sites.length&&<Empty/>}</ListPage>}
   {page==='visits'&&<ListPage title="الزيارات" add={()=>add('visit')}><div className="grid">{visits.map(v=>{const s=sites.find(x=>x.id===v.siteId);return <Card key={v.id} title={s?.facility||'موقع محذوف'} lines={[v.date,v.status,v.notes]} del={()=>remove('visit',v.id)}/>})}</div>{!visits.length&&<Empty/>}</ListPage>}
   {page==='maintenance'&&<ListPage title="صيانة الطفايات" add={()=>add('maintenance')}><div className="grid">{maintenance.map(m=><Card key={m.id} title={sites.find(s=>s.id===m.siteId)?.facility||'منشأة'} lines={[m.service,m.date,'الفني: '+m.technician]} badge={'العدد: '+m.count} del={()=>remove('maintenance',m.id)}/>)}</div>{!maintenance.length&&<Empty/>}</ListPage>}
   {page==='requests'&&<ListPage title="طلبات العملاء" add={()=>{}}><div className="grid">{requests.sort((a,b)=>b.updatedAt-a.updatedAt).map(r=><RequestAdminCard key={r.id} request={r} onSave={x=>{setRequestsSafe(requests.map(q=>q.id===x.id?x:q))}} onDelete={()=>{setRequestsSafe(requests.filter(q=>q.id!==r.id));removeCloudRecord('requests',r.id)}}/>)}</div>{!requests.length&&<Empty/>}</ListPage>}
   {page==='delegates'&&<ListPage title="المناديب" add={()=>add('delegate')}><div className="grid">{delegates.map(d=><Card key={d.id} title={d.name} lines={[d.phone,d.active?'نشط':'موقوف']} del={()=>remove('delegate',d.id)}/>)}</div>{!delegates.length&&<Empty/>}</ListPage>}
  </main>
  {open==='site'&&<SiteForm initial={editing} close={()=>setOpen(null)} onSave={x=>{setSitesSafe([x,...sites.filter(s=>s.id!==x.id)]);setOpen(null)}}/>}
  {open==='visit'&&<VisitForm sites={sites} initial={editing} close={()=>setOpen(null)} onSave={x=>{setVisitsSafe([x,...visits.filter(v=>v.id!==x.id)]);setOpen(null)}}/>}
  {open==='maintenance'&&<MaintenanceForm sites={sites} initial={editing} close={()=>setOpen(null)} onSave={x=>{setMaintenanceSafe([x,...maintenance.filter(m=>m.id!==x.id)]);setOpen(null)}}/>}
  {open==='delegate'&&<DelegateForm initial={editing} close={()=>setOpen(null)} onSave={x=>{setDelegatesSafe([x,...delegates.filter(d=>d.id!==x.id)]);setOpen(null)}}/>}
 </div>
}
function RequestAdminCard({request,onSave,onDelete}:{request:ServiceRequest;onSave:(x:ServiceRequest)=>void;onDelete:()=>void}){
 const statuses=['جديد','قيد المراجعة','تم التسعير','تم اعتماد الطلب','جاري التنفيذ','مكتمل','مرفوض'];
 const [status,setStatus]=useState(request.status),[note,setNote]=useState(request.note);
 const saveIt=()=>{const x={...request,status,note,updatedAt:Date.now()};onSave(x);if(firebaseConfigured)void saveCloud('requests',x).catch(e=>console.error(e));};
 return <article className="card requestAdmin"><h3>{request.service}</h3><p><b>رقم الطلب:</b> {request.id}</p><p><b>العميل:</b> {request.customerName} · {request.phone}</p><label>حالة الطلب<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>ملاحظة للعميل<textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}/></label><button className="primary wide" onClick={saveIt}>تحديث حالة الطلب</button><button className="delete" onClick={onDelete}>حذف الطلب</button></article>
}
function Stat({n,t}:{n:number;t:string}){return <div className="stat"><strong>{n}</strong><span>{t}</span></div>}
function ListPage({title,add,children}:{title:string;add:()=>void;children:any}){return <section><div className="pageTitle"><h1>{title}</h1><button className="primary" onClick={add}>＋ إضافة</button></div>{children}</section>}
function Card({title,lines,badge,del}:{title:string;lines:string[];badge?:string;del:()=>void}){return <article className="card"><h3>{title}</h3>{lines.filter(Boolean).map((x,i)=><p key={i}>{x}</p>)}{badge&&<span className="badge">{badge}</span>}<button className="delete" onClick={del}>حذف</button></article>}
function Empty(){return <div className="empty">لا توجد سجلات حتى الآن.</div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:any}){return <div className="modalBg"><div className="modal"><div className="modalHead"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>}
function Input({label,value,onChange,type='text',required=false}:{label:string;value:any;onChange:(v:string)=>void;type?:string;required?:boolean}){return <label>{label}<input type={type} value={value??''} onChange={e=>onChange(e.target.value)} required={required}/></label>}
function SiteForm({initial,close,onSave}:{initial?:Site|null;close:()=>void;onSave:(x:Site)=>void}){const [x,setX]=useState<Site>(initial||{id:uid(),client:'',facility:'',phone:'',address:'',contractEnd:'',extCount:0});return <Modal title="إضافة منشأة" close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,extCount:Number(x.extCount||0)})}}><Input label="اسم العميل" value={x.client} onChange={v=>setX({...x,client:v})} required/><Input label="اسم المنشأة" value={x.facility} onChange={v=>setX({...x,facility:v})} required/><Input label="رقم الجوال" value={x.phone} onChange={v=>setX({...x,phone:v})}/><Input label="العنوان" value={x.address} onChange={v=>setX({...x,address:v})}/><Input label="تاريخ انتهاء العقد" value={x.contractEnd} onChange={v=>setX({...x,contractEnd:v})} type="date"/><Input label="عدد الطفايات" value={x.extCount} onChange={v=>setX({...x,extCount:v as any})} type="number"/><button className="primary wide">حفظ المنشأة</button></form></Modal>}
function VisitForm({sites,initial,close,onSave}:{sites:Site[];initial?:Visit|null;close:()=>void;onSave:(x:Visit)=>void}){const [x,setX]=useState<Visit>(initial||{id:uid(),siteId:sites[0]?.id||'',date:new Date().toISOString().slice(0,10),status:'مجدولة',notes:''});return <Modal title="تسجيل زيارة" close={close}><form onSubmit={e=>{e.preventDefault();onSave(x)}}><label>المنشأة<select value={x.siteId} onChange={e=>setX({...x,siteId:e.target.value})}>{sites.map(s=><option key={s.id} value={s.id}>{s.facility}</option>)}</select></label><Input label="التاريخ" value={x.date} onChange={v=>setX({...x,date:v})} type="date" required/><Input label="الحالة" value={x.status} onChange={v=>setX({...x,status:v})}/><Input label="ملاحظات" value={x.notes} onChange={v=>setX({...x,notes:v})}/><button className="primary wide" disabled={!sites.length}>حفظ الزيارة</button></form></Modal>}
function MaintenanceForm({sites,initial,close,onSave}:{sites:Site[];initial?:Maintenance|null;close:()=>void;onSave:(x:Maintenance)=>void}){const [x,setX]=useState<Maintenance>(initial||{id:uid(),siteId:sites[0]?.id||'',date:new Date().toISOString().slice(0,10),expiryDate:'',service:'فحص وصيانة الطفايات',count:1,technician:''});return <Modal title="تسجيل صيانة" close={close}><form onSubmit={e=>{e.preventDefault();onSave({...x,count:Number(x.count||0)})}}><label>المنشأة<select value={x.siteId} onChange={e=>setX({...x,siteId:e.target.value})}>{sites.map(s=><option key={s.id} value={s.id}>{s.facility}</option>)}</select></label><Input label="الخدمة" value={x.service} onChange={v=>setX({...x,service:v})}/><Input label="التاريخ" value={x.date} onChange={v=>setX({...x,date:v})} type="date"/><Input label="تاريخ انتهاء الصيانة" value={x.expiryDate} onChange={v=>setX({...x,expiryDate:v})} type="date"/><Input label="عدد الطفايات" value={x.count} onChange={v=>setX({...x,count:v as any})} type="number"/><Input label="اسم الفني" value={x.technician} onChange={v=>setX({...x,technician:v})}/><button className="primary wide" disabled={!sites.length}>حفظ</button></form></Modal>}
function DelegateForm({initial,close,onSave}:{initial?:Delegate|null;close:()=>void;onSave:(x:Delegate)=>void}){const [x,setX]=useState<Delegate>(initial||{id:uid(),name:'',phone:'',active:true});return <Modal title="إضافة مندوب" close={close}><form onSubmit={e=>{e.preventDefault();onSave(x)}}><Input label="اسم المندوب" value={x.name} onChange={v=>setX({...x,name:v})} required/><Input label="رقم الجوال" value={x.phone} onChange={v=>setX({...x,phone:v})}/><label>الحالة<select value={x.active?'active':'inactive'} onChange={e=>setX({...x,active:e.target.value==='active'})}><option value="active">نشط</option><option value="inactive">موقوف</option></select></label><button className="primary wide">حفظ المندوب</button></form></Modal>}
