import { db } from "../config/db";
import { FALLBACK_ITINERARY } from "../data/fallback-itinerary";
import { enhanceItineraryWithDistance } from "./itineraryEnhancer.service";

export const getItineraryOptions = async (
  destination: string,
  budget: number
) => {
  const normalizedDestination = destination.trim();

  let budgetTier: "LOW" | "MEDIUM" | "HIGH" =
    budget < 8000 ? "LOW" : budget < 12000 ? "MEDIUM" : "HIGH";

  const [rows]: any = await db.execute(
    `SELECT * FROM system_itineraries 
     WHERE LOWER(destination) = LOWER(?) 
     AND budget_tier = ?`,
    [normalizedDestination, budgetTier]
  );

  if (!rows.length) {
    const fallbackPlan = {
  days: FALLBACK_ITINERARY.length,
  estimatedCost: budget,
  itinerary: FALLBACK_ITINERARY
  };

const enhancedFallback = await enhanceItineraryWithDistance(fallbackPlan);

return {
  source: "fallback",
  options: [enhancedFallback]
  };
  }

  const enhanced = await Promise.all(
  rows.map((p: any) => enhanceItineraryWithDistance(p))
);

return {
  source: "curated",
  options: enhanced
};

};
