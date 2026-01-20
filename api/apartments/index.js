const { verifyAuth } = require('../utils/auth.js');

module.exports = async function handler(req, res) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
        return res.status(500).json({ error: 'Upstash configuration missing' });
    }

    const key = 'apartments';

    if (req.method === 'GET') {
        try {
            const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
                }
            });

            const data = await response.json();
            let apartments = [];
            
            if (data.result) {
                try {
                    apartments = JSON.parse(data.result);
                } catch (e) {
                    apartments = [];
                }
            }
            
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            return res.status(200).json(apartments);
        } catch (error) {
            console.error('Error fetching apartments:', error);
            return res.status(500).json({ error: 'Failed to fetch apartments', details: error.message });
        }
    }

    if (req.method === 'POST') {
        const auth = await verifyAuth(req);
        if (!auth.valid) {
            return res.status(401).json({ error: auth.error || 'Unauthorized' });
        }

        try {
            const newApartment = {
                id: Date.now().toString(),
                ...req.body,
                createdAt: new Date().toISOString()
            };

            const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
                }
            });

            const data = await response.json();
            let apartments = [];
            
            if (data.result) {
                try {
                    apartments = JSON.parse(data.result);
                } catch (e) {
                    apartments = [];
                }
            }
            
            apartments.push(newApartment);

            const setResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apartments)
            });

            const setData = await setResponse.json();
            
            if (!setResponse.ok) {
                console.error('Upstash set error - Status:', setResponse.status, 'Data:', setData);
                return res.status(500).json({ 
                    error: 'Failed to save apartment to Upstash', 
                    details: setData.error || setData.message || JSON.stringify(setData),
                    status: setResponse.status
                });
            }
            
            if (setData.error) {
                console.error('Upstash set error:', setData);
                return res.status(500).json({ 
                    error: 'Failed to save apartment to Upstash', 
                    details: setData.error 
                });
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(201).json(newApartment);
        } catch (error) {
            console.error('Error creating apartment:', error);
            return res.status(500).json({ 
                error: 'Failed to create apartment', 
                details: error.message 
            });
        }
    }

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

