import { desc } from "drizzle-orm";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/match.validation.js";
import { getMatchStatus } from "../utils/match-status.js";

export async function listMatches(req, res) {
  const MAX_LIMIT = 100;
  const parse = listMatchesQuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      message: "Invalid query parameters",
      details: JSON.stringify(parse.error),
    });
  }

  const limit = Math.min(parse.data.limit ?? 50, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch matches",
      details: JSON.stringify(error),
    });
  }
}

export async function createMatch(req, res) {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request data",
      details: JSON.stringify(parsed.error),
    });
  }

  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = parsed;

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();
    if (res.app.locals.broadcastMatchCreated) {
      res.app.locals.broadcastMatchCreated(event);
    }
    return res.status(201).json({
      data: event,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create match",
      details: JSON.stringify(error),
    });
  }
}
