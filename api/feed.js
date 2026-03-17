const { kv } = require('@vercel/kv');

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            // Fetch the top 50 global uploads
            const feed = await kv.lrange('global_feed', 0, 49) || [];
            return res.status(200).json(feed);
        }

        if (req.method === 'POST') {
            const { record } = req.body;
            if (!record) {
                return res.status(400).json({ error: 'Record payload is required.' });
            }

            // Prepend new record to the list
            await kv.lpush('global_feed', record);
            
            // Keep only the latest 50 records to prevent the list from growing indefinitely
            await kv.ltrim('global_feed', 0, 49);

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Vercel KV Feed Error:', error);
        return res.status(500).json({ error: 'Failed to access global feed' });
    }
}
