// Session cleanup job – marks inactive sessions as completed after 30 minutes of inactivity
import Session from '../models/Session.js';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

export const startSessionCleanupJob = () => {
  // Run every minute
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - INACTIVITY_LIMIT_MS);
      const result = await Session.updateMany(
        {
          status: 'active',
          lastMessageAt: { $lt: cutoff }
        },
        {
          $set: { status: 'completed', endTime: new Date() }
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`[SessionCleanup] Marked ${result.modifiedCount} sessions as completed due to inactivity.`);
      }
    } catch (err) {
      console.error('[SessionCleanup] Error during cleanup:', err);
    }
  }, 60 * 1000); // 1 minute interval
};
