const { verifyAuth } = require('../utils/auth.js');

module.exports = async function handler(req, res) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    const { id } = req.query;

    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
        return res.status(500).json({ error: 'Upstash configuration missing' });
    }

    const key = 'tenants';

    if (req.method === 'GET') {
        try {
            const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
                }
            });

            const data = await response.json();
            const tenants = data.result ? JSON.parse(data.result) : [];
            const tenant = tenants.find(t => t.id === id);

            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json(tenant);
        } catch (error) {
            console.error('Error fetching tenant:', error);
            return res.status(500).json({ error: 'Failed to fetch tenant' });
        }
    }

    if (req.method === 'PUT') {
        const auth = await verifyAuth(req);
        if (!auth.valid) {
            return res.status(401).json({ error: auth.error || 'Unauthorized' });
        }

        try {
            const apartmentResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/get/apartments`, {
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
                }
            });

            const apartmentData = await apartmentResponse.json();
            const apartments = apartmentData.result ? JSON.parse(apartmentData.result) : [];
            const selectedApartment = apartments.find(apt => apt.name === req.body.apartmentName);

            if (!selectedApartment) {
                return res.status(400).json({ error: 'Apartment not found' });
            }

            const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
                }
            });

            const data = await response.json();
            const tenants = data.result ? JSON.parse(data.result) : [];
            const index = tenants.findIndex(t => t.id === id);

            if (index === -1) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            tenants[index] = {
                ...tenants[index],
                apartmentName: req.body.apartmentName,
                location: req.body.location,
                price: selectedApartment.price,
                tenantNames: req.body.tenantNames || [],
                electricitySubmeter: req.body.electricitySubmeter || null,
                waterSubmeter: req.body.waterSubmeter || null,
                updatedAt: new Date().toISOString()
            };

            const setResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(tenants)
            });

            if (!setResponse.ok) {
                const errorData = await setResponse.json().catch(() => ({}));
                throw new Error(`Failed to update: ${JSON.stringify(errorData)}`);
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json(tenants[index]);
        } catch (error) {
            console.error('Error updating tenant:', error);
            return res.status(500).json({ error: 'Failed to update tenant' });
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
            const tenants = data.result ? JSON.parse(data.result) : [];
            const filteredTenants = tenants.filter(t => t.id !== id);

            if (tenants.length === filteredTenants.length) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            const setResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(filteredTenants)
            });

            if (!setResponse.ok) {
                const errorData = await setResponse.json().catch(() => ({}));
                throw new Error(`Failed to delete: ${JSON.stringify(errorData)}`);
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json({ message: 'Tenant deleted successfully' });
        } catch (error) {
            console.error('Error deleting tenant:', error);
            return res.status(500).json({ error: 'Failed to delete tenant' });
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

