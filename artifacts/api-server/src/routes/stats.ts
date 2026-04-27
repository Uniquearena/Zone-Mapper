import { Router, type IRouter, type Request, type Response } from "express";
import { db, deadzonesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { GetHotspotsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/summary", async (_req: Request, res: Response) => {
  const totalsRow = await db
    .select({
      totalReports: sql<number>`count(*)::int`,
      totalConfirmations: sql<number>`coalesce(sum(${deadzonesTable.confirmations}), 0)::int`,
      uniqueCarriers: sql<number>`count(distinct ${deadzonesTable.carrier})::int`,
    })
    .from(deadzonesTable);

  const totals = totalsRow[0] ?? {
    totalReports: 0,
    totalConfirmations: 0,
    uniqueCarriers: 0,
  };

  const byType = await db
    .select({
      type: deadzonesTable.type,
      count: sql<number>`count(*)::int`,
    })
    .from(deadzonesTable)
    .groupBy(deadzonesTable.type);

  const bySeverity = await db
    .select({
      severity: deadzonesTable.severity,
      count: sql<number>`count(*)::int`,
    })
    .from(deadzonesTable)
    .groupBy(deadzonesTable.severity);

  const cityRows = await db
    .select({
      cityKey: sql<string>`(round(${deadzonesTable.latitude}::numeric, 1) || ',' || round(${deadzonesTable.longitude}::numeric, 1))`,
    })
    .from(deadzonesTable)
    .groupBy(
      sql`(round(${deadzonesTable.latitude}::numeric, 1) || ',' || round(${deadzonesTable.longitude}::numeric, 1))`,
    );

  res.json({
    totalReports: totals.totalReports,
    totalConfirmations: totals.totalConfirmations,
    uniqueCarriers: totals.uniqueCarriers,
    activeCities: cityRows.length,
    byType: byType.map((r) => ({ type: r.type, count: r.count })),
    bySeverity: bySeverity.map((r) => ({
      severity: r.severity,
      count: r.count,
    })),
  });
});

router.get("/stats/hotspots", async (req: Request, res: Response) => {
  const params = GetHotspotsQueryParams.parse(req.query);
  const limit = params.limit ?? 8;

  const rows = await db
    .select({
      label: sql<string>`(round(${deadzonesTable.latitude}::numeric, 1) || ', ' || round(${deadzonesTable.longitude}::numeric, 1))`,
      latitude: sql<number>`avg(${deadzonesTable.latitude})::float`,
      longitude: sql<number>`avg(${deadzonesTable.longitude})::float`,
      count: sql<number>`count(*)::int`,
      topType: sql<string>`(
        select t.type from (
          select inner_d.type, count(*) as c
          from deadzones inner_d
          where round(inner_d.latitude::numeric, 1) = round(${deadzonesTable.latitude}::numeric, 1)
            and round(inner_d.longitude::numeric, 1) = round(${deadzonesTable.longitude}::numeric, 1)
          group by inner_d.type
          order by c desc
          limit 1
        ) t
      )`,
    })
    .from(deadzonesTable)
    .groupBy(
      sql`round(${deadzonesTable.latitude}::numeric, 1)`,
      sql`round(${deadzonesTable.longitude}::numeric, 1)`,
    )
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  res.json(
    rows.map((r) => ({
      label: r.label,
      latitude: r.latitude,
      longitude: r.longitude,
      count: r.count,
      topType: r.topType,
    })),
  );
});

router.get("/stats/carriers", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      carrier: deadzonesTable.carrier,
      count: sql<number>`count(*)::int`,
      avgConfirmations: sql<number>`avg(${deadzonesTable.confirmations})::float`,
    })
    .from(deadzonesTable)
    .groupBy(deadzonesTable.carrier)
    .orderBy(desc(sql`count(*)`));

  res.json(
    rows.map((r) => ({
      carrier: r.carrier,
      count: r.count,
      avgConfirmations: r.avgConfirmations,
    })),
  );
});

export default router;
