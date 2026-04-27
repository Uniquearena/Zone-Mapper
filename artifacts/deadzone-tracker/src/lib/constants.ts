import { DeadzoneSeverity, DeadzoneType } from "@workspace/api-client-react";
import { Signal, SignalZero, Wifi, WifiOff, Satellite, Navigation, AlertTriangle, AlertCircle, AlertOctagon, XOctagon } from "lucide-react";

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
}

export const SEVERITY_LABELS = {
  [DeadzoneSeverity.low]: "Low Impact",
  [DeadzoneSeverity.medium]: "Degraded",
  [DeadzoneSeverity.high]: "Severe Drop",
  [DeadzoneSeverity.total]: "Total Deadzone",
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
