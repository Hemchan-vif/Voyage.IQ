"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collaboratorController = exports.CollaboratorController = void 0;
const database_1 = __importDefault(require("../config/database"));
class CollaboratorController {
    /**
     * GET /api/collaborators/:itineraryId
     * Get all collaborators for an itinerary
     */
    async getCollaborators(req, res) {
        try {
            const { itineraryId } = req.params;
            const userId = req.user?.id;
            // Check if user has access to this itinerary
            const hasAccess = await this.checkItineraryAccess(userId, parseInt(itineraryId));
            if (!hasAccess) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            const [collaborators] = await database_1.default.query(`SELECT 
          ic.id,
          ic.itinerary_id,
          ic.user_id,
          ic.permission,
          ic.invited_by,
          ic.invited_at,
          u.email,
          u.first_name,
          u.last_name,
          inv.email as invited_by_email,
          inv.first_name as invited_by_first_name
        FROM itinerary_collaborators ic
        JOIN users u ON ic.user_id = u.id
        JOIN users inv ON ic.invited_by = inv.id
        WHERE ic.itinerary_id = ?`, [itineraryId]);
            res.json({ collaborators });
        }
        catch (error) {
            console.error('Get collaborators error:', error);
            res.status(500).json({ error: 'Failed to fetch collaborators' });
        }
    }
    /**
     * POST /api/collaborators/:itineraryId/invite
     * Invite a user to collaborate on an itinerary
     */
    async inviteCollaborator(req, res) {
        try {
            const { itineraryId } = req.params;
            const { email, permission = 'edit' } = req.body;
            const inviterId = req.user?.id;
            // Check if user is owner of the itinerary
            const isOwner = await this.checkItineraryOwner(inviterId, parseInt(itineraryId));
            if (!isOwner) {
                res.status(403).json({ error: 'Only the owner can invite collaborators' });
                return;
            }
            // Find user by email
            const [users] = await database_1.default.query('SELECT id, email, first_name, last_name FROM users WHERE email = ?', [email]);
            const user = users[0];
            if (!user) {
                res.status(404).json({ error: 'User not found. They must be registered to collaborate.' });
                return;
            }
            // Can't invite yourself
            if (user.id === inviterId) {
                res.status(400).json({ error: 'You cannot invite yourself' });
                return;
            }
            // Check if already a collaborator
            const [existing] = await database_1.default.query('SELECT id FROM itinerary_collaborators WHERE itinerary_id = ? AND user_id = ?', [itineraryId, user.id]);
            if (existing.length > 0) {
                res.status(400).json({ error: 'User is already a collaborator' });
                return;
            }
            // Add collaborator
            await database_1.default.query('INSERT INTO itinerary_collaborators (itinerary_id, user_id, permission, invited_by) VALUES (?, ?, ?, ?)', [itineraryId, user.id, permission, inviterId]);
            res.status(201).json({
                message: 'Collaborator invited successfully',
                collaborator: {
                    user_id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    permission
                }
            });
        }
        catch (error) {
            console.error('Invite collaborator error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'User is already a collaborator' });
            }
            else {
                res.status(500).json({ error: 'Failed to invite collaborator' });
            }
        }
    }
    /**
     * PUT /api/collaborators/:itineraryId/:collaboratorId
     * Update collaborator permission
     */
    async updatePermission(req, res) {
        try {
            const { itineraryId, collaboratorId } = req.params;
            const { permission } = req.body;
            const userId = req.user?.id;
            // Check if user is owner
            const isOwner = await this.checkItineraryOwner(userId, parseInt(itineraryId));
            if (!isOwner) {
                res.status(403).json({ error: 'Only the owner can update permissions' });
                return;
            }
            await database_1.default.query('UPDATE itinerary_collaborators SET permission = ? WHERE id = ? AND itinerary_id = ?', [permission, collaboratorId, itineraryId]);
            res.json({ message: 'Permission updated successfully' });
        }
        catch (error) {
            console.error('Update permission error:', error);
            res.status(500).json({ error: 'Failed to update permission' });
        }
    }
    /**
     * DELETE /api/collaborators/:itineraryId/:collaboratorId
     * Remove a collaborator
     */
    async removeCollaborator(req, res) {
        try {
            const { itineraryId, collaboratorId } = req.params;
            const userId = req.user?.id;
            // Check if user is owner OR if user is removing themselves
            const isOwner = await this.checkItineraryOwner(userId, parseInt(itineraryId));
            // Get collaborator to check if it's the user themselves
            const [collabs] = await database_1.default.query('SELECT user_id FROM itinerary_collaborators WHERE id = ?', [collaboratorId]);
            const collab = collabs[0];
            const isSelf = collab && collab.user_id === userId;
            if (!isOwner && !isSelf) {
                res.status(403).json({ error: 'You can only remove yourself or be the owner to remove others' });
                return;
            }
            await database_1.default.query('DELETE FROM itinerary_collaborators WHERE id = ? AND itinerary_id = ?', [collaboratorId, itineraryId]);
            res.json({ message: 'Collaborator removed successfully' });
        }
        catch (error) {
            console.error('Remove collaborator error:', error);
            res.status(500).json({ error: 'Failed to remove collaborator' });
        }
    }
    /**
     * GET /api/collaborators/shared-with-me
     * Get all itineraries shared with the current user
     */
    async getSharedWithMe(req, res) {
        try {
            const userId = req.user?.id;
            const [itineraries] = await database_1.default.query(`SELECT 
          i.*,
          ic.permission,
          u.email as owner_email,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name
        FROM itinerary_collaborators ic
        JOIN itineraries i ON ic.itinerary_id = i.id
        JOIN users u ON i.user_id = u.id
        WHERE ic.user_id = ?
        ORDER BY ic.invited_at DESC`, [userId]);
            res.json({ itineraries });
        }
        catch (error) {
            console.error('Get shared itineraries error:', error);
            res.status(500).json({ error: 'Failed to fetch shared itineraries' });
        }
    }
    // Helper methods
    async checkItineraryAccess(userId, itineraryId) {
        // Check owner
        const [owner] = await database_1.default.query('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [itineraryId, userId]);
        if (owner.length > 0)
            return true;
        // Check collaborator
        const [collab] = await database_1.default.query('SELECT id FROM itinerary_collaborators WHERE itinerary_id = ? AND user_id = ?', [itineraryId, userId]);
        return collab.length > 0;
    }
    async checkItineraryOwner(userId, itineraryId) {
        const [result] = await database_1.default.query('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [itineraryId, userId]);
        return result.length > 0;
    }
}
exports.CollaboratorController = CollaboratorController;
exports.collaboratorController = new CollaboratorController();
