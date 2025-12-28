import { db } from "../config/db";

export const getLocationByName = async (name: string) => {
  const [rows]: any = await db.execute(
    "SELECT lat, lon FROM locations WHERE name = ? LIMIT 1",
    [name]
  );

  return rows[0] || null;
};
