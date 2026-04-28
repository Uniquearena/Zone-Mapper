import { Router, type IRouter, type Request, type Response } from "express";
import { db, deadzonesTable, type Deadzone } from "@workspace/db";
import {
  GetSignalStatusQueryParams,
  GetRoutesQueryParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const EARTH_R_KM = 6371;

function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_R_KM * Math.asin(Math.sqrt(h));
}

type SignalClass = "strong" | "moderate" | "dead" | "unknown";

const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Map a severity to an estimated dBm reading when no explicit value is logged.
 * Used as a fallback so legacy reports still influence routing.
 */
function severityToDbm(sev: string): number {
  switch (sev) {
    case "low":
      return -82;
    case "medium":
      return -95;
    case "high":
      return -106;
    case "total":
      return -118;
    default:
      return -100;
  }
}

function classifyDbm(dbm: number): SignalClass {
  if (dbm < -110) return "dead";
  if (dbm <= -90) return "moderate";
  return "strong";
}

interface SnapshotInput {
  reports: Deadzone[];
  lat: number;
  lng: number;
  radiusKm: number;
  now: number;
}

interface Snapshot {
  avgSignal: number | null;
  status: SignalClass;
  reportCount: number;
  confidence: number;
  lastUpdated: string | null;
}

/**
 * Compute weighted-average dBm for the area around (lat, lng).
 * Recency: linear decay from 1 (now) to 0 (24h ago). Older reports dropped.
 * Distance: inverse weighting — points at radiusKm contribute ~0, points at
 * the centre contribute the full weight.
 */
function snapshotAt({ reports, lat, lng, radiusKm, now }: SnapshotInput): Snapshot {
  let weightSum = 0;
  let weightedDbmSum = 0;
  let count = 0;
  let lastUpdated = 0;

  for (const r of reports) {
    const ageMs = now - r.createdAt.getTime();
    if (ageMs > WINDOW_MS) continue; // 24h window
    const distKm = haversineKm(lat, lng, r.latitude, r.longitude);
    if (distKm > radiusKm) continue;

    const recency = 1 - ageMs / WINDOW_MS; // 1..0
    const proximity = 1 - distKm / radiusKm; // 1..0
    const dbm = r.signalStrength ?? severityToDbm(r.severity);

    const w = recency * proximity;
    weightSum += w;
    weightedDbmSum += w * dbm;
    count++;
    if (r.createdAt.getTime() > lastUpdated) {
      lastUpdated = r.createdAt.getTime();
    }
  }

  if (weightSum === 0 || count === 0) {
    return {
      avgSignal: null,
      status: "unknown",
      reportCount: 0,
      confidence: 0,
      lastUpdated: null,
    };
  }

  const avg = weightedDbmSum / weightSum;
  // Confidence rises with both report count and total weight, squashed via tanh.
  const confidence = Math.min(1, Math.tanh((weightSum + count * 0.1) / 2));

  return {
    avgSignal: Math.round(avg * 10) / 10,
    status: classifyDbm(avg),
    reportCount: count,
    confidence: Math.round(confidence * 1000) / 1000,
    lastUpdated: new Date(lastUpdated).toISOString(),
  };
}

router.get("/signal-status", async (req: Request, res: Response) => {
  const params = GetSignalStatusQueryParams.parse(req.query);
  const radiusKm = params.radiusKm ?? 1.5;

  const reports = await db.select().from(deadzonesTable);
  const snap = snapshotAt({
    reports,
    lat: params.lat,
    lng: params.lng,
    radiusKm,
    now: Date.now(),
  });

  res.json({
    latitude: params.lat,
    longitude: params.lng,
    radiusKm,
    ...snap,
  });
});

interface OsrmGeometry {
  type: "LineString";
  coordinates: [number, number][]; // [lng, lat]
}

interface OsrmRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: OsrmGeometry;
}

interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
  message?: string;
}

/**
 * Resample a polyline to ~N evenly-spaced points (by index — good enough for
 * signal scoring without doing arc-length integration).
 */
