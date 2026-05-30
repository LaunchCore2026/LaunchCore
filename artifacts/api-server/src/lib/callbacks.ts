import { createHmac } from "node:crypto";
import { logger } from "./logger";

interface CrawlCallbackPayload {
  crawlId: number;
  status: "completed" | "failed";
  url: string;
  pagesFound?: number | null;
  pagesProcessed?: number | null;
  errorMessage?: string | null;
  completedAt?: string;
}

function signPayload(payload: string): string | undefined {
  const secret = process.env.CALLBACK_SECRET;
  if (!secret) return undefined;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function deliverCrawlCallback(callbackUrl: string | null | undefined, payload: CrawlCallbackPayload): Promise<void> {
  if (!callbackUrl) return;

  const body = JSON.stringify(payload);
  const signature = signPayload(body);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "user-agent": "LaunchCoreSEO/1.0",
  };

  if (signature) {
    headers["x-launchcore-signature"] = `sha256=${signature}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(callbackUrl, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn({ callbackUrl, statusCode: response.status, crawlId: payload.crawlId }, "Crawl callback returned non-success status");
    }
  } catch (err) {
    logger.warn({ callbackUrl, err, crawlId: payload.crawlId }, "Crawl callback delivery failed");
  } finally {
    clearTimeout(timeout);
  }
}
