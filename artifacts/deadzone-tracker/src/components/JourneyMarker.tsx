import { CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import type { JourneyState } from "@/lib/journey";

interface Props {
  state: JourneyState | null;
  follow: boolean;
}

const STATUS_FILL: Record<string, string> = {
  strong: "#22c55e",
  moderate: "#eab308",
  dead: "#ef4444",
  unknown: "#06b6d4",
};

export function JourneyMarker({ state, follow }: Props) {
  const map = useMap();
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!state || !follow) return;
    const key = `${state.position.lat.toFixed(4)},${state.position.lng.toFixed(4)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    map.panTo([state.position.lat, state.position.lng], { animate: true });
  }, [state, follow, map]);

  if (!state) return null;

  const fill = STATUS_FILL[state.currentStatus] ?? STATUS_FILL.unknown;
  return (
    <>
      <CircleMarker
        center={[state.position.lat, state.position.lng]}
        radius={11}
        pathOptions={{
          color: fill,
          weight: 3,
          fillColor: fill,
          fillOpacity: 0.25,
        }}
      />
      <CircleMarker
        center={[state.position.lat, state.position.lng]}
        radius={5}
        pathOptions={{
          color: "#0a0d14",
          weight: 1.5,
          fillColor: fill,
          fillOpacity: 1,
        }}
      >
        <Tooltip direction="top" offset={[0, -6]}>
          <span className="text-xs font-mono">
            {state.currentStatus.toUpperCase()} ·{" "}
            {state.progressKm.toFixed(1)} km
          </span>
        </Tooltip>
      </CircleMarker>
    </>
  );
}
