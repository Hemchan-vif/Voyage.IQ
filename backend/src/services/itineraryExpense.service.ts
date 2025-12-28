export const calculateItineraryExpenses = (plan: any) => {
  if (!plan.budget || !plan.itinerary) return plan;

  const totalBudget = plan.budget;
  let totalEstimatedCost = 0;

  const totalDays = plan.itinerary.length;
  const perDayBudget = totalBudget / totalDays;

  for (const day of plan.itinerary) {
    const activities = day.activities || [];

    if (activities.length === 0) continue;

    const totalDuration = activities.reduce(
      (sum: number, a: any) => sum + (a.durationMinutes || 60),
      0
    );

    let dayCost = 0;

    for (const activity of activities) {
      const duration = activity.durationMinutes || 60;

      const costShare = (duration / totalDuration) * perDayBudget;

      activity.activityCost = Math.round(costShare);

      dayCost += activity.activityCost;
    }

    day.dayEstimatedCost = dayCost;
    totalEstimatedCost += dayCost;
  }

  plan.totalEstimatedCost = totalEstimatedCost;
  plan.remainingBudget = Math.max(0, totalBudget - totalEstimatedCost);

  return plan;
};
