const { verifyAuth } = require('../utils/auth.js');

module.exports = async function handler(req, res) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

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
            
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            return res.status(200).json(tenants);
        } catch (error) {
            console.error('Error fetching tenants:', error);
            return res.status(500).json({ error: 'Failed to fetch tenants' });
        }
    }

    if (req.method === 'POST') {
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

            const newTenant = {
                id: Date.now().toString(),
                apartmentName: req.body.apartmentName,
                location: req.body.location,
                price: selectedApartment.price,
                tenantNames: req.body.tenantNames || [],
                electricitySubmeter: req.body.electricitySubmeter || null,
                waterSubmeter: req.body.waterSubmeter || null,
                createdAt: new Date().toISOString()
            };

            const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
                }
            });

            const data = await response.json();
            const tenants = data.result ? JSON.parse(data.result) : [];
            tenants.push(newTenant);

            await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(JSON.stringify(tenants))
            });

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(201).json(newTenant);
        } catch (error) {
            console.error('Error creating tenant:', error);
            return res.status(500).json({ error: 'Failed to create tenant' });
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

