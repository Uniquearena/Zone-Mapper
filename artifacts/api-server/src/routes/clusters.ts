import { Router, type IRouter, type Request, type Response } from "express";
import { db, deadzonesTable, type Deadzone } from "@workspace/db";
import { GetClustersQueryParams } from "@workspace/api-zod";

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

const SEVERITY_RANK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  total: 4,
};

/**
 * DBSCAN clustering. Returns array of cluster index per point (-1 = noise).
 */
function dbscan(
  points: { lat: number; lng: number }[],
  epsKm: number,
  minPts: number,
): number[] {
  const n = points.length;
  const labels = new Array<number>(n).fill(-2); // -2 = unvisited, -1 = noise
  let clusterId = 0;

  const regionQuery = (idx: number): number[] => {
    const neighbors: number[] = [];
    const p = points[idx];
    for (let i = 0; i < n; i++) {
      if (i === idx) continue;
      if (haversineKm(p.lat, p.lng, points[i].lat, points[i].lng) <= epsKm) {
        neighbors.push(i);
      }
    }
    return neighbors;
  };

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue;
    const neighbors = regionQuery(i);
    if (neighbors.length + 1 < minPts) {
      labels[i] = -1;
      continue;
    }
    labels[i] = clusterId;
    const seeds = [...neighbors];
    while (seeds.length > 0) {
      const q = seeds.shift()!;
      if (labels[q] === -1) labels[q] = clusterId;
      if (labels[q] !== -2) continue;
      labels[q] = clusterId;
      const qNeighbors = regionQuery(q);
      if (qNeighbors.length + 1 >= minPts) {
        for (const r of qNeighbors) {
          if (labels[r] === -2 || labels[r] === -1) seeds.push(r);
        }
      }
    }
    clusterId++;
  }

  return labels;
}

router.get("/clusters", async (req: Request, res: Response) => {
  const params = GetClustersQueryParams.parse(req.query);
  const epsKm = params.epsKm ?? 2;
  const minPts = params.minPts ?? 3;

  // Filter to "low signal" reports (medium/high/total) — ignore "low impact"
  const rows: Deadzone[] = await db.select().from(deadzonesTable);
  const filtered = rows.filter((r) =>
    ["medium", "high", "total"].includes(r.severity),
  );

  const points = filtered.map((r) => ({ lat: r.latitude, lng: r.longitude }));
  const labels = dbscan(points, epsKm, minPts);

  const groups = new Map<number, Deadzone[]>();
  for (let i = 0; i < filtered.length; i++) {
    const c = labels[i];
    if (c < 0) continue;
    const arr = groups.get(c) ?? [];
    arr.push(filtered[i]);
    groups.set(c, arr);
  }

  const now = Date.now();
  const clusters = Array.from(groups.entries()).map(([id, members]) => {
    const centroidLat =
      members.reduce((s, m) => s + m.latitude, 0) / members.length;
    const centroidLng =
      members.reduce((s, m) => s + m.longitude, 0) / members.length;
    const radiusKm = Math.max(
      ...members.map((m) =>
        haversineKm(centroidLat, centroidLng, m.latitude, m.longitude),
      ),
    );

    // Recency-weighted confidence: each report contributes a weight that
    // decays exponentially with age (half-life 7 days), boosted by
    // confirmations. Then squashed to 0-1 via tanh.
    const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000;
    let weightSum = 0;
    for (const m of members) {
      const ageMs = now - m.createdAt.getTime();
      const recency = Math.pow(0.5, ageMs / HALF_LIFE_MS);
      const sevWeight = SEVERITY_RANK[m.severity] ?? 1;
      weightSum += recency * (1 + m.confirmations * 0.25) * sevWeight;
    }
    const confidence = Math.min(1, Math.tanh(weightSum / 6));

    const sevCounts: Record<string, number> = {};
    const carrierCounts: Record<string, number> = {};
    let signalSum = 0;
    let signalN = 0;
    let lastUpdated = members[0].createdAt;
    for (const m of members) {
      sevCounts[m.severity] = (sevCounts[m.severity] ?? 0) + 1;
      carrierCounts[m.carrier] = (carrierCounts[m.carrier] ?? 0) + 1;
      if (m.signalStrength != null) {
        signalSum += m.signalStrength;
        signalN++;
      }
      if (m.createdAt > lastUpdated) lastUpdated = m.createdAt;
    }
    const topSeverity = Object.entries(sevCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0];
    const topCarrier = Object.entries(carrierCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    return {
      id,
      centroidLat,
      centroidLng,
      count: members.length,
      radiusKm: Math.max(radiusKm, 0.1),
      confidence,
      avgSignalStrength: signalN > 0 ? signalSum / signalN : null,
      topSeverity,
      topCarrier,
      lastUpdated: lastUpdated.toISOString(),
      reportIds: members.map((m) => m.id),
    };
  });

  // Sort by descending confidence then count
  clusters.sort(
    (a, b) => b.confidence - a.confidence || b.count - a.count,
  );

  res.json(clusters);
});

export default router;
