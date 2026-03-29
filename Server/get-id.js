import mongoose from 'mongoose';
import Session from './src/models/Session.js';
import dotenv from 'dotenv';
dotenv.config();

async function getLatest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const session = await Session.findOne().sort({ createdAt: -1 });
        if (session) {
            console.log('LATEST_SESSION_ID:' + session.sessionId);
        } else {
            console.log('NO_SESSIONS_FOUND');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

getLatest();
