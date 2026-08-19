import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useMapReports } from "../../hooks/useMapReports";
import { colors, spacing, radius, shadow } from "../../styles/theme";
import { MapReport, ReportType } from "../../types";

import { REPORT_TYPES, ReportTypeMeta, haversine } from "../../types/mapTypes";
import { buildLeafletHTML } from "./leaflet";
import { ProximityAlert, ReportDetailSheet, CreateReportSheet } from "./MapOverlays";

interface Props {
  wsRef: React.MutableRefObject<WebSocket | null>;
}

export function MapScreen({ wsRef }: Props) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationReady, setLocationReady] = useState(false);

  const { reports, isLoading, loadNearby, create, remove, reportAbuse } = useMapReports();

  const [selectedReport, setSelectedReport] = useState<MapReport | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [pendingCoord, setPendingCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [alertReport, setAlertReport] = useState<MapReport | null>(null);

  const alertedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      setLocationGranted(true);
      const last = await Location.getLastKnownPositionAsync({});
      if (last) {
        const { latitude: lat, longitude: lng } = last.coords;
        setUserLocation({ lat, lng });
        setLocationReady(true);
        loadNearby(lat, lng, 5000);
      }

      const precise = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = precise.coords;
      setUserLocation({ lat, lng });
      if (!last) {
        setLocationReady(true);
      }
      loadNearby(lat, lng, 5000);
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 20, timeInterval: 10000 },
        (loc) => {
          const { latitude: la, longitude: lo } = loc.coords;
          setUserLocation({ lat: la, lng: lo });
          sendToMap({ type: "updateLocation", lat: la, lng: lo });
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event: "location_update", payload: { lat: la, lng: lo } }));
          }
        }
      );
    })();
  }, []);
  useEffect(() => {
    if (!locationReady || !userLocation || reports.length === 0) return;

    const { lat, lng } = userLocation;
    sendToMap({
      type: "updateReports",
      reports: reports.map((r) => ({
        id: r.id, lat: r.lat, lng: r.lng, type: r.type,
        title: r.title, description: r.description,
        status: r.status, abuse_count: r.abuse_count,
        distance_m: r.distance_m ?? 0, created_at: r.created_at,
        user: r.user ?? null, image_urls: r.image_urls ?? [],
      })),
    });
    for (const r of reports) {
      if (r.type !== "poisoned_bait" && r.type !== "danger") continue;
      if (alertedIds.current.has(r.id)) continue;
      if (haversine(lat, lng, r.lat, r.lng) <= REPORT_TYPES[r.type].alertRadius) {
        alertedIds.current.add(r.id);
        setAlertReport(r);
        break;
      }
    }
  }, [reports, locationReady]);

  function sendToMap(msg: object) {
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(msg))}}));true;`
    );
  }

  function handleWebViewMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "mapTap") {
        setPendingCoord({ lat: msg.lat, lng: msg.lng });
        setShowCreateSheet(true);
        setSelectedReport(null);
      }
      if (msg.type === "selectReport") {
        setSelectedReport(msg.report as MapReport);
        setShowCreateSheet(false);
        setPendingCoord(null);
        sendToMap({ type: "clearPending" });
      }
    } catch {}
  }

  function centerOnUser() {
    if (userLocation) sendToMap({ type: "centerUser", ...userLocation });
  }

  function closeCreateSheet() {
    setShowCreateSheet(false);
    setPendingCoord(null);
    sendToMap({ type: "clearPending" });
  }

  if (!locationGranted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📍</Text>
        <Text style={styles.hint}>Abilita la posizione per usare la mappa</Text>
      </View>
    );
  }

  if (!locationReady || !userLocation) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.hint, { marginTop: spacing.md }]}>Caricamento posizione…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={["*"]}
        source={{ html: buildLeafletHTML(userLocation.lat, userLocation.lng, reports) }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        scrollEnabled={false}
        bounces={false}
        onShouldStartLoadWithRequest={(req) =>
          req.url === "about:blank" || req.url.startsWith("data:")
        }
      />

      {/* Top bar: legenda + refresh */}
      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <View style={styles.legend}>
          {(Object.entries(REPORT_TYPES) as [ReportType, ReportTypeMeta][]).map(([type, meta]) => (
            <View key={type} style={[styles.legendItem, { backgroundColor: meta.bg }]}>
              <Text style={styles.legendEmoji}>{meta.emoji}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => loadNearby(userLocation.lat, userLocation.lng, 5000)}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.iconBtnText}>↻</Text>}
        </TouchableOpacity>
      </View>

      {/* FAB centra posizione */}
      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 100 }]} onPress={centerOnUser}>
        <Text style={styles.fabText}>📍</Text>
      </TouchableOpacity>

      {/* Overlays */}
      {alertReport && (
        <ProximityAlert report={alertReport} onClose={() => setAlertReport(null)} />
      )}

      {selectedReport && !showCreateSheet && (
        <ReportDetailSheet
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onAbuse={async (reason) => {
            try { await reportAbuse(selectedReport.id, reason); }
            catch (e) { Alert.alert("Errore", e instanceof Error ? e.message : "Riprova"); }
            setSelectedReport(null);
          }}
          onDelete={async () => {
            try { await remove(selectedReport.id); setSelectedReport(null); }
            catch (e) { Alert.alert("Errore", e instanceof Error ? e.message : "Non autorizzato"); }
          }}
        />
      )}

      {showCreateSheet && pendingCoord && (
        <CreateReportSheet
          coord={pendingCoord}
          onClose={closeCreateSheet}
          onCreate={async (dto) => {
            await create(dto);
            closeCreateSheet();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  map:         { flex: 1 },
  centered:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  hint:        { fontSize: 15, color: colors.textSecondary, textAlign: "center" },
  topBar:      { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 50 },
  legend:      { flexDirection: "row", gap: spacing.xs, backgroundColor: colors.surface + "EE", borderRadius: radius.pill, padding: 6, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  legendItem:  { width: 30, height: 30, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  legendEmoji: { fontSize: 14 },
  iconBtn:     { width: 40, height: 40, borderRadius: 99, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  iconBtnText: { fontSize: 20, color: colors.primary },
  fab:         { position: "absolute", right: spacing.lg, width: 50, height: 50, borderRadius: 99, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadow.md, zIndex: 50 },
  fabText:     { fontSize: 22 },
});
