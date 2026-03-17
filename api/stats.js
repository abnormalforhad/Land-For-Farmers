const { kv } = require('@vercel/kv');

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            const stats = await kv.hgetall('global_stats') || {};
            
            // Provide default base stats if empty
            const defaultStats = {
                records_stored: 1420,
                ai_insights: 850,
                marketplace_datasets: 112
            };

            return res.status(200).json({
                records_stored: stats.records_stored || defaultStats.records_stored,
                ai_insights: stats.ai_insights || defaultStats.ai_insights,
                marketplace_datasets: stats.marketplace_datasets || defaultStats.marketplace_datasets
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

            await kv.hincrby('global_stats', fieldToIncrement, 1);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Vercel KV Stats Error:', error);
        return res.status(500).json({ error: 'Failed to access global stats' });
    }
}
