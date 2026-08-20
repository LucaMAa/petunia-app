import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { AppState } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { activitiesApi } from '../api/activities';
import { Activity, ActivityPoint, ActivityPrivacy, ActivityType, Pet } from '../types';
import { haversine } from '../types/mapTypes';

const STORAGE_KEY = '@petunia:pending-activity';
const MIN_POINT_DISTANCE_M = 5;
const MAX_ACCEPTED_ACCURACY_M = 200;
const MAX_WALK_SPEED_MPS = 10;
type LocalActivity = Activity & { pending_points: ActivityPoint[] };

function activeDuration(activity: Activity, at = Date.now()) {
  const end = activity.ended_at
    ? new Date(activity.ended_at).getTime()
    : activity.paused_at
      ? new Date(activity.paused_at).getTime()
      : at;
  return Math.max(
    0,
    Math.floor((end - new Date(activity.started_at).getTime()) / 1000) -
      (activity.paused_duration_s ?? 0),
  );
}

export function useActivityTracking() {
  const [activity, setActivity] = useState<LocalActivity | null>(null);
  const [now, setNow] = useState(Date.now());
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const activityRef = useRef<LocalActivity | null>(null);
  const persist = useCallback(async (next: LocalActivity | null) => {
    activityRef.current = next;
    setActivity(next);
    if (next) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);
  const mergeServer = useCallback(
    async (server: Activity, current: LocalActivity) => {
      const next = {
        ...current,
        ...server,
        pet: current.pet ?? server.pet,
        points: current.points,
        pending_points: current.pending_points,
      };
      await persist(next);
      return next;
    },
    [persist],
  );
  const sync = useCallback(
    async (current = activityRef.current) => {
      if (!current?.pending_points.length || current.id.startsWith('local-')) return current;
      const pending = current.pending_points;
      const server = await activitiesApi.appendPoints(current.id, pending);
      return mergeServer(server, { ...current, pending_points: [] });
    },
    [mergeServer],
  );
  const record = useCallback(
    async (location: Location.LocationObject) => {
      setLastLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
      const current = activityRef.current;
      if (
        !current ||
        current.status !== 'active' ||
        location.coords.accuracy === null ||
        location.coords.accuracy > MAX_ACCEPTED_ACCURACY_M
      )
        return;
      const point: ActivityPoint = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy_m: location.coords.accuracy,
        recorded_at: new Date(location.timestamp).toISOString(),
      };
      const previous = current.points?.[current.points.length - 1];
      if (previous) {
        const distance = haversine(previous.lat, previous.lng, point.lat, point.lng);
        const elapsed = Math.max(
          1,
          (new Date(point.recorded_at).getTime() - new Date(previous.recorded_at).getTime()) / 1000,
        );
        if (distance < MIN_POINT_DISTANCE_M || distance / elapsed > MAX_WALK_SPEED_MPS) return;
      }
      const distance = previous ? haversine(previous.lat, previous.lng, point.lat, point.lng) : 0;
      const next = {
        ...current,
        points: [...(current.points ?? []), point],
        pending_points: [...current.pending_points, point],
        distance_m: current.distance_m + distance,
        duration_s: activeDuration(current),
      };
      await persist(next);
      setNow(Date.now());
      if (next.pending_points.length >= 12)
        try {
          await sync(next);
        } catch {}
    },
    [persist, sync],
  );
  const watch = useCallback(async () => {
    subscription.current?.remove();
    subscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        timeInterval: 5000,
      },
      record,
    );
  }, [record]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (activityRef.current?.status === 'active') setNow(Date.now());
    }, 1000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(Date.now());
        if (activityRef.current?.status === 'active') watch().catch(() => {});
      }
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [watch]);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      const restored = JSON.parse(raw) as LocalActivity;
      persist(restored).then(() => {
        if (restored.status === 'active') watch();
      });
    });
    return () => subscription.current?.remove();
  }, [persist, watch]);
  const start = useCallback(
    async (type: ActivityType, pet: Pet | undefined, privacy: ActivityPrivacy = 'private') => {
      const started_at = new Date().toISOString();
      let created: Activity;
      try {
        created = await activitiesApi.start({ type, pet_id: pet?.id, privacy, started_at });
      } catch {
        created = {
          id: `local-${Date.now()}`,
          type,
          pet_id: pet?.id,
          pet,
          privacy,
          status: 'active',
          started_at,
          duration_s: 0,
          distance_m: 0,
          points: [],
          created_at: started_at,
        };
      }
      await persist({
        ...created,
        pet,
        status: 'active',
        points: [],
        pending_points: [],
        paused_duration_s: 0,
      });
      setNow(Date.now());
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('location_permission_denied');
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        await record(initial);
        await watch();
      } catch {
        // If permissions denied or other location error, leave activity active but without live tracking.
      }
    },
    [persist, record, watch],
  );
  const pause = useCallback(async () => {
    const current = activityRef.current;
    if (!current) return;
    subscription.current?.remove();
    const occurred = new Date().toISOString();
    const local = {
      ...current,
      status: 'paused' as const,
      paused_at: occurred,
      duration_s: activeDuration(current, new Date(occurred).getTime()),
    };
    await persist(local);
    try {
      await sync(local);
      if (!local.id.startsWith('local-'))
        await mergeServer(await activitiesApi.pause(local.id, occurred), local);
    } catch {}
  }, [mergeServer, persist, sync]);
  const resume = useCallback(async () => {
    const current = activityRef.current;
    if (!current) return;
    const occurred = new Date().toISOString();
    const pausedSeconds = current.paused_at
      ? Math.max(
          0,
          Math.floor((new Date(occurred).getTime() - new Date(current.paused_at).getTime()) / 1000),
        )
      : 0;
    const local = {
      ...current,
      status: 'active' as const,
      paused_at: null,
      paused_duration_s: (current.paused_duration_s ?? 0) + pausedSeconds,
    };
    await persist(local);
    try {
      if (!local.id.startsWith('local-'))
        await mergeServer(await activitiesApi.resume(local.id, occurred), local);
    } catch {}
    setNow(Date.now());
    await watch();
  }, [mergeServer, persist, watch]);
  const finish = useCallback(async () => {
    const current = activityRef.current;
    if (!current) return;
    subscription.current?.remove();
    const occurred = new Date().toISOString();
    try {
      await sync(current);
      if (!current.id.startsWith('local-')) await activitiesApi.finish(current.id, occurred);
    } finally {
      await persist(null);
    }
  }, [persist, sync]);
  const cancel = useCallback(async () => {
    const current = activityRef.current;
    subscription.current?.remove();
    if (current && !current.id.startsWith('local-'))
      try {
        await activitiesApi.cancel(current.id);
      } catch {}
    await persist(null);
  }, [persist]);
  return {
    activity: activity ? { ...activity, duration_s: activeDuration(activity, now) } : null,
    start,
    pause,
    resume,
    finish,
    cancel,
    lastLocation,
  };
}
