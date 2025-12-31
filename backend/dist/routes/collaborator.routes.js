"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const collaborator_controller_1 = require("../controllers/collaborator.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
// Get itineraries shared with current user
router.get('/shared-with-me', (req, res) => collaborator_controller_1.collaboratorController.getSharedWithMe(req, res));
// Get collaborators for an itinerary
router.get('/:itineraryId', (req, res) => collaborator_controller_1.collaboratorController.getCollaborators(req, res));
// Invite a collaborator
router.post('/:itineraryId/invite', (req, res) => collaborator_controller_1.collaboratorController.inviteCollaborator(req, res));
// Update collaborator permission
router.put('/:itineraryId/:collaboratorId', (req, res) => collaborator_controller_1.collaboratorController.updatePermission(req, res));
// Remove a collaborator
router.delete('/:itineraryId/:collaboratorId', (req, res) => collaborator_controller_1.collaboratorController.removeCollaborator(req, res));
exports.default = router;
