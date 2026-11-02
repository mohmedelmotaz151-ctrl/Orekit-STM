import { useRef, useState, type MouseEvent, type PointerEvent } from 'react';

type Mark = { id:string; type:string; x:number; y:number };
const STORE='orkeit-fire-plan-v1';
const tools=[
 {type:'smoke',label:'كاشف دخان',symbol:'د',color:'#c62828'},
 {type:'heat',label:'كاشف حراري',symbol:'ح',color:'#ef6c00'},
 {type:'manual',label:'نقطة نداء يدوية',symbol:'ن',color:'#6a1b9a'},
 {type:'horn',label:'جرس / صافرة إنذار',symbol:'ج',color:'#ad1457'},
 {type:'panel',label:'لوحة إنذار',symbol:'ل',color:'#4527a0'},
 {type:'sprinkler',label:'رشاش حريق',symbol:'ر',color:'#1565c0'},
 {type:'extinguisher',label:'طفاية حريق',symbol:'ط',color:'#d32f2f'},
 {type:'hose',label:'صندوق / بكرة خرطوم',symbol:'خ',color:'#00838f'},
 {type:'pump',label:'مضخة حريق',symbol:'ض',color:'#283593'},
 {type:'light',label:'إنارة طوارئ',symbol:'إ',color:'#558b2f'},
 {type:'exit',label:'لوحة مخرج',symbol:'م',color:'#2e7d32'},
 {type:'door',label:'باب طوارئ',symbol:'ب',color:'#37474f'}
];
const id=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
function saved(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
export default function FirePlanEditor(){
 const old=saved();
 const [facility,setFacility]=useState(old?.facility||'');
 const [image,setImage]=useState(old?.image||'');
 const [fileName,setFileName]=useState(old?.fileName||'');
 const [marks,setMarks]=useState<Mark[]>(old?.marks||[]);
 const [active,setActive]=useState('smoke');
 const [notice,setNotice]=useState('');
 const [pdfName,setPdfName]=useState('');
 const stage=useRef<HTMLDivElement>(null);
 const imgInput=useRef<HTMLInputElement>(null);
 const pdfInput=useRef<HTMLInputElement>(null);
 const upload=(file?:File)=>{
  if(!file)return;
  if(!file.type.startsWith('image/')){setNotice('يرجى رفع المخطط كصورة PNG أو JPG حتى يمكن وضع الرموز فوقه.');return}
  if(file.size>10*1024*1024){setNotice('حجم الصورة أكبر من 10 ميغابايت. يرجى تصغيرها أولًا.');return}
  const reader=new FileReader();
  reader.onload=()=>{setImage(String(reader.result||''));setFileName(file.name);setMarks([]);setNotice('تم رفع المخطط. اختر رمزًا ثم اضغط على موضعه.');};
  reader.onerror=()=>setNotice('تعذر قراءة الصورة.');
  reader.readAsDataURL(file);
 };
 const add=(e:MouseEvent<HTMLDivElement>)=>{
  if(!stage.current||(e.target as HTMLElement).closest('[data-mark]')||!image)return;
  const r=stage.current.getBoundingClientRect();
  const x=Math.max(1,Math.min(99,(e.clientX-r.left)/r.width*100));
  const y=Math.max(1,Math.min(99,(e.clientY-r.top)/r.height*100));
  setMarks(old=>[...old,{id:id(),type:active,x,y}]);
 };
 const move=(e:PointerEvent<HTMLButtonElement>,mark:Mark)=>{
  e.preventDefault();e.stopPropagation();
  const r=stage.current?.getBoundingClientRect();if(!r)return;
  const setPos=(cx:number,cy:number)=>setMarks(old=>old.map(m=>m.id===mark.id?{...m,x:Math.max(1,Math.min(99,(cx-r.left)/r.width*100)),y:Math.max(1,Math.min(99,(cy-r.top)/r.height*100))}:m));
  setPos(e.clientX,e.clientY);
  const onMove=(ev:PointerEvent)=>setPos(ev.clientX,ev.clientY);
  const onUp=()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp)};
  window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp,{once:true});
 };
 const save=()=>{
  try{localStorage.setItem(STORE,JSON.stringify({facility,image,fileName,marks,updatedAt:Date.now()}));setNotice('حُفظ المخطط والعلامات على هذا الجهاز والمتصفح فقط؛ لم تتم مزامنتها مع بقية المستخدمين.')}
  catch{setNotice('تعذر الحفظ بسبب حجم الصورة. ارفع صورة أصغر ثم حاول مجددًا.')}
 };
 const exportPlan=()=>{
  if(!image)return;
  const img=new Image();
  img.onload=()=>{
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const ctx=canvas.getContext('2d');if(!ctx)return;ctx.drawImage(img,0,0);
   marks.forEach(m=>{const t=tools.find(x=>x.type===m.type);if(!t)return;const x=m.x*canvas.width/100,y=m.y*canvas.height/100,rad=Math.max(12,canvas.width/100);
    ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();ctx.lineWidth=Math.max(2,canvas.width/600);ctx.strokeStyle=t.color;ctx.stroke();
    ctx.fillStyle=t.color;ctx.font='bold '+Math.max(13,canvas.width/75)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t.symbol,x,y);
   });
   canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Orkeit-fire-plan-marked.png';a.click();URL.revokeObjectURL(url)},'image/png');
  };img.src=image;
 };
 const counts=tools.map(t=>({...t,count:marks.filter(m=>m.type===t.type).length})).filter(t=>t.count);
 return <section className="firePlanPage" dir="rtl">
 <style>{".firePlanPage{display:grid;gap:15px}.fpHero,.fpPanel{background:var(--card,#fff);border:1px solid var(--border,#e0e5ec);border-radius:14px;padding:16px}.fpHero{background:linear-gradient(125deg,#101d38,#263c5d);color:#fff}.fpHero h1{margin:6px 0}.fpHero p{line-height:1.8}.fpFields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.fpFields label{display:flex;flex-direction:column;gap:6px;font-weight:600}.fpFields input{border:1px solid #d5dce6;border-radius:9px;padding:10px;font:inherit;min-width:0}.fpActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.fpActions button{border:0;border-radius:9px;padding:10px 13px;font:inherit;cursor:pointer}.fpPrimary{background:#a51f2b;color:#fff}.fpSecondary{background:#eef1f5;color:#202a3a}.fpNotice{background:#fff7e8;border-right:4px solid #c77d0a;padding:12px;border-radius:8px;line-height:1.8}.fpTools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.fpTool{display:flex;gap:7px;align-items:center;text-align:right;background:#fff;color:#1d2735;border:1px solid #d9e0e9;border-radius:10px;padding:8px 5px;font:inherit;cursor:pointer}.fpTool.selected{outline:2px solid #b42332;background:#fff4f4}.fpGlyph{display:inline-flex;align-items:center;justify-content:center;flex:0 0 29px;height:29px;border:2px solid currentColor;border-radius:50%;font-weight:800;font-size:12px}.fpStage{position:relative;width:100%;line-height:0;cursor:crosshair;background:#eef1f5;border-radius:10px;overflow:hidden}.fpStage>img{display:block;width:100%;height:auto}.fpMark{position:absolute;transform:translate(-50%,-50%);width:30px;height:30px;border:2px solid currentColor;background:#fff;border-radius:50%;font-size:12px;font-weight:800;line-height:1;cursor:grab;touch-action:none;z-index:2}.fpMark:active{cursor:grabbing}.fpHelp,.fpStatus{font-size:13px;line-height:1.8;color:#5f6b7d}.fpCounts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fpCount{display:flex;gap:8px;align-items:center;border:1px solid #e0e5ec;padding:8px;border-radius:9px}.fpLegend{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.fpLegend span{font-size:12px;display:flex;align-items:center;gap:5px}@media(max-width:600px){.fpFields,.fpCounts{grid-template-columns:1fr}.fpTools{grid-template-columns:repeat(2,minmax(0,1fr))}.fpPanel,.fpHero{padding:12px}}"}
 </style>
 <header className="fpHero"><small>ORKEIT STM • FIRE SYSTEM PLANS</small><h1>مخطط الإطفاء والإنذار</h1><p>ارفع صورة المخطط المعماري ثم ضع رموز أجهزة الإطفاء والإنذار على مواقعها، وحرّك الرموز وعدّلها وصدّر نسخة توضيحية.</p></header>
 <div className="fpNotice"><strong>تنبيه هندسي:</strong> هذه الأداة تساعد المهندس في وضع الرموز على الرسم فقط. لا تولّد تصميمًا معتمدًا ولا تحدد تلقائيًا التغطية أو المسافات أو سعة المضخات. يلزم مراجعة المخطط والحسابات وفق الكود السعودي ومتطلبات الجهة المختصة.</div>
 <section className="fpPanel"><h2>١. بيانات المشروع ورفع المخطط</h2><div className="fpFields"><label>اسم المنشأة / المشروع<input value={facility} onChange={e=>setFacility(e.target.value)} placeholder="اسم المنشأة"/></label><label>اسم المخطط أو الدور<input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="مثال: الدور الأرضي"/></label></div>
 <div className="fpActions"><button type="button" className="fpPrimary" onClick={()=>imgInput.current?.click()}>رفع صورة المخطط PNG / JPG</button><button type="button" className="fpSecondary" onClick={()=>pdfInput.current?.click()}>اختيار ملف PDF</button><input ref={imgInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0])}/><input ref={pdfInput} hidden type="file" accept="application/pdf,.pdf" onChange={e=>{const f=e.target.files?.[0];if(f){setPdfName(f.name);setNotice('تم اختيار '+f.name+'. لتحرير المخطط داخل الأداة، حوّل الصفحة المطلوبة من PDF إلى صورة PNG/JPG وارفعها. ملف PDF الأصلي لا يُعدّل هنا.')}}}/></div>{pdfName&&<p className="fpStatus">ملف PDF المختار: {pdfName}</p>}{notice&&<p className="fpStatus" role="status">{notice}</p>}</section>
 <section className="fpPanel"><h2>٢. وضع رموز الأجهزة على المخطط</h2><p className="fpHelp">اختر رمزًا ثم اضغط على موضع الجهاز في الرسم. اسحب الرمز لتحريكه، واضغط عليه مرتين لحذفه.</p><div className="fpTools">{tools.map(t=><button type="button" key={t.type} className={"fpTool "+(active===t.type?'selected':'')} onClick={()=>setActive(t.type)}><span className="fpGlyph" style={{color:t.color}}>{t.symbol}</span><span>{t.label}</span></button>)}</div>
 {image?<div ref={stage} className="fpStage" onClick={add}><img src={image} alt="المخطط المرفوع"/>{marks.map(m=>{const t=tools.find(x=>x.type===m.type)!;return <button key={m.id} data-mark="true" type="button" className="fpMark" title={t.label+' — اضغط مرتين للحذف'} style={{left:m.x+'%',top:m.y+'%',color:t.color}} onDoubleClick={e=>{e.stopPropagation();setMarks(old=>old.filter(x=>x.id!==m.id))}} onPointerDown={e=>move(e,m)}>{t.symbol}</button>})}</div>:<div style={{padding:35,textAlign:'center',background:'#f4f6f9',borderRadius:10}}>ارفع صورة المخطط لبدء إضافة الرموز.</div>}
 <div className="fpLegend">{tools.filter(t=>marks.some(m=>m.type===t.type)).map(t=><span key={t.type}><i className="fpGlyph" style={{color:t.color,width:23,height:23,flexBasis:23}}>{t.symbol}</i>{t.label}: {marks.filter(m=>m.type===t.type).length}</span>)}</div>
 <div className="fpActions"><button className="fpPrimary" type="button" onClick={save}>حفظ المخطط والعلامات</button><button className="fpSecondary" type="button" onClick={exportPlan} disabled={!image}>تصدير المخطط المعلّم PNG</button><button className="fpSecondary" type="button" onClick={()=>setMarks([])}>مسح الرموز</button></div></section>
 <section className="fpPanel"><h2>٣. ملخص الرموز الموضوعة</h2>{counts.length?<div className="fpCounts">{counts.map(t=><div className="fpCount" key={t.type}><span className="fpGlyph" style={{color:t.color}}>{t.symbol}</span><span style={{flex:1}}>{t.label}</span><strong>{t.count}</strong></div>)}</div>:<p className="fpHelp">لم تُضف رموزًا بعد.</p>}</section>
 <div className="fpNotice">الحفظ في هذه النسخة محلي على الجهاز والمتصفح، ولا تتم مزامنته مع المستخدمين الآخرين أو قاعدة البيانات. لا تستخدم النسخة التوضيحية كبديل عن المخططات التنفيذية المعتمدة والموقعة من المهندس المختص.</div>
 </section>;
}
