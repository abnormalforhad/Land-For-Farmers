import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const blobName = 'global/feed.json';

    try {
        if (req.method === 'GET') {
            try {
                const { blobs } = await list({ prefix: blobName });
                if (blobs.length > 0) {
                    const response = await fetch(blobs[0].url);
                    const feed = await response.json();
                    return res.status(200).json(feed);
                }
                return res.status(200).json([]);
            } catch (e) {
                console.error("Feed read error:", e);
                return res.status(200).json([]);
            }
        }

        if (req.method === 'POST') {
            const { record } = req.body;
            if (!record) {
                return res.status(400).json({ error: 'Record payload is required.' });
            }

            // Get current feed
            let feed = [];
            try {
                const { blobs } = await list({ prefix: blobName });
                if (blobs.length > 0) {
                    const response = await fetch(blobs[0].url);
                    feed = await response.json();
                }
            } catch (e) {
                // Ignore empty feed
            }

            // Prepend new record to the list
            feed.unshift(record);
            
            // Keep only the latest 50 records to prevent the list from growing indefinitely
            if (feed.length > 50) {
                feed = feed.slice(0, 50);
            }

            // Overwrite blob
            await put(blobName, JSON.stringify(feed), { 
                access: 'public',
                contentType: 'application/json',
                addRandomSuffix: false 
            });

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Vercel Blob Feed Error:', error);
        return res.status(500).json({ error: 'Failed to access global feed' });
    }
}
