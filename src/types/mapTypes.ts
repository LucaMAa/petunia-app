import {ReportType} from ".";

export interface ReportTypeMeta {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  alertRadius: number;
}

export const REPORT_TYPES: Record<ReportType, ReportTypeMeta> = {
  poisoned_bait: {
    label: "Boccone avvelenato",
    emoji: "☠️",
    color: "#B83232",
    bg: "#FAEAEA",
    alertRadius: 300
  },
  danger: {
    label: "Pericolo",
    emoji: "⚠️",
    color: "#C8973D",
    bg: "#F7EDD6",
    alertRadius: 200
  },
  dog_area: {
    label: "Area cani",
    emoji: "🐕",
    color: "#5A8E6E",
    bg: "#E4F2EB",
    alertRadius: 0
  },
  interesting: {
    label: "Posto interessante",
    emoji: "⭐",
    color: "#C4714A",
    bg: "#F5EAE2",
    alertRadius: 0
  },
  vet: {
    label: "Veterinario",
    emoji: "🏥",
    color: "#2B3F7A",
    bg: "#E6EBF5",
    alertRadius: 0
  }
};

export function haversine(lat1 : number, lng1 : number, lat2 : number, lng2 : number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
