import { Webhook } from 'svix';
import User from '../models/User.js';

export const clerkWebhookController = async (req, res) => {
    try {
        const payloadString = req.body.toString();
        const svixHeaders = req.headers;

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        const evt = wh.verify(payloadString, svixHeaders);

        const { id, ...attributes } = evt.data;

        // Handle the webhooks
        const eventType = evt.type;

        if (eventType === 'user.created' || eventType === 'user.updated') {
            const email = attributes.email_addresses?.[0]?.email_address;
            const firstName = attributes.first_name || '';
            const lastName = attributes.last_name || '';
            const imageUrl = attributes.image_url || '';

            await User.findOneAndUpdate(
                { clerkId: id },
                {
                    clerkId: id,
                    email,
                    firstName,
                    lastName,
                    imageUrl,
                },
                { upsert: true, returnDocument: 'after' }
            );
            console.log(`User ${id} was ${eventType === 'user.created' ? 'created' : 'updated'}`);
        }

        if (eventType === 'user.deleted') {
            await User.findOneAndDelete({ clerkId: id });
            console.log(`User ${id} was deleted`);
        }

        res.status(200).json({
            success: true,
            message: 'Webhook received',
        });
    } catch (err) {
        console.error('Error verifying Clerk webhook:', err.message);
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};


