import express from 'express';
import cors from 'cors';
import webhookRoutes from './routes/webhook.routes.js';
import userRoutes from './routes/user.routes.js';
import sessionRoutes from './routes/session.routes.js';
import { startSessionCleanupJob } from './jobs/sessionCleanup.js';

const app = express();

// Allow requests from the Next.js client 
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? [process.env.CLIENT_ORIGIN]
  : true;

// Webhook routes must be mounted before express.json() to preserve raw body for Svix verification
app.use('/api/webhooks', webhookRoutes);

// Start background jobs
startSessionCleanupJob();

// Middlewares
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Server is running 🚀' });
});

export default app;
