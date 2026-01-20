class Auth {
    constructor() {
        this.tokenKey = 'admin_token';
        this.sessionKey = 'admin_session';
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    removeToken() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.sessionKey);
    }

    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            this.setToken(data.token);
            this.updateUI(true);
            setTimeout(() => {
                if (typeof loadApartments === 'function') {
                    loadApartments();
                }
            }, 100);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            const token = this.getToken();
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.removeToken();
            this.updateUI(false);
        }
    }

    async verifySession() {
        const token = this.getToken();
        if (!token) {
            this.updateUI(false);
            return false;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.updateUI(true);
                return true;
            } else {
                this.removeToken();
                this.updateUI(false);
                return false;
            }
        } catch (error) {
            console.error('Session verification error:', error);
            this.removeToken();
            this.updateUI(false);
            return false;
        }
    }

    updateUI(isAuthenticated) {
        const loginScreen = document.getElementById('loginScreen');
        const mainContent = document.getElementById('mainContent');
        const logoutBtn = document.getElementById('logoutBtn');
        const addBtn = document.getElementById('addApartmentBtn');
        const nav = document.getElementById('mainNav');

        if (isAuthenticated) {
            loginScreen.classList.add('hidden');
            mainContent.classList.remove('hidden');
            nav.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
            addBtn.classList.remove('hidden');
        } else {
            loginScreen.classList.remove('hidden');
            mainContent.classList.add('hidden');
            nav.classList.add('hidden');
            logoutBtn.classList.add('hidden');
            addBtn.classList.add('hidden');
        }

        this.updateApartmentCards(isAuthenticated);
    }

    updateApartmentCards(isAuthenticated) {
        const editButtons = document.querySelectorAll('[onclick^="editApartment"]');
        const deleteButtons = document.querySelectorAll('[onclick^="deleteApartment"]');
        
        editButtons.forEach(btn => {
            btn.style.display = isAuthenticated ? '' : 'none';
        });
        
        deleteButtons.forEach(btn => {
            btn.style.display = isAuthenticated ? '' : 'none';
        });
    }

    isAuthenticated() {
        return !!this.getToken();
    }
}

const auth = new Auth();

document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    auth.verifySession();
});

function setupAuthListeners() {
    document.getElementById('logoutBtn').addEventListener('click', () => auth.logout());
    document.getElementById('loginFormMain').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('loginErrorMain');
    errorDiv.classList.add('hidden');

    const username = document.getElementById('usernameMain').value;
    const password = document.getElementById('passwordMain').value;

    const result = await auth.login(username, password);

    if (result.success) {
        showSuccess('Login successful!');
    } else {
        errorDiv.textContent = result.error || 'Invalid credentials';
        errorDiv.classList.remove('hidden');
    }
}

