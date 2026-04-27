import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { DeadzoneSeverity, DeadzoneType } from "@workspace/api-client-react";
import { SEVERITY_HEX, TYPE_ICONS } from "@/lib/constants";

export const createCustomIcon = (type: DeadzoneType, severity: DeadzoneSeverity) => {
  const Icon = TYPE_ICONS[type];
  const color = SEVERITY_HEX[severity];

  const html = renderToStaticMarkup(
    <div style={{
      color: "#000",
      backgroundColor: color,
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 0 10px ${color}80, 0 0 0 2px rgba(0,0,0,0.8)`,
      border: "1px solid rgba(255,255,255,0.4)"
    }}>
      <Icon size={16} />
    </div>
  );

  return L.divIcon({
    html,
    className: "custom-leaflet-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};
