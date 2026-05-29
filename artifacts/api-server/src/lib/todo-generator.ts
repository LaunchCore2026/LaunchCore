import type { SeoIssue } from "@workspace/db";
import type { InsertSeoTodo } from "@workspace/db";

type Priority = "P1" | "P2" | "P3" | "P4";

interface TodoTemplate {
  title: string;
  category: string;
  priority: Priority;
  exactAction: string;
  whyItMatters: string;
  expectedImpact: string;
  estimatedTimeMinutes: number;
  validationMethod: string;
}

const TODO_TEMPLATES: Record<string, TodoTemplate> = {
  missing_title: {
    title: "Add title tag",
    category: "On-Page SEO",
    priority: "P1",
    exactAction: "Open the page template or CMS, add a title tag with format: [Primary Keyword] - [City] | [Brand Name]",
    whyItMatters: "Title tags are the #1 on-page SEO signal. Missing titles make it impossible to rank for target keywords.",
    expectedImpact: "Immediate ranking improvement for the page. Could appear in search results within 1-2 weeks of indexing.",
    estimatedTimeMinutes: 20,
    validationMethod: "View page source and confirm <title> tag exists. Check Google Search Console for impressions within 2 weeks.",
  },
  title_too_short: {
    title: "Expand title tag",
    category: "On-Page SEO",
    priority: "P2",
    exactAction: "Edit the title tag to 50-60 characters including: primary service keyword + city name + brand name. Example: 'Emergency Plumbing Montreal | Smith Plumbing Inc.'",
    whyItMatters: "Short titles miss keyword opportunities and look weak in search results compared to competitors.",
    expectedImpact: "Improved keyword targeting and higher CTR in search results within 2-4 weeks.",
    estimatedTimeMinutes: 15,
    validationMethod: "Use browser source view to confirm title is 50-60 characters. Monitor GSC for CTR changes.",
  },
  title_too_long: {
    title: "Shorten title tag",
    category: "On-Page SEO",
    priority: "P3",
    exactAction: "Edit the title tag to under 60 characters. Keep primary keyword in the first 50 characters. Remove filler words.",
    whyItMatters: "Google truncates titles over 60 characters with '...' in search results, hiding your CTA or brand name.",
    expectedImpact: "Cleaner search result appearance and preserved brand/keyword visibility.",
    estimatedTimeMinutes: 10,
    validationMethod: "Check SERP snippet preview tool. Confirm full title visible without truncation.",
  },
  missing_meta_description: {
    title: "Add meta description",
    category: "On-Page SEO",
    priority: "P1",
    exactAction: "Add a meta description of 150-160 chars. Format: [What the page offers] + [Key benefit] + [CTA]. Example: 'Get fast emergency plumbing in Montreal. Licensed plumbers available 24/7. Call for a free quote today.'",
    whyItMatters: "Meta descriptions directly influence click-through rates. A compelling description can increase CTR by 20-30%.",
    expectedImpact: "Improved CTR in Google results leading to more organic traffic within 2-4 weeks.",
    estimatedTimeMinutes: 20,
    validationMethod: "Check page source for meta description tag. Monitor CTR in Google Search Console.",
  },
  meta_description_too_short: {
    title: "Expand meta description",
    category: "On-Page SEO",
    priority: "P3",
    exactAction: "Expand meta description to 150-160 characters. Add primary keyword, location, and a compelling value proposition.",
    whyItMatters: "Short meta descriptions miss the chance to differentiate from competitors and include actionable messaging.",
    expectedImpact: "Better-performing snippets in search results, potential CTR improvement.",
    estimatedTimeMinutes: 15,
    validationMethod: "Verify meta description length with a character counter. Monitor GSC CTR metrics.",
  },
  missing_h1: {
    title: "Add H1 heading",
    category: "On-Page SEO",
    priority: "P1",
    exactAction: "Add a single H1 tag at the top of the page content. Include the primary keyword naturally. Example: 'Emergency Plumbing Services in Montreal'",
    whyItMatters: "H1 is one of Google's strongest content signals. It tells Google and visitors exactly what the page is about.",
    expectedImpact: "Improved topical relevance signal to Google. Should see ranking improvements within 2-4 weeks.",
    estimatedTimeMinutes: 20,
    validationMethod: "View page source and confirm single H1 with target keyword. Check Google's rich results test.",
  },
  missing_canonical: {
    title: "Add canonical tag",
    category: "Technical SEO",
    priority: "P2",
    exactAction: "Add <link rel='canonical' href='[FULL URL]'> in the <head> section. Use the exact preferred URL including protocol and trailing slash preference.",
    whyItMatters: "Without canonical tags, URL variations (with/without trailing slash, query params) may be treated as duplicate content.",
    expectedImpact: "Consolidated link equity, cleaner indexation. Prevents duplicate content issues.",
    estimatedTimeMinutes: 30,
    validationMethod: "Check page source for canonical tag. Run Screaming Frog to verify canonicals across site.",
  },
  images_missing_alt: {
    title: "Add alt text to images",
    category: "On-Page SEO",
    priority: "P2",
    exactAction: "Add descriptive alt text to every image. For service/product images use format: [What is shown] - [Business name]. For decorative images use alt=''.",
    whyItMatters: "Alt text helps Google understand images and improves accessibility scores, both of which impact rankings.",
    expectedImpact: "Image search traffic, better accessibility score, and improved overall page quality signals.",
    estimatedTimeMinutes: 60,
    validationMethod: "Run accessibility audit in Chrome DevTools. Confirm 0 images with missing alt attributes.",
  },
  thin_content: {
    title: "Expand thin content",
    category: "Content Quality",
    priority: "P1",
    exactAction: "Expand the page to at least 600 words. Add an FAQ section, describe the service process, include local references, and address common customer questions.",
    whyItMatters: "Google's Helpful Content system penalizes thin pages. Comprehensive content ranks significantly better for competitive keywords.",
    expectedImpact: "Significant ranking improvement for target keywords within 4-8 weeks of indexing.",
    estimatedTimeMinutes: 180,
    validationMethod: "Use word count tool to verify minimum 600 words. Monitor rankings for target keywords in GSC.",
  },
  missing_open_graph: {
    title: "Add Open Graph tags",
    category: "Social SEO",
    priority: "P3",
    exactAction: "Add og:title, og:description, og:image (1200x630px), og:url, og:type to the page <head>. Use the same content as title/description tags.",
    whyItMatters: "Without OG tags, link shares on Facebook, LinkedIn, and WhatsApp display generic previews, reducing click-through.",
    expectedImpact: "Better social sharing previews leading to improved traffic from social referrals.",
    estimatedTimeMinutes: 30,
    validationMethod: "Test with Facebook Debugger (developers.facebook.com/tools/debug). Confirm all tags show correctly.",
  },
  missing_schema: {
    title: "Add structured data markup",
    category: "Structured Data",
    priority: "P2",
    exactAction: "Add JSON-LD LocalBusiness schema to the homepage with: name, address, phone, openingHours, geo coordinates, priceRange, serviceArea. Use Google's Rich Results Test to validate.",
    whyItMatters: "Schema markup enables Google rich results (star ratings, address, hours) which dramatically improve CTR in local search.",
    expectedImpact: "Rich results eligibility, improved local pack visibility, 20-30% CTR boost for qualifying searches.",
    estimatedTimeMinutes: 120,
    validationMethod: "Run URL through Google's Rich Results Test (search.google.com/test/rich-results). Confirm no errors.",
  },
  missing_contact_signals: {
    title: "Add visible contact information",
    category: "Conversion",
    priority: "P1",
    exactAction: "Add a clickable phone number in the header and hero section. Use tel: href for click-to-call. Add address and email in the footer. Consider adding a contact form.",
    whyItMatters: "Visitors who cannot quickly find contact information leave. Contact signals also contribute to Google's E-A-T signals.",
    expectedImpact: "Direct increase in phone calls and form submissions. Estimated 15-30% conversion improvement.",
    estimatedTimeMinutes: 60,
    validationMethod: "Test click-to-call on mobile. Verify phone shows in header on all breakpoints.",
  },
  missing_cta: {
    title: "Add primary CTA above the fold",
    category: "Conversion",
    priority: "P1",
    exactAction: "Add a prominent button in the hero section with action-oriented text: 'Get a Free Quote', 'Call Now', 'Book Online'. Button should contrast with background and be visible without scrolling on mobile.",
    whyItMatters: "Pages without above-fold CTAs require visitors to hunt for next steps. Every second of confusion reduces conversion probability.",
    expectedImpact: "Direct lead generation improvement. Well-placed CTAs can increase conversions by 25-50%.",
    estimatedTimeMinutes: 60,
    validationMethod: "Test on mobile at 375px width. Confirm CTA visible without scrolling. A/B test different CTA texts.",
  },
  missing_tracking: {
    title: "Install Google Analytics 4 and GTM",
    category: "Analytics",
    priority: "P1",
    exactAction: "Install Google Tag Manager container. Through GTM, fire GA4 tag on all pages. Set up conversion goals for: phone clicks, form submissions, contact page visits.",
    whyItMatters: "Without tracking, all marketing decisions are made blind. You cannot optimize what you cannot measure.",
    expectedImpact: "Enables data-driven decisions, conversion tracking, and ROI measurement for all marketing channels.",
    estimatedTimeMinutes: 120,
    validationMethod: "Use Tag Assistant Chrome extension to verify GTM and GA4 firing on all pages. Check GA4 DebugView.",
  },
  page_4xx: {
    title: "Fix broken page (4xx error)",
    category: "Technical SEO",
    priority: "P1",
    exactAction: "Check if the page should exist. If yes: restore content. If moved: set up 301 redirect to new URL. If obsolete: remove all internal links pointing to it.",
    whyItMatters: "Broken pages waste Google's crawl budget, create bad user experience, and lose any backlinks pointing to those URLs.",
    expectedImpact: "Preserved link equity from backlinks, improved crawl efficiency, better user experience.",
    estimatedTimeMinutes: 45,
    validationMethod: "Curl the URL and confirm 200 or 301 redirect. Run Screaming Frog to find any remaining broken internal links.",
  },
  non_indexable: {
    title: "Fix non-indexable page",
    category: "Technical SEO",
    priority: "P1",
    exactAction: "Remove 'noindex' from the robots meta tag if this page should appear in search results. If intentionally noindex, ensure it's not being linked from important pages.",
    whyItMatters: "Noindex pages are completely excluded from Google Search, receiving zero organic traffic.",
    expectedImpact: "Page becomes eligible for Google indexing. May appear in results within 1-4 weeks.",
    estimatedTimeMinutes: 15,
    validationMethod: "Confirm robots meta shows 'index, follow' or is absent. Submit URL in Google Search Console for reindexing.",
  },
  duplicate_title: {
    title: "Fix duplicate title tags",
    category: "On-Page SEO",
    priority: "P2",
    exactAction: "Audit all pages with the same title. Assign each page a unique title reflecting its specific content, primary keyword, and URL structure.",
    whyItMatters: "Google penalizes sites with duplicate titles, filtering duplicate pages from results and signaling poor quality.",
    expectedImpact: "Better page differentiation in search results, improved rankings for each individual page.",
    estimatedTimeMinutes: 90,
    validationMethod: "Crawl site with Screaming Frog. Filter by duplicate titles. Confirm 0 duplicates.",
  },
  duplicate_meta_description: {
    title: "Fix duplicate meta descriptions",
    category: "On-Page SEO",
    priority: "P3",
    exactAction: "Write unique meta descriptions for each affected page. Focus on the specific value each page provides.",
    whyItMatters: "Duplicate meta descriptions reduce differentiation between pages in search results.",
    expectedImpact: "Better per-page CTR in search results as each page has a unique, compelling description.",
    estimatedTimeMinutes: 60,
    validationMethod: "Crawl with Screaming Frog and filter duplicate meta descriptions. Confirm 0 duplicates.",
  },
};

export function generateTodos(crawlId: number, issues: SeoIssue[]): InsertSeoTodo[] {
  const todos: InsertSeoTodo[] = [];
  const processedTypes = new Set<string>();

  for (const issue of issues) {
    const key = issue.issueType;
    const template = TODO_TEMPLATES[key];
    if (!template) continue;

    const isMultiPage = ["duplicate_title", "duplicate_meta_description"].includes(key);

    if (isMultiPage) {
      if (processedTypes.has(key)) continue;
      processedTypes.add(key);
    }

    todos.push({
      crawlId,
      title: `${template.title}${!isMultiPage ? ` — ${issue.affectedUrl}` : ""}`,
      description: issue.evidence || undefined,
      targetUrl: isMultiPage ? undefined : issue.affectedUrl,
      priority: template.priority,
      category: template.category,
      exactAction: template.exactAction,
      whyItMatters: template.whyItMatters,
      expectedImpact: template.expectedImpact,
      estimatedTimeMinutes: template.estimatedTimeMinutes,
      validationMethod: template.validationMethod,
      status: "new",
    });
  }

  return todos;
}
