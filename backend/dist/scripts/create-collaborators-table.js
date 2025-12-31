"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
async function createCollaboratorsTable() {
    try {
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS itinerary_collaborators (
        id INT PRIMARY KEY AUTO_INCREMENT,
        itinerary_id INT NOT NULL,
        user_id INT NOT NULL,
        permission ENUM('view', 'edit') DEFAULT 'edit',
        invited_by INT NOT NULL,
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (invited_by) REFERENCES users(id),
        UNIQUE KEY unique_collab (itinerary_id, user_id)
      )
    `);
        console.log('✅ itinerary_collaborators table created successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}
createCollaboratorsTable();
