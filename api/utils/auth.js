export async function verifyAuth(req) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: 'Unauthorized' };
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
            return { valid: false, error: 'Invalid or expired session' };
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
            return { valid: false, error: 'Session expired' };
        }

        return { valid: true, username: sessionData.username };
    } catch (error) {
        console.error('Auth verification error:', error);
        return { valid: false, error: 'Failed to verify session' };
    }
}

