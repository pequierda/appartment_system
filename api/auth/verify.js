module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const sessionKey = `session:${token}`;

    try {
        const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
            headers: {
                'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
            }
        });

        const data = await response.json();

        if (!data.result) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const sessionData = JSON.parse(data.result);
        const expiresAt = new Date(sessionData.expiresAt);

        if (expiresAt < new Date()) {
            await fetch(`${UPSTASH_REDIS_REST_URL}/del/${sessionKey}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
                }
            });
            return res.status(401).json({ error: 'Session expired' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ 
            valid: true,
            username: sessionData.username
        });
    } catch (error) {
        console.error('Verify error:', error);
        return res.status(500).json({ error: 'Failed to verify session' });
    }
}

