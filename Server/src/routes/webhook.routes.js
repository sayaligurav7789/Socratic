import express from 'express';
import { clerkWebhookController } from '../controllers/webhook.controller.js';

const router = express.Router();

// Clerk webhook requires raw body for svix verification
// So we use express.raw({ type: 'application/json' }) before express.json() parses it.
router.post('/clerk', express.raw({ type: 'application/json' }), clerkWebhookController);

export default router;
