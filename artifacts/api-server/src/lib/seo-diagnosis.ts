import type { CrawlPage } from "@workspace/db";
import type { InsertSeoIssue } from "@workspace/db";

type IssueSeverity = "critical" | "high" | "medium" | "low";

interface IssueTemplate {
  issueType: string;
  category: string;
  severity: IssueSeverity;
  recommendation: string;
  businessImpact: string;
  estimatedEffort: string;
  confidenceScore: number;
}

const ISSUE_TEMPLATES: Record<string, IssueTemplate> = {
  missing_title: {
    issueType: "missing_title",
    category: "On-Page SEO",
    severity: "critical",
    recommendation: "Add a descriptive title tag (50-60 characters) including the primary keyword and brand name.",
    businessImpact: "Pages without titles receive significantly lower CTR from search results and may be ranked lower by Google.",
    estimatedEffort: "15 minutes",
    confidenceScore: 1.0,
  },
  title_too_short: {
    issueType: "title_too_short",
    category: "On-Page SEO",
    severity: "medium",
    recommendation: "Expand the title to 50-60 characters including the primary keyword, location, and brand.",
    businessImpact: "Short titles miss keyword opportunities and show less value to potential visitors in search results.",
    estimatedEffort: "10 minutes",
    confidenceScore: 0.9,
  },
  title_too_long: {
    issueType: "title_too_long",
    category: "On-Page SEO",
    severity: "medium",
    recommendation: "Shorten the title to under 60 characters. Keep the primary keyword and brand within the visible portion.",
    businessImpact: "Truncated titles look unprofessional in search results and may lose the most important keywords.",
    estimatedEffort: "10 minutes",
    confidenceScore: 0.9,
  },
  missing_meta_description: {
    issueType: "missing_meta_description",
    category: "On-Page SEO",
    severity: "high",
    recommendation: "Add a compelling meta description (150-160 characters) that includes the primary keyword and a clear call to action.",
    businessImpact: "Without meta descriptions, Google auto-generates snippets that are often less compelling, reducing click-through rates by 20-30%.",
    estimatedEffort: "15 minutes",
    confidenceScore: 1.0,
  },
  meta_description_too_short: {
    issueType: "meta_description_too_short",
    category: "On-Page SEO",
    severity: "low",
    recommendation: "Expand the meta description to 150-160 characters. Include the primary keyword and a compelling benefit statement.",
    businessImpact: "Short meta descriptions miss the opportunity to differentiate from competitors in search results.",
    estimatedEffort: "10 minutes",
    confidenceScore: 0.85,
  },
  meta_description_too_long: {
    issueType: "meta_description_too_long",
    category: "On-Page SEO",
    severity: "low",
    recommendation: "Trim the meta description to under 160 characters. Keep the most compelling information at the start.",
    businessImpact: "Truncated descriptions look unprofessional and may cut off the call to action.",
    estimatedEffort: "10 minutes",
    confidenceScore: 0.85,
  },
  missing_h1: {
    issueType: "missing_h1",
    category: "On-Page SEO",
    severity: "critical",
    recommendation: "Add a single H1 tag that clearly communicates the page's primary topic and includes the main keyword.",
    businessImpact: "H1 is one of the strongest on-page ranking signals. Missing H1 significantly weakens Google's understanding of the page topic.",
    estimatedEffort: "15 minutes",
    confidenceScore: 1.0,
  },
  missing_canonical: {
    issueType: "missing_canonical",
    category: "Technical SEO",
    severity: "medium",
    recommendation: "Add a canonical tag pointing to the preferred URL version of this page.",
    businessImpact: "Without canonical tags, duplicate content issues can dilute link equity and confuse search engines about the preferred URL.",
    estimatedEffort: "30 minutes",
    confidenceScore: 0.8,
  },
  page_4xx: {
    issueType: "page_4xx",
    category: "Technical SEO",
    severity: "critical",
    recommendation: "Fix the broken page: either restore the content, set up a 301 redirect to the correct URL, or remove links pointing to it.",
    businessImpact: "404 pages waste crawl budget, create poor user experience, and lose any backlink value pointing to these URLs.",
    estimatedEffort: "30 minutes",
    confidenceScore: 1.0,
  },
  page_5xx: {
    issueType: "page_5xx",
    category: "Technical SEO",
    severity: "critical",
    recommendation: "Investigate and fix the server error. Check hosting logs, database connections, and server resources.",
    businessImpact: "Server errors prevent Google from indexing pages and signal unreliability to both users and search engines.",
    estimatedEffort: "2 hours",
    confidenceScore: 1.0,
  },
  images_missing_alt: {
    issueType: "images_missing_alt",
    category: "On-Page SEO",
    severity: "medium",
    recommendation: "Add descriptive alt text to all images including relevant keywords where appropriate. Decorative images can use alt=''.",
    businessImpact: "Missing alt text loses image search traffic opportunities and hurts accessibility scores which can indirectly impact rankings.",
    estimatedEffort: "1 hour",
    confidenceScore: 0.95,
  },
  thin_content: {
    issueType: "thin_content",
    category: "Content Quality",
    severity: "high",
    recommendation: "Expand the page content to at least 500 words. Address user intent thoroughly with relevant topics, FAQs, and structured information.",
    businessImpact: "Thin content pages are less likely to rank well and Google may de-index them as low-quality.",
    estimatedEffort: "3 hours",
    confidenceScore: 0.85,
  },
  missing_open_graph: {
    issueType: "missing_open_graph",
    category: "Social SEO",
    severity: "low",
    recommendation: "Add Open Graph tags (og:title, og:description, og:image) to enable rich previews when shared on social media.",
    businessImpact: "Without Open Graph tags, social shares display poorly, reducing click-through rates from social platforms.",
    estimatedEffort: "30 minutes",
    confidenceScore: 0.9,
  },
  missing_schema: {
    issueType: "missing_schema",
    category: "Structured Data",
    severity: "medium",
    recommendation: "Add structured data markup (JSON-LD). At minimum add Organization/LocalBusiness schema for the homepage.",
    businessImpact: "Schema markup enables rich results in Google Search, which can increase CTR by 20-30% for eligible queries.",
    estimatedEffort: "2 hours",
    confidenceScore: 0.8,
  },
  missing_contact_signals: {
    issueType: "missing_contact_signals",
    category: "Conversion",
    severity: "high",
    recommendation: "Add a clickable phone number, email address, or contact form. Place contact info in the header or hero section.",
    businessImpact: "Pages without contact signals have significantly lower conversion rates. Users who can't quickly find how to contact you leave.",
    estimatedEffort: "1 hour",
    confidenceScore: 0.85,
  },
  missing_cta: {
    issueType: "missing_cta",
    category: "Conversion",
    severity: "high",
    recommendation: "Add a clear call-to-action (CTA) button above the fold. Examples: 'Get a Free Quote', 'Call Now', 'Book Appointment'.",
    businessImpact: "Pages without CTAs convert visitors at a fraction of the rate of pages with clear next-step actions.",
    estimatedEffort: "1 hour",
    confidenceScore: 0.85,
  },
  missing_tracking: {
    issueType: "missing_tracking",
    category: "Analytics",
    severity: "high",
    recommendation: "Install Google Analytics 4 and Google Tag Manager. This is essential for measuring marketing effectiveness.",
    businessImpact: "Without analytics, you cannot measure traffic, conversions, or the ROI of any marketing investment.",
    estimatedEffort: "2 hours",
    confidenceScore: 0.95,
  },
  non_indexable: {
    issueType: "non_indexable",
    category: "Technical SEO",
    severity: "critical",
    recommendation: "Review the robots meta tag. If this page should be indexed, remove the 'noindex' directive.",
    businessImpact: "Non-indexable pages are completely excluded from Google Search, losing all potential organic traffic.",
    estimatedEffort: "15 minutes",
    confidenceScore: 1.0,
  },
  deep_page: {
    issueType: "deep_page",
    category: "Site Architecture",
    severity: "low",
    recommendation: "Flatten the site structure so important pages are reachable within 3 clicks from the homepage. Add internal links from key pages.",
    businessImpact: "Pages buried deep in the site structure receive less crawl budget and internal link equity, leading to lower rankings.",
    estimatedEffort: "4 hours",
    confidenceScore: 0.75,
  },
};

