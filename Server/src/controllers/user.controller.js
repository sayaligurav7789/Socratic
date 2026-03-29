import User from '../models/User.js';
import Session from '../models/Session.js';

export const getUserSessions = async (req, res) => {
    try {
        const { clerkId } = req.params;

        // Find user by clerkId
        const user = await User.findOne({ clerkId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Fetch sessions belonging to this user, sorted by newest first
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
