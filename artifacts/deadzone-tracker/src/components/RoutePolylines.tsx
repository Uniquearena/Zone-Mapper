import { Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import type { RouteOption } from "@workspace/api-client-react";

interface Props {
  routes: RouteOption[];
  selectedId: number | null;
}

const ROUTE_COLORS = ["#3b82f6", "#a855f7", "#ec4899"];

const SEGMENT_COLOR: Record<string, string> = {
  strong: "#22c55e",
  moderate: "#eab308",
  dead: "#ef4444",
  unknown: "#64748b",
};

export function RoutePolylines({ routes, selectedId }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!routes.length) return;
    const sel = routes.find((r) => r.id === selectedId) ?? routes[0];
    if (!sel.geometry.length) return;
    const bounds = L.latLngBounds(
      sel.geometry.map(([lat, lng]) => L.latLng(lat, lng)),
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [routes, selectedId, map]);

  return (
    <>
      {routes.map((route) => {
        const isSelected = route.id === selectedId;
        const baseColor = ROUTE_COLORS[route.id % ROUTE_COLORS.length];
        return (
          <div key={route.id}>
            {/* Underlay: solid route in its base color (dimmed if not selected) */}
            <Polyline
              positions={route.geometry as [number, number][]}
              pathOptions={{
                color: baseColor,
                weight: isSelected ? 7 : 4,
                opacity: isSelected ? 0.9 : 0.35,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* Sample dots colored by signal status (only on selected route) */}
            {isSelected &&
              route.segments.map((s, i) => (
                <CircleMarker
                  key={i}
                  center={[s.latitude, s.longitude]}
                  radius={6}
                  pathOptions={{
                    color: "#0a0d14",
                    weight: 1.5,
                    fillColor: SEGMENT_COLOR[s.status] ?? "#64748b",
                    fillOpacity: 0.95,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -4]}>
                    <span className="text-xs font-mono">
                      {s.status.toUpperCase()}
                      {s.avgSignal != null ? ` · ${s.avgSignal} dBm` : ""}
                    </span>
                  </Tooltip>
                </CircleMarker>
              ))}
          </div>
        );
      })}
    </>
  );
}
