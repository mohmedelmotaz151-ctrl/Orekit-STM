import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';

type Mark = { id:string; type:string; x:number; y:number; x2?:number; y2?:number; layer?:string };
const STORE='orkeit-fire-plan-v2';
const LEGACY_STORE='orkeit-fire-plan-v1';
const planKey=(kind:string)=>STORE+'-'+kind;
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
 {type:'door',label:'باب مع قوس الفتح',symbol:'D',color:'#37474f'},
 {type:'line',label:'جدار / خط معماري',symbol:'W',color:'#263238'},
 {type:'pipeSprinkler',label:'خط تغذية الرشاشات',symbol:'━━',color:'#1565c0'},
 {type:'pipeHose',label:'خط تغذية الصناديق',symbol:'═',color:'#00838f'},\n {type:'dimension',label:'قياس / بُعد',symbol:'↔',color:'#455a64'}
];
const id=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
const segmentTypes=['line','door','pipeSprinkler','pipeHose','dimension'];\nconst layerFor=(type:string)=>['smoke','heat','manual','horn','panel','light','exit'].includes(type)?'alarm':['sprinkler','extinguisher','hose','pump','pipeSprinkler','pipeHose'].includes(type)?'fire':'architecture';
function saved(kind='alarm'){try{return JSON.parse(localStorage.getItem(planKey(kind))|| (kind==='alarm'?localStorage.getItem(LEGACY_STORE):null) ||'null')}catch{return null}}
export default function FirePlanEditor(){
 const [planType,setPlanType]=useState<'alarm'|'extinguishing'>(()=>{try{return (localStorage.getItem(STORE+'-active') as 'alarm'|'extinguishing')||'alarm'}catch{return 'alarm'}});
 const old=saved(planType);
 const [facility,setFacility]=useState(old?.facility||'');
 const [image,setImage]=useState(old?.image||'');
 const [blankSheet,setBlankSheet]=useState(Boolean(old?.blankSheet));
 const [fileName,setFileName]=useState(old?.fileName||'');
 const [marks,setMarks]=useState<Mark[]>(old?.marks||[]);
 const [active,setActive]=useState('smoke');
 const [selectedMark,setSelectedMark]=useState<string|null>(null);
 const [symbolSize,setSymbolSize]=useState(30);
 const [lineWidth,setLineWidth]=useState(2);
 const [zoom,setZoom]=useState(100);\n const [snapEnabled,setSnapEnabled]=useState(true);\n const [unit,setUnit]=useState('m');\n const [pixelsPerUnit,setPixelsPerUnit]=useState(50);
 const history=useRef<Mark[][]>([old?.marks||[]]);
 const historyIndex=useRef(0);
 const skipHistory=useRef(false);
 useEffect(()=>{if(skipHistory.current){skipHistory.current=false;return;}const current=history.current[historyIndex.current];if(JSON.stringify(current)===JSON.stringify(marks))return;history.current=history.current.slice(0,historyIndex.current+1);history.current.push(marks);if(history.current.length>60)history.current.shift();historyIndex.current=history.current.length-1;},[marks]);
 const travelHistory=(delta:number)=>{const next=Math.max(0,Math.min(history.current.length-1,historyIndex.current+delta));if(next===historyIndex.current)return;historyIndex.current=next;skipHistory.current=true;setMarks(history.current[next]);setSelectedMark(null);setNotice(delta<0?'تم التراجع عن آخر تعديل.':'تمت إعادة التعديل.');};
 const [notice,setNotice]=useState('');
 const [pdfName,setPdfName]=useState('');
 const stage=useRef<HTMLDivElement>(null);
 const drawing=useRef<string|null>(null);
 const imgInput=useRef<HTMLInputElement>(null);
 const pdfInput=useRef<HTMLInputElement>(null);
 const upload=(file?:File)=>{
  if(!file)return;
  if(!file.type.startsWith('image/')){setNotice('يرجى رفع المخطط كصورة PNG أو JPG حتى يمكن وضع الرموز فوقه.');return}
  if(file.size>3.5*1024*1024){setNotice('حجم الصورة أكبر من 3.5 ميغابايت. يرجى تصغيرها أولًا.');return}
  const reader=new FileReader();
  reader.onload=()=>{setImage(String(reader.result||''));setBlankSheet(false);setFileName(file.name);setMarks([]);setNotice('تم رفع المخطط. اختر رمزًا ثم اضغط على موضعه.');};
  reader.onerror=()=>setNotice('تعذر قراءة الصورة.');
  reader.readAsDataURL(file);
 };
 const add=(e:MouseEvent<HTMLDivElement>)=>{
  if(!stage.current||(e.target as HTMLElement).closest('[data-mark]')||(!image&&!blankSheet)||segmentTypes.includes(active))return;
  const r=stage.current.getBoundingClientRect();
  const x=Math.max(1,Math.min(99,(e.clientX-r.left)/r.width*100));
  const y=Math.max(1,Math.min(99,(e.clientY-r.top)/r.height*100));
  const mark={id:id(),type:active,x,y};setMarks(old=>[...old,mark]);setSelectedMark(mark.id);
 };
 const point=(clientX:number,clientY:number)=>{
  const r=stage.current?.getBoundingClientRect();if(!r)return {x:1,y:1};
  let x=Math.max(1,Math.min(99,(clientX-r.left)/r.width*100)),y=Math.max(1,Math.min(99,(clientY-r.top)/r.height*100));\n  if(snapEnabled){x=Math.round(x);y=Math.round(y)}\n  return {x,y};
 };
 const startSegment=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if((!image&&!blankSheet)||!segmentTypes.includes(active)||(e.target as HTMLElement).closest('[data-mark]'))return;
  e.preventDefault();const p=point(e.clientX,e.clientY),newId=id();drawing.current=newId;setSelectedMark(newId);
  e.currentTarget.setPointerCapture(e.pointerId);
  setMarks(old=>[...old,{id:newId,type:active,x:p.x,y:p.y,x2:p.x,y2:p.y,layer:layerFor(active)}]);
 };
 const updateSegment=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(!drawing.current)return;const p=point(e.clientX,e.clientY),drawingId=drawing.current;
  setMarks(old=>old.map(m=>m.id===drawingId?{...m,x2:p.x,y2:p.y}:m));
 };
 const endSegment=()=>{drawing.current=null};
 const doorPath=(m:Mark)=>{
  const x2=m.x2??m.x,y2=m.y2??m.y,dx=x2-m.x,dy=y2-m.y;
  return `M ${m.x} ${m.y} Q ${(m.x+x2)/2-dy*0.7} ${(m.y+y2)/2+dx*0.7} ${x2} ${y2}`;
 };
 const move=(e:ReactPointerEvent<HTMLButtonElement>,mark:Mark)=>{
  e.preventDefault();e.stopPropagation();
  const r=stage.current?.getBoundingClientRect();if(!r)return;
  const setPos=(cx:number,cy:number)=>setMarks(old=>old.map(m=>m.id===mark.id?{...m,x:Math.max(1,Math.min(99,(cx-r.left)/r.width*100)),y:Math.max(1,Math.min(99,(cy-r.top)/r.height*100))}:m));
  setPos(e.clientX,e.clientY);
  const onMove=(ev:globalThis.PointerEvent)=>setPos(ev.clientX,ev.clientY);
  const onUp=()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp)};
  window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp,{once:true});
 };
 const save=()=>{
  try{localStorage.setItem(planKey(planType),JSON.stringify({facility,image,blankSheet,fileName,marks,updatedAt:Date.now(),planType}));localStorage.setItem(STORE+'-active',planType);setNotice('تم حفظ مخطط '+(planType==='alarm'?'الإنذار':'الإطفاء')+' على هذا الجهاز.')}
  catch{setNotice('تعذر الحفظ بسبب حجم الصورة. ارفع صورة أصغر ثم حاول مجددًا.')}
 };
 const exportPlan=()=>{
  if(!image&&!blankSheet)return;
  const render=(img?:HTMLImageElement)=>{
   const canvas=document.createElement('canvas');canvas.width=img?.naturalWidth||1600;canvas.height=img?.naturalHeight||1131;
   const ctx=canvas.getContext('2d');if(!ctx)return;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);if(img)ctx.drawImage(img,0,0);
   marks.forEach(m=>{const t=tools.find(x=>x.type===m.type);if(!t)return;
    const x=m.x*canvas.width/100,y=m.y*canvas.height/100,x2=(m.x2??m.x)*canvas.width/100,y2=(m.y2??m.y)*canvas.height/100;
    ctx.strokeStyle=t.color;ctx.lineWidth=Math.max(lineWidth,canvas.width/1600);
    if(segmentTypes.includes(m.type)){
     ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();
     if(m.type==='door'){const dx=x2-x,dy=y2-y;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+x2)/2-dy*0.7,(y+y2)/2+dx*0.7,x2,y2);ctx.stroke();}
     return;
    }
    const rad=Math.max(8,symbolSize*canvas.width/Math.max(600,stage.current?.getBoundingClientRect().width||1000)/2);
    ctx.fillStyle='#fff';ctx.strokeStyle=t.color;ctx.lineWidth=Math.max(2,canvas.width/700);
    if(m.type==='smoke'){ctx.beginPath();ctx.arc(x,y,rad*.72,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,rad*.4,0,Math.PI*2);ctx.stroke();}
    else if(m.type==='heat'||m.type==='light'){ctx.beginPath();ctx.moveTo(x,y-rad);ctx.lineTo(x+rad,y);ctx.lineTo(x,y+rad);ctx.lineTo(x-rad,y);ctx.closePath();ctx.stroke();}
    else if(m.type==='sprinkler'||m.type==='manual'){ctx.beginPath();ctx.moveTo(x,y-rad);ctx.lineTo(x+rad,y+rad);ctx.lineTo(x-rad,y+rad);ctx.closePath();ctx.stroke();}
    else if(m.type==='extinguisher'){ctx.strokeRect(x-rad*.45,y-rad*.7,rad*.9,rad*1.4);ctx.beginPath();ctx.moveTo(x,y-rad*.7);ctx.lineTo(x+rad*.5,y-rad);ctx.stroke();}
    else if(m.type==='hose'){ctx.strokeRect(x-rad,y-rad*.7,rad*2,rad*1.4);ctx.beginPath();ctx.arc(x,y,rad*.48,0,Math.PI*2);ctx.stroke();}
    else if(m.type==='panel'){ctx.strokeRect(x-rad*.7,y-rad,rad*1.4,rad*2);ctx.beginPath();ctx.moveTo(x-rad*.4,y-rad*.3);ctx.lineTo(x+rad*.4,y-rad*.3);ctx.moveTo(x-rad*.4,y+rad*.2);ctx.lineTo(x+rad*.4,y+rad*.2);ctx.stroke();}
    else if(m.type==='horn'){ctx.beginPath();ctx.moveTo(x-rad,y-rad*.5);ctx.lineTo(x+rad*.2,y-rad*.5);ctx.lineTo(x+rad,y-rad);ctx.lineTo(x+rad,y+rad);ctx.lineTo(x+rad*.2,y+rad*.5);ctx.lineTo(x-rad,y+rad*.5);ctx.closePath();ctx.stroke();}
    else if(m.type==='pump'){ctx.beginPath();ctx.arc(x,y,rad*.75,0,Math.PI*2);ctx.moveTo(x-rad*.4,y-rad*.4);ctx.lineTo(x+rad*.4,y+rad*.4);ctx.moveTo(x+rad*.4,y-rad*.4);ctx.lineTo(x-rad*.4,y+rad*.4);ctx.stroke();}
    else if(m.type==='exit'){ctx.beginPath();ctx.moveTo(x-rad,y);ctx.lineTo(x+rad,y);ctx.moveTo(x+rad*.4,y-rad*.6);ctx.lineTo(x+rad,y);ctx.lineTo(x+rad*.4,y+rad*.6);ctx.stroke();}
    else {ctx.strokeRect(x-rad*.7,y-rad*.7,rad*1.4,rad*1.4);}
   });
   canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Orkeit-'+(planType==='alarm'?'fire-alarm':'fire-extinguishing')+'-plan-marked.png';a.click();URL.revokeObjectURL(url)},'image/png');
  };
  if(image){const img=new Image();img.onload=()=>render(img);img.onerror=()=>setNotice('تعذر تجهيز المخطط للتصدير.');img.src=image;}else render();
 };
 const counts=tools.map(t=>({...t,count:marks.filter(m=>m.type===t.type).length})).filter(t=>t.count);
 return <section className="firePlanPage" dir="rtl">
 <style>{".firePlanPage{display:grid;gap:15px}.fpHero,.fpPanel{background:var(--card,#fff);border:1px solid var(--border,#e0e5ec);border-radius:14px;padding:16px}.fpHero{background:linear-gradient(125deg,#101d38,#263c5d);color:#fff}.fpHero h1{margin:6px 0}.fpHero p{line-height:1.8}.fpFields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.fpFields label{display:flex;flex-direction:column;gap:6px;font-weight:600}.fpFields input{border:1px solid #d5dce6;border-radius:9px;padding:10px;font:inherit;min-width:0}.fpActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.fpActions button{border:0;border-radius:9px;padding:10px 13px;font:inherit;cursor:pointer}.fpPrimary{background:#a51f2b;color:#fff}.fpSecondary{background:#eef1f5;color:#202a3a}.fpNotice{background:#fff7e8;border-right:4px solid #c77d0a;padding:12px;border-radius:8px;line-height:1.8}.fpTools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.fpTool{display:flex;gap:7px;align-items:center;text-align:right;background:#fff;color:#1d2735;border:1px solid #d9e0e9;border-radius:10px;padding:8px 5px;font:inherit;cursor:pointer}.fpTool.selected{outline:2px solid #b42332;background:#fff4f4}.fpGlyph{display:inline-flex;align-items:center;justify-content:center;flex:0 0 29px;height:29px;border:2px solid currentColor;border-radius:50%;font-weight:800;font-size:12px}.fpViewport{width:100%;max-height:70vh;overflow:auto;border:1px solid #cbd3df;border-radius:10px;background:#e9edf3;overscroll-behavior:contain}.fpStage{position:relative;width:100%;min-width:100%;line-height:0;cursor:crosshair;background-color:#fff;background-image:linear-gradient(#dce3ec 1px,transparent 1px),linear-gradient(90deg,#dce3ec 1px,transparent 1px),linear-gradient(#c5cfdd 1px,transparent 1px),linear-gradient(90deg,#c5cfdd 1px,transparent 1px);background-size:10px 10px,10px 10px,50px 50px,50px 50px;border-radius:2px;overflow:hidden}.fpStage>img{display:block;width:100%;height:auto}.fpStage.fpBlankSheet{aspect-ratio:1600/1131;background:#fff;border:1px solid #b8c1ce;box-shadow:inset 0 0 0 1px #f0f2f5}.fpStage.fpBlankSheet:after{content:'ورقة مخطط جديدة';position:absolute;top:12px;right:14px;color:#d8dde5;font-size:12px;line-height:1;pointer-events:none}.fpDrawing{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}.fpMark{position:absolute;transform:translate(-50%,-50%);min-width:24px;min-height:24px;border:0;background:transparent;font-size:12px;font-weight:800;line-height:1;cursor:grab;touch-action:none;z-index:2;padding:0}.fpMark:active{cursor:grabbing}.fpMark.selected{outline:2px dashed #b42332;outline-offset:3px;border-radius:4px}.fpSymbol{display:block;width:100%;height:100%;overflow:visible}.fpHelp,.fpStatus{font-size:13px;line-height:1.8;color:#5f6b7d}.fpCounts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fpCount{display:flex;gap:8px;align-items:center;border:1px solid #e0e5ec;padding:8px;border-radius:9px}.fpLegend{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.fpSheet{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:12px;align-items:start}.fpSideLegend{border:1px solid #cbd3df;background:#fff;padding:10px;border-radius:8px;line-height:1.6}.fpSideLegend h3{margin:0 0 8px;font-size:14px}.fpLegendRow{display:flex;gap:7px;align-items:center;border-bottom:1px solid #e5e9ef;padding:5px 0;font-size:12px}.fpBottomLegend{border:1px solid #cbd3df;background:#fff;padding:10px;margin-top:10px;border-radius:8px}.fpBottomLegend h3{margin:0 0 8px;font-size:14px}.fpBottomLegend .fpCounts{grid-template-columns:repeat(3,minmax(0,1fr))}@media(max-width:700px){.fpSheet{grid-template-columns:1fr}.fpBottomLegend .fpCounts{grid-template-columns:repeat(2,minmax(0,1fr))}}.fpLegend span{font-size:12px;display:flex;align-items:center;gap:5px}@media(max-width:600px){.fpFields,.fpCounts{grid-template-columns:1fr}.fpTools{grid-template-columns:repeat(2,minmax(0,1fr))}.fpPanel,.fpHero{padding:12px}}"}
 </style>
 <header className="fpHero"><small>ORKEIT STM • FIRE SYSTEM PLANS</small><h1>مخطط الإطفاء والإنذار</h1><p>ارفع صورة المخطط المعماري ثم ضع رموز أجهزة الإطفاء والإنذار على مواقعها، وحرّك الرموز وعدّلها وصدّر نسخة توضيحية.</p></header>
 <div className="fpNotice"><strong>تنبيه هندسي:</strong> هذه الأداة تساعد المهندس في وضع الرموز على الرسم فقط. لا تولّد تصميمًا معتمدًا ولا تحدد تلقائيًا التغطية أو المسافات أو سعة المضخات. يلزم مراجعة المخطط والحسابات وفق الكود السعودي ومتطلبات الجهة المختصة.</div>
 <section className="fpPanel"><h2>نوع المخطط</h2><div className="fpActions"><button type="button" className={planType==='alarm'?'fpPrimary':'fpSecondary'} onClick={()=>{localStorage.setItem(planKey(planType),JSON.stringify({facility,image,blankSheet,fileName,marks,updatedAt:Date.now(),planType}));setPlanType('alarm');const p=saved('alarm');setFacility(p?.facility||facility);setImage(p?.image||'');setBlankSheet(Boolean(p?.blankSheet));setFileName(p?.fileName||'');setMarks(p?.marks||[]);localStorage.setItem(STORE+'-active','alarm');setNotice('تم فتح لوحة الإنذار المستقلة.')}}>مخطط إنذار الحريق</button><button type="button" className={planType==='extinguishing'?'fpPrimary':'fpSecondary'} onClick={()=>{localStorage.setItem(planKey(planType),JSON.stringify({facility,image,blankSheet,fileName,marks,updatedAt:Date.now(),planType}));setPlanType('extinguishing');const p=saved('extinguishing');setFacility(p?.facility||facility);setImage(p?.image||image);setFileName(p?.fileName||fileName);setMarks(p?.marks||[]);localStorage.setItem(STORE+'-active','extinguishing');setNotice('تم فتح لوحة الإطفاء المستقلة.')}}>مخطط الإطفاء</button><button type="button" className="fpSecondary" onClick={()=>{const other=planType==='alarm'?'extinguishing':'alarm';localStorage.setItem(planKey(other),JSON.stringify({facility,image,blankSheet,fileName,marks:[],updatedAt:Date.now(),planType:other}));setNotice('تم نسخ خلفية المخطط إلى اللوحة الأخرى، مع ترك الرموز فارغة.')}}>استنساخ الخلفية إلى اللوحة الأخرى</button></div><p className="fpHelp">لكل نظام حفظ مستقل. انسخ الخلفية المعمارية نفسها ثم وزّع رموز النظام الآخر بصورة مستقلة.</p></section>
 <section className="fpPanel"><h2>١. بيانات المشروع ورفع المخطط</h2><div className="fpFields"><label>اسم المنشأة / المشروع<input value={facility} onChange={e=>setFacility(e.target.value)} placeholder="اسم المنشأة"/></label><label>اسم المخطط أو الدور<input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="مثال: الدور الأرضي"/></label></div>
 <div className="fpActions"><button type="button" className="fpPrimary" onClick={()=>{setImage('');setBlankSheet(true);setFileName('');setMarks([]);setPdfName('');setNotice('تم إنشاء ورقة بيضاء جديدة. أضف الحوائط والأبواب ثم بقية رموز المخطط.')}}>بدء مخطط من الصفر — ورقة بيضاء</button><button type="button" className="fpSecondary" onClick={()=>imgInput.current?.click()}>رفع صورة المخطط PNG / JPG</button><button type="button" className="fpSecondary" onClick={()=>pdfInput.current?.click()}>اختيار ملف PDF</button><input ref={imgInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0])}/><input ref={pdfInput} hidden type="file" accept="application/pdf,.pdf" onChange={e=>{const f=e.target.files?.[0];if(f){setPdfName(f.name);setNotice('تم اختيار '+f.name+'. لتحرير المخطط داخل الأداة، حوّل الصفحة المطلوبة من PDF إلى صورة PNG/JPG وارفعها. ملف PDF الأصلي لا يُعدّل هنا.')}}}/></div>{pdfName&&<p className="fpStatus">ملف PDF المختار: {pdfName}</p>}{notice&&<p className="fpStatus" role="status">{notice}</p>}</section>
 <section className="fpPanel"><h2>٢. رسم المخطط والأنظمة</h2><p className="fpHelp">الرموز مرسومة بأشكال هندسية بدل الحروف داخل الدوائر. اختر الجدار أو الباب أو خط الأنابيب واسحب لرسمه. استخدم التكبير وشريطَي التمرير لتحريك مساحة العمل، والشبكة للمساعدة في محاذاة العناصر. يمكن التراجع عن التعديلات وإعادتها.</p><div className="fpFields"><label>تكبير / تصغير مساحة الرسم: {zoom}%<input type="range" min="50" max="200" step="10" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><label>وحدة القياس<select value={unit} onChange={e=>setUnit(e.target.value)}><option value="m">متر</option><option value="cm">سنتيمتر</option><option value="mm">ملليمتر</option><option value="ft">قدم</option></select></label><label>معايرة القياس: عدد وحدات الرسم في 100%<input type="number" min="1" max="1000" value={pixelsPerUnit} onChange={e=>setPixelsPerUnit(Math.max(1,Number(e.target.value)||1))}/></label><label style={{display:'flex',flexDirection:'row',alignItems:'center',gap:8}}><input type="checkbox" checked={snapEnabled} onChange={e=>setSnapEnabled(e.target.checked)}/> تفعيل الالتقاط إلى الشبكة</label><label>حجم الرموز: {symbolSize}px<input type="range" min="18" max="52" step="2" value={symbolSize} onChange={e=>setSymbolSize(Number(e.target.value))}/></label><label>سماكة الخطوط: {lineWidth}px<input type="range" min="1" max="8" step="0.5" value={lineWidth} onChange={e=>setLineWidth(Number(e.target.value))}/></label></div><div className="fpActions"><button type="button" className="fpSecondary" disabled={!historyIndex.current} onClick={()=>travelHistory(-1)}>↶ تراجع</button><button type="button" className="fpSecondary" disabled={historyIndex.current>=history.current.length-1} onClick={()=>travelHistory(1)}>↷ إعادة</button><button type="button" className="fpSecondary" disabled={!selectedMark} onClick={()=>{setMarks(old=>old.filter(m=>m.id!==selectedMark));setSelectedMark(null)}}>حذف العنصر المحدد</button></div><div className="fpTools">{tools.map(t=><button type="button" key={t.type} className={"fpTool "+(active===t.type?'selected':'')} onClick={()=>setActive(t.type)}><span className="fpGlyph" style={{color:t.color}}>{t.type==='smoke'?'◎':t.type==='heat'?'◇':t.type==='sprinkler'?'♧':t.type==='extinguisher'?'▯':t.type==='hose'?'▣':t.type==='line'?'━':t.type==='door'?'◜':t.type==='pipeSprinkler'?'━━':t.type==='pipeHose'?'══':t.symbol}</span><span>{t.label}</span></button>)}</div>
 {(image||blankSheet)?<div className="fpSheet"><div className="fpViewport"><div ref={stage} style={{width:zoom+'%',minWidth:zoom+'%'}} className={'fpStage '+(!image?'fpBlankSheet':'')} onClick={add} onPointerDown={startSegment} onPointerMove={updateSegment} onPointerUp={endSegment} onPointerCancel={endSegment}>{image&&<img src={image} alt="المخطط المرفوع"/>}<svg className="fpDrawing" viewBox="0 0 100 100" preserveAspectRatio="none">{marks.filter(m=>segmentTypes.includes(m.type)).map(m=><g key={m.id} stroke={selectedMark===m.id?'#b42332':tools.find(t=>t.type===m.type)?.color||'#263238'} strokeWidth={selectedMark===m.id?lineWidth+1.5:lineWidth} fill="none" style={{pointerEvents:'stroke',cursor:'pointer'}} onClick={e=>{e.stopPropagation();setSelectedMark(m.id)}} onDoubleClick={e=>{e.stopPropagation();setMarks(old=>old.filter(x=>x.id!==m.id));setSelectedMark(null)}}><line x1={m.x} y1={m.y} x2={m.x2??m.x} y2={m.y2??m.y}/>{m.type==='door'&&<path d={doorPath(m)}/ >}{m.type==='dimension'&&<><path d={`M ${m.x-1} ${m.y-1} l 2 2 M ${(m.x2??m.x)-1} ${(m.y2??m.y)-1} l 2 2`}/><text x={(m.x+(m.x2??m.x))/2} y={(m.y+(m.y2??m.y))/2-1} fill="#455a64" stroke="white" strokeWidth="0.25" paintOrder="stroke" fontSize="2.5" textAnchor="middle">{(Math.hypot((m.x2??m.x)-m.x,(m.y2??m.y)-m.y)*1.6/Math.max(1,pixelsPerUnit)).toFixed(2)} {unit}</text></>}}</g>)}</svg>{marks.filter(m=>!segmentTypes.includes(m.type)).map(m=>{const t=tools.find(x=>x.type===m.type)!;return <button key={m.id} data-mark="true" type="button" className={'fpMark '+(selectedMark===m.id?'selected':'')} title={t.label+' — تحديد ثم حذف'} style={{left:m.x+'%',top:m.y+'%',width:symbolSize,height:symbolSize,color:t.color}} onClick={e=>{e.stopPropagation();setSelectedMark(m.id)}} onDoubleClick={e=>{e.stopPropagation();setMarks(old=>old.filter(x=>x.id!==m.id));setSelectedMark(null)}} onPointerDown={e=>move(e,m)}><svg className="fpSymbol" viewBox="0 0 40 40" aria-label={t.label}>{m.type==='smoke'?<g fill="none" stroke="currentColor" strokeWidth="2"><circle cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="7"/><path d="M20 2v5M20 33v5M2 20h5M33 20h5"/></g>:m.type==='heat'?<path d="M20 3 37 20 20 37 3 20Z" fill="none" stroke="currentColor" strokeWidth="2.5"/>:m.type==='manual'?<path d="M20 3 37 36H3Z" fill="none" stroke="currentColor" strokeWidth="2.5"/>:m.type==='horn'?<path d="M5 14h14l14-8v28l-14-8H5Z" fill="none" stroke="currentColor" strokeWidth="2.5"/>:m.type==='panel'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="8" y="3" width="24" height="34"/><path d="M13 12h14M13 19h14M13 26h7"/></g>:m.type==='sprinkler'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 2v11M8 13h24M10 16l-6 12M30 16l6 12M16 16l-3 8M24 16l3 8"/></g>:m.type==='extinguisher'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="10" y="10" width="20" height="27" rx="2"/><path d="M15 10V5h10l5 5M15 5V2h10"/></g>:m.type==='hose'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="5" width="34" height="30"/><circle cx="20" cy="20" r="10"/><circle cx="20" cy="20" r="4"/></g>:m.type==='pump'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="20" cy="20" r="15"/><path d="M12 12l16 16M28 12 12 28"/></g>:m.type==='light'?<path d="M20 3 37 20 20 37 3 20Z" fill="none" stroke="currentColor" strokeWidth="2.5"/>:m.type==='exit'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20h26M22 12l8 8-8 8M5 5v30"/></g>:<rect x="4" y="4" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"/>}</svg></button>})}</div></div><aside className="fpSideLegend"><h3>مفتاح الرموز</h3>{tools.filter(t=>marks.some(m=>m.type===t.type)).map(t=><div className="fpLegendRow" key={t.type}><i className="fpGlyph" style={{color:t.color,width:24,height:24,flexBasis:24}}>{t.symbol}</i><span>{t.label}</span><strong style={{marginInlineStart:'auto'}}>{marks.filter(m=>m.type===t.type).length}</strong></div>)}{!marks.length&&<p className="fpHelp">تظهر الرموز هنا بعد إضافتها.</p>}</aside></div>:<div style={{padding:35,textAlign:'center',background:'#f4f6f9',borderRadius:10}}>ارفع صورة مخطط أو اختر «بدء مخطط من الصفر» لإنشاء ورقة بيضاء.</div>}
 <div className="fpBottomLegend"><h3>جدول الرموز والأعداد</h3><div className="fpCounts">{tools.map(t=><div className="fpCount" key={t.type}><span className="fpGlyph" style={{color:t.color}}>{t.symbol}</span><span style={{flex:1}}>{t.label}</span><strong>{marks.filter(m=>m.type===t.type).length}</strong></div>)}</div></div>
 <div className="fpLegend">{tools.filter(t=>marks.some(m=>m.type===t.type)).map(t=><span key={t.type}><i className="fpGlyph" style={{color:t.color,width:23,height:23,flexBasis:23}}>{t.symbol}</i>{t.label}: {marks.filter(m=>m.type===t.type).length}</span>)}</div>
 <div className="fpActions"><button className="fpPrimary" type="button" onClick={save}>حفظ المخطط والعلامات</button><button className="fpSecondary" type="button" onClick={exportPlan} disabled={!image&&!blankSheet}>تصدير المخطط المعلّم PNG</button><button className="fpSecondary" type="button" onClick={()=>setMarks([])}>مسح الرموز</button></div></section>
 <section className="fpPanel"><h2>٣. ملخص الرموز الموضوعة</h2>{counts.length?<div className="fpCounts">{counts.map(t=><div className="fpCount" key={t.type}><span className="fpGlyph" style={{color:t.color}}>{t.symbol}</span><span style={{flex:1}}>{t.label}</span><strong>{t.count}</strong></div>)}</div>:<p className="fpHelp">لم تُضف رموزًا بعد.</p>}</section>
 <div className="fpNotice">الحفظ في هذه النسخة محلي على الجهاز والمتصفح، ولا تتم مزامنته مع المستخدمين الآخرين أو قاعدة البيانات. لا تستخدم النسخة التوضيحية كبديل عن المخططات التنفيذية المعتمدة والموقعة من المهندس المختص.</div>
 </section>;
}
