import { Router } from "express";
import { shareItinerary, getSharedItinerary } from "../controllers/share.controller";
import { authenticate } from "../middleware/auth.middleware";
import { deleteSharedItinerary } from "../controllers/share.controller";

const router = Router();

router.post("/itineraries/:id/share", authenticate, shareItinerary);
router.get("/shared/:shareId", getSharedItinerary); 
router.delete("/shared/:shareId", authenticate, deleteSharedItinerary);

export default router;
