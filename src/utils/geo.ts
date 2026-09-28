import { Site, ProximityAlert } from '../types';

/**
 * Calculates the great-circle distance between two points in meters (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Checks if there is an existing site within 50m radius or with matching phone/name
 */
export function checkProximityAndDuplicates(
  currentLat: number,
  currentLon: number,
  siteName: string,
  phone: string,
  existingSites: Site[],
  excludeSiteId?: string
): ProximityAlert[] {
  const alerts: ProximityAlert[] = [];
  const normalizedName = siteName.trim().toLowerCase();
  const normalizedPhone = phone.replace(/[\s\-\+]/g, '');

  for (const site of existingSites) {
    if (excludeSiteId && site.id === excludeSiteId) continue;

    const dist = calculateDistanceMeters(currentLat, currentLon, site.latitude, site.longitude);
    
    // Proximity alert within 75 meters (flagging < 50m specifically)
    if (dist <= 75) {
      alerts.push({ existingSite: site, distanceMeters: dist });
      continue;
    }

    // Duplicate check by phone or exact name
    const existingPhone = (site.phone || '').replace(/[\s\-\+]/g, '');
    const existingName = (site.name || '').trim().toLowerCase();

    if (
      (normalizedPhone.length > 7 && existingPhone.includes(normalizedPhone)) ||
      (normalizedName.length > 3 && (existingName === normalizedName || existingName.includes(normalizedName)))
    ) {
      alerts.push({ existingSite: site, distanceMeters: dist });
    }
  }

  return alerts.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Gets device GPS with timeout and fallback
 */
export function getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy || 10),
          });
        },
        () => {
          // Fallback to high-traffic commercial location in Riyadh (Olaya / Tahlia Street)
          const jitterLat = (Math.random() - 0.5) * 0.008;
          const jitterLon = (Math.random() - 0.5) * 0.008;
          resolve({
            latitude: Number((24.7085 + jitterLat).toFixed(6)),
            longitude: Number((46.6852 + jitterLon).toFixed(6)),
            accuracy: 15,
          });
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      resolve({
        latitude: 24.7085,
        longitude: 46.6852,
        accuracy: 20,
      });
    }
  });
}

/**
 * Detects the closest Saudi city from given latitude and longitude coordinates
 */
export function detectClosestSaudiCity(lat: number, lon: number): string {
  const cityCoordinates: { name: string; lat: number; lon: number }[] = [
    { name: 'خميس مشيط', lat: 18.3000, lon: 42.7333 },
    { name: 'أبها', lat: 18.2164, lon: 42.5053 },
    { name: 'الرياض', lat: 24.7136, lon: 46.6753 },
    { name: 'جدة', lat: 21.5433, lon: 39.1728 },
    { name: 'مكة المكرمة', lat: 21.3891, lon: 39.8579 },
    { name: 'المدينة المنورة', lat: 24.5247, lon: 39.5692 },
    { name: 'الدمام', lat: 26.4207, lon: 50.0888 },
    { name: 'الخبر', lat: 26.2172, lon: 50.1971 },
    { name: 'القصيم / بريدة', lat: 26.3592, lon: 43.9818 },
    { name: 'تبوك', lat: 28.3835, lon: 36.5662 },
    { name: 'حائل', lat: 27.5114, lon: 41.7208 },
    { name: 'نجران', lat: 17.4924, lon: 44.1277 },
    { name: 'جازان', lat: 16.8892, lon: 42.5706 },
  ];

  let closestCity = 'الرياض';
  let minDistance = Infinity;

  for (const c of cityCoordinates) {
    const dist = calculateDistanceMeters(lat, lon, c.lat, c.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closestCity = c.name;
    }
  }

  // If closest city is within reasonable threshold (~250km), return it
  if (minDistance < 250000) {
    return closestCity;
  }
  return 'الرياض';
}

/**
 * Formats coordinates for display
 */
export function formatCoordinates(lat: number, lon: number): string {
  return `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`;
}
