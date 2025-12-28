import { Response } from 'express';
import { AuthRequest } from '../types';
import * as Itinerary from '../models/itinerary.model';
import { getItineraryOptions } from "../services/itineraryGenerator.service";
import {db} from '../config/db'; 
import { enhanceItineraryWithDistance } from '../services/itineraryEnhancer.service';
import { calculateItineraryTotals } from '../services/itineraryTotals.service';
import { calculateItineraryExpenses } from "../services/itineraryExpense.service";


// create itinerary
export const create = async (req: AuthRequest, res: Response) => {
  try {
    const { destination, start_date, end_date, budget } = req.body;

    if (!destination || budget <= 0 || start_date > end_date) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    await Itinerary.createItinerary({
      ...req.body,
      activities: JSON.stringify(req.body.activities), 
      user_id: req.user!.id
    });

    res.status(201).json({ message: 'Itinerary created' });
  } catch (err) {
    console.error(err); 
    res.status(500).json({ message: 'Creation failed' });
  }
};


// get all itineraries
export const getAll = async (req: AuthRequest, res: Response) => {
  const data: any = await Itinerary.getItinerariesByUser(req.user!.id);

const now = new Date();

const result = data.map((it: any) => ({
  ...it,
  status: now > new Date(it.end_date) ? "COMPLETED" : "ACTIVE"
}));

res.json(result);

};


// get itinerary by id
export const getById = async (req: AuthRequest, res: Response) => {
  const itinerary = await Itinerary.getItineraryById(+req.params.id);

  if (!itinerary) {
    return res.status(404).json({ message: 'Not found' });
  }

  if (
    itinerary.user_id !== req.user!.id &&
    req.user!.role !== 'ADMIN'
  ) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const now = new Date();
const status = now > new Date(itinerary.end_date) ? "COMPLETED" : "ACTIVE";

res.json({
  ...itinerary,
  status
});
};


// update itinerary
export const update = async (req: AuthRequest, res: Response) => {
  try {
    const itinerary = await Itinerary.getItineraryById(+req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Not found" });
    }

    if (itinerary.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }


    const updatedActivities = req.body.activities
      ? req.body.activities
      : JSON.parse(itinerary.activities);  // because stored as JSON string

    let enhancedPlan = {
      ...itinerary,
      ...req.body,
      itinerary: updatedActivities
    };


    enhancedPlan = await enhanceItineraryWithDistance(enhancedPlan);


    enhancedPlan = calculateItineraryTotals(enhancedPlan);

    enhancedPlan = calculateItineraryExpenses(enhancedPlan);
    const finalData = {
      destination: req.body.destination ?? itinerary.destination,
      start_date: req.body.start_date ?? itinerary.start_date,
      end_date: req.body.end_date ?? itinerary.end_date,
      budget: req.body.budget ?? itinerary.budget,
      preferences: req.body.preferences ?? itinerary.preferences,
      activities: JSON.stringify(enhancedPlan.itinerary),   // STORE PROCESSED VERSION
      notes: req.body.notes ?? itinerary.notes,
      media_paths: req.body.media_paths ?? itinerary.media_paths
    };

    await Itinerary.updateItinerary(+req.params.id, finalData);

    res.json({
      message: "Updated successfully",
      data: enhancedPlan
    });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Update failed" });
  }
};


// delete itinerary
export const remove = async (req: AuthRequest, res: Response) => {
  const itinerary = await Itinerary.getItineraryById(+req.params.id);

  if (!itinerary) {
    return res.status(404).json({ message: 'Not found' });
  }

  if (itinerary.user_id !== req.user!.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await Itinerary.deleteItinerary(+req.params.id);
  res.json({ message: 'Deleted' });
};
 

// auto generate itinerary
export const getItineraryOptionsController = async (
  req: AuthRequest,
  res: Response
) => {
  const { destination, budget } = req.query;

  if (!destination || !budget) {
    return res.status(400).json({ message: "Destination and budget required" });
  }

  const result = await getItineraryOptions(
    destination as string,
    Number(budget)
  );

  res.json(result);
};


// search & filter itineraries
export const searchItineraries = async (
  req: AuthRequest,
  res: Response
) => {
  const { destination, minBudget, maxBudget, startDate, endDate } = req.query;

  let query = "SELECT * FROM itineraries WHERE 1=1";
  const params: any[] = [];

  if (destination) {
    query += " AND destination = ?";
    params.push(destination);
  }

  if (minBudget && maxBudget) {
    query += " AND budget BETWEEN ? AND ?";
    params.push(minBudget, maxBudget);
  }

  if (startDate && endDate) {
    query += " AND start_date >= ? AND end_date <= ?";
    params.push(startDate, endDate);
  }

  const [rows] = await db.execute(query, params);
  res.json(rows);
};
