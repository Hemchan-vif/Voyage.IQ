import { Router } from 'express';
import * as controller from '../controllers/itinerary.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();


router.use(authenticate);

// this goes first - special
router.get('/options', controller.getItineraryOptionsController);
router.get('/search', controller.searchItineraries);
 

// it is just a ordinary one so stay down 
router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
