const { kv } = require('@vercel/kv');

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { walletAddress } = req.query;

    if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required.' });
    }

    const kvKey = `user_${walletAddress.toLowerCase()}`;

    try {
        if (req.method === 'GET') {
            const userData = await kv.get(kvKey);
            return res.status(200).json({ data: userData || null });
        } 
        
        if (req.method === 'POST') {
            const { data } = req.body;
            if (!data) {
                return res.status(400).json({ error: 'Data payload is required.' });
            }
            await kv.set(kvKey, data);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Vercel KV Sync Error:', error);
        return res.status(500).json({ error: 'Failed to access storage backend' });
    }
}
