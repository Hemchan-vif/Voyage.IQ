import tnData from "../data/tn-itineraries.json";
import { FALLBACK_ITINERARY } from "../data/fallback-itinerary";

export const getItineraryOptions = (
  destination: string,
  budget: number
) => {
  const normalizedDestination = destination.trim();
  const cityData = (tnData as any)[normalizedDestination];

  let budgetTier: "LOW" | "MEDIUM" | "HIGH" =
    budget < 8000 ? "LOW" : budget < 12000 ? "MEDIUM" : "HIGH";

  //city illa na
  if (!cityData) {
    return {
      source: "fallback",
      options: [
        {
          days: FALLBACK_ITINERARY.length,
          estimatedCost: budget,
          itinerary: FALLBACK_ITINERARY
        }
      ]
    };
  }

  const filtered = cityData.filter(
    (it: any) => it.budgetTier === budgetTier
  );

// budget 0 na handle pannanum la so iven pathupan
  if (filtered.length === 0) {
    return {
      source: "fallback",
      options: [
        {
          days: FALLBACK_ITINERARY.length,
          estimatedCost: budget,
          itinerary: FALLBACK_ITINERARY
        }
      ]
    };
  }

  return {
    source: "curated",
    options: filtered
  };
};
