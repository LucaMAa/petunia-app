import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { MapReport } from '../types';

export function useGeofencing(
  reports: MapReport[],
  onAlert: (report: MapReport) => void,
  wsRef: React.MutableRefObject<WebSocket | null>,
) {
  const alertedIds = useRef<Set<string>>(new Set());
  const ALERT_RADIUS_M = 200;

  const checkProximity = useCallback(
    (lat: number, lng: number) => {
      for (const r of reports) {
        if (r.type !== 'poisoned_bait' && r.type !== 'danger') continue;
        if (alertedIds.current.has(r.id)) continue;
        const dist = haversine(lat, lng, r.lat, r.lng);
        if (dist <= ALERT_RADIUS_M) {
          alertedIds.current.add(r.id);
          onAlert(r);
        }
      }
    },
    [reports, onAlert],
  );

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 30,
          timeInterval: 15000,
        },
        (loc) => {
          const { latitude: lat, longitude: lng } = loc.coords;
          checkProximity(lat, lng);

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event: 'location_update', payload: { lat, lng } }));
          }
        },
      );
    })();

    return () => {
      sub?.remove();
    };
  }, [checkProximity, wsRef]);
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
