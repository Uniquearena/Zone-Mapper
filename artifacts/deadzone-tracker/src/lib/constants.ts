import { DeadzoneSeverity, DeadzoneType } from "@workspace/api-client-react";
import { SignalZero, WifiOff, Satellite, Navigation } from "lucide-react";

export const SEVERITY_COLORS = {
  [DeadzoneSeverity.low]: "text-severity-low border-severity-low/30 bg-severity-low/10",
  [DeadzoneSeverity.medium]: "text-severity-medium border-severity-medium/30 bg-severity-medium/10",
  [DeadzoneSeverity.high]: "text-severity-high border-severity-high/30 bg-severity-high/10",
  [DeadzoneSeverity.total]: "text-severity-total border-severity-total/30 bg-severity-total/10",
};

export const SEVERITY_HEX = {
  [DeadzoneSeverity.low]: "#22c55e",
  [DeadzoneSeverity.medium]: "#eab308",
  [DeadzoneSeverity.high]: "#f97316",
  [DeadzoneSeverity.total]: "#ef4444",
};

export const SEVERITY_LABELS = {
  [DeadzoneSeverity.low]: "Strong (Issue)",
  [DeadzoneSeverity.medium]: "Weak Signal",
  [DeadzoneSeverity.high]: "Severe Drop",
  [DeadzoneSeverity.total]: "Total Deadzone",
};

export const SEVERITY_DBM_HINT = {
  [DeadzoneSeverity.low]: "> -85 dBm",
  [DeadzoneSeverity.medium]: "-85 to -100 dBm",
  [DeadzoneSeverity.high]: "-100 to -110 dBm",
  [DeadzoneSeverity.total]: "< -110 dBm or no signal",
};

export const TYPE_ICONS = {
  [DeadzoneType.cellular]: SignalZero,
  [DeadzoneType.wifi]: WifiOff,
  [DeadzoneType.gps]: Navigation,
  [DeadzoneType.satellite]: Satellite,
};

export const TYPE_LABELS = {
  [DeadzoneType.cellular]: "Cellular",
  [DeadzoneType.wifi]: "Wi-Fi",
  [DeadzoneType.gps]: "GPS",
  [DeadzoneType.satellite]: "Satellite",
};

// Indian network providers
export const CARRIERS = [
  "Jio",
  "Airtel",
  "Vi",
  "BSNL",
  "MTNL",
  "Other",
];

// Map defaults — centered on India
export const INDIA_CENTER: [number, number] = [22.9734, 78.6569];
export const INDIA_ZOOM = 5;

/**
 * Convert dBm to a normalized 0..1 weight where 1 = no signal.
 * Used to colour the heatmap red→yellow→green.
 */
export function dbmToHeatWeight(dbm: number | null | undefined): number {
  if (dbm == null) return 0.5;
  // -60 dBm (excellent) → 0, -120 dBm (no signal) → 1
  const clamped = Math.max(-120, Math.min(-60, dbm));
  return (Math.abs(clamped) - 60) / 60;
}

export function severityToHeatWeight(severity: string): number {
  switch (severity) {
    case "low":
      return 0.25;
    case "medium":
      return 0.5;
    case "high":
      return 0.75;
    case "total":
      return 1.0;
    default:
      return 0.5;
  }
}
