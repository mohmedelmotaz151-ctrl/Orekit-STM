import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';

type Mark = { id:string; type:string; x:number; y:number; x2?:number; y2?:number; layer?:string; rotation?:number };
type SelectedMarkId = string | null;
const STORE='orkeit-fire-plan-v2';
const LEGACY_STORE='orkeit-fire-plan-v1';
const planKey=(kind:string)=>STORE+'-'+kind;
const tools=[
 {type:'smoke',label:'كاشف دخان',symbol:'S',color:'#1565c0'},
 {type:'heat',label:'كاشف حراري',symbol:'H',color:'#1565c0'},
 {type:'manual',label:'نقطة نداء يدوية',symbol:'ن',color:'#6a1b9a'},
 {type:'horn',label:'جرس / صافرة إنذار',symbol:'ج',color:'#ad1457'},
 {type:'panel',label:'لوحة إنذار (Control)',symbol:'control',color:'#263f72'},
 {type:'sprinkler',label:'رشاش حريق',symbol:'ر',color:'#1565c0'},
 {type:'extinguisher',label:'طفاية حريق',symbol:'ط',color:'#d32f2f'},
 {type:'hose',label:'صندوق / بكرة خرطوم',symbol:'خ',color:'#00838f'},
 {type:'pump',label:'مضخة حريق',symbol:'ض',color:'#283593'},
 {type:'light',label:'كشاف / إنارة طوارئ',symbol:'☼',color:'#1565c0'},
 {type:'exit',label:'لوحة مخرج',symbol:'م',color:'#2e7d32'},
 {type:'door',label:'باب مع قوس الفتح',symbol:'D',color:'#37474f'},
 {type:'line',label:'جدار / خط معماري',symbol:'W',color:'#263238'},
 {type:'pipeSprinkler',label:'خط تغذية الرشاشات',symbol:'━━',color:'#1565c0'},
 {type:'pipeHose',label:'خط تغذية الصناديق',symbol:'═',color:'#00838f'},
 {type:'dimension',label:'قياس / بُعد',symbol:'↔',color:'#455a64'}
];
const id=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
const segmentTypes=['line','door','pipeSprinkler','pipeHose','dimension'];
const quantityExcludedTypes=['line','dimension'];
const quantityTools=tools.filter(t=>!quantityExcludedTypes.includes(t.type));
const layerFor=(type:string)=>type==='dimension'?'dimensions':['smoke','heat','manual','horn','panel','light','exit'].includes(type)?'alarm':['sprinkler','extinguisher','hose','pump','pipeSprinkler','pipeHose'].includes(type)?'fire':'architecture';
function saved(kind='alarm'){try{return JSON.parse(localStorage.getItem(planKey(kind))|| (kind==='alarm'?localStorage.getItem(LEGACY_STORE):null) ||'null')}catch{return null}}
export default function FirePlanEditor(){
 const [planType,setPlanType]=useState<'alarm'|'extinguishing'>(()=>{try{return (localStorage.getItem(STORE+'-active') as 'alarm'|'extinguishing')||'alarm'}catch{return 'alarm'}});
 const old=saved(planType);
 const [facility,setFacility]=useState(old?.facility||'');
 const [image,setImage]=useState(old?.image||'');
 const [blankSheet,setBlankSheet]=useState(Boolean(old?.blankSheet));
 const [fileName,setFileName]=useState(old?.fileName||'');
 const [planName,setPlanName]=useState(old?.planName||old?.fileName||'');
 const [ownerName,setOwnerName]=useState(old?.ownerName||'');
 const [contractorName,setContractorName]=useState(old?.contractorName||'');
 const [designerName,setDesignerName]=useState(old?.designerName||'');
 const [drawingNumber,setDrawingNumber]=useState(old?.drawingNumber||'FP-001');
 const [revision,setRevision]=useState(old?.revision||'00');
 const [planDate,setPlanDate]=useState(old?.planDate||new Date().toISOString().slice(0,10));
 const [marks,setMarks]=useState<Mark[]>(old?.marks||[]);
 const [active,setActive]=useState('smoke');
 const [selectedMark,setSelectedMark]=useState<SelectedMarkId>(null);
 const [symbolSize,setSymbolSize]=useState(30);
 const [lineWidth,setLineWidth]=useState(2);
 const [zoom,setZoom]=useState(100);
 const [visibleLayers,setVisibleLayers]=useState<Record<string,boolean>>({architecture:true,fire:true,alarm:true,dimensions:true});
 const isLayerVisible=(m:Mark)=>visibleLayers[m.layer||layerFor(m.type)]!==false;
 const [snapEnabled,setSnapEnabled]=useState(true);
 const [unit,setUnit]=useState('m');
 const [pixelsPerUnit,setPixelsPerUnit]=useState(50);
 const [angleSnap,setAngleSnap]=useState(true);
 const [gridStep,setGridStep]=useState(0.25);
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
  let x=Math.max(1,Math.min(99,(clientX-r.left)/r.width*100)),y=Math.max(1,Math.min(99,(clientY-r.top)/r.height*100));
  if(snapEnabled){x=Math.round(x/gridStep)*gridStep;y=Math.round(y/gridStep)*gridStep}
  return {x,y};
 };
 const startSegment=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if((!image&&!blankSheet)||!segmentTypes.includes(active)||(e.target as HTMLElement).closest('[data-mark]'))return;
  e.preventDefault();const p=point(e.clientX,e.clientY),newId=id();drawing.current=newId;setSelectedMark(newId);
  e.currentTarget.setPointerCapture(e.pointerId);
  setMarks(old=>[...old,{id:newId,type:active,x:p.x,y:p.y,x2:p.x,y2:p.y,layer:layerFor(active)}]);
 };
 const updateSegment=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(!drawing.current)return;const p=point(e.clientX,e.clientY),drawingId=drawing.current;
  setMarks(old=>old.map(m=>{if(m.id!==drawingId)return m;let x2=p.x,y2=p.y;if(angleSnap){const dx=x2-m.x,dy=y2-m.y,len=Math.hypot(dx,dy),step=Math.PI/12,a=Math.round(Math.atan2(dy,dx)/step)*step;x2=m.x+Math.cos(a)*len;y2=m.y+Math.sin(a)*len;}return {...m,x2:Math.max(0,Math.min(100,x2)),y2:Math.max(0,Math.min(100,y2))};}));
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
 const duplicateSelected=()=>{
  const source=marks.find(m=>m.id===selectedMark);if(!source)return;
  const dx=source.x<90?3:-3,dy=source.y<90?3:-3;
  const copy:Mark={...source,id:id(),x:Math.max(1,Math.min(99,source.x+dx)),y:Math.max(1,Math.min(99,source.y+dy)),...(source.x2!==undefined?{x2:Math.max(1,Math.min(99,source.x2+dx))}:{}),...(source.y2!==undefined?{y2:Math.max(1,Math.min(99,source.y2+dy))}:{})};
  setMarks(old=>[...old,copy]);setSelectedMark(copy.id);setNotice('تم استنساخ العنصر. حرّك النسخة إلى موضعها المناسب.');
 };
 const rotateSelected=()=>{
  if(!selectedMark)return;setMarks(old=>old.map(m=>m.id===selectedMark?{...m,rotation:((m.rotation||0)+90)%360}:m));setNotice('تم تدوير العنصر المحدد 90 درجة.');
 };
 const centerSelected=()=>{
  if(!selectedMark)return;
  setMarks(old=>old.map(m=>{if(m.id!==selectedMark)return m;const mx=((m.x2??m.x)+m.x)/2,my=((m.y2??m.y)+m.y)/2,dx=50-mx,dy=50-my;return {...m,x:Math.max(1,Math.min(99,m.x+dx)),y:Math.max(1,Math.min(99,m.y+dy)),...(m.x2!==undefined?{x2:Math.max(1,Math.min(99,m.x2+dx))}:{}),...(m.y2!==undefined?{y2:Math.max(1,Math.min(99,m.y2+dy))}:{})};}));
  setNotice('تم توسيط العنصر المحدد داخل مساحة الرسم.');
 };
 const save=()=>{
  try{localStorage.setItem(planKey(planType),JSON.stringify({facility,image,blankSheet,fileName,planName,ownerName,contractorName,designerName,drawingNumber,revision,planDate,marks,updatedAt:Date.now(),planType}));localStorage.setItem(STORE+'-active',planType);setNotice('تم حفظ مخطط '+(planType==='alarm'?'الإنذار':'الإطفاء')+' على هذا الجهاز.')}
  catch{setNotice('تعذر الحفظ بسبب حجم الصورة. ارفع صورة أصغر ثم حاول مجددًا.')}
 };
 const exportPlan=()=>{
  if(!image&&!blankSheet)return;
  const render=(img?:HTMLImageElement)=>{
   const W=1800,H=1250,drawBox={x:55,y:155,w:1250,h:1010},sideBox={x:1335,y:145,w:400,h:1020};
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
   const ctx=canvas.getContext('2d');if(!ctx)return;
   ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#26364d';ctx.lineWidth=3;ctx.strokeRect(18,18,W-36,H-36);
   ctx.direction='rtl';ctx.textAlign='right';ctx.fillStyle='#13233d';ctx.font='bold 38px Arial, sans-serif';
   ctx.fillText(planName||fileName||facility||'مخطط نظام الحريق',W-65,68);
   ctx.font='bold 24px Arial, sans-serif';ctx.fillStyle='#a51f2b';ctx.fillText(planType==='alarm'?'مخطط نظام إنذار الحريق':'مخطط نظام إطفاء الحريق',W-65,108);
   ctx.strokeStyle='#9aa8ba';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(55,130);ctx.lineTo(W-55,130);ctx.stroke();
   const fields=[['المنشأة / المشروع',facility||'—'],['المالك',ownerName||'—'],['الشركة المنفذة',contractorName||'—'],['المهندس المصمم',designerName||'—'],['رقم المخطط',drawingNumber||'—'],['الإصدار',revision||'00'],['التاريخ',planDate||'—']];
   ctx.fillStyle='#fff';ctx.fillRect(sideBox.x,sideBox.y,sideBox.w,sideBox.h);ctx.strokeStyle='#9aa8ba';ctx.lineWidth=2;ctx.strokeRect(sideBox.x,sideBox.y,sideBox.w,sideBox.h);
   ctx.textAlign='right';ctx.direction='rtl';ctx.fillStyle='#13233d';ctx.font='bold 27px Arial, sans-serif';ctx.fillText('بيانات المشروع',sideBox.x+sideBox.w-18,sideBox.y+38);
   ctx.strokeStyle='#c7d0dc';ctx.beginPath();ctx.moveTo(sideBox.x+14,sideBox.y+52);ctx.lineTo(sideBox.x+sideBox.w-14,sideBox.y+52);ctx.stroke();
   let fieldY=sideBox.y+84;ctx.font='bold 17px Arial, sans-serif';
   fields.forEach((f,i)=>{ctx.fillStyle='#526176';ctx.textAlign='right';ctx.fillText(f[0],sideBox.x+sideBox.w-18,fieldY);ctx.fillStyle='#172438';ctx.font='17px Arial, sans-serif';ctx.textAlign='right';ctx.fillText(String(f[1]),sideBox.x+sideBox.w-18,fieldY+22,sideBox.w-36);fieldY+=54;ctx.font='bold 17px Arial, sans-serif';});
   const legendY=fieldY+4;ctx.fillStyle='#13233d';ctx.textAlign='right';ctx.font='bold 25px Arial, sans-serif';ctx.fillText('جدول الرموز والأعداد',sideBox.x+sideBox.w-18,legendY);
   ctx.strokeStyle='#9aa8ba';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sideBox.x+14,legendY+14);ctx.lineTo(sideBox.x+sideBox.w-14,legendY+14);ctx.stroke();
   const activeTools=quantityTools.filter(t=>marks.some(m=>m.type===t.type)),rowH=34;
   activeTools.forEach((t,i)=>{const y=legendY+48+i*rowH; if(y>sideBox.y+sideBox.h-18)return;ctx.fillStyle='#f8fafc';ctx.fillRect(sideBox.x+10,y-22,sideBox.w-20,29);ctx.strokeStyle='#dce3ec';ctx.lineWidth=1;ctx.strokeRect(sideBox.x+10,y-22,sideBox.w-20,29);ctx.strokeStyle=t.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(sideBox.x+sideBox.w-30,y-8,8,0,Math.PI*2);ctx.stroke();ctx.fillStyle=t.color;ctx.font='bold 12px Arial, sans-serif';ctx.textAlign='center';ctx.fillText(t.symbol,sideBox.x+sideBox.w-30,y-4);ctx.fillStyle='#243247';ctx.font='16px Arial, sans-serif';ctx.textAlign='right';ctx.fillText(t.label,sideBox.x+sideBox.w-48,y-3,sideBox.w-100);ctx.textAlign='left';ctx.font='bold 18px Arial, sans-serif';ctx.fillText(String(marks.filter(m=>m.type===t.type).length),sideBox.x+20,y-3);});
   let dw=drawBox.w,dh=drawBox.h,aspect=img?(img.naturalWidth/img.naturalHeight):(1600/1131);
   if(aspect>dw/dh)dh=dw/aspect;else dw=dh*aspect;
   const dx=drawBox.x+(drawBox.w-dw)/2,dy=drawBox.y+(drawBox.h-dh)/2;
   ctx.fillStyle='#f8fafc';ctx.fillRect(drawBox.x,drawBox.y,drawBox.w,drawBox.h);ctx.strokeStyle='#aeb9c8';ctx.lineWidth=2;ctx.strokeRect(drawBox.x,drawBox.y,drawBox.w,drawBox.h);
   if(img)ctx.drawImage(img,dx,dy,dw,dh);else{ctx.fillStyle='#fff';ctx.fillRect(dx,dy,dw,dh);ctx.strokeStyle='#dce3ec';ctx.lineWidth=1;ctx.strokeRect(dx,dy,dw,dh);ctx.fillStyle='#aab4c2';ctx.font='22px Arial, sans-serif';ctx.textAlign='right';ctx.fillText('ورقة مخطط جديدة',dx+dw-20,dy+30);}
   const sx=dw/100,sy=dh/100,baseScale=dw/Math.max(1,stage.current?.getBoundingClientRect().width||1000);
   marks.filter(isLayerVisible).forEach(m=>{const t=tools.find(x=>x.type===m.type);if(!t)return;const x=dx+m.x*sx,y=dy+m.y*sy,x2=dx+(m.x2??m.x)*sx,y2=dy+(m.y2??m.y)*sy;ctx.save();ctx.translate((x+x2)/2,(y+y2)/2);ctx.rotate((m.rotation||0)*Math.PI/180);ctx.translate(-(x+x2)/2,-(y+y2)/2);ctx.strokeStyle=t.color;ctx.lineWidth=Math.max(2,lineWidth*baseScale);
    if(segmentTypes.includes(m.type)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();if(m.type==='door'){const ddx=x2-x,ddy=y2-y;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+x2)/2-ddy*.7,(y+y2)/2+ddx*.7,x2,y2);ctx.stroke();}ctx.restore();return;}
    const rad=Math.max(10,symbolSize*baseScale/2);ctx.fillStyle='#fff';ctx.strokeStyle=t.color;ctx.lineWidth=Math.max(2,2.5*baseScale);
    if(m.type==='smoke'||m.type==='heat'){ctx.beginPath();ctx.arc(x,y,rad*.78,0,Math.PI*2);ctx.fillStyle='#1565c0';ctx.fill();ctx.strokeStyle='#0d3975';ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold '+Math.max(12,rad*1.05)+'px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(m.type==='smoke'?'S':'H',x,y);ctx.textBaseline='alphabetic';}
    else if(m.type==='heat'||m.type==='light'){ctx.beginPath();ctx.moveTo(x,y-rad);ctx.lineTo(x+rad,y);ctx.lineTo(x,y+rad);ctx.lineTo(x-rad,y);ctx.closePath();ctx.stroke();}
    else if(m.type==='sprinkler'||m.type==='manual'){ctx.beginPath();ctx.moveTo(x,y-rad);ctx.lineTo(x+rad,y+rad);ctx.lineTo(x-rad,y+rad);ctx.closePath();ctx.stroke();}
    else if(m.type==='extinguisher'){ctx.strokeRect(x-rad*.45,y-rad*.7,rad*.9,rad*1.4);ctx.beginPath();ctx.moveTo(x,y-rad*.7);ctx.lineTo(x+rad*.5,y-rad);ctx.stroke();}
    else if(m.type==='hose'){ctx.strokeRect(x-rad,y-rad*.7,rad*2,rad*1.4);ctx.beginPath();ctx.arc(x,y,rad*.48,0,Math.PI*2);ctx.stroke();}
    else if(m.type==='panel'){ctx.fillStyle='#fff';ctx.fillRect(x-rad,y-rad*.65,rad*2,rad*1.3);ctx.strokeRect(x-rad,y-rad*.65,rad*2,rad*1.3);ctx.fillStyle=t.color;ctx.font='bold '+Math.max(9,rad*.48)+'px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('control',x,y,rad*1.8);ctx.textBaseline='alphabetic';}
    else if(m.type==='horn'){ctx.beginPath();ctx.moveTo(x-rad,y-rad*.5);ctx.lineTo(x+rad*.2,y-rad*.5);ctx.lineTo(x+rad,y-rad);ctx.lineTo(x+rad,y+rad);ctx.lineTo(x+rad*.2,y+rad*.5);ctx.lineTo(x-rad,y+rad*.5);ctx.closePath();ctx.stroke();}
    else if(m.type==='pump'){ctx.beginPath();ctx.arc(x,y,rad*.75,0,Math.PI*2);ctx.moveTo(x-rad*.4,y-rad*.4);ctx.lineTo(x+rad*.4,y+rad*.4);ctx.moveTo(x+rad*.4,y-rad*.4);ctx.lineTo(x-rad*.4,y+rad*.4);ctx.stroke();}
    else if(m.type==='light'){ctx.strokeRect(x-rad*.3,y-rad*.25,rad*.6,rad*1.15);ctx.beginPath();ctx.moveTo(x-rad*.5,y-rad*.45);ctx.lineTo(x-rad*.9,y-rad*.85);ctx.moveTo(x,y-rad*.48);ctx.lineTo(x,y-rad*1.05);ctx.moveTo(x+rad*.5,y-rad*.45);ctx.lineTo(x+rad*.9,y-rad*.85);ctx.moveTo(x-rad*.55,y+rad*.05);ctx.lineTo(x-rad,y+rad*.05);ctx.moveTo(x+rad*.55,y+rad*.05);ctx.lineTo(x+rad,y+rad*.05);ctx.stroke();}
    else if(m.type==='exit'){ctx.beginPath();ctx.moveTo(x-rad,y);ctx.lineTo(x+rad,y);ctx.moveTo(x+rad*.4,y-rad*.6);ctx.lineTo(x+rad,y);ctx.lineTo(x+rad*.4,y+rad*.6);ctx.stroke();}
    else{ctx.strokeRect(x-rad*.7,y-rad*.7,rad*1.4,rad*1.4);}
    ctx.restore();
   });
   ctx.textAlign='left';ctx.direction='ltr';ctx.fillStyle='#667387';ctx.font='15px Arial, sans-serif';ctx.fillText('ORKEIT STM • '+(planType==='alarm'?'FIRE ALARM':'FIRE EXTINGUISHING')+' • '+new Date().toLocaleDateString('en-CA'),65,H-35);
   canvas.toBlob(blob=>{if(!blob){setNotice('تعذر إنشاء صورة التصدير.');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Orkeit-'+(planType==='alarm'?'fire-alarm':'fire-extinguishing')+'-plan-marked.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('تم تصدير صورة المخطط مع بيانات المشروع ومفتاح الرموز، والمخطط في المنتصف.');},'image/png');
  };
  if(image){const img=new Image();img.onload=()=>render(img);img.onerror=()=>setNotice('تعذر تجهيز المخطط للتصدير.');img.src=image;}else render();
 };
 const counts=quantityTools.map(t=>({...t,count:marks.filter(m=>m.type===t.type).length})).filter(t=>t.count);
 const selectedLine=marks.find(m=>m.id===selectedMark&&segmentTypes.includes(m.type));
 const lineAngle=selectedLine?((Math.atan2((selectedLine.y2??selectedLine.y)-selectedLine.y,(selectedLine.x2??selectedLine.x)-selectedLine.x)*180/Math.PI+360)%360):0;
 return <section className="firePlanPage" dir="rtl">
 <style>{".firePlanPage{display:grid;gap:15px}.fpHero,.fpPanel{background:var(--card,#fff);border:1px solid var(--border,#e0e5ec);border-radius:14px;padding:16px}.fpHero{background:linear-gradient(125deg,#101d38,#263c5d);color:#fff}.fpHero h1{margin:6px 0}.fpHero p{line-height:1.8}.fpFields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.fpFields label{display:flex;flex-direction:column;gap:6px;font-weight:600}.fpFields input{border:1px solid #d5dce6;border-radius:9px;padding:10px;font:inherit;min-width:0}.fpActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.fpLayers{border:1px solid #d9e0e9;background:#f8fafc;border-radius:10px;padding:10px;margin:12px 0}.fpLayerToggle{display:flex!important;flex-direction:row!important;align-items:center;gap:6px;border:1px solid #d9e0e9;border-radius:8px;padding:8px;background:#fff;font-size:13px}.fpLayerToggle input{width:auto!important}.fpActions button{border:0;border-radius:9px;padding:10px 13px;font:inherit;cursor:pointer}.fpPrimary{background:#a51f2b;color:#fff}.fpSecondary{background:#eef1f5;color:#202a3a}.fpNotice{background:#fff7e8;border-right:4px solid #c77d0a;padding:12px;border-radius:8px;line-height:1.8}.fpTools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.fpTool{display:flex;gap:7px;align-items:center;text-align:right;background:#fff;color:#1d2735;border:1px solid #d9e0e9;border-radius:10px;padding:8px 5px;font:inherit;cursor:pointer}.fpTool.selected{outline:2px solid #b42332;background:#fff4f4}.fpGlyph{display:inline-flex;align-items:center;justify-content:center;flex:0 0 29px;height:29px;border:2px solid currentColor;border-radius:50%;font-weight:800;font-size:12px}.fpViewport{width:100%;max-height:70vh;overflow:auto;border:1px solid #cbd3df;border-radius:10px;background:#e9edf3;overscroll-behavior:contain}.fpStage{position:relative;width:100%;min-width:100%;line-height:0;cursor:crosshair;background-color:#fff;background-image:linear-gradient(#dce3ec 1px,transparent 1px),linear-gradient(90deg,#dce3ec 1px,transparent 1px),linear-gradient(#c5cfdd 1px,transparent 1px),linear-gradient(90deg,#c5cfdd 1px,transparent 1px);background-size:10px 10px,10px 10px,50px 50px,50px 50px;border-radius:2px;overflow:hidden}.fpStage>img{display:block;width:100%;height:auto}.fpStage.fpBlankSheet{aspect-ratio:1600/1131;background:#fff;border:1px solid #b8c1ce;box-shadow:inset 0 0 0 1px #f0f2f5}.fpStage.fpBlankSheet:after{content:'ورقة مخطط جديدة';position:absolute;top:12px;right:14px;color:#d8dde5;font-size:12px;line-height:1;pointer-events:none}.fpDrawing{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}.fpMark{position:absolute;transform:translate(-50%,-50%);min-width:24px;min-height:24px;border:0;background:transparent;font-size:12px;font-weight:800;line-height:1;cursor:grab;touch-action:none;z-index:2;padding:0}.fpMark:active{cursor:grabbing}.fpMark.selected{outline:2px dashed #b42332;outline-offset:3px;border-radius:4px}.fpSymbol{display:block;width:100%;height:100%;overflow:visible}.fpHelp,.fpStatus{font-size:13px;line-height:1.8;color:#5f6b7d}.fpCounts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fpCount{display:flex;gap:8px;align-items:center;border:1px solid #e0e5ec;padding:8px;border-radius:9px}.fpLegend{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.fpSheet{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:12px;align-items:start}.fpSideLegend{border:1px solid #cbd3df;background:#fff;padding:10px;border-radius:8px;line-height:1.6}.fpSideLegend h3{margin:0 0 8px;font-size:14px}.fpTitleBlock{border:1px solid #aeb8c6;border-radius:7px;padding:9px;margin-bottom:12px;background:#f8fafc;color:#1d2735}.fpTitleBlock .fpTitleName{display:block;font-size:13px;line-height:1.7;padding:7px 0;border-bottom:1px solid #d7dee8;margin-bottom:5px;overflow-wrap:anywhere}.fpTitleBlock>div{display:grid;grid-template-columns:40% minmax(0,1fr);gap:6px;padding:5px 0;border-bottom:1px solid #e1e6ed;font-size:11px;line-height:1.5}.fpTitleBlock>div:last-child{border-bottom:0}.fpTitleBlock span{color:#586579}.fpTitleBlock b{overflow-wrap:anywhere;font-weight:600}.fpLegendRow{display:flex;gap:7px;align-items:center;border-bottom:1px solid #e5e9ef;padding:5px 0;font-size:12px}.fpBottomLegend{border:1px solid #cbd3df;background:#fff;padding:10px;margin-top:10px;border-radius:8px}.fpBottomLegend h3{margin:0 0 8px;font-size:14px}.fpBottomLegend .fpCounts{grid-template-columns:repeat(3,minmax(0,1fr))}@media(max-width:700px){.fpSheet{grid-template-columns:1fr}.fpBottomLegend .fpCounts{grid-template-columns:repeat(2,minmax(0,1fr))}}.fpLegend span{font-size:12px;display:flex;align-items:center;gap:5px}@media(max-width:600px){.fpFields,.fpCounts{grid-template-columns:1fr}.fpTools{grid-template-columns:repeat(2,minmax(0,1fr))}.fpPanel,.fpHero{padding:12px}}"}
 </style>
 <header className="fpHero"><small>ORKEIT STM • FIRE SYSTEM PLANS</small><h1>مخطط الإطفاء والإنذار</h1><p>ارفع صورة المخطط المعماري ثم ضع رموز أجهزة الإطفاء والإنذار على مواقعها، وحرّك الرموز وعدّلها وصدّر نسخة توضيحية.</p></header>
 <div className="fpNotice"><strong>تنبيه هندسي:</strong> هذه الأداة تساعد المهندس في وضع الرموز على الرسم فقط. لا تولّد تصميمًا معتمدًا ولا تحدد تلقائيًا التغطية أو المسافات أو سعة المضخات. يلزم مراجعة المخطط والحسابات وفق الكود السعودي ومتطلبات الجهة المختصة.</div>
 <section className="fpPanel"><h2>نوع المخطط</h2><div className="fpActions"><button type="button" className={planType==='alarm'?'fpPrimary':'fpSecondary'} onClick={()=>{localStorage.setItem(planKey(planType),JSON.stringify({facility,image,blankSheet,fileName,planName,ownerName,contractorName,designerName,drawingNumber,revision,planDate,marks,updatedAt:Date.now(),planType}));setPlanType('alarm');const p=saved('alarm');setFacility(p?.facility||facility);setImage(p?.image||'');setBlankSheet(Boolean(p?.blankSheet));setFileName(p?.fileName||'');setPlanName(p?.planName||planName);setOwnerName(p?.ownerName||ownerName);setContractorName(p?.contractorName||contractorName);setDesignerName(p?.designerName||designerName);setDrawingNumber(p?.drawingNumber||drawingNumber);setRevision(p?.revision||revision);setPlanDate(p?.planDate||planDate);setMarks(p?.marks||[]);localStorage.setItem(STORE+'-active','alarm');setNotice('تم فتح لوحة الإنذار المستقلة.')}}>مخطط إنذار الحريق</button><button type="button" className={planType==='extinguishing'?'fpPrimary':'fpSecondary'} onClick={()=>{localStorage.setItem(planKey(planType),JSON.stringify({facility,image,blankSheet,fileName,planName,ownerName,contractorName,designerName,drawingNumber,revision,planDate,marks,updatedAt:Date.now(),planType}));setPlanType('extinguishing');const p=saved('extinguishing');setFacility(p?.facility||facility);setImage(p?.image||image);setFileName(p?.fileName||fileName);setPlanName(p?.planName||planName);setOwnerName(p?.ownerName||ownerName);setContractorName(p?.contractorName||contractorName);setDesignerName(p?.designerName||designerName);setDrawingNumber(p?.drawingNumber||drawingNumber);setRevision(p?.revision||revision);setPlanDate(p?.planDate||planDate);setMarks(p?.marks||[]);localStorage.setItem(STORE+'-active','extinguishing');setNotice('تم فتح لوحة الإطفاء المستقلة.')}}>مخطط الإطفاء</button><button type="button" className="fpSecondary" onClick={()=>{const other=planType==='alarm'?'extinguishing':'alarm';localStorage.setItem(planKey(other),JSON.stringify({facility,image,blankSheet,fileName,planName,ownerName,contractorName,designerName,drawingNumber,revision,planDate,marks:[],updatedAt:Date.now(),planType:other}));setNotice('تم نسخ خلفية المخطط إلى اللوحة الأخرى، مع ترك الرموز فارغة.')}}>استنساخ الخلفية إلى اللوحة الأخرى</button></div><p className="fpHelp">لكل نظام حفظ مستقل. انسخ الخلفية المعمارية نفسها ثم وزّع رموز النظام الآخر بصورة مستقلة.</p></section>
 <section className="fpPanel"><h2>١. بيانات المشروع ورفع المخطط</h2><div className="fpFields"><label>اسم المنشأة / المشروع<input value={facility} onChange={e=>setFacility(e.target.value)} placeholder="اسم المنشأة"/></label><label>اسم المخطط أو الدور<input value={fileName} onChange={e=>{setFileName(e.target.value);if(!planName)setPlanName(e.target.value)}} placeholder="مثال: الدور الأرضي"/></label><label>اسم المخطط في لوحة العنوان<input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="مثال: مخطط إنذار الحريق — الدور الأرضي"/></label><label>اسم المالك / الجهة المالكة<input value={ownerName} onChange={e=>setOwnerName(e.target.value)} placeholder="اسم المالك أو المنشأة"/></label><label>الشركة المنفذة<input value={contractorName} onChange={e=>setContractorName(e.target.value)} placeholder="اسم الشركة المنفذة"/></label><label>المهندس المصمم<input value={designerName} onChange={e=>setDesignerName(e.target.value)} placeholder="اسم المهندس المصمم"/></label><label>رقم المخطط<input value={drawingNumber} onChange={e=>setDrawingNumber(e.target.value)} placeholder="FP-001"/></label><label>رقم الإصدار<input value={revision} onChange={e=>setRevision(e.target.value)} placeholder="00"/></label><label>تاريخ المخطط<input type="date" value={planDate} onChange={e=>setPlanDate(e.target.value)}/></label></div>
 <div className="fpActions"><button type="button" className="fpPrimary" onClick={()=>{setImage('');setBlankSheet(true);setFileName('');setMarks([]);setPdfName('');setNotice('تم إنشاء ورقة بيضاء جديدة. أضف الحوائط والأبواب ثم بقية رموز المخطط.')}}>بدء مخطط من الصفر — ورقة بيضاء</button><button type="button" className="fpSecondary" onClick={()=>imgInput.current?.click()}>رفع صورة المخطط PNG / JPG</button><button type="button" className="fpSecondary" onClick={()=>pdfInput.current?.click()}>اختيار ملف PDF</button><input ref={imgInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0])}/><input ref={pdfInput} hidden type="file" accept="application/pdf,.pdf" onChange={e=>{const f=e.target.files?.[0];if(f){setPdfName(f.name);setNotice('تم اختيار '+f.name+'. لتحرير المخطط داخل الأداة، حوّل الصفحة المطلوبة من PDF إلى صورة PNG/JPG وارفعها. ملف PDF الأصلي لا يُعدّل هنا.')}}}/></div>{pdfName&&<p className="fpStatus">ملف PDF المختار: {pdfName}</p>}{notice&&<p className="fpStatus" role="status">{notice}</p>}</section>
 <section className="fpPanel"><h2>٢. رسم المخطط والأنظمة</h2><p className="fpHelp">الرموز مرسومة بأشكال هندسية بدل الحروف داخل الدوائر. اختر الجدار أو الباب أو خط الأنابيب واسحب لرسمه. استخدم التكبير وشريطَي التمرير لتحريك مساحة العمل، والشبكة للمساعدة في محاذاة العناصر. يمكن التراجع عن التعديلات وإعادتها.</p><div className="fpFields"><label>تكبير / تصغير مساحة الرسم: {zoom}%<input type="range" min="50" max="200" step="10" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><label>وحدة القياس<select value={unit} onChange={e=>setUnit(e.target.value)}><option value="m">متر</option><option value="cm">سنتيمتر</option><option value="mm">ملليمتر</option><option value="ft">قدم</option></select></label><label>معايرة القياس: عدد وحدات الرسم في 100%<input type="number" min="1" max="1000" value={pixelsPerUnit} onChange={e=>setPixelsPerUnit(Math.max(1,Number(e.target.value)||1))}/></label><label style={{display:'flex',flexDirection:'row',alignItems:'center',gap:8}}><input type="checkbox" checked={snapEnabled} onChange={e=>setSnapEnabled(e.target.checked)}/> تفعيل الالتقاط إلى الشبكة</label><label>حجم الرموز: {symbolSize}px<input type="range" min="18" max="52" step="2" value={symbolSize} onChange={e=>setSymbolSize(Number(e.target.value))}/></label><label>سماكة الخطوط: {lineWidth}px<input type="range" min="1" max="8" step="0.5" value={lineWidth} onChange={e=>setLineWidth(Number(e.target.value))}/></label></div><div className="fpActions"><button type="button" className="fpSecondary" disabled={!historyIndex.current} onClick={()=>travelHistory(-1)}>↶ تراجع</button><button type="button" className="fpSecondary" disabled={historyIndex.current>=history.current.length-1} onClick={()=>travelHistory(1)}>↷ إعادة</button><button type="button" className="fpSecondary" disabled={!selectedMark} onClick={()=>{setMarks(old=>old.filter(m=>m.id!==selectedMark));setSelectedMark(null)}}>حذف العنصر المحدد</button><button type="button" className="fpSecondary" disabled={!selectedMark} onClick={duplicateSelected}>نسخ العنصر المحدد</button><button type="button" className="fpSecondary" disabled={!selectedMark} onClick={rotateSelected}>تدوير 90°</button><button type="button" className="fpSecondary" disabled={!selectedMark} onClick={centerSelected}>توسيط العنصر</button></div><div className="fpLayers"><strong>الطبقات — إظهار / إخفاء</strong><div className="fpActions">{[{id:'architecture',label:'المعمار والجدران'},{id:'fire',label:'نظام الإطفاء'},{id:'alarm',label:'نظام الإنذار'},{id:'dimensions',label:'الأبعاد والقياسات'}].map(layer=><label key={layer.id} className="fpLayerToggle"><input type="checkbox" checked={visibleLayers[layer.id]!==false} onChange={e=>setVisibleLayers(old=>({...old,[layer.id]:e.target.checked}))}/>{layer.label}</label>)}</div><p className="fpHelp">إخفاء الطبقة لا يحذف عناصرها؛ ستبقى محفوظة ويمكن إظهارها مجددًا.</p></div>{selectedLine&&<div className="fpPanel" style={{padding:12,marginBottom:10}}><strong>إحداثيات الخط المحدد — أثناء الرسم وبعده</strong><div className="fpCounts" style={{marginTop:8}}><div className="fpCount"><span>X البداية</span><strong>{selectedLine.x.toFixed(2)}%</strong></div><div className="fpCount"><span>Y البداية</span><strong>{selectedLine.y.toFixed(2)}%</strong></div><div className="fpCount"><span>X النهاية</span><strong>{(selectedLine.x2??selectedLine.x).toFixed(2)}%</strong></div><div className="fpCount"><span>Y النهاية</span><strong>{(selectedLine.y2??selectedLine.y).toFixed(2)}%</strong></div><div className="fpCount"><span>زاوية الميلان</span><strong>{lineAngle.toFixed(1)}°</strong></div></div><p className="fpHelp">الإحداثيات كنسبة مئوية من مساحة الورقة: X أفقيًا من اليسار إلى اليمين، وY رأسيًا من الأعلى إلى الأسفل. الزاوية محسوبة من المحور الأفقي باتجاه الرسم على الشاشة.</p></div>}<div className="fpTools">{tools.map(t=><button type="button" key={t.type} className={"fpTool "+(active===t.type?'selected':'')} onClick={()=>setActive(t.type)}><span className="fpGlyph" style={{color:t.color}}>{t.type==='smoke'?'◎':t.type==='heat'?'◇':t.type==='sprinkler'?'♧':t.type==='extinguisher'?'▯':t.type==='hose'?'▣':t.type==='line'?'━':t.type==='door'?'◜':t.type==='pipeSprinkler'?'━━':t.type==='pipeHose'?'══':t.symbol}</span><span>{t.label}</span></button>)}</div>
 {(image||blankSheet)?<div className="fpSheet"><div className="fpViewport"><div ref={stage} style={{width:zoom+'%',minWidth:zoom+'%'}} className={'fpStage '+(!image?'fpBlankSheet':'')} onClick={add} onPointerDown={startSegment} onPointerMove={updateSegment} onPointerUp={endSegment} onPointerCancel={endSegment}>{image&&<img src={image} alt="المخطط المرفوع"/>}<svg className="fpDrawing" viewBox="0 0 100 100" preserveAspectRatio="none">{marks.filter(m=>segmentTypes.includes(m.type)&&isLayerVisible(m)).map(m=><g key={m.id} transform={m.rotation?`rotate(${m.rotation} ${(m.x+(m.x2??m.x))/2} ${(m.y+(m.y2??m.y))/2})`:undefined} stroke={selectedMark===m.id?'#b42332':tools.find(t=>t.type===m.type)?.color||'#263238'} strokeWidth={selectedMark===m.id?lineWidth+1.5:lineWidth} fill="none" style={{pointerEvents:'stroke',cursor:'pointer'}} onClick={e=>{e.stopPropagation();setSelectedMark(m.id)}} onDoubleClick={e=>{e.stopPropagation();setMarks(old=>old.filter(x=>x.id!==m.id));setSelectedMark(null)}}><line x1={m.x} y1={m.y} x2={m.x2??m.x} y2={m.y2??m.y}/>{m.type==='door'&&<path d={doorPath(m)}/>}{m.type==='dimension'&&<><path d={`M ${m.x-1} ${m.y-1} l 2 2 M ${(m.x2??m.x)-1} ${(m.y2??m.y)-1} l 2 2`}/><text x={(m.x+(m.x2??m.x))/2} y={(m.y+(m.y2??m.y))/2-1} fill="#455a64" stroke="white" strokeWidth="0.25" paintOrder="stroke" fontSize="2.5" textAnchor="middle">{(Math.hypot((m.x2??m.x)-m.x,(m.y2??m.y)-m.y)*1.6/Math.max(1,pixelsPerUnit)).toFixed(2)} {unit}</text></>}</g>)}</svg>{marks.filter(m=>!segmentTypes.includes(m.type)&&isLayerVisible(m)).map(m=>{const t=tools.find(x=>x.type===m.type)!;return <button key={m.id} data-mark="true" type="button" className={'fpMark '+(selectedMark===m.id?'selected':'')} title={t.label+' — تحديد ثم حذف'} style={{left:m.x+'%',top:m.y+'%',width:symbolSize,height:symbolSize,color:t.color,transform:`translate(-50%,-50%) rotate(${m.rotation||0}deg)`}} onClick={e=>{e.stopPropagation();setSelectedMark(m.id)}} onDoubleClick={e=>{e.stopPropagation();setMarks(old=>old.filter(x=>x.id!==m.id));setSelectedMark(null)}} onPointerDown={e=>move(e,m)}><svg className="fpSymbol" viewBox="0 0 40 40" aria-label={t.label}>{m.type==='smoke'?<g fill="none" stroke="currentColor" strokeWidth="2"><circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="10"/><circle cx="20" cy="20" r="3"/><path d="M20 2v5M20 33v5M2 20h5M33 20h5"/></g>:m.type==='heat'?<g fill="none" stroke="currentColor" strokeWidth="2"><circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="9"/><path d="M20 5v7M20 28v7M5 20h7M28 20h7"/><path d="M14 23q6-10 12 0" strokeWidth="2.5"/></g>:m.type==='manual'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="5" width="30" height="30" rx="2"/><rect x="11" y="11" width="18" height="18" rx="1"/><path d="M15 20h10M20 15v10"/></g>:m.type==='horn'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 15h11l14-9v28l-14-9H4Z"/><path d="M32 13q7 7 0 14M29 16q4 4 0 8"/></g>:m.type==='panel'?<g><rect x="3" y="4" width="34" height="32" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/><rect x="8" y="9" width="24" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="28" r="2" fill="currentColor"/><circle cx="20" cy="28" r="2" fill="currentColor"/><circle cx="28" cy="28" r="2" fill="currentColor"/></g>:m.type==='sprinkler'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 2v11M8 13h24M10 16l-6 12M30 16l6 12M16 16l-3 8M24 16l3 8"/></g>:m.type==='extinguisher'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="10" y="10" width="20" height="27" rx="2"/><path d="M15 10V5h10l5 5M15 5V2h10"/></g>:m.type==='hose'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="5" width="34" height="30"/><circle cx="20" cy="20" r="10"/><circle cx="20" cy="20" r="4"/></g>:m.type==='pump'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="20" cy="20" r="15"/><path d="M12 12l16 16M28 12 12 28"/></g>:m.type==='light'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="15" y="13" width="10" height="24" rx="1.5"/><path d="M11 10 5 4M20 8V1M29 10l6-6M10 19H2M30 19h8" strokeLinecap="round"/></g>:m.type==='exit'?<g fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20h26M22 12l8 8-8 8M5 5v30"/></g>:<rect x="4" y="4" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"/>}</svg></button>})}</div></div><aside className="fpSideLegend"><section className="fpTitleBlock"><h3>بيانات المخطط</h3><strong className="fpTitleName">{planName||fileName||'اسم المخطط'}</strong><div><span>المالك</span><b>{ownerName||'غير محدد'}</b></div><div><span>الشركة المنفذة</span><b>{contractorName||'غير محددة'}</b></div><div><span>المهندس المصمم</span><b>{designerName||'غير محدد'}</b></div><div><span>رقم المخطط</span><b>{drawingNumber||'—'}</b></div><div><span>الإصدار</span><b>{revision||'00'}</b></div><div><span>التاريخ</span><b>{planDate||'—'}</b></div></section><h3>مفتاح الرموز</h3>{quantityTools.filter(t=>marks.some(m=>m.type===t.type)).map(t=><div className="fpLegendRow" key={t.type}><i className="fpGlyph" style={{color:t.color,width:24,height:24,flexBasis:24}}>{t.symbol}</i><span>{t.label}</span><strong style={{marginInlineStart:'auto'}}>{marks.filter(m=>m.type===t.type).length}</strong></div>)}{!marks.length&&<p className="fpHelp">تظهر الرموز هنا بعد إضافتها.</p>}</aside></div>:<div style={{padding:35,textAlign:'center',background:'#f4f6f9',borderRadius:10}}>ارفع صورة مخطط أو اختر «بدء مخطط من الصفر» لإنشاء ورقة بيضاء.</div>}
 <div className="fpBottomLegend"><h3>جدول الرموز والأعداد</h3><div className="fpCounts">{quantityTools.map(t=><div className="fpCount" key={t.type}><span className="fpGlyph" style={{color:t.color}}>{t.symbol}</span><span style={{flex:1}}>{t.label}</span><strong>{marks.filter(m=>m.type===t.type).length}</strong></div>)}</div></div>
 <div className="fpLegend">{quantityTools.filter(t=>marks.some(m=>m.type===t.type)).map(t=><span key={t.type}><i className="fpGlyph" style={{color:t.color,width:23,height:23,flexBasis:23}}>{t.symbol}</i>{t.label}: {marks.filter(m=>m.type===t.type).length}</span>)}</div>
 <div className="fpActions"><button className="fpPrimary" type="button" onClick={save}>حفظ المخطط والعلامات</button><button className="fpSecondary" type="button" onClick={exportPlan} disabled={!image&&!blankSheet}>تصدير المخطط المعلّم PNG</button><button className="fpSecondary" type="button" onClick={()=>setMarks([])}>مسح الرموز</button></div></section>
 <section className="fpPanel"><h2>٣. ملخص الرموز الموضوعة</h2>{counts.length?<div className="fpCounts">{counts.map(t=><div className="fpCount" key={t.type}><span className="fpGlyph" style={{color:t.color}}>{t.symbol}</span><span style={{flex:1}}>{t.label}</span><strong>{t.count}</strong></div>)}</div>:<p className="fpHelp">لم تُضف رموزًا بعد.</p>}</section>
 <div className="fpNotice">الحفظ في هذه النسخة محلي على الجهاز والمتصفح، ولا تتم مزامنته مع المستخدمين الآخرين أو قاعدة البيانات. لا تستخدم النسخة التوضيحية كبديل عن المخططات التنفيذية المعتمدة والموقعة من المهندس المختص.</div>
 </section>;
}
