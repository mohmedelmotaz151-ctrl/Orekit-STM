import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Camera, 
  Shield, 
  Flame, 
  Bell, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Building2, 
  Phone, 
  User as UserIcon,
  Navigation,
  Clock,
  Upload,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Check
} from 'lucide-react';
import { 
  User, 
  Site, 
  Visit, 
  SiteType, 
  SiteStatus, 
  ProximityAlert,
  SAUDI_CITIES 
} from '../../types';
import { 
  getCurrentPosition, 
  checkProximityAndDuplicates, 
  formatCoordinates 
} from '../../utils/geo';
import { LeafletMap } from '../Common/LeafletMap';
import { PhotoCapture } from '../Common/PhotoCapture';

interface NewVisitModalProps {
  currentUser: User;
  existingSites: Site[];
  isOpen: boolean;
  onClose: () => void;
  onSaveSiteAndVisit: (newSite: Site, newVisit: Visit) => void;
  defaultSiteToVisit?: Site | null;
}

const SITE_TYPES: SiteType[] = [
  'مطعم',
  'فندق',
  'مستشفى',
  'مدرسة',
  'مستودع',
  'مصنع',
  'مكتب',
  'مجمع تجاري',
  'محطة وقود',
  'أخرى',
];

export const NewVisitModal: React.FC<NewVisitModalProps> = ({
  currentUser,
  existingSites,
  isOpen,
  onClose,
  onSaveSiteAndVisit,
  defaultSiteToVisit,
}) => {
  // Wizard steps: 1: Start Visit & GPS, 2: Site Info, 3: Licenses & Contracts, 4: Safety Equipment, 5: Defense & Outcome
  const [step, setStep] = useState<number>(1);
  const [visitStarted, setVisitStarted] = useState<boolean>(false);
  const [startTimeStr, setStartTimeStr] = useState<string>('');
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);

  // GPS Coordinates
  const [currentLat, setCurrentLat] = useState<number>(24.7136);
  const [currentLon, setCurrentLon] = useState<number>(46.6753);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(10);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [proximityAlerts, setProximityAlerts] = useState<ProximityAlert[]>([]);

  // Facility Info
  const [siteName, setSiteName] = useState<string>('');
  const [siteType, setSiteType] = useState<SiteType>('مطعم');
  const [managerName, setManagerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [altPhone, setAltPhone] = useState<string>('');
  const [city, setCity] = useState<string>('الرياض');
  const [district, setDistrict] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [sitePhoto, setSitePhoto] = useState<string>('');

  // Licenses
  const [hasLicense, setHasLicense] = useState<'yes' | 'no' | 'unknown'>('yes');
  const [licenseType, setLicenseType] = useState<string>('رخصة بلدية وسلامة الدفاع المدني');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [licenseExpiry, setLicenseExpiry] = useState<string>('');
  const [licensePhoto, setLicensePhoto] = useState<string>('');

  // Contract
  const [hasContract, setHasContract] = useState<'yes' | 'no' | 'unknown'>('no');
  const [contractCompany, setContractCompany] = useState<string>('');
  const [contractStart, setContractStart] = useState<string>('');
  const [contractEnd, setContractEnd] = useState<string>('');
  const [contractPhoto, setContractPhoto] = useState<string>('');

  // Safety Equipment
  // Extinguishers
  const [extinguisherCount, setExtinguisherCount] = useState<number>(6);
  const [extTypes, setExtTypes] = useState<('powder' | 'co2' | 'foam' | 'water')[]>(['powder', 'co2']);
  const [extNeedsMaintenance, setExtNeedsMaintenance] = useState<boolean>(false);
  const [extNeedsReplacement, setExtNeedsReplacement] = useState<boolean>(false);
  const [extNeedsNewInstall, setExtNeedsNewInstall] = useState<boolean>(false);
  const [extNotes, setExtNotes] = useState<string>('');

  // Alarm system
  const [alarmExists, setAlarmExists] = useState<boolean>(true);
  const [alarmWorking, setAlarmWorking] = useState<boolean>(true);
  const [alarmNeedsMaintenance, setAlarmNeedsMaintenance] = useState<boolean>(false);
  const [alarmNeedsInstall, setAlarmNeedsInstall] = useState<boolean>(false);
  const [detectorCount, setDetectorCount] = useState<number>(12);
  const [callPointCount, setCallPointCount] = useState<number>(3);
  const [alarmPanelType, setAlarmPanelType] = useState<string>('معنون (Addressable)');

  // Fire suppression / pumps / sprinklers
  const [sprinklersExist, setSprinklersExist] = useState<boolean>(false);
  const [sprinklersCount, setSprinklersCount] = useState<number>(0);
  const [pumpsExist, setPumpsExist] = useState<boolean>(false);
  const [pumpsType, setPumpsType] = useState<string>('مضخة كهربائية + ديزل');
  const [fireHoseReelsCount, setFireHoseReelsCount] = useState<number>(2);
  const [specialSuppression, setSpecialSuppression] = useState<string>('كيتشن هود بمطبخ الطهي');

  // Civil defense & Status
  const [hasCivilDefense, setHasCivilDefense] = useState<boolean>(true);
  const [cdLastVisit, setCdLastVisit] = useState<string>('');
  const [cdNextVisit, setCdNextVisit] = useState<string>('');
  const [cdReportNumber, setCdReportNumber] = useState<string>('');
  const [cdNotes, setCdNotes] = useState<string>('');

  // Customer status & Visit outcome
  const [outcomeStatus, setOutcomeStatus] = useState<SiteStatus>('new_opportunity');
  const [visitNotes, setVisitNotes] = useState<string>('');
  const [nextFollowupDate, setNextFollowupDate] = useState<string>('');

  // Pre-fill if visiting existing site
  useEffect(() => {
    if (defaultSiteToVisit) {
      setSiteName(defaultSiteToVisit.name);
      setSiteType(defaultSiteToVisit.type);
      setManagerName(defaultSiteToVisit.managerName);
      setPhone(defaultSiteToVisit.phone);
      setAltPhone(defaultSiteToVisit.altPhone || '');
      setCity(defaultSiteToVisit.city);
      setDistrict(defaultSiteToVisit.district);
      setAddress(defaultSiteToVisit.address);
      setCurrentLat(defaultSiteToVisit.latitude);
      setCurrentLon(defaultSiteToVisit.longitude);
      setSitePhoto(defaultSiteToVisit.sitePhoto || '');
      setHasLicense(defaultSiteToVisit.license.hasLicense);
      setLicenseType(defaultSiteToVisit.license.licenseType);
      setLicenseNumber(defaultSiteToVisit.license.licenseNumber);
      setLicenseExpiry(defaultSiteToVisit.license.expiryDate);
      setHasContract(defaultSiteToVisit.contract.hasContract);
      setContractCompany(defaultSiteToVisit.contract.companyName);
      setContractStart(defaultSiteToVisit.contract.startDate);
      setContractEnd(defaultSiteToVisit.contract.endDate);
      setExtinguisherCount(defaultSiteToVisit.equipment.extinguishers.totalCount);
      setExtTypes(defaultSiteToVisit.equipment.extinguishers.types);
      setExtNeedsMaintenance(defaultSiteToVisit.equipment.extinguishers.needsMaintenance);
      setExtNeedsReplacement(defaultSiteToVisit.equipment.extinguishers.needsReplacement);
      setExtNeedsNewInstall(defaultSiteToVisit.equipment.extinguishers.needsNewInstall);
      setAlarmExists(defaultSiteToVisit.equipment.alarmSystem.exists);
      setAlarmWorking(defaultSiteToVisit.equipment.alarmSystem.working);
      setAlarmNeedsMaintenance(defaultSiteToVisit.equipment.alarmSystem.needsMaintenance);
      setAlarmNeedsInstall(defaultSiteToVisit.equipment.alarmSystem.needsInstall);
      setDetectorCount(defaultSiteToVisit.equipment.alarmSystem.detectorCount);
      setCallPointCount(defaultSiteToVisit.equipment.alarmSystem.callPointCount);
      setAlarmPanelType(defaultSiteToVisit.equipment.alarmSystem.panelType);
      setOutcomeStatus(defaultSiteToVisit.status);
    }
  }, [defaultSiteToVisit]);

  // Initial location fetch when modal opens
  useEffect(() => {
    if (isOpen && !visitStarted && !defaultSiteToVisit) {
      fetchLocation();
    }
  }, [isOpen]);

  // Proximity check whenever location or name/phone changes
  useEffect(() => {
    if (currentLat && currentLon && !defaultSiteToVisit) {
      const alerts = checkProximityAndDuplicates(
        currentLat,
        currentLon,
        siteName,
        phone,
        existingSites
      );
      setProximityAlerts(alerts);
    }
  }, [currentLat, currentLon, siteName, phone, existingSites, defaultSiteToVisit]);

  const fetchLocation = async () => {
    setIsLocating(true);
    try {
      const pos = await getCurrentPosition();
      setCurrentLat(pos.latitude);
      setCurrentLon(pos.longitude);
      setGpsAccuracy(pos.accuracy);
    } finally {
      setIsLocating(false);
    }
  };

  const handleStartVisit = async () => {
    await fetchLocation();
    const d = new Date();
    setStartDateObj(d);
    setStartTimeStr(d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
    setVisitStarted(true);
    setStep(2); // move to site info
  };

  // Sample photo generator / simulator
  const handlePhotoUploadSim = (type: 'site' | 'license' | 'contract') => {
    const samplePhotos = {
      site: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      license: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80',
      contract: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    };
    if (type === 'site') setSitePhoto(samplePhotos.site);
    if (type === 'license') setLicensePhoto(samplePhotos.license);
    if (type === 'contract') setContractPhoto(samplePhotos.contract);
  };

  const handleFinishVisit = () => {
    if (!siteName.trim()) {
      alert('الرجاء إدخال اسم المنشأة');
      setStep(2);
      return;
    }
    if (!phone.trim()) {
      alert('الرجاء إدخال رقم هاتف التواصل');
      setStep(2);
      return;
    }
    if (!sitePhoto.trim()) {
      alert('الرجاء التقاط صورة واجهة المنشأة بالكاميرا أو اختيارها من الاستديو لتوثيق الموقع');
      setStep(2);
      return;
    }

    const nowEnd = new Date();
    const duration = startDateObj
      ? Math.max(1, Math.round((nowEnd.getTime() - startDateObj.getTime()) / (1000 * 60)))
      : 18;

    const newSiteId = defaultSiteToVisit ? defaultSiteToVisit.id : `site_${Date.now()}`;

    const newSite: Site = {
      id: newSiteId,
      name: siteName.trim(),
      type: siteType,
      managerName: managerName.trim() || 'المسؤول المباشر',
      phone: phone.trim(),
      altPhone: altPhone.trim() || '',
      city: city || 'الرياض',
      district: district.trim() || 'حي المروج',
      address: address.trim() || `${city} - ${district}`,
      latitude: currentLat,
      longitude: currentLon,
      sitePhoto: sitePhoto.trim(),
      license: {
        hasLicense,
        licenseType,
        licenseNumber: licenseNumber || 'TR-2024-DEF',
        expiryDate: licenseExpiry,
        licensePhoto: licensePhoto || '',
      },
      contract: {
        hasContract,
        companyName: contractCompany,
        startDate: contractStart,
        endDate: contractEnd,
        contractPhoto: contractPhoto || '',
      },
      equipment: {
        extinguishers: {
          totalCount: Number(extinguisherCount) || 1,
          types: extTypes,
          needsMaintenance: extNeedsMaintenance,
          needsReplacement: extNeedsReplacement,
          needsNewInstall: extNeedsNewInstall,
          notes: extNotes || '',
        },
        alarmSystem: {
          exists: alarmExists,
          working: alarmWorking,
          needsMaintenance: alarmNeedsMaintenance,
          needsInstall: alarmNeedsInstall,
          detectorCount: Number(detectorCount) || 0,
          callPointCount: Number(callPointCount) || 0,
          panelType: alarmPanelType,
        },
        waterAndPumps: {
          sprinklersExist,
          sprinklersCount: Number(sprinklersCount) || 0,
          sprinklersCondition: sprinklersExist ? 'good' : 'not_working',
          pumpsExist,
          pumpsType,
          pumpsWorking: pumpsExist,
          fireHoseReelsCount: Number(fireHoseReelsCount) || 0,
          fireCabinetsCount: Number(fireHoseReelsCount) || 0,
          specialSuppressionSystem: specialSuppression,
          specialSuppressionWorking: true,
        },
      },
      civilDefense: {
        hasRecord: hasCivilDefense,
        lastVisitDate: cdLastVisit,
        nextVisitDate: cdNextVisit,
        reportNumber: cdReportNumber,
        notes: cdNotes || '',
      },
      status: outcomeStatus,
      approvalStatus: 'pending', // Sent for Admin audit & approval before incentive release
      createdByAgentId: currentUser.id,
      createdByAgentName: currentUser.name,
      createdAt: defaultSiteToVisit ? defaultSiteToVisit.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      incentiveAmount: 1.50, // Standard 1.50 SAR per site
      incentivePaid: false,
      visitsCount: (defaultSiteToVisit?.visitsCount || 0) + 1,
      lastVisitDate: new Date().toISOString().split('T')[0],
      notes: visitNotes,
    };

    const newVisit: Visit = {
      id: `visit_${Date.now()}`,
      siteId: newSiteId,
      siteName: newSite.name,
      agentId: currentUser.id,
      agentName: currentUser.name,
      visitDate: new Date().toISOString().split('T')[0],
      startTime: startTimeStr || '10:00',
      endTime: nowEnd.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: duration,
      startLatitude: currentLat,
      startLongitude: currentLon,
      endLatitude: currentLat,
      endLongitude: currentLon,
      deviceModel: navigator.userAgent.includes('Android')
        ? 'Samsung Galaxy S24 (Android)'
        : navigator.userAgent.includes('iPhone')
        ? 'Apple iPhone (iOS)'
        : 'جهاز المندوب الميداني (أوريكيت)',
      notes: visitNotes || 'تمت معاينة المنشأة وتوثيق أجهزة السلامة والعقود بنجاح',
      outcomeStatus,
      photos: sitePhoto ? [sitePhoto] : [],
      nextFollowupDate: nextFollowupDate || undefined,
      status: 'completed',
    };

    onSaveSiteAndVisit(newSite, newVisit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                {defaultSiteToVisit ? `تسجيل زيارة: ${defaultSiteToVisit.name}` : 'تسجيل موقع وزيارة ميدانية جديدة'}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>المندوب: {currentUser.name}</span>
                {startTimeStr && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">بدأت الزيارة {startTimeStr}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress indicator */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto gap-2">
          {[
            { num: 1, label: 'بدء الزيارة و GPS' },
            { num: 2, label: 'بيانات المنشأة' },
            { num: 3, label: 'التراخيص والعقد' },
            { num: 4, label: 'حصر السلامة' },
            { num: 5, label: 'حالة العميل والإنهاء' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => visitStarted && setStep(s.num)}
              disabled={!visitStarted && s.num > 1}
              className={`flex items-center gap-1.5 py-1 px-2 rounded-lg whitespace-nowrap transition ${
                step === s.num
                  ? 'bg-orange-600 text-white font-bold'
                  : step > s.num
                  ? 'text-emerald-400 hover:bg-slate-800 font-medium'
                  : 'text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === s.num ? 'bg-white text-orange-600 font-bold' : step > s.num ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-500'
              }`}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Step Contents */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* STEP 1: START VISIT & GPS VALIDATION */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-950/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-orange-500/30 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-950/60 animate-bounce">
                  <Navigation className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">تأكيد الحضور الميداني (منع التلاعب)</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                    يقوم نظام أوريكيت بتسجيل إحداثيات GPS الدقيقة، وقت الوصول، ونوع الجهاز، لضمان مصداقية الزيارات واعتماد الحافز المالي (1.50 ر.س).
                  </p>
                </div>

                {/* GPS Info Card */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs text-right space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold flex items-center gap-1.5 text-slate-200">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      إحداثيات الموقع الحالي:
                    </span>
                    <span className="font-mono text-emerald-400 dir-ltr">{formatCoordinates(currentLat, currentLon)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>دقة إشارة الأقمار الصناعية:</span>
                    <span className="text-slate-200">± {gpsAccuracy} متر</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>الجهاز المستخدم:</span>
                    <span className="text-slate-200">جهاز مندوب ميداني موثق</span>
                  </div>
                </div>

                {/* Map Preview */}
                <LeafletMap
                  center={[currentLat, currentLon]}
                  zoom={15}
                  pickedLocation={{ lat: currentLat, lon: currentLon }}
                  highlightProximityRadius={{ lat: currentLat, lon: currentLon, meters: 50 }}
                  className="w-full h-44 rounded-xl border border-slate-700"
                />

                {/* PROXIMITY DUPLICATE WARNING */}
                {proximityAlerts.length > 0 && (
                  <div className="bg-amber-950/80 border-2 border-amber-600/80 rounded-xl p-3.5 text-right space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>تنبيه منع التكرار: توجد منشأة مسجلة بالقرب منك!</span>
                    </div>
                    <div className="text-xs text-amber-200 space-y-1">
                      {proximityAlerts.slice(0, 2).map((alert, i) => (
                        <div key={i} className="bg-slate-900/80 p-2 rounded-lg border border-amber-700/50 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white">{alert.existingSite.name}</span>
                            <span className="text-[11px] text-amber-300/80 block">المسؤول: {alert.existingSite.managerName} - مسجل بواسطة: {alert.existingSite.createdByAgentName}</span>
                          </div>
                          <span className="bg-amber-500/20 text-amber-300 font-mono text-[11px] px-2 py-0.5 rounded border border-amber-500/40">
                            على بعد {alert.distanceMeters} م
                          </span>
                        </div>
                      ))}
                      <p className="text-[11px] text-amber-300 mt-1">
                        يرجى التأكد من أنك لا تعيد تسجيل نفس الموقع لضمان قبول الحافز وعدم الرفض الإداري.
                      </p>
                    </div>
                  </div>
                )}

                {/* Big Start Visit Button */}
                <button
                  type="button"
                  onClick={handleStartVisit}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-base shadow-lg shadow-orange-950/60 flex items-center justify-center gap-2 transition transform active:scale-95"
                >
                  <Clock className="w-5 h-5" />
                  <span>بدء الزيارة وتسجيل الموقع الآن</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FACILITY & MANAGER INFORMATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم المنشأة / المحل / الشركة <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="مثال: مطعم شواية الخليج - فرع الصحافة"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع النشاط</label>
                  <select
                    value={siteType}
                    onChange={(e) => setSiteType(e.target.value as SiteType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {SITE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المسؤول / المدير</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="مثال: أ. عبد الله الشمري"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رقم هاتف التواصل <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-left font-mono"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم جوال إضافي</label>
                  <input
                    type="tel"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="05XXXXXXXX / هاتف أرضي"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">المدينة</label>
                  <select
                    value={city}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setCity(newCity);
                      if (newCity === 'خميس مشيط') {
                        setCurrentLat(18.3000);
                        setCurrentLon(42.7333);
                      } else if (newCity === 'أبها') {
                        setCurrentLat(18.2164);
                        setCurrentLon(42.5053);
                      } else if (newCity === 'جدة') {
                        setCurrentLat(21.5433);
                        setCurrentLon(39.1728);
                      } else if (newCity === 'الدمام') {
                        setCurrentLat(26.4207);
                        setCurrentLon(50.0888);
                      } else if (newCity === 'الرياض') {
                        setCurrentLat(24.7136);
                        setCurrentLon(46.6753);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-bold"
                  >
                    {SAUDI_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الحي والشارع</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="مثال: حي الياسمين - طريق أنس بن مالك"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Location Picker & Fine Tuning */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">موقع المنشأة على الخريطة (GPS)</span>
                  <button
                    type="button"
                    onClick={fetchLocation}
                    disabled={isLocating}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>تحديث موقعي</span>
                  </button>
                </div>
                <LeafletMap
                  center={[currentLat, currentLon]}
                  zoom={15}
                  interactivePicker={true}
                  pickedLocation={{ lat: currentLat, lon: currentLon }}
                  onLocationPicked={(lat, lon) => {
                    setCurrentLat(lat);
                    setCurrentLon(lon);
                  }}
                  className="w-full h-44 rounded-xl border border-slate-700"
                />
              </div>

              {/* Site Photo Capture (Camera or Studio) */}
              <div className="pt-2">
                <PhotoCapture
                  label="تصوير واجهة الموقع / اللوحة"
                  sublabel="افتح الكاميرا لالتقاط صورة مباشرة للمنشأة أو اختر من الاستديو لتوثيق الموقع"
                  photoUrl={sitePhoto}
                  onPhotoCaptured={(photo) => setSitePhoto(photo)}
                  onPhotoRemoved={() => setSitePhoto('')}
                  required={true}
                />
              </div>
            </div>
          )}

          {/* STEP 3: LICENSES & COMPETITOR CONTRACT */}
          {step === 3 && (
            <div className="space-y-6">
              
              {/* Licenses Section */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-sm text-white">بيانات التراخيص الحكومية</h4>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">هل يوجد ترخيص سارٍ للمنشأة؟</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['yes', 'no', 'unknown'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setHasLicense(opt)}
                        className={`py-2 text-xs rounded-xl font-bold transition border ${
                          hasLicense === opt
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {opt === 'yes' ? 'نعم يوجد' : opt === 'no' ? 'لا يوجد' : 'غير معروف'}
                      </button>
                    ))}
                  </div>
                </div>

                {hasLicense === 'yes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">نوع الترخيص</label>
                      <input
                        type="text"
                        value={licenseType}
                        onChange={(e) => setLicenseType(e.target.value)}
                        placeholder="بلدي / صناعي / سلامة"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">رقم الترخيص</label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="رقم الترخيص الرسمي"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">تاريخ انتهاء الترخيص</label>
                      <input
                        type="date"
                        value={licenseExpiry}
                        onChange={(e) => setLicenseExpiry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <PhotoCapture
                        label="صورة الترخيص"
                        sublabel="التقط صورة للترخيص بالكاميرا أو اخترها من الاستديو"
                        photoUrl={licensePhoto}
                        onPhotoCaptured={(photo) => setLicensePhoto(photo)}
                        onPhotoRemoved={() => setLicensePhoto('')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Maintenance Contract Section */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <h4 className="font-bold text-sm text-white">عقد الصيانة الحالي (الفرصة البيعية)</h4>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">هل يوجد عقد صيانة مع شركة أخرى؟</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['yes', 'no', 'unknown'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setHasContract(opt)}
                        className={`py-2 text-xs rounded-xl font-bold transition border ${
                          hasContract === opt
                            ? 'bg-sky-600 text-white border-sky-500'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {opt === 'yes' ? 'نعم مرتبط بعقد' : opt === 'no' ? 'لا يوجد عقد حالي' : 'غير معروف'}
                      </button>
                    ))}
                  </div>
                </div>

                {hasContract === 'yes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-400 mb-1">اسم شركة الصيانة الحالية</label>
                      <input
                        type="text"
                        value={contractCompany}
                        onChange={(e) => setContractCompany(e.target.value)}
                        placeholder="مثال: شركة الأمان للسلامة"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">تاريخ بداية العقد</label>
                      <input
                        type="date"
                        value={contractStart}
                        onChange={(e) => setContractStart(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        تاريخ انتهاء العقد <span className="text-amber-400">(مهم لحساب التذكيرات)</span>
                      </label>
                      <input
                        type="date"
                        value={contractEnd}
                        onChange={(e) => setContractEnd(e.target.value)}
                        className="w-full bg-slate-900 border border-amber-600/70 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <PhotoCapture
                        label="صورة العقد إن وجدت"
                        sublabel="التقط صورة لمستند العقد بالكاميرا أو اخترها من الاستديو"
                        photoUrl={contractPhoto}
                        onPhotoCaptured={(photo) => setContractPhoto(photo)}
                        onPhotoRemoved={() => setContractPhoto('')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SAFETY EQUIPMENT AUDIT */}
          {step === 4 && (
            <div className="space-y-6">
              
              {/* 1. Fire Extinguishers */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    <h4 className="font-bold text-sm text-white">حصر طفايات وأجهزة الإطفاء اليدوية</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">إجمالي الطفايات:</span>
                    <input
                      type="number"
                      min={0}
                      value={extinguisherCount}
                      onChange={(e) => setExtinguisherCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-400 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">الأنواع المتوفرة:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'powder', label: 'بودرة جافة' },
                      { id: 'co2', label: 'ثاني أكسيد الكربون CO2' },
                      { id: 'foam', label: 'رغوة فوم' },
                      { id: 'water', label: 'مائية / رطبة K' },
                    ].map((t) => {
                      const isChecked = extTypes.includes(t.id as any);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setExtTypes(extTypes.filter((x) => x !== t.id));
                            } else {
                              setExtTypes([...extTypes, t.id as any]);
                            }
                          }}
                          className={`py-1.5 px-2 text-xs rounded-xl font-medium border text-center transition ${
                            isChecked
                              ? 'bg-red-600/30 text-red-300 border-red-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {isChecked ? '✓ ' : ''}{t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-xs font-medium text-slate-400 block">احتياجات الطفايات:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setExtNeedsMaintenance(!extNeedsMaintenance)}
                      className={`py-2 text-xs rounded-xl font-bold border transition ${
                        extNeedsMaintenance ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {extNeedsMaintenance ? '✓ تحتاج صيانة' : 'تحتاج صيانة؟'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtNeedsReplacement(!extNeedsReplacement)}
                      className={`py-2 text-xs rounded-xl font-bold border transition ${
                        extNeedsReplacement ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {extNeedsReplacement ? '✓ تحتاج استبدال' : 'تحتاج استبدال؟'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtNeedsNewInstall(!extNeedsNewInstall)}
                      className={`py-2 text-xs rounded-xl font-bold border transition ${
                        extNeedsNewInstall ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {extNeedsNewInstall ? '✓ تركيب جديد' : 'تركيب جديد؟'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Fire Alarm System */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-sm text-white">نظام الإنذار المبكر</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlarmExists(!alarmExists)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                      alarmExists ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {alarmExists ? 'يوجد نظام إنذار' : 'لا يوجد إنذار'}
                  </button>
                </div>

                {alarmExists ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAlarmWorking(true)}
                        className={`py-2 text-xs rounded-xl font-bold border ${
                          alarmWorking ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {alarmWorking ? '✓ يعمل بشكل سليم' : 'يعمل بشكل سليم'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlarmWorking(false)}
                        className={`py-2 text-xs rounded-xl font-bold border ${
                          !alarmWorking ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {!alarmWorking ? '⚠️ معطل / به أعطال' : 'معطل / به أعطال'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">نوع اللوحة</label>
                        <select
                          value={alarmPanelType}
                          onChange={(e) => setAlarmPanelType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
                        >
                          <option value="معنون (Addressable)">معنون (Addressable)</option>
                          <option value="تقليدي (Conventional)">تقليدي (Conventional)</option>
                          <option value="لاسلكي (Wireless)">لاسلكي</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">عدد الكواشف</label>
                        <input
                          type="number"
                          value={detectorCount}
                          onChange={(e) => setDetectorCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">كواسر الإنذار</label>
                        <input
                          type="number"
                          value={callPointCount}
                          onChange={(e) => setCallPointCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-950/40 border border-amber-700/50 rounded-xl text-xs text-amber-300">
                    💡 فرصة تركيب نظام إنذار جديد متوافق مع لوائح الدفاع المدني (عرض توريد وتركيب).
                  </div>
                )}
              </div>

              {/* 3. Automatic Suppression, Sprinklers & Pumps */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-bold text-sm text-white">الرشاشات والمضخات والأنظمة الخاصة</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">شبكة الرشاشات التلقائية (Sprinklers)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSprinklersExist(!sprinklersExist)}
                        className={`flex-1 py-1.5 rounded-lg border font-bold ${
                          sprinklersExist ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {sprinklersExist ? '✓ متوفرة' : 'غير متوفرة'}
                      </button>
                      {sprinklersExist && (
                        <input
                          type="number"
                          value={sprinklersCount}
                          onChange={(e) => setSprinklersCount(parseInt(e.target.value) || 0)}
                          placeholder="العدد"
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 text-center text-white"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">مضخات الحريق (Fire Pumps)</label>
                    <button
                      type="button"
                      onClick={() => setPumpsExist(!pumpsExist)}
                      className={`w-full py-1.5 rounded-lg border font-bold ${
                        pumpsExist ? 'bg-sky-600/30 text-sky-300 border-sky-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {pumpsExist ? '✓ توجد مضخات حريق' : 'لا توجد مضخات حريق'}
                    </button>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">الأنظمة الخاصة (كيتشن هود / غاز FM200 / رغوة)</label>
                    <input
                      type="text"
                      value={specialSuppression}
                      onChange={(e) => setSpecialSuppression(e.target.value)}
                      placeholder="مثال: نظام كيتشن هود لمطابخ الطهي / FM200 لغرف السيرفرات"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CIVIL DEFENSE & OUTCOME STATUS */}
          {step === 5 && (
            <div className="space-y-6">
              
              {/* Defense Visits */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-sm text-white">سجل وزيارات الدفاع المدني</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">تاريخ آخر زيارة دفاع مدني</label>
                    <input
                      type="date"
                      value={cdLastVisit}
                      onChange={(e) => setCdLastVisit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">تاريخ الزيارة القادمة المتوقعة</label>
                    <input
                      type="date"
                      value={cdNextVisit}
                      onChange={(e) => setCdNextVisit(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-600/70 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">رقم المحضر / تقرير التفتيش إن وجد</label>
                    <input
                      type="text"
                      value={cdReportNumber}
                      onChange={(e) => setCdReportNumber(e.target.value)}
                      placeholder="رقم التقرير من منصة سلامة"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* OUTCOME / CUSTOMER STATUS */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-white">
                  تحديد تصنيف وحالة العميل بعد الزيارة <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'new_opportunity', label: '🟢 فرصة جديدة', desc: 'منشأة جديدة مهتمة بعقد أو تركيبات' },
                    { id: 'needs_followup', label: '🟡 يحتاج متابعة', desc: 'تم النقاش وبانتظار معاودة الاتصال' },
                    { id: 'competitor_contract', label: '🔵 لديه عقد مع شركة أخرى', desc: 'مرتبط بعقد سارٍ مع منافس' },
                    { id: 'expiring_soon', label: '🟠 العقد قريب الانتهاء', desc: 'ينتهي خلال أسابيع وفرصة ممتازة' },
                    { id: 'urgent_maintenance', label: '🔴 يحتاج صيانة عاجلة', desc: 'أعطال في الإنذار أو الطفايات' },
                    { id: 'no_opportunity', label: '⚫ لا توجد فرصة حاليًا', desc: 'الموقع غير مستعد أو قيد الإغلاق' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setOutcomeStatus(st.id as SiteStatus)}
                      className={`p-3 rounded-xl border text-right transition flex flex-col gap-0.5 ${
                        outcomeStatus === st.id
                          ? 'bg-orange-600/25 border-orange-500 text-white shadow-md'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span className="font-bold text-sm">{st.label}</span>
                      <span className="text-[11px] text-slate-400">{st.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visit Notes & Next Followup */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات الزيارة وتوصيات المندوب</label>
                  <textarea
                    rows={3}
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder="اكتب تفاصيل المحادثة مع المسؤول، متطلباته، الملاحظات الفنية..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">موعد المتابعة القادمة</label>
                  <input
                    type="date"
                    value={nextFollowupDate}
                    onChange={(e) => setNextFollowupDate(e.target.value)}
                    className="w-full sm:w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Final Incentive & Anti-Fraud Notice */}
              <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-emerald-200">حافز تسجيل الموقع: 1.50 ر.س</div>
                    <div className="text-[11px] text-slate-400">
                      سيتم تحويل الموقع للمراجعة الإدارية للتحقق من الموقع والصور قبل إضافته لحسابك المعتمد
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !visitStarted) {
                  handleStartVisit();
                } else {
                  setStep(step + 1);
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/50 transition"
            >
              <span>{step === 1 ? 'بدء الزيارة والمتابعة' : 'التالي'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishVisit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>إنهاء الزيارة وحفظ الموقع</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
