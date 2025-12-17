import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import * as Itinerary from '../models/itinerary.model';
import { getItineraryOptions } from "../services/itineraryGenerator.service";
import {db} from '../config/db'; 


// auto generate itinerary
export const getItineraryOptionsController = (
  req: Request,
  res: Response
) => {
  const { destination, budget } = req.query;

  if (!destination || !budget) {
    return res.status(400).json({ message: "Destination and budget required" });
  }

  const result = getItineraryOptions(
    destination as string,
    Number(budget)
  );

  res.json(result);
};


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
    console.error(err); // helpful for debugging
    res.status(500).json({ message: 'Creation failed' });
  }
};


// get all itineraries
export const getAll = async (req: AuthRequest, res: Response) => {
  const data = await Itinerary.getItinerariesByUser(req.user!.id);
  res.json(data);
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

  res.json(itinerary);
};


// update itinerary
export const update = async (req: AuthRequest, res: Response) => {
  const itinerary = await Itinerary.getItineraryById(+req.params.id);

  if (!itinerary) {
    return res.status(404).json({ message: 'Not found' });
  }

  if (itinerary.user_id !== req.user!.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const finalData = {
    destination: req.body.destination ?? itinerary.destination,
    start_date: req.body.start_date ?? itinerary.start_date,
    end_date: req.body.end_date ?? itinerary.end_date,
    budget: req.body.budget ?? itinerary.budget,
    preferences: req.body.preferences ?? itinerary.preferences,
    activities: req.body.activities
      ? JSON.stringify(req.body.activities)
      : itinerary.activities,
    notes: req.body.notes ?? itinerary.notes,
    media_paths: req.body.media_paths ?? itinerary.media_paths
};
  await Itinerary.updateItinerary(+req.params.id, finalData);
  res.json({ message: 'Updated' });
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
