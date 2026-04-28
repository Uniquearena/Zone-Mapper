import { Polyline, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import type { RouteOption, RouteSegment } from "@workspace/api-client-react";
import { closestIndex } from "@/lib/journey";

interface Props {
  routes: RouteOption[];
  selectedId: number | null;
}

const ROUTE_BASE_COLORS = ["#3b82f6", "#a855f7", "#ec4899"];

const SEGMENT_COLOR: Record<string, string> = {
  strong: "#22c55e",
  moderate: "#eab308",
  dead: "#ef4444",
  unknown: "#64748b",
};

const STATUS_PRIORITY: Record<string, number> = {
  dead: 3,
  moderate: 2,
  unknown: 1,
  strong: 0,
};

/**
 * Split the route geometry into colored chunks. Each pair of consecutive
 * sample points defines one chunk; the chunk is colored by whichever of the
 * two samples has the worst signal (dead > moderate > unknown > strong) so a
 * dead zone is never visually washed out.
 */
function buildColoredChunks(route: RouteOption): {
  positions: [number, number][];
  color: string;
}[] {
  const geometry = route.geometry as [number, number][];
  if (geometry.length === 0 || route.segments.length === 0) return [];

  // Map each sample → closest geometry index, then sort by index.
  const ordered = route.segments
    .map((seg, i) => ({
      seg,
      i,
      idx: closestIndex(
        { lat: seg.latitude, lng: seg.longitude },
        geometry,
      ),
    }))
    .sort((a, b) => a.idx - b.idx);

  // Always anchor the chunks to the start and end vertices of the route.
  const anchors: { idx: number; status: RouteSegment["status"] }[] = [];
  anchors.push({ idx: 0, status: ordered[0].seg.status });
  for (const o of ordered) {
    if (o.idx > anchors[anchors.length - 1].idx) {
      anchors.push({ idx: o.idx, status: o.seg.status });
    }
  }
  if (anchors[anchors.length - 1].idx < geometry.length - 1) {
    anchors.push({
      idx: geometry.length - 1,
      status: ordered[ordered.length - 1].seg.status,
    });
  }

  const chunks: { positions: [number, number][]; color: string }[] = [];
  for (let k = 0; k < anchors.length - 1; k++) {
    const a = anchors[k];
    const b = anchors[k + 1];
    const status =
      (STATUS_PRIORITY[a.status] ?? 0) >= (STATUS_PRIORITY[b.status] ?? 0)
        ? a.status
        : b.status;
    // slice inclusive on both ends so chunks visually meet end-to-end.
    const positions = geometry.slice(a.idx, b.idx + 1);
    if (positions.length >= 2) {
      chunks.push({ positions, color: SEGMENT_COLOR[status] ?? "#64748b" });
    }
  }
  return chunks;
}

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

  // Pre-compute colored chunks for every route once, so toggling selection
  // doesn't recompute closestIndex (which is O(n*m)).
  const coloredChunks = useMemo(() => {
    const out = new Map<number, { positions: [number, number][]; color: string }[]>();
    for (const r of routes) out.set(r.id, buildColoredChunks(r));
    return out;
  }, [routes]);

  return (
    <>
      {routes.map((route) => {
        const isSelected = route.id === selectedId;
        const baseColor =
          ROUTE_BASE_COLORS[route.id % ROUTE_BASE_COLORS.length];
        const chunks = coloredChunks.get(route.id) ?? [];

        if (!isSelected) {
          // Non-selected alternative: dim, single base color, no segment detail.
          return (
            <Polyline
              key={route.id}
              positions={route.geometry as [number, number][]}
              pathOptions={{
                color: baseColor,
                weight: 4,
                opacity: 0.35,
                lineCap: "round",
                lineJoin: "round",
                dashArray: "6 6",
              }}
            />
          );
        }

        // Selected route: dark casing first, then color-coded chunks on top.
        return (
          <div key={route.id}>
            <Polyline
              positions={route.geometry as [number, number][]}
              pathOptions={{
                color: "#0a0d14",
                weight: 10,
                opacity: 0.75,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {chunks.map((chunk, i) => (
              <Polyline
                key={i}
                positions={chunk.positions}
                pathOptions={{
                  color: chunk.color,
                  weight: 7,
                  opacity: 1,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
