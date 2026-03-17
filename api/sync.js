import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { walletAddress } = req.query;

    if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required.' });
    }

    const blobName = `users/${walletAddress.toLowerCase()}.json`;

    try {
        if (req.method === 'GET') {
            try {
                // Fetch the list of blobs to find ours
                const { blobs } = await list({ prefix: blobName });
                if (blobs.length > 0) {
                    const response = await fetch(blobs[0].url);
                    const data = await response.json();
                    return res.status(200).json({ data });
                }
                return res.status(200).json({ data: null });
            } catch (e) {
                console.error("Blob read error:", e);
                return res.status(200).json({ data: null });
            }
        } 
        
        if (req.method === 'POST') {
            const { data } = req.body;
            if (!data) {
                return res.status(400).json({ error: 'Data payload is required.' });
            }
            
            // Overwrite existing data for this user
            await put(blobName, JSON.stringify(data), { 
                access: 'public',
                contentType: 'application/json',
                addRandomSuffix: false // keeps the URL deterministic for updates
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Vercel Blob Sync Error:', error);
        return res.status(500).json({ error: 'Failed to access storage backend' });
    }
}