function resamplePolyline(
  coords: [number, number][],
  targetN: number,
): [number, number][] {
  if (coords.length <= targetN) return coords;
  const out: [number, number][] = [];
  const step = (coords.length - 1) / (targetN - 1);
  for (let i = 0; i < targetN; i++) {
    const idx = Math.round(i * step);
    out.push(coords[idx]);
  }
  return out;
}

router.get("/routes", async (req: Request, res: Response) => {
  const params = GetRoutesQueryParams.parse(req.query);
  const { fromLat, fromLng, toLat, toLng } = params;

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?alternatives=true&overview=full&geometries=geojson`;

  let osrm: OsrmResponse;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "DeadZoneTracker-IN/1.0" },
    });
    if (!r.ok) {
      logger.warn({ status: r.status }, "OSRM upstream returned non-OK");
      res.status(502).json({ error: "Routing provider unavailable" });
      return;
    }
    osrm = (await r.json()) as OsrmResponse;
  } catch (err) {
    logger.error({ err }, "OSRM upstream fetch failed");
    res.status(502).json({ error: "Routing provider unreachable" });
    return;
  }

  if (osrm.code !== "Ok" || !osrm.routes?.length) {
    res
      .status(502)
      .json({ error: osrm.message || "No routes found by upstream" });
    return;
  }

  // Pre-load all reports once and reuse for every sampled point.
  const allReports = await db.select().from(deadzonesTable);
  const now = Date.now();

  const TARGET_SAMPLES = 24;
  const SAMPLE_RADIUS_KM = 1.5;

  const compared = osrm.routes.slice(0, 3).map((route, idx) => {
    const coordsLngLat = route.geometry.coordinates;
    const sampled = resamplePolyline(coordsLngLat, TARGET_SAMPLES);

    let dead = 0;
    let moderate = 0;
    let strong = 0;
    let unknown = 0;

    const segments = sampled.map(([lng, lat]) => {
      const snap = snapshotAt({
        reports: allReports,
        lat,
        lng,
        radiusKm: SAMPLE_RADIUS_KM,
        now,
      });
      switch (snap.status) {
        case "dead":
          dead++;
          break;
        case "moderate":
          moderate++;
          break;
        case "strong":
          strong++;
          break;
        default:
          unknown++;
      }
      return {
        latitude: lat,
        longitude: lng,
        status: snap.status,
        avgSignal: snap.avgSignal,
      };
    });

    // Signal score: dead -3, moderate +1, strong +2, unknown +1 (assume OK).
    // Normalize to 0..100 so the best possible run is 100.
    const total = segments.length;
    const raw =
      dead * -3 + moderate * 1 + strong * 2 + unknown * 1;
    const minPossible = total * -3;
    const maxPossible = total * 2;
    const signalScore = Math.round(
      ((raw - minPossible) / (maxPossible - minPossible)) * 100,
    );

    // Full geometry as [lat, lng] pairs for the client (Leaflet ordering).
    const geometryLatLng: [number, number][] = coordsLngLat.map(([lng, lat]) => [
      lat,
      lng,
    ]);

    return {
      id: idx,
      label: idx === 0 ? "Primary" : `Alternative ${idx}`,
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      durationMin: Math.round((route.duration / 60) * 10) / 10,
      geometry: geometryLatLng,
      segments,
      deadCount: dead,
      moderateCount: moderate,
      strongCount: strong,
      unknownCount: unknown,
      signalScore,
    };
  });

  // Recommended = highest signal score (ties → shortest distance)
  const recommended = [...compared].sort(
    (a, b) => b.signalScore - a.signalScore || a.distanceKm - b.distanceKm,
  )[0];
  const shortest = [...compared].sort(
    (a, b) => a.distanceKm - b.distanceKm,
  )[0];

  res.json({
    routes: compared,
    recommendedId: recommended.id,
    shortestId: shortest.id,
    provider: "OSRM",
  });
});

export default router;
