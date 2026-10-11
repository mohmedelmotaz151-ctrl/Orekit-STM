import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firebaseConfigured, loadCloud, saveCloud } from './cloudStore';
import { storage } from './firebase';

type Props={user:{id:string;name?:string;phone?:string;profilePhoto?:string};onClose:()=>void};
type Facility={id:string;customerId?:string;ownerCustomerId?:string;client?:string;facility:string;phone?:string;address:string;contractEnd?:string;extCount?:number;lat?:number;lng?:number;photoUrl?:string;createdByRole?:string;updatedAt?:number};
type RecordItem={id:string;[key:string]:any};
type Profile={id:string;name:string;phone:string;profilePhoto?:string;updatedAt:number};
const accountsKey='orkeit-customer-accounts';
const idOf=()=>crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
const accounts=()=>{try{return JSON.parse(localStorage.getItem(accountsKey)||'[]')}catch{return []}};
const earth=(s:Facility)=>{const q=s.lat!=null&&s.lng!=null?s.lat+','+s.lng:s.address;window.open('https://earth.google.com/web/search/'+encodeURIComponent(q),'_blank','noopener,noreferrer')};
const maps=(s:Facility)=>{const q=s.lat!=null&&s.lng!=null?s.lat+','+s.lng:s.address;window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q),'_blank','noopener,noreferrer')};

