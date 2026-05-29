import { logger } from "./logger";

export interface LeadResult {
  businessName: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  googleMapsUrl: string | null;
  email: string | null;
  leadScore: number;
}

const BUSINESS_NAMES: Record<string, string[]> = {
  plumber: ["Pro Flow Plumbing", "City Pipe Solutions", "QuickFix Plumbers", "Reliable Drain Co.", "Superior Plumbing Services", "First Choice Plumbing", "Express Plumbing Inc.", "AquaTech Solutions", "Precision Pipe Works", "Master Plumbing Group"],
  electrician: ["Bright Power Electric", "Circuit Masters", "Volt Pro Services", "Premium Electric Co.", "Safety First Electrical", "Quick Spark Electric", "Elite Electrical Services", "Power Plus Inc.", "Pro Wiring Solutions", "Ace Electric Group"],
  dentist: ["Smile First Dental", "Gentle Care Dentistry", "Family Dental Centre", "Bright Smile Clinic", "Downtown Dental Arts", "Premier Dental Studio", "Comfortable Dental Care", "Total Dental Health", "White Pearl Dentistry", "Advanced Smile Centre"],
  restaurant: ["The Local Table", "Urban Bites Cafe", "Fresh Kitchen Co.", "The Corner Bistro", "Sunrise Eatery", "Good Eats Restaurant", "The Food Studio", "Heritage Kitchen", "Modern Bites", "The Daily Plate"],
  default: ["Local Business Pro", "City Services Inc.", "Premier Solutions Co.", "Quality First Services", "Expert Team LLC", "Professional Services", "Top Rated Business", "Trusted Local Co.", "Elite Service Group", "Prime Business Solutions"],
};

function getMockBusinessNames(category: string, count: number): string[] {
  const key = category.toLowerCase().replace(/[^a-z]/g, "");
  let names = BUSINESS_NAMES[key] || BUSINESS_NAMES["default"]!;
  if (names.length < count) {
    names = [...names, ...Array.from({ length: count - names.length }, (_, i) => `${category} Pro ${i + 1}`)];
  }
  return names.slice(0, count);
}

function scoreLead(lead: Partial<LeadResult>): number {
  let score = 0;
  if (!lead.website) score += 25;
  else score += 5;
  if (lead.reviewCount && lead.reviewCount < 20) score += 15;
  if (lead.rating && lead.rating < 4.0) score += 15;
  if (!lead.phone) score += 10;
  return Math.min(100, Math.max(10, 100 - score + Math.round(Math.random() * 20 - 10)));
}

export async function runLeadSearch(
  businessCategory: string,
  city: string,
  _country: string,
  limit: number,
): Promise<LeadResult[]> {
  const outscraperKey = process.env.OUTSCRAPER_API_KEY;
  const dataForSeoLogin = process.env.DATAFORSEO_LOGIN;

  if (outscraperKey) {
    try {
      logger.info({ businessCategory, city }, "Using Outscraper for lead search");
      // Outscraper adapter placeholder
    } catch (err) {
      logger.warn({ err }, "Outscraper failed, falling back to mock");
    }
  }

  if (dataForSeoLogin) {
    try {
      logger.info({ businessCategory, city }, "Using DataForSEO for lead search");
      // DataForSEO Business Data adapter placeholder
    } catch (err) {
      logger.warn({ err }, "DataForSEO failed, falling back to mock");
    }
  }

  logger.info({ businessCategory, city }, "Using mock lead data");
  await new Promise((r) => setTimeout(r, 600));

  const names = getMockBusinessNames(businessCategory, limit);
  const tlds = ["", ".com", ".ca", ".net"];
  const streets = ["123 Main St", "456 Oak Ave", "789 Elm Blvd", "321 Park Rd", "654 Queen St", "987 King Ave", "111 First St", "222 Second Ave", "333 Third Blvd", "444 Fourth Rd"];

  return names.map((name, i) => {
    const hasWebsite = Math.random() > 0.3;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const tld = tlds[i % tlds.length] || ".com";
    const reviewCount = Math.floor(Math.random() * 150);
    const rating = reviewCount > 0 ? Math.round((3.0 + Math.random() * 2.0) * 10) / 10 : null;
    const partial: Partial<LeadResult> = {
      website: hasWebsite ? `https://www.${slug}${tld}` : null,
      reviewCount,
      rating,
      phone: Math.random() > 0.2 ? `(514) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : null,
    };
    partial.leadScore = scoreLead(partial);

    return {
      businessName: name,
      website: partial.website || null,
      phone: partial.phone || null,
      address: `${streets[i % streets.length]}, ${city}`,
      city,
      category: businessCategory,
      rating: partial.rating || null,
      reviewCount: partial.reviewCount || null,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(name + " " + city)}`,
      email: null,
      leadScore: partial.leadScore!,
    } as LeadResult;
  });
}
