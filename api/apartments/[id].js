const { verifyAuth } = require('../utils/auth.js');

module.exports = async function handler(req, res) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    const { id } = req.query;

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
            const apartments = data.result ? JSON.parse(data.result) : [];
            const apartment = apartments.find(apt => apt.id === id);

            if (!apartment) {
                return res.status(404).json({ error: 'Apartment not found' });
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json(apartment);
        } catch (error) {
            console.error('Error fetching apartment:', error);
            return res.status(500).json({ error: 'Failed to fetch apartment' });
        }
    }

    if (req.method === 'PUT') {
        const auth = await verifyAuth(req);
        if (!auth.valid) {
            return res.status(401).json({ error: auth.error || 'Unauthorized' });
        }

        try {
            const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
                }
            });

            const data = await response.json();
            const apartments = data.result ? JSON.parse(data.result) : [];
            const index = apartments.findIndex(apt => apt.id === id);

            if (index === -1) {
                return res.status(404).json({ error: 'Apartment not found' });
            }

            apartments[index] = {
                ...apartments[index],
                ...req.body,
                updatedAt: new Date().toISOString()
            };

            await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(JSON.stringify(apartments))
            });

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json(apartments[index]);
        } catch (error) {
            console.error('Error updating apartment:', error);
            return res.status(500).json({ error: 'Failed to update apartment' });
        }
    }

    if (req.method === 'DELETE') {
        const auth = await verifyAuth(req);
        if (!auth.valid) {
            return res.status(401).json({ error: auth.error || 'Unauthorized' });
        }

        try {
            const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
                }
            });

            const data = await response.json();
            const apartments = data.result ? JSON.parse(data.result) : [];
            const filteredApartments = apartments.filter(apt => apt.id !== id);

            if (apartments.length === filteredApartments.length) {
                return res.status(404).json({ error: 'Apartment not found' });
            }

            await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(JSON.stringify(filteredApartments))
            });

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json({ message: 'Apartment deleted successfully' });
        } catch (error) {
            console.error('Error deleting apartment:', error);
            return res.status(500).json({ error: 'Failed to delete apartment' });
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