export function diagnosePages(crawlId: number, pages: CrawlPage[]): InsertSeoIssue[] {
  const issues: InsertSeoIssue[] = [];
  const titleMap = new Map<string, number>();
  const descMap = new Map<string, number>();

  for (const page of pages) {
    if (page.crawlError && page.statusCode === 0) continue;

    const url = page.url;

    if (page.statusCode && page.statusCode >= 400 && page.statusCode < 500) {
      issues.push({
        crawlId,
        affectedUrl: url,
        evidence: `HTTP status: ${page.statusCode}`,
        ...ISSUE_TEMPLATES.page_4xx,
      });
      continue;
    }

    if (page.statusCode && page.statusCode >= 500) {
      issues.push({
        crawlId,
        affectedUrl: url,
        evidence: `HTTP status: ${page.statusCode}`,
        ...ISSUE_TEMPLATES.page_5xx,
      });
      continue;
    }

    const robotsMeta = page.robotsMeta?.toLowerCase() || "";
    if (robotsMeta.includes("noindex")) {
      issues.push({
        crawlId,
        affectedUrl: url,
        evidence: `robots meta: "${page.robotsMeta}"`,
        ...ISSUE_TEMPLATES.non_indexable,
      });
    }

    if (!page.title) {
      issues.push({ crawlId, affectedUrl: url, evidence: "No title tag found", ...ISSUE_TEMPLATES.missing_title });
    } else {
      const len = page.title.length;
      if (len < 20) {
        issues.push({ crawlId, affectedUrl: url, evidence: `Title: "${page.title}" (${len} chars)`, ...ISSUE_TEMPLATES.title_too_short });
      } else if (len > 70) {
        issues.push({ crawlId, affectedUrl: url, evidence: `Title: "${page.title}" (${len} chars)`, ...ISSUE_TEMPLATES.title_too_long });
      }
      titleMap.set(page.title, (titleMap.get(page.title) || 0) + 1);
    }

    if (!page.metaDescription) {
      issues.push({ crawlId, affectedUrl: url, evidence: "No meta description found", ...ISSUE_TEMPLATES.missing_meta_description });
    } else {
      const len = page.metaDescription.length;
      if (len < 50) {
        issues.push({ crawlId, affectedUrl: url, evidence: `Meta description: "${page.metaDescription}" (${len} chars)`, ...ISSUE_TEMPLATES.meta_description_too_short });
      } else if (len > 170) {
        issues.push({ crawlId, affectedUrl: url, evidence: `Meta description length: ${len} chars`, ...ISSUE_TEMPLATES.meta_description_too_long });
      }
      descMap.set(page.metaDescription, (descMap.get(page.metaDescription) || 0) + 1);
    }

    if (!page.h1) {
      issues.push({ crawlId, affectedUrl: url, evidence: "No H1 tag found on page", ...ISSUE_TEMPLATES.missing_h1 });
    }

    if (!page.canonical) {
      issues.push({ crawlId, affectedUrl: url, evidence: "No canonical link tag found", ...ISSUE_TEMPLATES.missing_canonical });
    }

    if (page.imagesCount && page.imagesMissingAlt && page.imagesMissingAlt > 0) {
      issues.push({
        crawlId,
        affectedUrl: url,
        evidence: `${page.imagesMissingAlt} of ${page.imagesCount} images missing alt text`,
        ...ISSUE_TEMPLATES.images_missing_alt,
      });
    }

    if (page.wordCount !== null && page.wordCount !== undefined && page.wordCount < 200) {
      issues.push({
        crawlId,
        affectedUrl: url,
        evidence: `Only ${page.wordCount} words found on page`,
        ...ISSUE_TEMPLATES.thin_content,
      });
    }

    if (!page.hasOpenGraph) {
      issues.push({ crawlId, affectedUrl: url, evidence: "No og: meta tags found", ...ISSUE_TEMPLATES.missing_open_graph });
    }

    if (!page.hasSchema) {
      issues.push({ crawlId, affectedUrl: url, evidence: "No JSON-LD schema found", ...ISSUE_TEMPLATES.missing_schema });
    }

    if (!page.hasPhoneLink && !page.hasEmailLink && !page.hasForm) {
      issues.push({ crawlId, affectedUrl: url, evidence: "No phone link, email link, or form detected", ...ISSUE_TEMPLATES.missing_contact_signals });
    }

    if (!page.hasCta) {
      issues.push({ crawlId, affectedUrl: url, evidence: "No CTA keywords or button patterns detected", ...ISSUE_TEMPLATES.missing_cta });
    }

    if (!page.hasAnalytics && !page.hasGtm) {
      issues.push({ crawlId, affectedUrl: url, evidence: "No Google Analytics, GTM, or tracking scripts detected", ...ISSUE_TEMPLATES.missing_tracking });
    }

    if (page.crawlDepth !== null && page.crawlDepth !== undefined && page.crawlDepth > 4) {
      issues.push({
        crawlId,
        affectedUrl: url,
        evidence: `Page found at crawl depth ${page.crawlDepth}`,
        ...ISSUE_TEMPLATES.deep_page,
      });
    }
  }

  for (const [title, count] of titleMap) {
    if (count > 1) {
      issues.push({
        crawlId,
        issueType: "duplicate_title",
        category: "On-Page SEO",
        severity: "high",
        affectedUrl: "multiple pages",
        evidence: `Title "${title}" appears on ${count} pages`,
        recommendation: "Ensure every page has a unique title that accurately describes its specific content.",
        businessImpact: "Duplicate titles cause Google to filter pages from results and signal poor site quality.",
        estimatedEffort: "2 hours",
        confidenceScore: 1.0,
      });
    }
  }

  for (const [desc, count] of descMap) {
    if (count > 1) {
      issues.push({
        crawlId,
        issueType: "duplicate_meta_description",
        category: "On-Page SEO",
        severity: "medium",
        affectedUrl: "multiple pages",
        evidence: `Meta description "${desc.substring(0, 60)}..." appears on ${count} pages`,
        recommendation: "Write unique meta descriptions for each page that reflect its specific content and target keywords.",
        businessImpact: "Duplicate meta descriptions reduce differentiation between pages in search results.",
        estimatedEffort: "1 hour",
        confidenceScore: 0.9,
      });
    }
  }

  return issues;
}
