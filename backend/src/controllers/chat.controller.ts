import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { socketService } from '../services/socket.service';

interface ChatMessage {
  id: number;
  itinerary_id: number;
  user_id: number;
  message: string;
  created_at: Date;
  user_name?: string;
}

export class CollaborationChatController {
  // =============================================
  // Get chat messages for an itinerary
  // =============================================
  async getChatMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { itineraryId } = req.params;
      const userId = req.user?.id;
      const { limit = 50, before } = req.query;

      // Verify user has access to this itinerary
      const hasAccess = await this.checkAccess(userId!, parseInt(itineraryId));
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this itinerary' });
        return;
      }

      let query = `
        SELECT cc.*, u.name as user_name, u.email as user_email
        FROM collaboration_chats cc
        JOIN users u ON cc.user_id = u.id
        WHERE cc.itinerary_id = ?
        ${before ? 'AND cc.id < ?' : ''}
        ORDER BY cc.created_at DESC
        LIMIT ?
      `;

      const params = before 
        ? [itineraryId, before, Number(limit)]
        : [itineraryId, Number(limit)];

      const [messages] = await pool.query(query, params);

      // Reverse to get chronological order
      (messages as any[]).reverse();

      // Get participant info
      const [participants] = await pool.query(`
        SELECT DISTINCT u.id, u.name, u.email
        FROM (
          SELECT user_id FROM itineraries WHERE id = ?
          UNION
          SELECT user_id FROM itinerary_collaborators WHERE itinerary_id = ? AND status = 'accepted'
        ) p
        JOIN users u ON p.user_id = u.id
      `, [itineraryId, itineraryId]);

      res.json({
        messages,
        participants,
        hasMore: (messages as any[]).length === Number(limit)
      });
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
  }

  // =============================================
  // Send chat message
  // =============================================
  async sendChatMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { itineraryId } = req.params;
      const userId = req.user?.id;
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        res.status(400).json({ error: 'Message cannot be empty' });
        return;
      }

      // Verify user has access
      const hasAccess = await this.checkAccess(userId!, parseInt(itineraryId));
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this itinerary' });
        return;
      }

      // Get user info
      const [users] = await pool.query(
        `SELECT name, email FROM users WHERE id = ?`,
        [userId]
      );
      const user = (users as any[])[0];

      // Insert message
      const [result] = await pool.query(
        `INSERT INTO collaboration_chats (itinerary_id, user_id, message)
         VALUES (?, ?, ?)`,
        [itineraryId, userId, message.trim()]
      );

      const chatMessage = {
        id: (result as any).insertId,
        itinerary_id: parseInt(itineraryId),
        user_id: userId,
        message: message.trim(),
        created_at: new Date(),
        user_name: user.name,
        user_email: user.email
      };

      // Broadcast to all collaborators via Socket.io
      socketService.broadcastToItinerary(parseInt(itineraryId), 'chat_message', chatMessage);

      // Send notification to other collaborators
      const [collaborators] = await pool.query(`
        SELECT user_id FROM itinerary_collaborators 
        WHERE itinerary_id = ? AND status = 'accepted' AND user_id != ?
        UNION
        SELECT user_id FROM itineraries WHERE id = ? AND user_id != ?
      `, [itineraryId, userId, itineraryId, userId]);

      // Get itinerary info
      const [itineraries] = await pool.query(
        `SELECT destination FROM itineraries WHERE id = ?`,
        [itineraryId]
      );
      const itinerary = (itineraries as any[])[0];

      for (const collab of collaborators as any[]) {
        // Create notification
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, content, link)
           VALUES (?, 'collaboration', ?, ?, ?)`,
          [
            collab.user_id,
            `New message in ${itinerary.destination}`,
            `${user.name}: ${message.substring(0, 100)}`,
            `/itinerary/${itineraryId}/chat`
          ]
        );

        // Send real-time notification
        socketService.sendToUser(collab.user_id, 'notification', {
          type: 'chat',
          title: `New message in ${itinerary.destination}`,
          content: `${user.name}: ${message.substring(0, 50)}...`,
          itineraryId: parseInt(itineraryId)
        });
      }

      res.status(201).json({
        message: 'Message sent successfully',
        chatMessage
      });
    } catch (error) {
      console.error('Send chat message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // =============================================
  // Delete chat message (own messages only)
  // =============================================
  async deleteChatMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      // Verify ownership
      const [messages] = await pool.query(
        `SELECT * FROM collaboration_chats WHERE id = ? AND user_id = ?`,
        [messageId, userId]
      );

      if ((messages as any[]).length === 0) {
        res.status(403).json({ error: 'Cannot delete this message' });
        return;
      }

      const chatMessage = (messages as any[])[0];

      await pool.query(
        `DELETE FROM collaboration_chats WHERE id = ?`,
        [messageId]
      );

      // Broadcast deletion
      socketService.broadcastToItinerary(chatMessage.itinerary_id, 'chat_message_deleted', {
        messageId: parseInt(messageId),
        itineraryId: chatMessage.itinerary_id
      });

      res.json({ message: 'Message deleted' });
    } catch (error) {
      console.error('Delete chat message error:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  }

  // =============================================
  // Get unread chat count for all itineraries
  // =============================================
  async getUnreadChatCounts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      // Get itineraries where user is owner or collaborator
      const [counts] = await pool.query(`
        SELECT 
          i.id as itinerary_id,
          i.destination,
          COUNT(cc.id) as unread_count
        FROM itineraries i
        LEFT JOIN collaboration_chats cc ON cc.itinerary_id = i.id 
          AND cc.user_id != ? 
          AND cc.created_at > COALESCE(
            (SELECT MAX(created_at) FROM collaboration_chats WHERE itinerary_id = i.id AND user_id = ?),
            '1970-01-01'
          )
        WHERE i.user_id = ? OR i.id IN (
          SELECT itinerary_id FROM itinerary_collaborators WHERE user_id = ? AND status = 'accepted'
        )
        GROUP BY i.id, i.destination
        HAVING unread_count > 0
      `, [userId, userId, userId, userId]);

      res.json({ unreadChats: counts });
    } catch (error) {
      console.error('Get unread chat counts error:', error);
      res.status(500).json({ error: 'Failed to fetch unread counts' });
    }
  }

  // =============================================
  // Helper: Check if user has access to itinerary
  // =============================================
  private async checkAccess(userId: number, itineraryId: number): Promise<boolean> {
    const [result] = await pool.query(`
      SELECT 1 FROM itineraries WHERE id = ? AND user_id = ?
      UNION
      SELECT 1 FROM itinerary_collaborators WHERE itinerary_id = ? AND user_id = ? AND status = 'accepted'
    `, [itineraryId, userId, itineraryId, userId]);

    return (result as any[]).length > 0;
  }
}

export const collaborationChatController = new CollaborationChatController();
