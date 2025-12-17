import {db} from '../config/db'; 


// Create itinerary

export const createItinerary = async (data: any) => {
  const sql = `
    INSERT INTO itineraries 
    (user_id, destination, start_date, end_date, budget, preferences, activities, notes, media_paths)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  return db.execute(sql, [
    data.user_id,
    data.destination,
    data.start_date,
    data.end_date,
    data.budget,
    data.preferences || null,
    data.activities || null,
    data.notes || null,
    data.media_paths || null
  ]);
};


// Get itineraries by user

export const getItinerariesByUser = async (userId: number) => {
  const sql = `SELECT * FROM itineraries WHERE user_id = ?`;
  const [rows] = await db.execute(sql, [userId]);
  return rows;
};


// Get itinerary by ID

export const getItineraryById = async (id: number) => {
  const [rows]: any = await db.execute(
    `SELECT * FROM itineraries WHERE id = ?`,
    [id]
  );
  return rows[0];
};


// Update itinerary

export const updateItinerary = async (id: number, data: any) => {
  const sql = `
    UPDATE itineraries
    SET destination=?, start_date=?, end_date=?, budget=?, preferences=?, activities=?, notes=?, media_paths=?
    WHERE id=?
  `;

  return db.execute(sql, [
    data.destination,
    data.start_date,
    data.end_date,
    data.budget,
    data.preferences || null,
    data.activities || null,
    data.notes || null,
    data.media_paths || null,
    id
  ]);
};


// Delete itinerary

export const deleteItinerary = async (id: number) => {
  return db.execute(`DELETE FROM itineraries WHERE id = ?`, [id]);
};


// Types 

export interface Itinerary {
  id?: number;
  user_id: number;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  preferences?: string;
  activities?: any;      
  notes?: string;
  media_paths?: string;  
}
