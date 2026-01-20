const crypto = require('crypto');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
        return res.status(500).json({ error: 'Upstash configuration missing' });
    }

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'Admin credentials not configured' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        const token = crypto.randomBytes(32).toString('hex');
        const sessionKey = `session:${token}`;
        const sessionData = {
            username,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        await fetch(`${UPSTASH_REDIS_REST_URL}/set/${sessionKey}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ex: 86400,
                value: JSON.stringify(sessionData)
            })
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ 
            token,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Failed to create session' });
    }
}

