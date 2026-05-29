import type { Crawl, CrawlPage, SeoIssue, SeoTodo } from "@workspace/db";
import type { InsertReport } from "@workspace/db";

interface ReportInput {
  crawl: Crawl;
  pages: CrawlPage[];
  issues: SeoIssue[];
  todos: SeoTodo[];
}

export function generateReport(input: ReportInput): Omit<InsertReport, "crawlId"> {
  const { crawl, pages, issues, todos } = input;

  const domain = (() => {
    try {
      return new URL(crawl.url).hostname;
    } catch {
      return crawl.url;
    }
  })();

  const criticalIssues = issues.filter((i) => i.severity === "critical");
  const highIssues = issues.filter((i) => i.severity === "high");
  const pagesWithAnalytics = pages.filter((p) => p.hasAnalytics || p.hasGtm);
  const pagesWith4xx = pages.filter((p) => p.statusCode && p.statusCode >= 400 && p.statusCode < 500);
  const pagesWithCta = pages.filter((p) => p.hasCta);
  const pagesWithSchema = pages.filter((p) => p.hasSchema);
  const p1Todos = todos.filter((t) => t.priority === "P1");

  const issueScore = Math.max(0, 100 - criticalIssues.length * 15 - highIssues.length * 5);
  const ctaScore = pages.length ? (pagesWithCta.length / pages.length) * 100 : 0;
  const analyticsScore = pagesWithAnalytics.length > 0 ? 100 : 0;
  const schemaScore = pagesWithSchema.length > 0 ? 80 : 0;
  const overallScore = Math.round((issueScore * 0.4 + ctaScore * 0.2 + analyticsScore * 0.2 + schemaScore * 0.2));

  const executiveSummary = `
**Website:** ${domain}
**Crawl Date:** ${new Date(crawl.createdAt).toLocaleDateString()}
**Pages Analyzed:** ${pages.length}
**Overall SEO Score:** ${overallScore}/100

${domain} has ${issues.length} SEO issues identified across ${pages.length} crawled pages. Of these, ${criticalIssues.length} are critical issues requiring immediate attention and ${highIssues.length} are high-priority issues.

${criticalIssues.length > 0 ? `The most urgent problems are: ${criticalIssues.slice(0, 3).map((i) => i.issueType.replace(/_/g, " ")).join(", ")}.` : "No critical issues found — strong technical foundation."}

There are ${p1Todos.length} P1 actions that should be completed within the next 7 days to maximize organic visibility and lead generation.
`.trim();

  const biggestRevenueLeaks = `
## Biggest Revenue Leaks

${pagesWith4xx.length > 0 ? `### 1. Broken Pages Losing Link Equity\n${pagesWith4xx.length} page(s) return 4xx errors. These pages are invisible to Google and waste any backlink authority pointed at them.\n\n` : ""}${pagesWithAnalytics.length === 0 ? `### ${pagesWith4xx.length > 0 ? "2" : "1"}. No Analytics Installed\nWithout Google Analytics, you cannot measure traffic, conversions, or marketing ROI. Every dollar spent on ads or SEO cannot be properly attributed.\n\n` : ""}${pages.filter((p) => !p.hasCta).length > pages.length * 0.5 ? `### Missing CTAs on ${pages.filter((p) => !p.hasCta).length} Pages\nMore than half of analyzed pages have no clear call-to-action. Visitors who don't know what to do next leave without converting.\n\n` : ""}### Thin Content Pages
${pages.filter((p) => p.wordCount && p.wordCount < 200).length} pages have fewer than 200 words. These pages are unlikely to rank for competitive keywords and may be flagged by Google as low-quality.
`.trim();

  const quickWins = `
## Quick Wins (Complete Within 1 Week)

${p1Todos.slice(0, 5).map((t, i) => `**${i + 1}. ${t.title}**\n${t.exactAction}\n_Estimated time: ${t.estimatedTimeMinutes} min | Impact: ${t.expectedImpact}_`).join("\n\n")}
`.trim();

  const technicalSeo = `
## Technical SEO Assessment

**Crawled Pages:** ${pages.length}
**4xx Errors:** ${pagesWith4xx.length}
**Missing Canonical Tags:** ${issues.filter((i) => i.issueType === "missing_canonical").length} pages
**Non-Indexable Pages:** ${issues.filter((i) => i.issueType === "non_indexable").length} pages
**Deep Architecture Issues:** ${issues.filter((i) => i.issueType === "deep_page").length} pages

${pagesWith4xx.length > 0 ? `⚠️ Critical: ${pagesWith4xx.length} broken pages must be fixed immediately.` : "✅ No broken pages detected."}

**Duplicate Content:**
- Duplicate titles: ${issues.filter((i) => i.issueType === "duplicate_title").length > 0 ? "⚠️ Found" : "✅ None"}
- Duplicate meta descriptions: ${issues.filter((i) => i.issueType === "duplicate_meta_description").length > 0 ? "⚠️ Found" : "✅ None"}
`.trim();

  const localSeo = `
## Local SEO Assessment

**Structured Data (Schema):** ${pagesWithSchema.length > 0 ? `✅ Found on ${pagesWithSchema.length} pages` : "⚠️ Missing — critical for local visibility"}
**Contact Signals:** ${pages.filter((p) => p.hasPhoneLink || p.hasEmailLink || p.hasForm).length} of ${pages.length} pages have contact signals
**Local Schema (LocalBusiness):** ${pagesWithSchema.length > 0 ? "Detected (verify LocalBusiness type)" : "⚠️ Not detected"}

**Priority Actions:**
1. Add LocalBusiness JSON-LD schema to the homepage with: name, address, phone, hours, geo, serviceArea
2. Ensure NAP (Name, Address, Phone) is consistent across all pages and matches Google Business Profile
3. Create dedicated service+city landing pages for top revenue keywords
`.trim();

  const conversionIssues = `
## Website Conversion Issues

**Pages with CTA:** ${pagesWithCta.length} / ${pages.length} (${Math.round((pagesWithCta.length / Math.max(pages.length, 1)) * 100)}%)
**Pages with Contact Signals:** ${pages.filter((p) => p.hasPhoneLink || p.hasEmailLink || p.hasForm).length} / ${pages.length}
**Pages with Forms:** ${pages.filter((p) => p.hasForm).length} / ${pages.length}

${pagesWithCta.length < pages.length * 0.5 ? `⚠️ More than half of pages lack a clear CTA. Visitors on ${pages.length - pagesWithCta.length} pages have no obvious next step.` : ""}

**Recommended CTA Framework:**
- Header: Clickable phone number (tel: link)
- Hero section: Primary button ("Get a Free Quote" / "Call Now")
- Service pages: Contextual CTA matching the service intent
- Footer: Contact form + address + phone
`.trim();

  const mobileSpeedReadiness = `
## Mobile & Speed Readiness

This analysis is based on page structure observations. For full Core Web Vitals data, connect the Google PageSpeed Insights API.

**Recommendations:**
1. Test mobile experience at 375px width for all key pages
2. Compress hero images to WebP format (target < 100KB per image)
3. Enable lazy loading for below-the-fold images
4. Ensure clickable elements (phone, CTA buttons) are minimum 44px touch targets on mobile
5. Run PageSpeed Insights on the 3 most important pages and fix all opportunities flagged as "High Impact"
`.trim();

  const competitorGap = `
## Competitor Gap Snapshot

To access full SERP and competitor analysis, connect the DataForSEO or SerpAPI integration.

**Manual Competitive Analysis Checklist:**
1. Search your top 3 keywords — identify the top 3 ranking local competitors
2. Check their: page word count, schema markup, review count, citation sources
3. Look for keywords they rank for that you don't (content gap)
4. Replicate their top backlinks using the Backlink Opportunities module

**Key Signals to Outcompete:**
- More comprehensive service pages (500+ words with local references)
- More Google Business reviews and faster response rate
- LocalBusiness + Service schema markup
- Citations on directories competitors are listed in
`.trim();

  const actionPlan30Days = `
## Recommended 30-Day Action Plan

### Week 1 — Foundation (Critical Fixes)
${p1Todos.slice(0, 4).map((t, i) => `${i + 1}. **${t.title}** — ${t.estimatedTimeMinutes} min`).join("\n")}

### Week 2 — Content & On-Page
${todos.filter((t) => t.priority === "P2" && t.category === "On-Page SEO").slice(0, 3).map((t, i) => `${i + 1}. **${t.title}** — ${t.estimatedTimeMinutes} min`).join("\n") || "- Add/optimize service page content with local keywords\n- Add FAQ sections to top 3 pages\n- Update image alt text across site"}

### Week 3 — Technical & Schema
- Add LocalBusiness JSON-LD schema to homepage
- Fix all canonical tags
- Submit sitemap to Google Search Console
- Fix any remaining 4xx pages

### Week 4 — Authority & Leads
- Submit to top 5 local citation sources
- Request 5 Google reviews from recent customers
- Start keyword research for next quarter's content plan
- Set up Google Analytics 4 conversion tracking
`.trim();

  const outreachEmail = `
## Outreach Email Template (Sales)

**Subject:** Quick question about ${domain}'s online visibility

Hi [First Name],

I was researching [nicheStr] businesses in [city] and ran a quick SEO audit on ${domain}.

I found a few things holding you back from ranking higher in Google:

${criticalIssues.slice(0, 3).map((i, idx) => `${idx + 1}. ${i.issueType.replace(/_/g, " ")} — ${i.businessImpact}`).join("\n")}

These are fixable — some within a day. Our team at [Your Agency] specializes in helping local businesses like yours turn these gaps into more phone calls and leads.

Would you be open to a 15-minute call to review the full report? I can show you exactly what's being left on the table.

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
