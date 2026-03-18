import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const blobName = 'global/stats.json';

    try {
        if (req.method === 'GET') {
            let stats = {};
            try {
                const { blobs } = await list({ prefix: blobName });
                if (blobs.length > 0) {
                    const response = await fetch(blobs[0].url);
                    stats = await response.json();
                }
            } catch (e) {
                // Return zeros if not found
            }

            // Return only real counts — no fake inflation
            return res.status(200).json({
                records_stored: parseInt(stats.records_stored || 0),
                ai_insights: parseInt(stats.ai_insights || 0),
                marketplace_datasets: parseInt(stats.marketplace_datasets || 0)
            });
        } 
        
        if (req.method === 'POST') {
            const { type } = req.body; // 'record', 'insight', 'dataset'
            if (!type) {
                return res.status(400).json({ error: 'Increment type is required.' });
            }

            let fieldToIncrement = '';
            if (type === 'record') fieldToIncrement = 'records_stored';
            else if (type === 'insight') fieldToIncrement = 'ai_insights';
            else if (type === 'dataset') fieldToIncrement = 'marketplace_datasets';
            else return res.status(400).json({ error: 'Invalid increment type.' });

            // Get current stats
            let stats = {};
            try {
                const { blobs } = await list({ prefix: blobName });
                if (blobs.length > 0) {
                    const response = await fetch(blobs[0].url);
                    stats = await response.json();
                }
            } catch (e) {
                // Start tracking fresh
            }

            stats[fieldToIncrement] = (parseInt(stats[fieldToIncrement] || 0)) + 1;

            await put(blobName, JSON.stringify(stats), { 
                access: 'public',
                contentType: 'application/json',
                addRandomSuffix: false 
            });

            return res.status(200).json({ success: true });
        }

        // DELETE method to reset stats to zero
        if (req.method === 'DELETE') {
            const freshStats = {
                records_stored: 0,
                ai_insights: 0,
                marketplace_datasets: 0
            };

            await put(blobName, JSON.stringify(freshStats), { 
                access: 'public',
                contentType: 'application/json',
                addRandomSuffix: false 
            });

            return res.status(200).json({ success: true, message: 'Stats reset to zero.' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Vercel Blob Stats Error:', error);
        return res.status(500).json({ error: 'Failed to access global stats' });
    }
}

