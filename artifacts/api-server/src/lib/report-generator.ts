import type { Crawl, CrawlPage, SeoIssue, SeoTodo } from "@workspace/db";
import type { InsertReport } from "@workspace/db";

interface ReportInput {
  crawl: Crawl;
  pages: CrawlPage[];
  issues: SeoIssue[];
  todos: SeoTodo[];
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function issueLabel(issueType: string): string {
  return issueType.replace(/_/g, " ");
}

function percent(part: number, total: number): number {
  return Math.round((part / Math.max(total, 1)) * 100);
}

function formatTodoList(todos: SeoTodo[], fallback: string): string {
  if (todos.length === 0) return fallback;
  return todos
    .map((todo, index) => `${index + 1}. **${todo.title}** - ${todo.estimatedTimeMinutes ?? "?"} min\n${todo.exactAction ?? "Review and resolve this item."}`)
    .join("\n\n");
}

export function generateReport(input: ReportInput): Omit<InsertReport, "crawlId"> {
  const { crawl, pages, issues, todos } = input;

  const domain = getDomain(crawl.url);
  const criticalIssues = issues.filter((i) => i.severity === "critical");
  const highIssues = issues.filter((i) => i.severity === "high");
  const pagesWithAnalytics = pages.filter((p) => p.hasAnalytics || p.hasGtm);
  const pagesWith4xx = pages.filter((p) => p.statusCode && p.statusCode >= 400 && p.statusCode < 500);
  const pagesWithCta = pages.filter((p) => p.hasCta);
  const pagesWithSchema = pages.filter((p) => p.hasSchema);
  const pagesWithContactSignals = pages.filter((p) => p.hasPhoneLink || p.hasEmailLink || p.hasForm);
  const thinPages = pages.filter((p) => p.wordCount && p.wordCount < 200);
  const p1Todos = todos.filter((t) => t.priority === "P1");
  const p2OnPageTodos = todos.filter((t) => t.priority === "P2" && t.category === "On-Page SEO");

  const issueScore = Math.max(0, 100 - criticalIssues.length * 15 - highIssues.length * 5);
  const ctaScore = pages.length ? (pagesWithCta.length / pages.length) * 100 : 0;
  const analyticsScore = pagesWithAnalytics.length > 0 ? 100 : 0;
  const schemaScore = pagesWithSchema.length > 0 ? 80 : 0;
  const overallScore = Math.round(issueScore * 0.4 + ctaScore * 0.2 + analyticsScore * 0.2 + schemaScore * 0.2);

  const urgentProblems = criticalIssues.length > 0
    ? `The most urgent problems are: ${criticalIssues.slice(0, 3).map((i) => issueLabel(i.issueType)).join(", ")}.`
    : "No critical issues were found in the crawl.";

  const executiveSummary = `
**Website:** ${domain}
**Crawl Date:** ${new Date(crawl.createdAt).toLocaleDateString()}
**Pages Analyzed:** ${pages.length}
**Overall SEO Score:** ${overallScore}/100

${domain} has ${issues.length} SEO issues identified across ${pages.length} crawled pages. Of these, ${criticalIssues.length} are critical issues requiring immediate attention and ${highIssues.length} are high-priority issues.

${urgentProblems}

There are ${p1Todos.length} P1 actions that should be completed within the next 7 days to improve organic visibility and lead generation.
`.trim();

  const biggestRevenueLeaks = `
## Biggest Revenue Leaks

${pagesWith4xx.length > 0 ? `### Broken Pages Losing Link Equity\n${pagesWith4xx.length} page(s) return 4xx errors. These pages are invisible to Google and waste any backlink authority pointed at them.\n` : ""}
${pagesWithAnalytics.length === 0 ? `### No Analytics Installed\nWithout Google Analytics or Google Tag Manager, traffic, conversions, and marketing ROI cannot be measured reliably.\n` : ""}
${pagesWithCta.length < pages.length * 0.5 ? `### Missing CTAs\n${pages.length - pagesWithCta.length} page(s) lack a clear call to action, which can reduce visitor-to-lead conversion.\n` : ""}
### Thin Content Pages
${thinPages.length} page(s) have fewer than 200 words. These pages are unlikely to rank for competitive keywords and may be treated as low-value content.
`.trim();

  const quickWins = `
## Quick Wins (Complete Within 1 Week)

${formatTodoList(p1Todos.slice(0, 5), "No P1 quick wins were generated for this crawl.")}
`.trim();

  const technicalSeo = `
## Technical SEO Assessment

**Crawled Pages:** ${pages.length}
**4xx Errors:** ${pagesWith4xx.length}
**Missing Canonical Tags:** ${issues.filter((i) => i.issueType === "missing_canonical").length} pages
**Non-Indexable Pages:** ${issues.filter((i) => i.issueType === "non_indexable").length} pages
**Deep Architecture Issues:** ${issues.filter((i) => i.issueType === "deep_page").length} pages

${pagesWith4xx.length > 0 ? `Critical: ${pagesWith4xx.length} broken page(s) should be fixed immediately.` : "No broken pages detected."}

**Duplicate Content:**
- Duplicate titles: ${issues.some((i) => i.issueType === "duplicate_title") ? "Found" : "None"}
- Duplicate meta descriptions: ${issues.some((i) => i.issueType === "duplicate_meta_description") ? "Found" : "None"}
`.trim();

  const localSeo = `
## Local SEO Assessment

**Structured Data:** ${pagesWithSchema.length > 0 ? `Found on ${pagesWithSchema.length} page(s)` : "Missing or not detected"}
**Contact Signals:** ${pagesWithContactSignals.length} of ${pages.length} page(s) have contact signals
**LocalBusiness Schema:** ${pagesWithSchema.length > 0 ? "Schema exists; verify it includes LocalBusiness fields" : "Not detected"}

**Priority Actions:**
1. Add LocalBusiness JSON-LD schema to the homepage with name, address, phone, hours, geo, and serviceArea.
2. Ensure NAP (Name, Address, Phone) is consistent across all pages and matches Google Business Profile.
3. Create dedicated service-plus-city landing pages for top revenue keywords.
`.trim();

  const conversionIssues = `
## Website Conversion Issues

**Pages with CTA:** ${pagesWithCta.length} / ${pages.length} (${percent(pagesWithCta.length, pages.length)}%)
**Pages with Contact Signals:** ${pagesWithContactSignals.length} / ${pages.length}
**Pages with Forms:** ${pages.filter((p) => p.hasForm).length} / ${pages.length}

${pagesWithCta.length < pages.length * 0.5 ? `More than half of pages lack a clear CTA. Visitors on ${pages.length - pagesWithCta.length} page(s) have no obvious next step.` : "CTA coverage is present on at least half of crawled pages."}

**Recommended CTA Framework:**
- Header: clickable phone number using a tel: link.
- Hero section: primary button such as "Get a Free Quote", "Call Now", or "Book Online".
- Service pages: contextual CTA matching the service intent.
- Footer: contact form, address, phone, and email.
`.trim();

  const mobileSpeedReadiness = `
## Mobile & Speed Readiness

This analysis is based on page structure observations. For full Core Web Vitals data, connect the Google PageSpeed Insights API.

**Recommendations:**
1. Test mobile experience at 375px width for all key pages.
2. Compress hero images to WebP format and keep critical images lightweight.
3. Enable lazy loading for below-the-fold images.
4. Ensure clickable elements are at least 44px on mobile.
5. Run PageSpeed Insights on the 3 most important pages and fix high-impact opportunities.
`.trim();

  const competitorGap = `
## Competitor Gap Snapshot

To access full SERP and competitor analysis, connect DataForSEO or SerpAPI.

**Manual Competitive Analysis Checklist:**
1. Search the top 3 keywords and identify the top 3 ranking local competitors.
2. Compare page word count, schema markup, review count, and citation sources.
3. Find keywords competitors rank for that this site does not.
4. Use backlink discovery to replicate high-quality competitor citation and authority sources.

**Key Signals to Outcompete:**
- More comprehensive service pages with local references.
- More Google Business reviews and faster response rate.
- LocalBusiness and Service schema markup.
- Citations on trusted directories where competitors are listed.
`.trim();

  const actionPlan30Days = `
## Recommended 30-Day Action Plan

### Week 1 - Foundation
${formatTodoList(p1Todos.slice(0, 4), "1. Review critical technical and conversion findings.\n2. Fix any pages blocked from indexing.\n3. Add missing analytics and conversion tracking.")}

### Week 2 - Content & On-Page
${formatTodoList(p2OnPageTodos.slice(0, 3), "1. Add or optimize service page content with local keywords.\n2. Add FAQ sections to top pages.\n3. Update image alt text across the site.")}

### Week 3 - Technical & Schema
1. Add LocalBusiness JSON-LD schema to the homepage.
2. Fix missing canonical tags.
3. Submit sitemap to Google Search Console.
4. Fix remaining 4xx pages.

### Week 4 - Authority & Leads
1. Submit to top local citation sources.
2. Request new Google reviews from recent customers.
3. Run keyword research for the next content plan.
4. Set up GA4 conversion tracking for phone clicks and form submissions.
`.trim();

  const topCriticalLines = criticalIssues.length > 0
    ? criticalIssues.slice(0, 3).map((i, idx) => `${idx + 1}. ${issueLabel(i.issueType)} - ${i.businessImpact ?? "This can limit organic visibility or conversions."}`).join("\n")
    : "1. No critical issues were found in this crawl.";

  const outreachEmail = `
## Outreach Email Template (Sales)

**Subject:** Quick question about ${domain}'s online visibility

Hi [First Name],

I ran a quick SEO audit on ${domain} and found a few items that may be holding back search visibility and lead generation.

${topCriticalLines}

These are fixable, and some can usually be corrected within a day. Our team specializes in helping local businesses turn SEO gaps into more phone calls and qualified leads.

Would you be open to a 15-minute call to review the full report? I can show you the exact issues and the highest-impact fixes.

Best,
[Your Name]
[Phone] | [Website]
`.trim();

  return {
    executiveSummary,
    biggestRevenueLeaks,
    quickWins,
    technicalSeo,
    localSeo,
    conversionIssues,
    mobileSpeedReadiness,
    competitorGap,
    actionPlan30Days,
    outreachEmail,
    overallScore,
  };
}
