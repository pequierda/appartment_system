class UpstashAPI {
    constructor() {
        this.baseUrl = '/api';
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async getAllApartments() {
        return this.request('/apartments');
    }

    async getApartment(id) {
        return this.request(`/apartments/${id}`);
    }

    async createApartment(data) {
        return this.request('/apartments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateApartment(id, data) {
        return this.request(`/apartments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteApartment(id) {
        return this.request(`/apartments/${id}`, {
            method: 'DELETE'
        });
    }
}

const api = new UpstashAPI();

