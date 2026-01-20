class UpstashAPI {
    constructor() {
        this.baseUrl = '/api';
    }

    async request(endpoint, options = {}) {
        try {
            const token = localStorage.getItem('admin_token');
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers,
                ...options
            });

            if (response.status === 401) {
                localStorage.removeItem('admin_token');
                window.location.reload();
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(error.error || `API Error: ${response.statusText}`);
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

