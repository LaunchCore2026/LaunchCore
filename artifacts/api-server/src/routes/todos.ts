import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, seoTodosTable } from "@workspace/db";
import { UpdateTodoParams, UpdateTodoBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.patch("/todos/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTodoParams.safeParse({ id: Number(rawId) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateTodoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Partial<typeof seoTodosTable.$inferInsert> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.implementationNotes !== undefined) updates.implementationNotes = parsed.data.implementationNotes ?? undefined;

  const [todo] = await db.update(seoTodosTable).set(updates).where(eq(seoTodosTable.id, params.data.id)).returning();
  if (!todo) { res.status(404).json({ error: "Todo not found" }); return; }
  res.json(todo);
});

export default router;
