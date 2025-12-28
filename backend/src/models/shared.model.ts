import { db } from "../config/db";

export const createShareRecord = async (data: any) => {
  const sql = `
    INSERT INTO shared_itineraries 
    (itinerary_id, user_id, title, description, is_public, share_id) 
    VALUES (?, ?, ?, ?, 1, ?)
  `;

  await db.execute(sql, [
    data.itinerary_id,
    data.user_id,
    data.title,
    data.description,
    data.share_id
  ]);
};

export const getSharedByToken = async (shareId: string) => {
  const [rows]: any = await db.execute(
    `SELECT * FROM shared_itineraries WHERE share_id = ? AND is_public = 1`,
    [shareId]
  );
  return rows[0];
};
export const deleteSharedByToken = async (shareId: string) => {
  return db.execute(
    `DELETE FROM shared_itineraries WHERE share_id = ?`,
    [shareId]
  );
};
    