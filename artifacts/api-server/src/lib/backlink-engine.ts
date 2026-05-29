import { logger } from "./logger";

export interface BacklinkOpportunityResult {
  targetDomain: string;
  targetUrl: string | null;
  opportunityType: string;
  relevanceScore: number;
  authorityScore: number;
  difficultyScore: number;
  contactEmail: string | null;
  contactPage: string | null;
  suggestedPitch: string;
  status: string;
  notes: string | null;
}

type OpportunityType = {
  type: string;
  domains: string[];
  difficulty: number;
  authority: number;
  relevanceBase: number;
};

function generateMockOpportunities(
  domain: string,
  city: string | null,
  niche: string | null,
): BacklinkOpportunityResult[] {
  const cityStr = city || "your city";
  const nicheStr = niche || "local business";
  const citySlug = cityStr.toLowerCase().replace(/\s+/g, "");
  const brandName = domain.replace(/^www\./, "").replace(/\.[a-z]+$/, "");

  const opportunityTypes: OpportunityType[] = [
    {
      type: "local_citation",
      domains: [`${citySlug}businessdirectory.com`, `localguide${citySlug}.ca`, `yellowpages.ca`],
      difficulty: 20,
      authority: 45,
      relevanceBase: 80,
    },
    {
      type: "business_directory",
      domains: ["yelp.ca", "bbb.org", "houzz.com", "homestars.com", "pagesjaunes.ca"],
      difficulty: 25,
      authority: 70,
      relevanceBase: 85,
    },
    {
      type: "chamber_of_commerce",
      domains: [`${citySlug}chamber.ca`, `${citySlug}businessassociation.org`, "ccq.ca"],
      difficulty: 40,
      authority: 55,
      relevanceBase: 90,
    },
    {
      type: "niche_directory",
      domains: [`${nicheStr.replace(/\s/g, "")}directory.com`, `best${nicheStr.replace(/\s/g, "")}s.ca`],
      difficulty: 35,
      authority: 42,
      relevanceBase: 92,
    },
    {
      type: "competitor_backlink_replication",
      domains: ["competitor1-backlinks.example.com", "competitor2source.com"],
      difficulty: 55,
      authority: 48,
      relevanceBase: 75,
    },
    {
      type: "resource_page_outreach",
      domains: [`${citySlug}resources.ca`, `local${nicheStr.replace(/\s/g, "")}guides.com`],
      difficulty: 50,
      authority: 38,
      relevanceBase: 70,
    },
    {
      type: "local_sponsorship",
      domains: [`${citySlug}community.ca`, `${citySlug}events.org`, `${citySlug}sports.ca`],
      difficulty: 45,
      authority: 35,
      relevanceBase: 65,
    },
    {
      type: "guest_post",
      domains: [`${nicheStr.replace(/\s/g, "")}blog.com`, `${citySlug}lifestyle.ca`],
      difficulty: 65,
      authority: 40,
      relevanceBase: 72,
    },
    {
      type: "unlinked_brand_mention",
      domains: [`${citySlug}news.ca`, "localdirectory.ca"],
      difficulty: 30,
      authority: 50,
      relevanceBase: 88,
    },
    {
      type: "broken_link_building",
      domains: [`${nicheStr.replace(/\s/g, "")}resources.com`, `${citySlug}guides.org`],
      difficulty: 60,
      authority: 44,
      relevanceBase: 68,
    },
  ];

  const pitches: Record<string, string> = {
    local_citation: `Submit ${domain} to this directory. Include business name, address, phone, website, hours, and category. Use consistent NAP data across all citations.`,
    business_directory: `Create a complete profile on this platform. Add photos, services, respond to reviews. This is a high-authority link that also drives direct referral traffic.`,
    chamber_of_commerce: `Join the ${cityStr} Chamber of Commerce and get listed in their member directory. Benefits include a dofollow link, community networking, and trust signals for Google.`,
    niche_directory: `Submit ${domain} to this niche-specific directory. Provides a relevant, themed backlink that strengthens topical authority for ${nicheStr} keywords.`,
    competitor_backlink_replication: `This domain links to your top competitor. Reach out with a value-add angle — better content, local focus, or unique offer — to earn a similar link.`,
    resource_page_outreach: `Email the resource page owner: 'Hi [Name], I noticed your [City] resources page and thought [Business Name] would be a helpful addition for locals looking for ${nicheStr} help. We've helped 200+ clients in ${cityStr}. Happy to share any content that would be useful to your visitors.'`,
    local_sponsorship: `Sponsor a local event or sports team to earn a link from this community site. Typically $200-500 investment for a permanent dofollow link with high local relevance.`,
    guest_post: `Pitch a guest post: '5 Signs You Need a ${nicheStr} Professional in ${cityStr}' or '${cityStr} Homeowner Guide to ${nicheStr}'. Provide unique value in exchange for an author link.`,
    unlinked_brand_mention: `${brandName} is mentioned on this site without a link. Email: 'Hi, I noticed you mentioned us in your article — would you be able to add a link to [url]? It helps readers find us directly.'`,
    broken_link_building: `This page has broken links to ${nicheStr}-related resources. Offer your own content as a replacement and request the link be updated to point to ${domain}.`,
  };

  const results: BacklinkOpportunityResult[] = [];

  for (const oppType of opportunityTypes) {
    for (const targetDomain of oppType.domains) {
      const relevanceVariance = Math.round((Math.random() - 0.5) * 20);
      results.push({
        targetDomain,
        targetUrl: `https://${targetDomain}/`,
        opportunityType: oppType.type,
        relevanceScore: Math.min(100, Math.max(30, oppType.relevanceBase + relevanceVariance)),
        authorityScore: Math.min(100, Math.max(10, oppType.authority + Math.round((Math.random() - 0.5) * 20))),
        difficultyScore: Math.min(100, Math.max(10, oppType.difficulty + Math.round((Math.random() - 0.5) * 15))),
        contactEmail: Math.random() > 0.6 ? `info@${targetDomain}` : null,
        contactPage: `https://${targetDomain}/contact`,
        suggestedPitch: pitches[oppType.type] || "Reach out with a personalized value proposition.",
        status: "new",
        notes: null,
      });
    }
  }

  return results;
}

export async function runBacklinkDiscovery(
  domain: string,
  city: string | null,
  niche: string | null,
): Promise<BacklinkOpportunityResult[]> {
  const dataForSeoLogin = process.env.DATAFORSEO_LOGIN;

  if (dataForSeoLogin) {
    try {
      logger.info({ domain }, "Using DataForSEO for backlink discovery");
      // DataForSEO Backlinks API adapter placeholder
    } catch (err) {
      logger.warn({ err }, "DataForSEO failed, falling back to mock");
    }
  }

  logger.info({ domain }, "Using mock backlink data");
  await new Promise((r) => setTimeout(r, 700));
  return generateMockOpportunities(domain, city, niche);
}
