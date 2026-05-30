import type { RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";

function extractToken(headerValue: string | undefined): string | null {
  if (!headerValue) return null;
  const trimmed = headerValue.trim();
  const bearerPrefix = "Bearer ";
  if (trimmed.toLowerCase().startsWith(bearerPrefix.toLowerCase())) {
    return trimmed.slice(bearerPrefix.length).trim() || null;
  }
  return trimmed || null;
}

function tokensMatch(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  if (candidateBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

export const requireApiToken: RequestHandler = (req, res, next) => {
  if (req.path === "/healthz") {
    next();
    return;
  }

  const expectedToken = process.env.API_TOKEN;

  if (!expectedToken) {
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ error: "API_TOKEN is not configured" });
      return;
    }

    next();
    return;
  }

  const authToken = extractToken(req.get("authorization"));
  const headerToken = extractToken(req.get("x-api-token"));
  const suppliedToken = authToken ?? headerToken;

  if (!suppliedToken || !tokensMatch(suppliedToken, expectedToken)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};
