import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Site } from '../../types';
import { getCurrentPosition } from '../../utils/geo';
import { MapPin, Navigation, ExternalLink, X, Phone, Building2, ShieldAlert } from 'lucide-react';

interface LeafletMapProps {
  sites?: Site[];
  selectedSiteId?: string;
  onSelectSite?: (site: Site) => void;
  center?: [number, number];
  zoom?: number;
  interactivePicker?: boolean;
  onLocationPicked?: (lat: number, lon: number) => void;
  pickedLocation?: { lat: number; lon: number };
  highlightProximityRadius?: { lat: number; lon: number; meters: number };
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  sites = [],
  selectedSiteId,
  onSelectSite,
  center = [24.7136, 46.6753], // Riyadh default
  zoom = 6,
  interactivePicker = false,
  onLocationPicked,
  pickedLocation,
  highlightProximityRadius,
  className = 'w-full h-80 rounded-2xl overflow-hidden',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  
  // Track selected site for the on-map quick action card
  const [activeSite, setActiveSite] = useState<Site | null>(null);

  // Sync external selectedSiteId
  useEffect(() => {
    if (selectedSiteId) {
      const found = sites.find((s) => s.id === selectedSiteId);
      if (found) {
        setActiveSite(found);
        const marker = markersMapRef.current.get(selectedSiteId);
        if (marker && mapInstanceRef.current) {
          mapInstanceRef.current.setView([found.latitude, found.longitude], 15, { animate: true });
          marker.openPopup();
        }
      }
    }
  }, [selectedSiteId, sites]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      // CartoDB Voyager tiles with CARTO API Key
      const cartoKey =
        (import.meta as any)?.env?.VITE_CARTO_API_KEY ||
        'cb1_3yo7_1_13ca9026653fe92c79527253';
      const cartoTileUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoKey}`;


      L.tileLayer(cartoTileUrl, {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Handle map resizing reliably
      const resizeTimer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      const resizeTimer2 = setTimeout(() => {
        map.invalidateSize();
      }, 500);

      // Interactive location picking
      if (interactivePicker && onLocationPicked) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationPicked(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        });
      }

      return () => {
        clearTimeout(resizeTimer);
        clearTimeout(resizeTimer2);
      };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ResizeObserver to ensure map always fills container without grey tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update center when center or zoom changes externally
  useEffect(() => {
    if (mapInstanceRef.current && center && !selectedSiteId && !pickedLocation && !activeSite) {
      mapInstanceRef.current.setView(center, zoom);
      mapInstanceRef.current.invalidateSize();
    }
  }, [center[0], center[1], zoom]);

  // Update picked marker and proximity circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickedLocation) {
      const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${pickedLocation.lat},${pickedLocation.lon}`;
      const pickerPopup = `
        <div class="text-right p-2 font-['Cairo',sans-serif] min-w-[210px] space-y-2">
          <div class="flex items-center gap-1.5 text-amber-400 font-bold text-xs border-b border-slate-700/80 pb-1.5">
            <span>📍</span>
            <span>الموقع الجغرافي المحدد</span>
          </div>
          <div class="text-[11px] text-slate-300 font-mono bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 text-center" dir="ltr">
            ${pickedLocation.lat.toFixed(6)}, ${pickedLocation.lon.toFixed(6)}
          </div>
          <a
            href="${gmapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="oriket-gmaps-btn"
            style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 12px; padding: 8px 12px; border-radius: 8px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4); border: 1px solid rgba(255, 255, 255, 0.2);"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="10" cy="10" r="3"></circle>
            </svg>
            <span>فتح في خرائط جوجل</span>
          </a>
        </div>
      `;

      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([pickedLocation.lat, pickedLocation.lon]);
        pickerMarkerRef.current.setPopupContent(pickerPopup);
      } else {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `
            <div style="transform: translate(-50%, -100%); cursor: pointer;" class="flex flex-col items-center">
              <span class="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-xs shadow-lg whitespace-nowrap border border-white">
                📍 الموقع المحدد
              </span>
              <div class="w-4 h-4 bg-amber-500 border-2 border-white rounded-full mt-0.5 shadow-md animate-bounce"></div>
            </div>
          `,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
        });

        pickerMarkerRef.current = L.marker([pickedLocation.lat, pickedLocation.lon], {
          icon: pickerIcon,
          draggable: interactivePicker,
        }).addTo(map);

        pickerMarkerRef.current.bindPopup(pickerPopup, {
          offset: [0, -32],
          autoPanPadding: [20, 20],
        });

        if (interactivePicker && onLocationPicked) {
          pickerMarkerRef.current.on('dragend', (e) => {
            const latlng = e.target.getLatLng();
            onLocationPicked(Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6)));
          });
        }
      }
    } else if (pickerMarkerRef.current) {
      map.removeLayer(pickerMarkerRef.current);
      pickerMarkerRef.current = null;
    }

    // 50m Proximity radius circle
    if (highlightProximityRadius) {
      if (circleLayerRef.current) {
        circleLayerRef.current.setLatLng([highlightProximityRadius.lat, highlightProximityRadius.lon]);
        circleLayerRef.current.setRadius(highlightProximityRadius.meters);
      } else {
        circleLayerRef.current = L.circle([highlightProximityRadius.lat, highlightProximityRadius.lon], {
          radius: highlightProximityRadius.meters,
          color: '#f97316',
          fillColor: '#ea580c',
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4, 4',
        }).addTo(map);
      }
    } else if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
      circleLayerRef.current = null;
    }
  }, [pickedLocation, highlightProximityRadius, interactivePicker]);

  // Helper status color mapping
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'urgent_maintenance':
        return { label: 'صيانة عاجلة', bg: '#ef4444', border: '#b91c1c', badge: 'bg-red-500/20 text-red-400 border-red-500/40', symbol: '🧯' };
      case 'expiring_soon':
        return { label: 'عقد ينتهي قريباً', bg: '#f97316', border: '#c2410c', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40', symbol: '⚠️' };
      case 'competitor_contract':
        return { label: 'عقد مع منافس', bg: '#3b82f6', border: '#1d4ed8', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40', symbol: '📋' };
      case 'needs_followup':
        return { label: 'يحتاج متابعة', bg: '#eab308', border: '#a16207', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', symbol: '📞' };
      default:
        return { label: 'فرصة جديدة', bg: '#10b981', border: '#059669', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', symbol: '🏢' };
    }
  };

  // Update site markers and automatically center/fit bounds
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!markersGroup || !map) return;

    markersGroup.clearLayers();
    markersMapRef.current.clear();

    const validSites = sites.filter(
      (s) =>
        typeof s.latitude === 'number' &&
        typeof s.longitude === 'number' &&
        !isNaN(s.latitude) &&
        !isNaN(s.longitude) &&
        s.latitude !== 0
    );

    validSites.forEach((site) => {
      const isSelected = selectedSiteId === site.id || activeSite?.id === site.id;
      const statusInfo = getStatusDetails(site.status);

      const customIcon = L.divIcon({
        className: 'site-marker-icon',
        html: `
          <div style="transform: translate(-50%, -100%); cursor: pointer;" class="flex flex-col items-center group">
            <div class="px-2 py-0.5 rounded text-[11px] font-bold shadow-lg whitespace-nowrap mb-1 transition-all ${
              isSelected
                ? 'bg-amber-400 text-slate-950 border-2 border-white scale-110 z-50 ring-2 ring-amber-500'
                : 'bg-slate-900/95 text-white border border-slate-700'
            }">
              ${site.name.slice(0, 18)}${site.name.length > 18 ? '...' : ''}
            </div>
            <div style="background-color: ${statusInfo.bg}; border-color: ${isSelected ? '#ffffff' : statusInfo.border};" 
                 class="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xl border-2 text-white font-bold transition-transform group-hover:scale-125">
              ${statusInfo.symbol}
            </div>
            <div style="border-top-color: ${statusInfo.bg};" class="w-0 h-0 border-x-4 border-x-transparent border-t-6"></div>
          </div>
        `,
        iconSize: [36, 52],
        iconAnchor: [18, 52],
      });

      const marker = L.marker([site.latitude, site.longitude], { icon: customIcon });

      // Construct rich Arabic Popup with prominent 'فتح في خرائط جوجل'
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}`;

      const popupContent = `
        <div class="oriket-map-popup text-right font-['Cairo',sans-serif] min-w-[240px] max-w-[280px]">
          <!-- Header -->
          <div class="border-b border-slate-700/80 pb-2 mb-2">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.badge} border">
                ${statusInfo.label}
              </span>
              <span class="text-[10px] text-slate-400 font-mono" dir="ltr">
                ${site.city}
              </span>
            </div>
            <h4 class="font-black text-sm text-white leading-snug">${site.name}</h4>
            <p class="text-xs text-orange-400 mt-0.5">📍 ${site.city} - ${site.district || 'الحي غير محدد'}</p>
          </div>

          <!-- Quick Info -->
          <div class="text-xs text-slate-300 space-y-1.5 pb-2.5">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">النشاط:</span>
              <span class="font-bold text-white text-[11px]">${site.type}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">المسؤول:</span>
              <span class="font-medium text-slate-200 text-[11px]">${site.managerName}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">رقم الهاتف:</span>
              <a href="tel:${site.phone}" class="text-sky-400 font-mono font-bold hover:underline text-[11px]" dir="ltr">
                📞 ${site.phone}
              </a>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">أجهزة السلامة:</span>
              <span class="text-emerald-400 font-bold text-[11px]">
                ${site.equipment?.extinguishers?.totalCount || 0} طفاية
                ${site.equipment?.alarmSystem?.exists ? '• إنذار' : ''}
              </span>
            </div>
            ${
              site.contract?.hasContract === 'yes' && site.contract?.endDate
                ? `<div class="flex items-center justify-between text-[10px] text-amber-300/90 pt-0.5">
                    <span>انتهاء العقد الحالي:</span>
                    <span class="font-mono">${site.contract.endDate}</span>
                  </div>`
                : ''
            }
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800" dir="ltr">
              <span>${site.latitude.toFixed(5)}, ${site.longitude.toFixed(5)}</span>
              <span class="text-slate-500">إحداثيات GPS</span>
            </div>
          </div>

          <!-- Action 1: Direct Google Maps Launch Button -->
          <a
            href="${googleMapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="oriket-gmaps-btn"
            style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; padding: 10px 14px; border-radius: 12px; margin-top: 4px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); transition: all 0.2s;"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>فتح في خرائط جوجل</span>
          </a>

          <!-- Action 2: Direct GPS Turn-by-Turn Directions -->
          <a
            href="${directionsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; background: #1e293b; color: #38bdf8; text-decoration: none; font-weight: 700; font-size: 11px; padding: 7px 10px; border-radius: 10px; margin-top: 6px; border: 1px solid #334155;"
          >
            <span>🚗 بدء التوجيه ومسار القيادة</span>
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        offset: [0, -38],
        autoPanPadding: [25, 25],
        closeButton: true,
      });

      marker.on('click', () => {
        setActiveSite(site);
        marker.openPopup();
        if (onSelectSite) {
          onSelectSite(site);
        }
      });

      markersGroup.addLayer(marker);
      markersMapRef.current.set(site.id, marker);

      // If this site is currently selected, open popup
      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 100);
      }
    });

    // Auto-fit bounds on added sites so the user always sees their added sites!
    if (!interactivePicker && !pickedLocation) {
      if (selectedSiteId || activeSite) {
        const targetId = selectedSiteId || activeSite?.id;
        const selected = validSites.find((s) => s.id === targetId);
        if (selected) {
          map.setView([selected.latitude, selected.longitude], 15, { animate: true });
        }
      } else if (validSites.length === 1) {
        map.setView([validSites[0].latitude, validSites[0].longitude], 14, { animate: true });
      } else if (validSites.length > 1) {
        const bounds = L.latLngBounds(validSites.map((s) => [s.latitude, s.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
      }
    }
  }, [sites, selectedSiteId, interactivePicker, pickedLocation]);

  // Fit all sites manually button
  const handleFitAllSites = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const validSites = sites.filter(
      (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number' && s.latitude !== 0
    );
    if (validSites.length === 1) {
      map.setView([validSites[0].latitude, validSites[0].longitude], 14);
    } else if (validSites.length > 1) {
      const bounds = L.latLngBounds(validSites.map((s) => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView(center, zoom);
    }
    map.invalidateSize();
  };

  // Locate me button
  const handleLocateMe = async () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const pos = await getCurrentPosition();
    map.setView([pos.latitude, pos.longitude], 15, { animate: true });
    map.invalidateSize();
  };

  const validSitesCount = sites.filter((s) => s.latitude && s.longitude).length;

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* On-map top controls */}
      {!interactivePicker && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto">
          <span className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>المواقع على الخريطة: {validSitesCount}</span>
          </span>

          {validSitesCount > 1 && (
            <button
              onClick={handleFitAllSites}
              className="bg-slate-900/90 hover:bg-slate-800 text-orange-400 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm font-bold transition"
              title="عرض واحتواء جميع المواقع"
            >
              🎯 إظهار الكل
            </button>
          )}

          <button
            onClick={handleLocateMe}
            className="bg-slate-900/90 hover:bg-slate-800 text-sky-400 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm font-bold transition"
            title="تحديد موقعي الآن"
          >
            📍 موقعي
          </button>
        </div>
      )}

      {/* Instruction badge for picker mode */}
      {interactivePicker && (
        <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/95 text-amber-300 text-xs px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xl pointer-events-none backdrop-blur-sm flex items-center gap-1.5">
          <span>💡</span>
          <span>انقر على الخريطة أو اسحب المؤشر لتحديد موقع المنشأة بدقة</span>
        </div>
      )}

      {/* Responsive floating quick card when a site is actively selected */}
      {activeSite && !interactivePicker && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:left-3 sm:w-80 z-[1000] bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40">
                  {getStatusDetails(activeSite.status).label}
                </span>
                <span className="text-xs text-slate-400">{activeSite.type}</span>
              </div>
              <h4 className="font-bold text-sm text-white line-clamp-1">{activeSite.name}</h4>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>{activeSite.city} - {activeSite.district}</span>
              </p>
            </div>

            <button
              onClick={() => setActiveSite(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800 font-mono" dir="ltr">
            <span>{activeSite.latitude.toFixed(5)}, {activeSite.longitude.toFixed(5)}</span>
            <span className="text-slate-500 text-[11px] font-sans">مسؤول: {activeSite.managerName}</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activeSite.latitude},${activeSite.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-98"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>فتح في خرائط جوجل</span>
            </a>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeSite.latitude},${activeSite.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition active:scale-98"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>بدء التوجيه (GPS)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
