import { Request, Response } from "express";
import { AuthRequest } from "../types";
import * as Shared from "../models/shared.model";
import * as Itinerary from "../models/itinerary.model";
import { generateShareToken } from "../utils/shareToken";


// POST /itineraries/:id/share
export const shareItinerary = async (req: AuthRequest, res: Response) => {
  const itineraryId = +req.params.id;

  const itinerary: any = await Itinerary.getItineraryById(itineraryId);

  if (!itinerary) return res.status(404).json({ message: "Not found" });

  if (itinerary.user_id !== req.user!.id)
    return res.status(403).json({ message: "Forbidden" });

  const token = generateShareToken();

  await Shared.createShareRecord({
    itinerary_id: itineraryId,
    user_id: req.user!.id,
    title: req.body.title || itinerary.destination,
    description: req.body.description || "Shared Itinerary",
    share_id: token
  });

  res.json({
    message: "Itinerary shared successfully",
    shareLink: `/shared/${token}`,
    shareId: token
  });
};


// GET /shared/:shareId   (NO AUTH REQUIRED)
export const getSharedItinerary = async (req: Request, res: Response) => {
  const { shareId } = req.params;

  const shared = await Shared.getSharedByToken(shareId);

  if (!shared) return res.status(404).json({ message: "Invalid share link" });

  const itinerary: any = await Itinerary.getItineraryById(shared.itinerary_id);

  res.json({
    readOnly: true,
    sharedBy: shared.user_id,
    title: shared.title,
    description: shared.description,
    itinerary
  });
};

// DELETE /shared/:shareId (UNSHARE)
export const deleteSharedItinerary = async (req: AuthRequest, res: Response) => {
  const { shareId } = req.params;

  // find share record
  const shared: any = await Shared.getSharedByToken(shareId);

  if (!shared)
    return res.status(404).json({ message: "Share link not found" });

  // verify ownership
  if (shared.user_id !== req.user!.id)
    return res.status(403).json({ message: "Not allowed" });

  await Shared.deleteSharedByToken(shareId);

  res.json({
    message: "Shared itinerary removed successfully"
  });
};