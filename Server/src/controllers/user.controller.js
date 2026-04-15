import User from '../models/User.js';
import Session from '../models/Session.js';

export const getUserSessions = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const user = await User.findOne({ clerkId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const sessions = await Session.find({ user: user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: sessions,
        });
    } catch (err) {
        console.error('Error fetching user sessions:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

export const getUserStreak = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch all sessions, only need startTime
        const sessions = await Session.find({ user: user._id }, { startTime: 1 }).sort({ startTime: -1 });

        if (sessions.length === 0) {
            return res.status(200).json({
                success: true,
                data: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: null },
            });
        }

        // Get unique calendar days (UTC) that had at least one session
        const daySet = new Set();
        for (const s of sessions) {
            const d = new Date(s.startTime);
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
            daySet.add(key);
        }

        // Sort unique days descending
        const sortedDays = Array.from(daySet)
            .map(k => {
                const [y, m, d] = k.split('-').map(Number);
                return new Date(Date.UTC(y, m, d));
            })
            .sort((a, b) => b - a);

        const MS_PER_DAY = 86400000;

        const todayUTC = new Date();
        const todayMidnight = Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate());

        // Current streak: count backwards from today (or yesterday if today has no session)
        let currentStreak = 0;
        const mostRecentDay = sortedDays[0].getTime();
        const daysSinceMostRecent = Math.round((todayMidnight - mostRecentDay) / MS_PER_DAY);

        // Streak is active if most recent session was today or yesterday
        if (daysSinceMostRecent <= 1) {
            currentStreak = 1;
            let prev = mostRecentDay;
            for (let i = 1; i < sortedDays.length; i++) {
                const curr = sortedDays[i].getTime();
                const gap = Math.round((prev - curr) / MS_PER_DAY);
                if (gap === 1) {
                    currentStreak++;
                    prev = curr;
                } else {
                    break;
                }
            }
        }

        // Longest streak: sliding window over all days
        let longestStreak = 1;
        let runStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
            const gap = Math.round((sortedDays[i - 1].getTime() - sortedDays[i].getTime()) / MS_PER_DAY);
            if (gap === 1) {
                runStreak++;
                if (runStreak > longestStreak) longestStreak = runStreak;
            } else {
                runStreak = 1;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                currentStreak,
                longestStreak: Math.max(longestStreak, currentStreak),
                totalDays: sortedDays.length,
                lastActiveDate: sortedDays[0],
            },
        });
    } catch (err) {
        console.error('Error calculating streak:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};