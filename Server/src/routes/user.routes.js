import express from 'express';
import { getUserSessions, getUserStreak } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/:clerkId/sessions', getUserSessions);
router.get('/:clerkId/streak', getUserStreak);

export default router;