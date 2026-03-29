import express from 'express';
import { getUserSessions } from '../controllers/user.controller.js';

const router = express.Router();

// Get all sessions for a specific user (by Clerk ID)
router.get('/:clerkId/sessions', getUserSessions);

export default router;
