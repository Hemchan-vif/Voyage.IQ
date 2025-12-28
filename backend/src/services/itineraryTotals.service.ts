export const calculateItineraryTotals = (plan: any) => {
  let totalTripTravelMinutes = 0;
  let totalTripActivityMinutes = 0;

  for (const day of plan.itinerary) {
    let dayTravel = 0;
    let dayActivity = 0;

    for (const a of day.activities) {
      dayTravel += a.estimatedTravelTimeMinutes || 0;
      dayActivity += a.durationMinutes || 0;
    }

    day.totalTravelMinutes = dayTravel;
    day.totalActivityMinutes = dayActivity;
    day.totalDayDurationMinutes = dayTravel + dayActivity;

    totalTripTravelMinutes += dayTravel;
    totalTripActivityMinutes += dayActivity;
  }

  plan.totalTripTravelMinutes = totalTripTravelMinutes;
  plan.totalTripActivityMinutes = totalTripActivityMinutes;
  plan.totalTripDurationMinutes = totalTripTravelMinutes + totalTripActivityMinutes;

  return plan;
};
