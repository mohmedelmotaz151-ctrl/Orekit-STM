import{collection,doc,deleteDoc,onSnapshot,setDoc}from'firebase/firestore';import{db}from'../firebase';

const cols={sites:'orkeit_sites',contracts:'orkeit_contracts',maintenance:'orkeit_extinguisher_maintenance',delegates:'users',visits:'orkeit_visits',customers:'orkeit_customers',requests:'orkeit_service_requests'} as const;
const clean=(v:any):any=>{if(v===undefined)return null;if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(clean);const o:any={};Object.entries(v).forEach(([k,x])=>o[k]=clean(x));return o};
const sub=(key:keyof typeof cols,setter:(x:any[])=>void)=>onSnapshot(collection(db,cols[key]),snap=>{const a:any[]=[];snap.forEach(x=>{const d:any=x.data();if(key==='delegates'&&d.role&&d.role!=='agent'&&d.role!=='delegate')return;a.push({id:x.id,...d})});setter(a)},e=>console.error('Firestore '+key+' listener:',e));
const save=(key:keyof typeof cols,x:any)=>setDoc(doc(db,cols[key],x.id),clean(x),{merge:true});
const del=(key:keyof typeof cols,id:string)=>deleteDoc(doc(db,cols[key],id));

const siteValue=(x:any,...keys:string[])=>{for(const k of keys){const v=x?.[k];if(v!==undefined&&v!==null&&String(v).trim()!=='')return v}return''};
const siteKey=(x:any)=>{const id=siteValue(x,'id','siteId');if(id)return'id:'+String(id).trim().toLowerCase();const phone=String(siteValue(x,'phone','mobile','contactPhone')).replace(/\\D/g,'');const facility=String(siteValue(x,'facility','siteName','name')).trim().toLowerCase();const client=String(siteValue(x,'client','clientName','customerName')).trim().toLowerCase();if(phone&&(facility||client))return'person:'+phone+'|'+facility+'|'+client;const lat=siteValue(x,'lat','latitude'),lng=siteValue(x,'lng','longitude');if(lat!==''&&lng!=='')return'geo:'+Number(lat).toFixed(6)+'|'+Number(lng).toFixed(6);return'fallback:'+facility+'|'+client+'|'+phone+'|'+String(siteValue(x,'address')).trim().toLowerCase()};
const mergeSites=(current:any[],old:any[],local:any[])=>{const result:any[]=[];const seen=new Set<string>();for(const source of [current,old,local])for(const raw of Array.isArray(source)?source:[]){if(!raw||typeof raw!=='object')continue;const key=siteKey(raw);if(seen.has(key))continue;seen.add(key);result.push({...raw})}return result};

export const subscribeSites=(f:(x:any[])=>void)=>{let current:any[]=[];let old:any[]=[];let local:any[]=[];let unsubCurrent:undefined|(()=>void);let unsubOld:undefined|(()=>void);try{const raw=localStorage.getItem('ork_s');const parsed=raw?JSON.parse(raw):[];if(Array.isArray(parsed))local=parsed}catch(e){console.warn('تعذر قراءة ork_s:',e)}const emit=()=>f(mergeSites(current,old,local));unsubCurrent=onSnapshot(collection(db,'orkeit_sites'),snap=>{current=[];snap.forEach(x=>current.push({id:x.id,...x.data()}));emit()},e=>console.error('Firestore orkeit_sites listener:',e));unsubOld=onSnapshot(collection(db,'sites'),snap=>{old=[];snap.forEach(x=>old.push({id:x.id,...x.data()}));emit()},e=>console.error('Firestore sites listener:',e));emit();return()=>{unsubCurrent?.();unsubOld?.()}};

export const subscribeContracts=(f:(x:any[])=>void)=>sub('contracts',f);
export const subscribeMaintenance=(f:(x:any[])=>void)=>{
  let current:any[]=[];let legacy:any[]=[];let local:any[]=[];
  try{const raw=localStorage.getItem('ork_maintenance');const parsed=raw?JSON.parse(raw):[];if(Array.isArray(parsed))local=parsed}catch(e){console.warn('تعذر قراءة صيانة الطفايات المحلية:',e)}
  const emit=()=>{const seen=new Set<string>();const out:any[]=[];for(const source of [current,legacy,local])for(const x of source){if(!x||!x.id||seen.has(String(x.id)))continue;seen.add(String(x.id));out.push(x)}f(out)};
  const a=onSnapshot(collection(db,'orkeit_extinguisher_maintenance'),snap=>{current=[];snap.forEach(x=>current.push({id:x.id,...x.data()}));emit()},e=>{console.error('Firestore صيانة الطفايات:',e);emit()});
  const b=onSnapshot(collection(db,'maintenance'),snap=>{legacy=[];snap.forEach(x=>legacy.push({id:x.id,...x.data()}));emit()},e=>{console.warn('Firestore legacy maintenance:',e);emit()});
  emit();return()=>{a();b()};
};
export const subscribeDelegates=(f:(x:any[])=>void)=>sub('delegates',f);
export const subscribeVisits=(f:(x:any[])=>void)=>sub('visits',f);
export const saveSite=(x:any)=>save('sites',x);
export const saveContract=(x:any)=>save('contracts',x);
export const saveMaintenance=async(x:any)=>{
  const item=clean({...x,updatedAt:Date.now()});
  try{
    await setDoc(doc(db,'orkeit_extinguisher_maintenance',item.id),item,{merge:true});
    try{localStorage.setItem('ork_maintenance',JSON.stringify([item,...JSON.parse(localStorage.getItem('ork_maintenance')||'[]').filter((q:any)=>q?.id!==item.id)]))}catch{}
    return item;
  }catch(e){
    try{localStorage.setItem('ork_maintenance',JSON.stringify([item,...JSON.parse(localStorage.getItem('ork_maintenance')||'[]').filter((q:any)=>q?.id!==item.id)]))}catch{}
    console.error('فشل حفظ صيانة الطفايات في Firebase:',e);
    throw e;
  }
};
export const saveDelegate=(x:any)=>save('delegates',{...x,role:'agent'});
export const saveVisit=(x:any)=>save('visits',x);
export const deleteSite=(id:string)=>del('sites',id);
export const deleteContract=(id:string)=>del('contracts',id);
export const deleteMaintenance=async(id:string)=>{await del('maintenance',id).catch(()=>{});await deleteDoc(doc(db,'orkeit_extinguisher_maintenance',id)).catch(e=>console.warn('تعذر حذف صيانة الطفايات من Firebase:',e));try{localStorage.setItem('ork_maintenance',JSON.stringify(JSON.parse(localStorage.getItem('ork_maintenance')||'[]').filter((q:any)=>q?.id!==id)))}catch{}};
export const deleteDelegate=(id:string)=>del('delegates',id);
export const subscribeCustomers=(f:(x:any[])=>void)=>sub('customers',f);
export const subscribeRequests=(f:(x:any[])=>void)=>sub('requests',f);
export const saveCustomer=(x:any)=>save('customers',x);
export const saveRequest=(x:any)=>save('requests',x);
