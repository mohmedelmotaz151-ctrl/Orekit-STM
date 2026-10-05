import React,{useMemo,useState}from'react';
import{ContractData}from'./../types/contract';
import{createDefaultContract,getOneYearLater}from'./../constants/defaultContract';
import{ContractForm}from'./ContractForm';
import{ContractDocument}from'./ContractDocument';
import{SafetyCertificateDocument}from'./SafetyCertificateDocument';
import{X,Printer,Download,FileCheck2,FileSpreadsheet,Layers}from'lucide-react';

const td=()=>new Date().toISOString().slice(0,10);

function normalizeContract(seed:any):ContractData{
  const base=createDefaultContract();
  const start=seed?.startDate||seed?.start||base.startDate;
  const end=seed?.endDate||seed?.end||getOneYearLater(start);
  const n:any={...base,...seed};
  n.id=seed?.id||base.id;
  n.contractNumber=seed?.contractNumber||base.contractNumber;
  n.contractDate=seed?.contractDate||start;
  n.clientName=seed?.clientName??seed?.client??base.clientName;
  n.facilityName=seed?.facilityName??seed?.facility??base.facilityName;
  n.commercialRegOrId=seed?.commercialRegOrId??'';
  n.clientPhone=seed?.clientPhone??seed?.phone??'';
  n.city=seed?.city??base.city;
  n.district=seed?.district??'';
  n.street=seed?.street??'';
  n.activityType=seed?.activityType??'';
  n.buildingFloors=seed?.buildingFloors??'دور أرضي';
  n.startDate=start;
  n.endDate=end;
  n.durationYears=seed?.durationYears??1;
  n.totalAmount=seed?.totalAmount??(seed?.value?Number(seed.value):base.totalAmount);
  n.isVatIncluded=seed?.isVatIncluded??true;
  n.paymentMethod=seed?.paymentMethod??'دفعة واحدة عند التوقيع';
  n.safetyItems=Array.isArray(seed?.safetyItems)?seed.safetyItems:base.safetyItems;
  n.clauses=Array.isArray(seed?.clauses)&&seed.clauses.length?seed.clauses:base.clauses;
  n.coveredSystems=seed?.coveredSystems||base.coveredSystems;
  n.inspectorName=seed?.inspectorName??base.inspectorName;
  n.inspectorLicense=seed?.inspectorLicense??base.inspectorLicense;
  n.certificateNotes=seed?.certificateNotes??base.certificateNotes;
  n.options={...base.options,...(seed?.options||{})};
  n.updatedAt=new Date().toISOString();
  n.createdAt=seed?.createdAt||new Date().toISOString();
  return n as ContractData;
}

export default function ContractsWorkspace({sites=[],initialContract,close,save}:any){
  const[contract,setContract]=useState<ContractData>(()=>normalizeContract(initialContract));
  const[page,setPage]=useState<'contract'|'certificate'|'both'>('contract');
  const[saved,setSaved]=useState(false);
  const update=(x:ContractData)=>{setContract(x);setSaved(false)};
  const applyPreset=(presetId:any)=>{
    const mod:any=window;
    // The actual preset application is owned by the source ContractForm's parent.
    const {CONTRACT_PRESETS}=mod.__ORK_CONTRACT_PRESETS||{};
    const p=CONTRACT_PRESETS?.find((q:any)=>q.id===presetId);
    if(p)setContract(prev=>({...prev,activityType:p.activityType,totalAmount:p.defaultAmount,coveredSystems:{...p.systems},safetyItems:[...p.defaultItems],updatedAt:new Date().toISOString()}));
  };
  const applyPresetDirect=(presetId:any)=>{
    import('./../constants/defaultContract').then(({CONTRACT_PRESETS})=>{
      const p=CONTRACT_PRESETS.find((q:any)=>q.id===presetId);if(p)setContract(prev=>({...prev,activityType:p.activityType,totalAmount:p.defaultAmount,coveredSystems:{...p.systems},safetyItems:[...p.defaultItems],updatedAt:new Date().toISOString()}));
    });
  };
  const saveNow=()=>{
    const x:any={...contract,client:contract.clientName,facility:contract.facilityName,phone:contract.clientPhone,start:contract.startDate,end:contract.endDate,duration:contract.durationYears+' سنة',value:contract.totalAmount??'',services:'صيانة أنظمة السلامة ومكافحة الحريق ومعدات الدفاع المدني',siteId:initialContract?.siteId||''};
    save(x);setSaved(true);
  };
  const print=()=>window.print();
  return <div className="contractWorkspace">
    <div className="cwTop no-print">
      <div><b>عقود ومشاهد الدفاع المدني</b><small>النموذج والصيغة والورق المروس من مشروع Contract-</small></div>
      <div className="cwActions">
        <button onClick={saveNow}>حفظ العقد</button>
        <button onClick={print}><Printer size={15}/> طباعة / PDF</button>
        <button onClick={close}><X size={17}/> إغلاق</button>
      </div>
    </div>
    {saved&&<div className="cwSaved no-print">تم حفظ العقد في سجل العقود.</div>}
    <div className="cwBody">
      <div className="cwEditor no-print">
        <ContractForm contract={contract} onChange={update} onApplyPreset={applyPresetDirect} onSaveContract={saveNow}/>
      </div>
      <div className="cwPreview">
        <div className="cwTabs no-print">
          <button className={page==='contract'?'on':''} onClick={()=>setPage('contract')}><FileCheck2 size={14}/> عقد الصيانة</button>
          <button className={page==='certificate'?'on':''} onClick={()=>setPage('certificate')}><FileSpreadsheet size={14}/> مشهد السلامة</button>
          <button className={page==='both'?'on':''} onClick={()=>setPage('both')}><Layers size={14}/> الوثيقتان</button>
        </div>
        <div className="cwPages">
          {(page==='contract'||page==='both')&&<ContractDocument contract={contract} id="ork-contract-preview"/>}
          {(page==='certificate'||page==='both')&&<SafetyCertificateDocument contract={contract} id="ork-safety-preview"/>}
        </div>
      </div>
    </div>
  </div>
}
