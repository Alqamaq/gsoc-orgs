import { loadHomepageData } from "@/lib/homepage-types";
import { TrendingOrgsClient } from "./trending-orgs-client";

/**
 * TrendingOrgs Server Component
 * 
 * Reads from STATIC JSON file - NO API CALLS, NO DATABASE.
 * Data is pre-computed by scripts/generate-homepage-data.js
 */
export async function TrendingOrgs() {
  const data = await loadHomepageData();

  if (!data) {
    return null;
  }

  return <TrendingOrgsClient organizations={data.featured_organizations} />;
}