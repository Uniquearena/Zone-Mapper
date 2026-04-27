import { Router, type IRouter, type Request, type Response } from "express";
import { db, deadzonesTable, type Deadzone } from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  CreateDeadzoneBody,
  ListDeadzonesQueryParams,
  ListRecentDeadzonesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(d: Deadzone) {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    type: d.type,
    severity: d.severity,
    signalStrength: d.signalStrength,
    latitude: d.latitude,
    longitude: d.longitude,
    carrier: d.carrier,
    reporter: d.reporter,
    confirmations: d.confirmations,
    createdAt: d.createdAt.toISOString(),
    address: d.address,
  };
}

router.get("/deadzones", async (req: Request, res: Response) => {
  const params = ListDeadzonesQueryParams.parse(req.query);
  const conds = [];
  if (params.type) conds.push(eq(deadzonesTable.type, params.type));
  if (params.severity)
    conds.push(eq(deadzonesTable.severity, params.severity));
  if (params.carrier) conds.push(eq(deadzonesTable.carrier, params.carrier));
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db
    .select()
    .from(deadzonesTable)
    .where(where)
    .orderBy(desc(deadzonesTable.createdAt));
  res.json(rows.map(serialize));
});

router.get("/deadzones/recent", async (req: Request, res: Response) => {
  const params = ListRecentDeadzonesQueryParams.parse(req.query);
  const limit = params.limit ?? 10;
  const rows = await db
    .select()
    .from(deadzonesTable)
    .orderBy(desc(deadzonesTable.createdAt))
    .limit(limit);
  res.json(rows.map(serialize));
});

router.post("/deadzones", async (req: Request, res: Response) => {
  const body = CreateDeadzoneBody.parse(req.body);

  // Lightweight duplicate filter: same carrier + ~50m radius within last 5 min
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const dupes = await db
    .select({ id: deadzonesTable.id })
    .from(deadzonesTable)
    .where(
      and(
        eq(deadzonesTable.carrier, body.carrier),
        sql`${deadzonesTable.createdAt} > ${fiveMinAgo}`,
        sql`abs(${deadzonesTable.latitude} - ${body.latitude}) < 0.0005`,
        sql`abs(${deadzonesTable.longitude} - ${body.longitude}) < 0.0005`,
      ),
    )
    .limit(1);
  if (dupes.length > 0) {
    res
      .status(409)
      .json({ error: "Duplicate report at same location within last 5 minutes" });
    return;
  }

  const [row] = await db
    .insert(deadzonesTable)
    .values({
      title: body.title,
      description: body.description,
      type: body.type,
      severity: body.severity,
      signalStrength: body.signalStrength ?? null,
      latitude: body.latitude,
      longitude: body.longitude,
      carrier: body.carrier,
      reporter: body.reporter,
      address: body.address ?? null,
    })
    .returning();
  res.status(201).json(serialize(row));
});

router.get("/deadzones/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(deadzonesTable)
    .where(eq(deadzonesTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/deadzones/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(deadzonesTable).where(eq(deadzonesTable.id, id));
  res.status(204).end();
});

router.post(
  "/deadzones/:id/confirm",
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [row] = await db
      .update(deadzonesTable)
      .set({
        confirmations: sql`${deadzonesTable.confirmations} + 1`,
      })
      .where(eq(deadzonesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(serialize(row));
  },
);

export default router;
