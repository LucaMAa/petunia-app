import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useMapReports } from '../../hooks/useMapReports';
import { usePets } from '../../hooks/usePets';
import { useActivityTrackingContext } from '../../context/ActivityTrackingContext';
import { colors, spacing } from '../../styles/theme';
import { REPORT_TYPES } from '../../types/mapTypes';
import { buildLeafletHTML } from './leaflet';
import { CreateReportSheet } from './MapOverlays';
import { ActivityDock } from './components/ActivityDock';
import { MapFilter, MapHubControls, reportMatchesFilter } from './components/MapHubControls';
import { ActivityStartSheet } from './components/ActivityStartSheet';

interface Props {
  wsRef: React.MutableRefObject<WebSocket | null>;
}

export function MapScreen({ wsRef }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionState, setPermissionState] = useState<'loading' | 'denied' | 'granted'>(
    'loading',
  );
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [pendingCoord, setPendingCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMode, setMapMode] = useState<'explore' | 'report'>('explore');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MapFilter>('all');
  const [showActivityStart, setShowActivityStart] = useState(false);
  const [mapHeight, setMapHeight] = useState(0);
  const { reports, loadNearby, create } = useMapReports();
  const { pets, load: loadPets } = usePets();
  const activityTracking = useActivityTrackingContext();
  const { setDock } = activityTracking;
  const onDockChange = useCallback(
    (next: { minimized: boolean; top: number | null }) => setDock(next),
    [setDock],
  );
  const filteredReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          reportMatchesFilter(r.type, filter) &&
          `${r.title} ${r.description} ${REPORT_TYPES[r.type].label}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [reports, filter, query],
  );
  const sendToMap = (msg: object) =>
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(msg))}}));true;`,
    );

  useEffect(() => {
    loadPets();
  }, [loadPets]);
  useEffect(() => {
    let watcher: Location.LocationSubscription | undefined;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionState('denied');
        return;
      }
      setPermissionState('granted');
      const applyLocation = (loc: Location.LocationObject) => {
        const point = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setUserLocation(point);
        sendToMap({ type: 'updateLocation', ...point });
        if (wsRef.current?.readyState === WebSocket.OPEN)
          wsRef.current.send(JSON.stringify({ event: 'location_update', payload: point }));
        return point;
      };
      const last = await Location.getLastKnownPositionAsync({});
      if (last) {
        const point = applyLocation(last);
        loadNearby(point.lat, point.lng, 5000);
      }
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const point = applyLocation(current);
        loadNearby(point.lat, point.lng, 5000);
        watcher = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 15000 },
          applyLocation,
        );
      } catch {}
    })();
    return () => watcher?.remove();
  }, [loadNearby, wsRef]);
  useEffect(() => {
    if (!userLocation) return;
    sendToMap({ type: 'updateReports', reports: filteredReports });
  }, [filteredReports, userLocation]);
  useEffect(() => {
    sendToMap({ type: 'updateTrack', points: activityTracking.activity?.points ?? [] });
  }, [activityTracking.activity?.points]);
  useEffect(() => {
    if (activityTracking.activity?.status === 'active' && userLocation)
      sendToMap({ type: 'setFollowing', following: true });
  }, [activityTracking.activity?.id, activityTracking.activity?.status, userLocation]);
  useEffect(() => {
    if (!activityTracking.lastLocation) return;
    setUserLocation(activityTracking.lastLocation);
    sendToMap({ type: 'updateLocation', ...activityTracking.lastLocation });
  }, [activityTracking.lastLocation]);

  function openQuickReport() {
    if (userLocation) {
      setMapMode('explore');
      setPendingCoord(userLocation);
      setShowCreateSheet(true);
    }
  }
  if (permissionState === 'loading')
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.hint}>Sto preparando la tua mappa…</Text>
      </View>
    );
  if (permissionState === 'denied')
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionIcon}>📍</Text>
        <Text style={styles.hint}>
          Abilita la posizione per scoprire cosa puoi fare intorno a te.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() =>
            Location.requestForegroundPermissionsAsync().then(({ status }) =>
              setPermissionState(status === 'granted' ? 'granted' : 'denied'),
            )
          }
        >
          <Text style={styles.permissionButtonText}>Abilita posizione</Text>
        </TouchableOpacity>
      </View>
    );
  if (!userLocation)
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.hint}>Cerco la tua posizione…</Text>
      </View>
    );
  return (
    <View
      style={styles.container}
      onLayout={(event: LayoutChangeEvent) => setMapHeight(event.nativeEvent.layout.height)}
    >
      <WebView
        ref={webViewRef}
        style={styles.map}
        pointerEvents="auto"
        originWhitelist={['*']}
        source={{ html: buildLeafletHTML(userLocation.lat, userLocation.lng, filteredReports) }}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'mapTap' && mapMode === 'report') {
              setPendingCoord({ lat: msg.lat, lng: msg.lng });
              setShowCreateSheet(true);
              setMapMode('explore');
            }
          } catch {}
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        scrollEnabled
        bounces={false}
        onShouldStartLoadWithRequest={(request) =>
          request.url === 'about:blank' || request.url.startsWith('data:')
        }
      />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {!showCreateSheet && (
          <MapHubControls
            query={query}
            onQueryChange={setQuery}
            filter={filter}
            onFilterChange={setFilter}
            onLocate={() => sendToMap({ type: 'centerUser', ...userLocation })}
            mapMode={mapMode}
            onMapModeChange={setMapMode}
            onReport={() => setMapMode('report')}
            onActivity={() => setShowActivityStart(true)}
            activeActivity={!!activityTracking.activity}
          />
        )}
      </View>
      <ActivityDock
        activity={activityTracking.activity}
        dock={activityTracking.dock}
        containerHeight={mapHeight}
        onDockChange={onDockChange}
        onPause={activityTracking.pause}
        onResume={activityTracking.resume}
        onFinish={activityTracking.finish}
      />
      {showCreateSheet && pendingCoord && (
        <CreateReportSheet
          coord={pendingCoord}
          onClose={() => {
            setShowCreateSheet(false);
            setPendingCoord(null);
            setMapMode('explore');
            sendToMap({ type: 'clearPending' });
          }}
          onCreate={async (dto) => {
            await create(dto);
            setShowCreateSheet(false);
            setPendingCoord(null);
            setMapMode('explore');
            sendToMap({ type: 'clearPending' });
          }}
        />
      )}
      <ActivityStartSheet
        visible={showActivityStart}
        pet={pets[0]}
        pets={pets}
        onClose={() => setShowActivityStart(false)}
        onStart={async (type, pet) => {
          setShowActivityStart(false);
          await activityTracking.start(type, pet ?? pets[0]);
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  hint: { color: colors.textSecondary, textAlign: 'center', fontSize: 15 },
  permissionIcon: { fontSize: 48 },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    height: 46,
    borderRadius: 999,
    justifyContent: 'center',
  },
  permissionButtonText: { color: colors.textOnPrimary, fontWeight: '800' },
});
