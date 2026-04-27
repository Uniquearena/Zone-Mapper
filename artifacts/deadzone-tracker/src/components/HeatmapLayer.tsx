import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

type HeatPoint = [number, number, number];

interface Props {
  points: HeatPoint[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
}

export function HeatmapLayer({
  points,
  radius = 30,
  blur = 22,
  maxZoom = 12,
  max = 1.0,
}: Props) {
  const map = useMap();

  useEffect(() => {
    // Red = dead zone, yellow = weak, green = strong
    const gradient = {
      0.0: "#22c55e",
      0.35: "#a3e635",
      0.55: "#eab308",
      0.75: "#f97316",
      1.0: "#ef4444",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layer = (L as any).heatLayer(points, {
      radius,
      blur,
      maxZoom,
      max,
      minOpacity: 0.35,
      gradient,
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points, radius, blur, maxZoom, max]);

  return null;
}
