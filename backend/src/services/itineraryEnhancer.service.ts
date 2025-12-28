import { haversineDistance } from "../utils/distance";
import { getLocationByName } from "../models/location.model";

export const enhanceItineraryWithDistance = async (plan: any) => {

  for (const dayPlan of plan.itinerary) {
    let prevLocation: any = null;

    for (const activity of dayPlan.activities) {


      if (!prevLocation) {
        activity.distanceFromPreviousKm = 0;
        activity.estimatedTravelTimeMinutes = 0;
        if (activity.travelTimeMinutes !== undefined) {
            delete activity.travelTimeMinutes;
            }
        const firstLocation = await getLocationByName(activity.name);

        // if DB doesn't have it -> anchor fallback point
        prevLocation = firstLocation || { lat: 10.0, lon: 77.0 };
        continue;
      }


      const currentLocation = await getLocationByName(activity.name);

      // If missing -> fallback distance/time but DO NOT leave 0
      if (!currentLocation) {
        activity.distanceFromPreviousKm = 3;
        activity.estimatedTravelTimeMinutes = 12;
            if (activity.travelTimeMinutes !== undefined) {
                delete activity.travelTimeMinutes;
            }
        
        prevLocation = { lat: 10.0, lon: 77.0 };
        continue;
      }


      const distance = haversineDistance(
        prevLocation.lat,
        prevLocation.lon,
        currentLocation.lat,
        currentLocation.lon
      );

      const estimatedTime = Math.round((distance / 30) * 60); // avg 30 km/h

      activity.distanceFromPreviousKm = Number(distance.toFixed(2));
      activity.estimatedTravelTimeMinutes = estimatedTime;

      if (activity.travelTimeMinutes !== undefined) {
        delete activity.travelTimeMinutes;
    }
      prevLocation = currentLocation;
    }
  }

  return plan;
};
