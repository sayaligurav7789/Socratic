import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        topic: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['initializing', 'active', 'completed'],
            default: 'initializing',
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: {
            type: Date,
            default: null,
        },
        conceptTree: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        messages: [
            {
                type: mongoose.Schema.Types.Mixed,
            }
        ],
        depthScores: {
            type: Map,
            of: Number,
            default: {},
        },
        blindSpots: [
            {
                type: mongoose.Schema.Types.Mixed,
            }
        ],
        score: {
            type: Number,
            default: 0,
        },
        duration: {
            type: String,
            default: '0m',
        },
        durationMinutes: {
            type: Number,
            default: 0,
        },
        report: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        overallScore: {
            type: Number,
            default: 0,
        },
        concepts: [
            {
                type: String,
            }
        ],
        misconception: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        sourceText: {
            type: String,
            default: null,
        },
        pasteCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);