export default function CustomerProfile({user,onClose}:Props){
 const [name,setName]=useState(user.name||'');
 const [phone,setPhone]=useState(user.phone||'');
 const [photo,setPhoto]=useState(user.profilePhoto||'');
 const [sites,setSites]=useState<Facility[]>([]);
 const [requests,setRequests]=useState<RecordItem[]>([]);
 const [contracts,setContracts]=useState<RecordItem[]>([]);
 const [maintenance,setMaintenance]=useState<RecordItem[]>([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [adding,setAdding]=useState(false);
 const [profileFile,setProfileFile]=useState<File|null>(null),[siteFile,setSiteFile]=useState<File|null>(null);
 const profileRef=useRef<HTMLInputElement>(null);
 const [form,setForm]=useState({facility:'',address:'',contractEnd:'',extCount:'0',lat:'',lng:''});

 useEffect(()=>{let cancelled=false;void (async()=>{
  try{
   if(!firebaseConfigured)throw new Error('Firebase غير مهيأ؛ تعذر تحميل الملف الشخصي من السحابة.');
   const results=await Promise.all([loadCloud<Facility>('sites'),loadCloud<RecordItem>('requests'),loadCloud<RecordItem>('contracts'),loadCloud<RecordItem>('maintenance'),loadCloud<Profile>('customers')]);
   if(cancelled)return;
   const [allSites,allRequests,allContracts,allMaintenance,allProfiles]=results;
   const mineSites=allSites.filter(s=>s.customerId===user.id||s.ownerCustomerId===user.id||(s.phone===user.phone&&s.createdByRole==='customer'));
   const siteIds=new Set(mineSites.map(s=>s.id));
   const match=(r:RecordItem)=>r.customerId===user.id||r.phone===user.phone||(r.siteId&&siteIds.has(r.siteId))||mineSites.some(s=>(r.facility&&r.facility===s.facility)||(r.client&&r.client===s.client));
   setSites(mineSites.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)));
   setRequests(allRequests.filter(r=>r.customerId===user.id||r.phone===user.phone).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)));
   setContracts(allContracts.filter(match).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)));
   setMaintenance(allMaintenance.filter(match).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))));
   const profile=allProfiles.find(c=>c.id===user.id)||allProfiles.find(c=>c.phone===user.phone);
   if(profile){setName(profile.name||user.name||'');setPhone(profile.phone||user.phone||'');setPhoto(profile.profilePhoto||user.profilePhoto||'')}
  }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'تعذر تحميل بيانات الملف الشخصي.')}
  finally{if(!cancelled)setLoading(false)}
 })();return()=>{cancelled=true}},[user.id,user.phone,user.name,user.profilePhoto]);

 const upload=async(file:File,kind:'profile'|'facility',siteId?:string)=>{
  if(!storage||!firebaseConfigured)throw new Error('خدمة رفع الصور غير مهيأة في Firebase Storage.');
  if(!file.type.startsWith('image/'))throw new Error('اختر ملف صورة صالحًا.');
  if(file.size>8*1024*1024)throw new Error('حجم الصورة أكبر من 8 ميجابايت.');
  const path=kind==='profile'?'customer-profiles/'+user.id+'/profile-'+Date.now():'customer-profiles/'+user.id+'/facilities/'+siteId+'-'+Date.now();
  const object=ref(storage,path);await uploadBytes(object,file,{contentType:file.type});return getDownloadURL(object);
 };
 const saveProfile=async(e:FormEvent)=>{
  e.preventDefault();if(saving)return;setSaving(true);setError('');setNotice('');
  try{
   if(!firebaseConfigured)throw new Error('Firebase غير مهيأ؛ لم يتم حفظ التعديلات.');
   if(!name.trim()||!phone.trim())throw new Error('أدخل اسم العميل ورقم الجوال.');
   const nextPhoto=profileFile?await upload(profileFile,'profile'):photo;
   const profile:Profile={id:user.id,name:name.trim(),phone:phone.trim(),profilePhoto:nextPhoto,updatedAt:Date.now()};
   await saveCloud('customers',profile);
   const list=accounts();let found=false;
   const updated=list.map((x:any)=>{if(x.id===user.id||x.phone===user.phone){found=true;return {...x,name:profile.name,phone:profile.phone,profilePhoto:nextPhoto}}return x});
   if(!found)updated.unshift(profile);
   localStorage.setItem(accountsKey,JSON.stringify(updated));
   localStorage.setItem('orkeit-customer-auth',JSON.stringify({id:user.id,name:profile.name,phone:profile.phone,profilePhoto:nextPhoto}));
   setPhoto(nextPhoto);setProfileFile(null);setNotice('تم حفظ بيانات الملف الشخصي.');
  }catch(e){setError(e instanceof Error?e.message:'تعذر حفظ الملف الشخصي.')}finally{setSaving(false)}
 };
 const addFacility=async(e:FormEvent)=>{
  e.preventDefault();if(saving)return;
  if(!form.facility.trim()||!form.address.trim()){setError('أدخل اسم المنشأة وعنوانها.');return}
  if((form.lat&&!Number.isFinite(Number(form.lat)))||(form.lng&&!Number.isFinite(Number(form.lng)))){setError('أدخل إحداثيات صحيحة.');return}
  setSaving(true);setError('');setNotice('');
  const id=idOf();
  try{
   if(!firebaseConfigured)throw new Error('Firebase غير مهيأ؛ لم يتم حفظ المنشأة.');
   const photoUrl=siteFile?await upload(siteFile,'facility',id):'';
   const row:Facility={id,customerId:user.id,client:name.trim()||user.name||'العميل',facility:form.facility.trim(),phone:phone.trim()||user.phone||'',address:form.address.trim(),contractEnd:form.contractEnd,extCount:Number(form.extCount||0),lat:form.lat?Number(form.lat):undefined,lng:form.lng?Number(form.lng):undefined,photoUrl,createdByRole:'customer',updatedAt:Date.now()};
   await saveCloud('sites',row);setSites(prev=>[row,...prev]);setForm({facility:'',address:'',contractEnd:'',extCount:'0',lat:'',lng:''});setSiteFile(null);setAdding(false);setNotice('تمت إضافة المنشأة إلى ملفك.');
  }catch(e){setError(e instanceof Error?e.message:'تعذر حفظ المنشأة.')}finally{setSaving(false)}
 };
 const locate=()=>{if(!navigator.geolocation){setError('المتصفح لا يدعم تحديد الموقع.');return}navigator.geolocation.getCurrentPosition(p=>setForm(v=>({...v,lat:p.coords.latitude.toFixed(6),lng:p.coords.longitude.toFixed(6)})),()=>setError('تعذر تحديد الموقع؛ تحقق من إذن الموقع في الهاتف.'),{enableHighAccuracy:true,timeout:15000})};
 const siteFor=(id:string)=>sites.find(s=>s.id===id);
 const facilityFor=(r:RecordItem)=>r.facility||r.client||siteFor(r.siteId||'')?.facility||'منشأة';
 return <section className="customerProfile panel" dir="rtl">
  <div className="customerProfileHead"><div><span className="eyebrow">ORKEIT CUSTOMER</span><h2>الملف الشخصي للعميل</h2><p>بيانات العميل والمنشآت والطلبات وعقود الصيانة والطفايات.</p></div><button type="button" className="secondaryBtn" onClick={onClose}>العودة للخدمات</button></div>
  <form className="customerIdentity" onSubmit={saveProfile}>
   <div className="customerAvatarWrap">{photo?<img src={photo} alt="الصورة الشخصية للعميل"/>:<div className="customerAvatarFallback">{(name||user.name||'ع').slice(0,1)}</div>}<button type="button" className="secondaryBtn" onClick={()=>profileRef.current?.click()}>إضافة / تغيير الصورة الشخصية</button><input ref={profileRef} hidden type="file" accept="image/*" onChange={(e:ChangeEvent<HTMLInputElement>)=>setProfileFile(e.target.files?.[0]||null)}/>{profileFile&&<small>الصورة جاهزة للحفظ</small>}</div>
   <div className="customerIdentityFields"><label>اسم العميل<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>رقم الجوال<input inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} required/></label><button className="primary" disabled={saving}>{saving?'جارٍ الحفظ…':'حفظ بيانات الملف'}</button></div>
  </form>
  <div className="customerProfileCounts"><div><strong>{sites.length}</strong><span>منشآتي</span></div><div><strong>{requests.length}</strong><span>طلباتي</span></div><div><strong>{contracts.length}</strong><span>عقود الصيانة</span></div><div><strong>{maintenance.length}</strong><span>سجلات الطفايات</span></div></div>
  <section className="customerProfileSection"><div className="customerProfileSectionHead"><div><h3>منشآتي</h3><p>يمكنك إضافة أكثر من منشأة، وتحديد الموقع وإرفاق صورة لكل واحدة.</p></div><button type="button" className="primary" onClick={()=>setAdding(v=>!v)}>{adding?'إلغاء':'＋ إضافة منشأة أخرى'}</button></div>
   {adding&&<form className="customerFacilityForm" onSubmit={addFacility}><label>اسم المنشأة<input value={form.facility} onChange={e=>setForm(v=>({...v,facility:e.target.value}))} required/></label><label>العنوان / وصف الموقع<textarea rows={2} value={form.address} onChange={e=>setForm(v=>({...v,address:e.target.value}))} placeholder="المدينة، الحي، الشارع أو رابط الموقع" required/></label><div className="customerCoords"><label>خط العرض<input inputMode="decimal" value={form.lat} onChange={e=>setForm(v=>({...v,lat:e.target.value}))} placeholder="21.5433"/></label><label>خط الطول<input inputMode="decimal" value={form.lng} onChange={e=>setForm(v=>({...v,lng:e.target.value}))} placeholder="39.1728"/></label><button type="button" className="secondaryBtn" onClick={locate}>📍 تحديد موقعي</button></div><label>تاريخ انتهاء عقد الصيانة (اختياري)<input type="date" value={form.contractEnd} onChange={e=>setForm(v=>({...v,contractEnd:e.target.value}))}/></label><label>عدد الطفايات<input type="number" min="0" value={form.extCount} onChange={e=>setForm(v=>({...v,extCount:e.target.value}))}/></label><label>صورة المنشأة<input type="file" accept="image/*" onChange={e=>setSiteFile(e.target.files?.[0]||null)}/></label><div className="customerFacilityActions"><button className="primary" disabled={saving}>{saving?'جارٍ الحفظ…':'حفظ المنشأة'}</button><button type="button" className="secondaryBtn" onClick={()=>{const q=form.lat&&form.lng?form.lat+','+form.lng:form.address;window.open('https://earth.google.com/web/search/'+encodeURIComponent(q),'_blank','noopener,noreferrer')}}>فتح Google Earth لتحديد الموقع</button></div></form>}
   {loading?<p>جارٍ تحميل بيانات المنشآت…</p>:sites.length===0?<div className="empty">لم تضف أي منشأة بعد.</div>:<div className="customerFacilityGrid">{sites.map(s=><article className="customerFacilityCard" key={s.id}>{s.photoUrl?<img className="customerFacilityPhoto" src={s.photoUrl} alt={'صورة '+s.facility}/>:<div className="customerFacilityPhoto customerFacilityPhotoEmpty">صورة المنشأة</div>}<div className="customerFacilityBody"><h4>{s.facility}</h4><p>{s.address}</p><div className="customerFacilityMeta"><span>عدد الطفايات: {s.extCount??0}</span>{s.contractEnd&&<span>انتهاء العقد: {s.contractEnd}</span>}</div><div className="customerFacilityActions"><button type="button" className="secondaryBtn" onClick={()=>maps(s)}>فتح في Google Maps</button><button type="button" className="secondaryBtn" onClick={()=>earth(s)}>عرض في Google Earth</button></div></div></article>)}</div>}
  </section>
  <div className="customerTrackingGrid"><section className="customerProfileSection"><h3>متابعة طلباتي</h3>{requests.length?requests.map(r=><article className="customerTrackingCard" key={r.id}><div><strong>{r.service||'طلب خدمة'}</strong><span className="profilePill">{r.status||'جديد'}</span></div><p>رقم الطلب: {r.id}</p><p>المنشأة: {facilityFor(r)}</p><p>{r.note||''}</p><small>{r.createdAt?new Date(r.createdAt).toLocaleString('ar-SA'):'—'}</small></article>):<div className="empty">لا توجد طلبات مرتبطة بهذا الحساب.</div>}</section>
   <section className="customerProfileSection"><h3>عقود الصيانة</h3>{contracts.length?contracts.map(c=><article className="customerTrackingCard" key={c.id}><div><strong>{c.contractNo||c.title||'عقد صيانة'}</strong><span className="profilePill">{c.status||'مسجل'}</span></div><p>المنشأة: {facilityFor(c)}</p><p>رقم العقد: {c.contractNo||c.id}</p><p>بداية العقد: {c.startDate||'—'} · النهاية: {c.endDate||c.contractEnd||'—'}</p><p>{c.scope||''}</p></article>):<div className="empty">لا توجد عقود مرتبطة بمنشآتك حتى الآن.</div>}</section>
   <section className="customerProfileSection"><h3>صيانة وطفايات الحريق</h3>{maintenance.length?maintenance.map(m=><article className="customerTrackingCard" key={m.id}><div><strong>{m.service||'صيانة طفايات الحريق'}</strong><span className="profilePill">{m.expiryDate&&m.expiryDate<new Date().toISOString().slice(0,10)?'منتهية':'سجل صيانة'}</span></div><p>المنشأة: {facilityFor(m)}</p><p>تاريخ الصيانة: {m.date||'—'} · الانتهاء: {m.expiryDate||'—'}</p><p>عدد الطفايات: {m.count??'—'}</p></article>):<div className="empty">لا توجد سجلات صيانة طفايات مرتبطة بمنشآتك حتى الآن.</div>}</section>
  </div>
  {loading&&<p>جارٍ تحميل الملف…</p>}{error&&<div className="error">{error}</div>}{notice&&<div className="profilePill customerProfileNotice">{notice}</div>}
 </section>;
}
