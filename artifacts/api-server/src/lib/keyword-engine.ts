import { logger } from "./logger";

export interface KeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  searchIntent: string;
  isLocalIntent: boolean;
  recommendedPageType: string;
  opportunityScore: number;
}

function detectIntent(keyword: string): string {
  const lower = keyword.toLowerCase();
  if (/\b(buy|price|cost|quote|hire|near me|service|repair|install|emergency|24\/7)\b/.test(lower)) return "transactional";
  if (/\b(how to|what is|guide|tips|best|review|vs|compare)\b/.test(lower)) return "informational";
  if (/\b(near me|in [a-z]+|[a-z]+ [a-z]+|local)\b/.test(lower)) return "local";
  return "navigational";
}

function recommendPageType(keyword: string, intent: string): string {
  if (intent === "transactional" || intent === "local") return "Service/Landing Page";
  if (intent === "informational") return "Blog Post / Guide";
  return "Homepage or About Page";
}

function generateMockKeywords(
  seedKeyword: string,
  city: string | null,
  businessCategory: string | null,
): KeywordResult[] {
  const cityStr = city || "your city";
  const baseSeed = seedKeyword.toLowerCase();

  const templates = [
    { suffix: "", volumeBase: 1200, cpc: 4.5, competition: 0.65, difficulty: 45 },
    { suffix: ` ${cityStr}`, volumeBase: 880, cpc: 6.2, competition: 0.72, difficulty: 38 },
    { suffix: " near me", volumeBase: 1600, cpc: 7.1, competition: 0.81, difficulty: 42 },
    { suffix: " cost", volumeBase: 720, cpc: 2.8, competition: 0.45, difficulty: 32 },
    { suffix: " price", volumeBase: 590, cpc: 2.5, competition: 0.42, difficulty: 30 },
    { suffix: " best", volumeBase: 480, cpc: 3.1, competition: 0.55, difficulty: 35 },
    { suffix: " emergency", volumeBase: 320, cpc: 8.9, competition: 0.88, difficulty: 50 },
    { suffix: ` services ${cityStr}`, volumeBase: 390, cpc: 5.5, competition: 0.68, difficulty: 40 },
    { suffix: " company", volumeBase: 450, cpc: 4.2, competition: 0.62, difficulty: 37 },
    { suffix: " reviews", volumeBase: 280, cpc: 1.8, competition: 0.35, difficulty: 28 },
    { suffix: " how to", volumeBase: 1100, cpc: 0.9, competition: 0.22, difficulty: 20 },
    { suffix: ` tips`, volumeBase: 650, cpc: 0.7, competition: 0.18, difficulty: 18 },
    { suffix: ` ${cityStr} reviews`, volumeBase: 200, cpc: 1.5, competition: 0.40, difficulty: 25 },
    { suffix: " affordable", volumeBase: 310, cpc: 3.8, competition: 0.58, difficulty: 33 },
    { suffix: " licensed", volumeBase: 240, cpc: 5.2, competition: 0.70, difficulty: 41 },
  ];

  return templates.map((t) => {
    const keyword = `${baseSeed}${t.suffix}`;
    const intent = detectIntent(keyword);
    const isLocalIntent = keyword.includes(cityStr.toLowerCase()) || keyword.includes("near me");
    const opportunityScore = Math.round(
      (t.volumeBase / 1600) * 30 +
        (1 - t.competition) * 30 +
        (t.cpc / 9) * 25 +
        (isLocalIntent ? 15 : 0),
    );

    return {
      keyword,
      volume: t.volumeBase + Math.round((Math.random() - 0.5) * t.volumeBase * 0.2),
      cpc: Math.round(t.cpc * 100) / 100,
      competition: Math.round(t.competition * 100),
      difficulty: t.difficulty + Math.round((Math.random() - 0.5) * 10),
      searchIntent: intent,
      isLocalIntent,
      recommendedPageType: recommendPageType(keyword, intent),
      opportunityScore: Math.min(100, Math.max(0, opportunityScore)),
    };
  });
}

export async function runKeywordResearch(
  seedKeyword: string,
  city: string | null,
  businessCategory: string | null,
  _language: string,
  _country: string,
): Promise<KeywordResult[]> {
  const dataForSeoLogin = process.env.DATAFORSEO_LOGIN;
  const dataForSeoPassword = process.env.DATAFORSEO_PASSWORD;

  if (dataForSeoLogin && dataForSeoPassword) {
    try {
      logger.info({ seedKeyword }, "Using DataForSEO for keyword research");
      // DataForSEO adapter placeholder
      // const client = new DataForSEOClient(dataForSeoLogin, dataForSeoPassword);
      // return await client.getKeywordSuggestions(seedKeyword, city, _language, _country);
    } catch (err) {
      logger.warn({ err }, "DataForSEO failed, falling back to mock");
    }
  }

  logger.info({ seedKeyword }, "Using mock keyword data");
  await new Promise((r) => setTimeout(r, 500));
  return generateMockKeywords(seedKeyword, city, businessCategory);
}
