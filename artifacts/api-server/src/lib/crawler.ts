import { isIP } from "node:net";
import * as cheerio from "cheerio";
import { logger } from "./logger";

export interface CrawledPage {
  url: string;
  statusCode: number | null;
  redirectUrl: string | null;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2s: string[];
  canonical: string | null;
  robotsMeta: string | null;
  wordCount: number;
  internalLinksCount: number;
  externalLinksCount: number;
  imagesCount: number;
  imagesMissingAlt: number;
  hasOpenGraph: boolean;
  hasSchema: boolean;
  hasAnalytics: boolean;
  hasGtm: boolean;
  hasMetaPixel: boolean;
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  hasCta: boolean;
  hasForm: boolean;
  crawlDepth: number;
  crawlError: string | null;
  internalLinks: string[];
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!normalized) return true;
  if (normalized === "localhost" || normalized.endsWith(".localhost")) return true;

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) return isPrivateIpv4(normalized);
  if (ipVersion === 6) {
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80");
  }

  return false;
}

function assertCrawlableUrl(url: string): void {
  if (url.length > 2048) throw new Error("URL is too long");
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs can be crawled");
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error("Refusing to crawl localhost or private network URL");
  }
}

function normalizeUrl(url: string, base: string): string | null {
  try {
    if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("javascript:") || url.startsWith("#")) {
      return null;
    }
    const resolved = new URL(url, base);
    resolved.hash = "";
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    if (isBlockedHostname(resolved.hostname)) return null;
    return resolved.href;
  } catch {
    return null;
  }
}

function getBaseDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function addProtocol(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

export async function crawlPage(url: string, baseUrl: string, depth: number): Promise<CrawledPage> {
  const result: CrawledPage = {
    url,
    statusCode: null,
    redirectUrl: null,
    title: null,
    metaDescription: null,
    h1: null,
    h2s: [],
    canonical: null,
    robotsMeta: null,
    wordCount: 0,
    internalLinksCount: 0,
    externalLinksCount: 0,
    imagesCount: 0,
    imagesMissingAlt: 0,
    hasOpenGraph: false,
    hasSchema: false,
    hasAnalytics: false,
    hasGtm: false,
    hasMetaPixel: false,
    hasPhoneLink: false,
    hasEmailLink: false,
    hasCta: false,
    hasForm: false,
    crawlDepth: depth,
    crawlError: null,
    internalLinks: [],
  };

  const baseDomain = getBaseDomain(baseUrl);

  try {
    assertCrawlableUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "LaunchCoreSEOBot/1.0 (+https://launchcore.io/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeout);

    result.statusCode = response.status;

    if (response.redirected) {
      result.redirectUrl = response.url;
      assertCrawlableUrl(response.url);
    }

    if (!response.ok || response.status >= 400) {
      result.crawlError = `HTTP ${response.status}`;
      return result;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      result.crawlError = "Not HTML";
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    result.title = $("title").first().text().trim() || null;
    result.metaDescription = $('meta[name="description"]').attr("content")?.trim() || null;
    result.h1 = $("h1").first().text().trim() || null;
    result.h2s = $("h2").map((_, el) => $(el).text().trim()).get().filter(Boolean);
    result.canonical = $('link[rel="canonical"]').attr("href")?.trim() || null;
    result.robotsMeta = $('meta[name="robots"]').attr("content")?.trim() || null;

    result.hasOpenGraph = $('meta[property^="og:"]').length > 0;
    result.hasSchema = $('script[type="application/ld+json"]').length > 0;

    const htmlLower = html.toLowerCase();
    result.hasAnalytics = htmlLower.includes("google-analytics.com") || htmlLower.includes("gtag(") || htmlLower.includes("ga(");
    result.hasGtm = htmlLower.includes("googletagmanager.com") || htmlLower.includes("gtm.js");
    result.hasMetaPixel = htmlLower.includes("connect.facebook.net") || htmlLower.includes("fbq(");

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.startsWith("tel:")) result.hasPhoneLink = true;
      if (href.startsWith("mailto:")) result.hasEmailLink = true;
    });

    const ctaPatterns = /\b(contact|get started|get a quote|free quote|call now|book now|schedule|request|buy now|order now|sign up|try free|get help)\b/i;
    result.hasCta = ctaPatterns.test(html);
    result.hasForm = $("form").length > 0;

    $("img").each((_, el) => {
      result.imagesCount++;
      const alt = $(el).attr("alt");
      if (!alt || alt.trim() === "") result.imagesMissingAlt++;
    });

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    result.wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;

    const internalSet = new Set<string>();
    let externalCount = 0;

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const normalized = normalizeUrl(href, url);
      if (!normalized) return;
      const linkDomain = getBaseDomain(normalized);
      if (linkDomain === baseDomain) {
        internalSet.add(normalized);
      } else {
        externalCount++;
      }
    });

    result.internalLinks = Array.from(internalSet);
    result.internalLinksCount = internalSet.size;
    result.externalLinksCount = externalCount;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    result.crawlError = message;
    result.statusCode = 0;
  }

  return result;
}

export async function runCrawl(
  rootUrl: string,
  maxPages: number,
  onPage: (page: CrawledPage) => Promise<void>,
  onProgress: (processed: number, found: number) => Promise<void>,
): Promise<void> {
  const normalizedRoot = addProtocol(rootUrl.trim());
  assertCrawlableUrl(normalizedRoot);

  const baseDomain = getBaseDomain(normalizedRoot);
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: normalizedRoot, depth: 0 }];

  while (queue.length > 0 && visited.size < maxPages) {
    const item = queue.shift()!;
    const { url, depth } = item;

    if (visited.has(url)) continue;
    visited.add(url);

    logger.info({ url, depth }, "Crawling page");

    const page = await crawlPage(url, normalizedRoot, depth);
    await onPage(page);
    await onProgress(visited.size, visited.size + queue.length);

    if (depth < 5 && page.internalLinks.length > 0) {
      for (const link of page.internalLinks) {
        if (!visited.has(link) && getBaseDomain(link) === baseDomain) {
          queue.push({ url: link, depth: depth + 1 });
        }
      }
    }
  }
}
