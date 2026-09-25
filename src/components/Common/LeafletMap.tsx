import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Site } from '../../types';
import { getCurrentPosition } from '../../utils/geo';

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
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);

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
      const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY || 'cb1_3yo7_1_13ca9026653fe92c79527253';
      const cartoTileUrl = CARTO_API_KEY
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(cartoTileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        subdomains: 'abcd',
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
    if (mapInstanceRef.current && center && !selectedSiteId && !pickedLocation) {
      mapInstanceRef.current.setView(center, zoom);
      mapInstanceRef.current.invalidateSize();
    }
  }, [center[0], center[1], zoom]);

  // Update picked marker and proximity circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickedLocation) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([pickedLocation.lat, pickedLocation.lon]);
      } else {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `
            <div style="transform: translate(-50%, -100%);" class="flex flex-col items-center">
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

  // Update site markers and automatically center/fit bounds
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!markersGroup || !map) return;

    markersGroup.clearLayers();

    const validSites = sites.filter(
      (s) =>
        typeof s.latitude === 'number' &&
        typeof s.longitude === 'number' &&
        !isNaN(s.latitude) &&
        !isNaN(s.longitude) &&
        s.latitude !== 0
    );

    validSites.forEach((site) => {
      const isSelected = selectedSiteId === site.id;

      // Color mapping for pins
      let markerBg = '#10b981'; // green: new_opportunity
      let markerBorder = '#059669';
      let iconSymbol = '🏢';

      if (site.status === 'urgent_maintenance') {
        markerBg = '#ef4444'; // red
        markerBorder = '#b91c1c';
        iconSymbol = '🧯';
      } else if (site.status === 'expiring_soon') {
        markerBg = '#f97316'; // orange
        markerBorder = '#c2410c';
        iconSymbol = '⚠️';
      } else if (site.status === 'competitor_contract') {
        markerBg = '#3b82f6'; // blue
        markerBorder = '#1d4ed8';
        iconSymbol = '📋';
      } else if (site.status === 'needs_followup') {
        markerBg = '#eab308'; // yellow
        markerBorder = '#a16207';
        iconSymbol = '📞';
      }

      const customIcon = L.divIcon({
        className: 'site-marker-icon',
        html: `
          <div style="transform: translate(-50%, -100%); cursor: pointer;" class="flex flex-col items-center group">
            <div class="px-2 py-0.5 rounded text-[11px] font-bold shadow-lg whitespace-nowrap mb-1 transition-all ${
              isSelected
                ? 'bg-amber-400 text-slate-950 border-2 border-white scale-125 z-50'
                : 'bg-slate-900/95 text-white border border-slate-700'
            }">
              ${site.name.slice(0, 18)}${site.name.length > 18 ? '...' : ''}
            </div>
            <div style="background-color: ${markerBg}; border-color: ${isSelected ? '#ffffff' : markerBorder};" 
                 class="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xl border-2 text-white font-bold transition-transform group-hover:scale-125">
              ${iconSymbol}
            </div>
            <div style="border-top-color: ${markerBg};" class="w-0 h-0 border-x-4 border-x-transparent border-t-6"></div>
          </div>
        `,
        iconSize: [36, 52],
        iconAnchor: [18, 52],
      });

      const marker = L.marker([site.latitude, site.longitude], { icon: customIcon });

      marker.on('click', () => {
        if (onSelectSite) {
          onSelectSite(site);
        }
      });

      const popupContent = `
        <div class="text-right p-1.5 min-w-[210px] font-['Cairo',sans-serif]">
          <h4 class="font-bold text-sm text-white mb-1">${site.name}</h4>
          <p class="text-xs text-orange-400 mb-2">📍 ${site.city} - ${site.district}</p>
          <div class="text-xs text-slate-300 space-y-1 border-t border-slate-700/80 pt-1.5">
            <div><strong>المسؤول:</strong> ${site.managerName} (${site.phone})</div>
            <div><strong>النشاط:</strong> ${site.type}</div>
            <div><strong>المندوب:</strong> ${site.createdByAgentName}</div>
            <div class="text-emerald-400 font-bold mt-1">طفايات: ${site.equipment?.extinguishers?.totalCount || 0}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersGroup.addLayer(marker);
    });

    // Auto-fit bounds on added sites so the user always sees their added sites!
    if (!interactivePicker && !pickedLocation) {
      if (selectedSiteId) {
        const selected = validSites.find((s) => s.id === selectedSiteId);
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
  }, [sites, selectedSiteId, onSelectSite, interactivePicker, pickedLocation]);

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
      
      {/* On-map header controls */}
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

      {interactivePicker && (
        <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/95 text-amber-300 text-xs px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xl pointer-events-none backdrop-blur-sm flex items-center gap-1.5">
          <span>💡</span>
          <span>انقر على الخريطة أو اسحب المؤشر لتحديد موقع المنشأة بدقة</span>
        </div>
      )}
    </div>
  );
};
