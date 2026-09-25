import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Site } from '../../types';

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
  zoom = 12,
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

      // CartoDB Dark Matter / Voyager tiles for sleek professional theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      if (interactivePicker && onLocationPicked) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationPicked(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when center or zoom changes externally
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
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
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '4, 4',
        }).addTo(map);
      }
    } else if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
      circleLayerRef.current = null;
    }
  }, [pickedLocation, highlightProximityRadius, interactivePicker]);

  // Update site markers
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!markersGroup || !map) return;

    markersGroup.clearLayers();

    sites.forEach((site) => {
      if (!site.latitude || !site.longitude) return;

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
            <div class="px-2 py-0.5 rounded text-[11px] font-bold shadow-md whitespace-nowrap mb-1 ${
              isSelected ? 'bg-amber-400 text-slate-900 border-2 border-white scale-110' : 'bg-slate-900/90 text-white border border-slate-700'
            }">
              ${site.name.slice(0, 16)}${site.name.length > 16 ? '...' : ''}
            </div>
            <div style="background-color: ${markerBg}; border-color: ${isSelected ? '#ffffff' : markerBorder};" 
                 class="w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg border-2 text-white font-bold transition-transform group-hover:scale-125">
              ${iconSymbol}
            </div>
            <div style="border-top-color: ${markerBg};" class="w-0 h-0 border-x-4 border-x-transparent border-t-6"></div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 48],
      });

      const marker = L.marker([site.latitude, site.longitude], { icon: customIcon });

      marker.on('click', () => {
        if (onSelectSite) {
          onSelectSite(site);
        }
      });

      const popupContent = `
        <div class="text-right p-1 min-w-[200px]">
          <h4 class="font-bold text-sm text-slate-100 mb-1">${site.name}</h4>
          <p class="text-xs text-slate-400 mb-2">📍 ${site.city} - ${site.district}</p>
          <div class="text-xs text-slate-300 space-y-1 border-t border-slate-700/80 pt-1.5">
            <div><strong>المسؤول:</strong> ${site.managerName} (${site.phone})</div>
            <div><strong>النشاط:</strong> ${site.type}</div>
            <div><strong>المندوب:</strong> ${site.createdByAgentName}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersGroup.addLayer(marker);
    });
  }, [sites, selectedSiteId, onSelectSite]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {interactivePicker && (
        <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 text-amber-300 text-xs px-3 py-1.5 rounded-lg border border-amber-500/40 shadow-lg pointer-events-none backdrop-blur-sm">
          💡 انقر على الخريطة أو اسحب المؤشر لتحديد موقع المنشأة بدقة
        </div>
      )}
    </div>
  );
};
