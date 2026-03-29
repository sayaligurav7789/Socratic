import express from 'express';
import multer from 'multer';
import { createSession, initSession, deleteSession, getSession, endSession, generateReport, recordPasteEvent } from '../controllers/session.controller.js';
import { streamChat } from '../controllers/chat.controller.js';

const router = express.Router();
const upload = multer();

// Create a new session (legacy mapping)
router.post('/', createSession);

// Initialize a new session from onboarding (Handles topic + file upload)
router.post('/init', upload.single('file'), initSession);

// Get a session by ID
router.get('/:id', getSession);

// Streaming AI Chat Endpoint
router.post('/:id/chat', streamChat);

// Track paste events in the session input field
router.post('/:id/paste', recordPasteEvent);

// Delete a session locally by ID
router.delete('/:id', deleteSession);

// End a session explicitly
router.post('/:id/end', endSession);

// Generate / Get Mastery Report
router.post('/:id/report', generateReport);

export default router;
