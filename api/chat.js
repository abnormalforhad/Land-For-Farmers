import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are Land for Farmers AI, an expert agricultural advisor for farmers. You help with: soil management, crop diseases, planting schedules, irrigation, pest control, fertilizer recommendations, weather interpretation, and yield optimization. Give practical, actionable advice. Keep responses concise (2-4 sentences). Use simple language that farmers can understand. If relevant, mention specific quantities, timing, or products.`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 512,
        });

        const reply = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        return res.status(200).json({ reply });
    } catch (err) {
        console.error('Groq API error:', err);
        return res.status(500).json({ error: err.message || 'Failed to get AI response' });
    }
}
