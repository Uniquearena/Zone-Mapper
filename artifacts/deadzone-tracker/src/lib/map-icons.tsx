import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { DeadzoneSeverity, DeadzoneType } from "@workspace/api-client-react";
import { SEVERITY_HEX, TYPE_ICONS } from "@/lib/constants";

export const createCustomIcon = (
  type: DeadzoneType,
  severity: DeadzoneSeverity,
) => {
  const Icon = TYPE_ICONS[type];
  const color = SEVERITY_HEX[severity];

  const html = renderToStaticMarkup(
    <div
      style={{
        color: "#000",
        backgroundColor: color,
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 10px ${color}80, 0 0 0 2px rgba(0,0,0,0.8)`,
        border: "1px solid rgba(255,255,255,0.4)",
      }}
    >
      <Icon size={16} />
    </div>,
  );

  return L.divIcon({
    html,
    className: "custom-leaflet-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

export const createUserLocationIcon = () => {
  const html = `
    <div style="position: relative; width: 22px; height: 22px;">
      <div style="
        position: absolute; inset: 0;
        background: #06b6d4;
        border-radius: 50%;
        opacity: 0.3;
        animation: dz-pulse 2s ease-out infinite;
      "></div>
      <div style="
        position: absolute; inset: 4px;
        background: #06b6d4;
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(6,182,212,0.9);
      "></div>
    </div>
    <style>
      @keyframes dz-pulse {
        0% { transform: scale(0.6); opacity: 0.6; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    </style>
  `;
  return L.divIcon({
    html,
    className: "user-location-icon",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

export const createClusterRingIcon = (
  count: number,
  confidence: number,
  topSeverity: DeadzoneSeverity,
) => {
  const color = SEVERITY_HEX[topSeverity] ?? "#ef4444";
  const size = Math.min(72, 32 + count * 4);
  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}99 0%, ${color}33 60%, transparent 100%)`,
          opacity: 0.45 + confidence * 0.4,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "30%",
          borderRadius: "50%",
          background: color,
          color: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: "11px",
          border: "2px solid rgba(0,0,0,0.7)",
          boxShadow: `0 0 14px ${color}aa`,
        }}
      >
        {count}
      </div>
    </div>,
  );
  return L.divIcon({
    html,
    className: "cluster-ring-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};
