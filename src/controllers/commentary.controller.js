import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.validation.js";
import { matchIdParamSchema } from "../validation/match.validation.js";

export async function listCommentary(req, res) {
  const MAX_LIMIT = 100;

  const parsedParams = matchIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({
      message: "Invalid route parameters",
      details: JSON.stringify(parsedParams.error),
    });
  }

  const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({
      message: "Invalid query parameters",
      details: JSON.stringify(parsedQuery.error),
    });
  }

  const limit = Math.min(parsedQuery.data.limit ?? 100, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, parsedParams.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch commentary",
      details: JSON.stringify(error),
    });
  }
}

export async function createCommentary(req, res) {
  const parsedParams = matchIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({
      message: "Invalid route parameters",
      details: JSON.stringify(parsedParams.error),
    });
  }

  const parsedBody = createCommentarySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      message: "Invalid request data",
      details: JSON.stringify(parsedBody.error),
    });
  }

  try {
    const [createdCommentary] = await db
      .insert(commentary)
      .values({
        matchId: parsedParams.data.id,
        minute: parsedBody.data.minutes,
        sequence: parsedBody.data.sequence,
        period: parsedBody.data.period,
        eventType: parsedBody.data.eventType,
        actor: parsedBody.data.actor,
        team: parsedBody.data.team,
        message: parsedBody.data.message,
        metadata: parsedBody.data.metadata,
        tags: parsedBody.data.tags,
      })
      .returning();
    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(
        parsedParams.data.id,
        createdCommentary,
      );
    }
    return res.status(201).json({
      data: createdCommentary,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create commentary",
      details: JSON.stringify(error),
    });
  }
}
