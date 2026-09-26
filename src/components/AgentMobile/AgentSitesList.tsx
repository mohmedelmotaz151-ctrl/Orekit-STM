import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Clock, 
  PlusCircle, 
  Building2, 
  ShieldAlert, 
  ChevronLeft,
  Calendar,
  CheckCircle2,
  Map as MapIcon,
  List as ListIcon
} from 'lucide-react';
import { User, Site, SiteType, SiteStatus } from '../../types';
import { SITE_STATUS_MAP, formatDateArabic, getContractExpiryBadge } from '../../utils/date';
import { LeafletMap } from '../Common/LeafletMap';

interface AgentSitesListProps {
  currentUser: User;
  sites: Site[];
  onSelectSite: (site: Site) => void;
  onOpenNewVisit: (siteToVisit?: Site) => void;
}

export const AgentSitesList: React.FC<AgentSitesListProps> = ({
  currentUser,
  sites,
  onSelectSite,
  onOpenNewVisit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showOnlyMine, setShowOnlyMine] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeMapSiteId, setActiveMapSiteId] = useState<string | undefined>(undefined);

  const filteredSites = sites.filter((site) => {
    const isMine = site.createdByAgentId === currentUser.id || 
                   (site.createdByAgentName && site.createdByAgentName === currentUser.name);
    if (showOnlyMine && !isMine) {
      return false;
    }
    if (selectedType !== 'all' && site.type !== selectedType) {
      return false;
    }
    if (selectedStatus !== 'all' && site.status !== selectedStatus) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = site.name.toLowerCase().includes(q);
      const matchPhone = site.phone.includes(q);
      const matchDistrict = site.district.toLowerCase().includes(q);
      const matchManager = site.managerName.toLowerCase().includes(q);
      return matchName || matchPhone || matchDistrict || matchManager;
    }
    return true;
  });

  return (
    <div className="space-y-4 max-w-md mx-auto pb-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">سجل المواقع والمنشآت (CRM)</h2>
          <p className="text-xs text-slate-400">إدارة ومتابعة عملاء الصيانة والسلامة</p>
        </div>
        <button
          onClick={() => onOpenNewVisit()}
          className="py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>موقع جديد</span>
        </button>
      </div>

      {/* Scope and View Mode Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Scope toggle: My Sites vs All Company Sites */}
        <div className="flex-1 flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setShowOnlyMine(true)}
            className={`flex-1 py-1.5 rounded-lg font-bold transition ${
              showOnlyMine ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            مواقعي ({sites.filter((s) => s.createdByAgentId === currentUser.id).length})
          </button>
          <button
            onClick={() => setShowOnlyMine(false)}
            className={`flex-1 py-1.5 rounded-lg font-bold transition ${
              !showOnlyMine ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الكل ({sites.length})
          </button>
        </div>

        {/* View mode toggle: List vs Map */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
              viewMode === 'list' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="عرض كقائمة"
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>قائمة</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
              viewMode === 'map' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="عرض على الخريطة"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>خريطة</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="بحث بالاسم، رقم الهاتف، الحي، أو اسم المسؤول..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Filter Row */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs"
        >
          <option value="all">كل الأنشطة</option>
          <option value="مطعم">مطاعم</option>
          <option value="فندق">فنادق</option>
          <option value="مستشفى">مستشفيات</option>
          <option value="مدرسة">مدارس</option>
          <option value="مستودع">مستودعات</option>
          <option value="مصنع">مصانع</option>
          <option value="مكتب">مكاتب</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs"
        >
          <option value="all">كل الحالات</option>
          <option value="new_opportunity">🟢 فرصة جديدة</option>
          <option value="needs_followup">🟡 يحتاج متابعة</option>
          <option value="competitor_contract">🔵 لديه عقد مع منافس</option>
          <option value="expiring_soon">🟠 عقد قريب الانتهاء</option>
          <option value="urgent_maintenance">🔴 يحتاج صيانة عاجلة</option>
        </select>
      </div>

      {/* Content: Map View OR List View */}
      {viewMode === 'map' ? (
        <div className="space-y-2">
          <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-orange-400">
              <MapPin className="w-4 h-4" />
              <span>المواقع على الخريطة ({filteredSites.length})</span>
            </span>
            <span className="text-[11px] text-slate-400">انقر على أي منشأة لفتح نافذة خرائط جوجل</span>
          </div>

          <LeafletMap
            sites={filteredSites}
            selectedSiteId={activeMapSiteId}
            onSelectSite={(site) => {
              setActiveMapSiteId(site.id);
            }}
            className="w-full h-[450px] rounded-2xl border border-slate-800 shadow-xl"
          />
        </div>
      ) : (
        /* Sites List */
        <div className="space-y-2.5">
          {filteredSites.length === 0 ? (
            <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center space-y-2">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">لا توجد مواقع مطابقة للبحث</h4>
              <p className="text-xs text-slate-500">جرب تغيير كلمات البحث أو إضافة موقع جديد الآن</p>
            </div>
          ) : (
            filteredSites.map((site) => {
              const statusInfo = SITE_STATUS_MAP[site.status] || SITE_STATUS_MAP.new_opportunity;
              const expiryBadge = site.contract.endDate ? getContractExpiryBadge(site.contract.endDate) : null;

              return (
                <div
                  key={site.id}
                  onClick={() => onSelectSite(site)}
                  className="bg-slate-900/80 hover:bg-slate-850 p-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-2.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                        <img
                          src={site.sitePhoto || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'}
                          alt={site.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white line-clamp-1">{site.name}</h4>
                        <p className="text-xs text-slate-400">
                          {site.type} • {site.city} ({site.district})
                        </p>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          المسؤول: {site.managerName}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap border ${statusInfo.bgClass}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                  {/* Expiry badge if applicable */}
                  {expiryBadge && (
                    <div className={`p-1.5 px-2.5 rounded-xl text-xs flex items-center justify-between ${expiryBadge.badgeClass}`}>
                      <span>عقد الصيانة:</span>
                      <span className="font-bold">{expiryBadge.text}</span>
                    </div>
                  )}

                  {/* Bottom stats and action buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${site.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 flex items-center gap-1 transition"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{site.phone}</span>
                      </a>

                      {site.latitude && site.longitude && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 px-2.5 rounded-lg bg-blue-950/70 text-blue-300 hover:bg-blue-900 border border-blue-800/60 flex items-center gap-1 text-[11px] font-bold transition shadow-sm"
                          title="فتح في خرائط جوجل"
                        >
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          <span>فتح في خرائط جوجل</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNewVisit(site);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-orange-600/30 text-orange-300 hover:bg-orange-600 hover:text-white text-[11px] font-bold transition flex items-center gap-1 border border-orange-500/40"
                      >
                        <span>زيارة جديدة</span>
                      </button>
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};
