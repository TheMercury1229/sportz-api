import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetEnv = process.env.ARCJET_ENV || "production";
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
  throw new Error("ARCJET_KEY is not set. Arcjet will not be initialized.");
}

export const httpArcject = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({
          mode: arcjetMode,
          interval: "10s",
          max: 100,
        }),
      ],
    })
  : null;
export const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({
          mode: arcjetMode,
          interval: "5s",
          max: 2,
        }),
      ],
    })
  : null;

export function securityMiddleware() {
  return async (req, res, next) => {
    if (!httpArcject) {
      return next();
    }
    try {
      const decision = await httpArcject.protect(req);

      if (decision.isDenied) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({
            message: "Too many requests - rate limit exceeded",
          });
        }
        return res.status(403).json({
          message: "Access denied",
        });
      }
    } catch (error) {
      console.error("Arcjet error:", error);
      return res.status(503).json({
        message: "Internal server error",
        details: "Arcjet processing failed",
      });
    }
    next();
  };
}
