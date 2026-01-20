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
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const addBtn = document.getElementById('addApartmentBtn');

        if (isAuthenticated) {
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            addBtn.classList.remove('hidden');
        } else {
            loginBtn.classList.remove('hidden');
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
    document.getElementById('loginBtn').addEventListener('click', () => openLoginModal());
    document.getElementById('logoutBtn').addEventListener('click', () => auth.logout());
    document.getElementById('closeLoginModal').addEventListener('click', () => closeLoginModal());
    document.getElementById('cancelLoginBtn').addEventListener('click', () => closeLoginModal());
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    document.getElementById('loginModal').addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') closeLoginModal();
    });
}

function openLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('loginError').classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.add('hidden');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const result = await auth.login(username, password);

    if (result.success) {
        closeLoginModal();
        showSuccess('Login successful!');
    } else {
        errorDiv.textContent = result.error || 'Invalid credentials';
        errorDiv.classList.remove('hidden');
    }
}

