"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const itinerary_controller_1 = require("../controllers/itinerary.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const itineraryController = new itinerary_controller_1.ItineraryController();
// User routes
router.post('/', auth_middleware_1.authenticateToken, validation_middleware_1.itineraryValidation, (req, res) => itineraryController.createItinerary(req, res));
router.get('/', auth_middleware_1.authenticateToken, (req, res) => itineraryController.getAllItineraries(req, res));
router.get('/:id', auth_middleware_1.authenticateToken, validation_middleware_1.idValidation, (req, res) => itineraryController.getItineraryById(req, res));
router.put('/:id', auth_middleware_1.authenticateToken, validation_middleware_1.idValidation, validation_middleware_1.itineraryValidation, (req, res) => itineraryController.updateItinerary(req, res));
router.delete('/:id', auth_middleware_1.authenticateToken, validation_middleware_1.idValidation, (req, res) => itineraryController.deleteItinerary(req, res));
// Regenerate activities for an itinerary
router.post('/:id/regenerate', auth_middleware_1.authenticateToken, validation_middleware_1.idValidation, (req, res) => itineraryController.regenerateActivities(req, res));
// Admin routes
router.get('/admin/all', auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRoles)('Admin'), (req, res) => itineraryController.getAllItinerariesAdmin(req, res));
router.get('/admin/analytics', auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRoles)('Admin'), (req, res) => itineraryController.getAnalytics(req, res));
exports.default = router;
