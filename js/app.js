let tenants = [];
let filteredTenants = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    if (auth.isAuthenticated()) {
        loadTenants();
        if (typeof loadApartments === 'function') {
            loadApartments();
        }
    }
}

function setupEventListeners() {
    document.getElementById('addTenantBtn').addEventListener('click', () => openTenantModal());
    document.getElementById('closeTenantModal').addEventListener('click', () => closeTenantModal());
    document.getElementById('cancelTenantBtn').addEventListener('click', () => closeTenantModal());
    document.getElementById('tenantForm').addEventListener('submit', handleTenantSubmit);
    document.getElementById('closeViewModal').addEventListener('click', () => closeViewModal());
    
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('priceFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);

    document.getElementById('tenantModal').addEventListener('click', (e) => {
        if (e.target.id === 'tenantModal') closeTenantModal();
    });

    document.getElementById('viewModal').addEventListener('click', (e) => {
        if (e.target.id === 'viewModal') closeViewModal();
    });
}

async function loadTenants() {
    showLoading(true);
    try {
        tenants = await api.getAllTenants();
        filteredTenants = tenants;
        renderTenants();
    } catch (error) {
        showError('Failed to load tenants. Please try again.');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function renderTenants() {
    const grid = document.getElementById('apartmentsGrid');
    const emptyState = document.getElementById('emptyState');
    const isAuthenticated = auth.isAuthenticated();
    
    if (filteredTenants.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    grid.innerHTML = filteredTenants.map(tenant => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            <div class="p-4">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${tenant.apartmentName}</h3>
                <p class="text-gray-600 mb-2 flex items-center">
                    <i class="fas fa-map-marker-alt text-blue-600 mr-2"></i>
                    ${tenant.location}
                </p>
                <p class="text-gray-600 mb-2 flex items-center">
                    <i class="fas fa-dollar-sign text-green-600 mr-2"></i>
                    $${tenant.price}/month
                </p>
                <div class="mb-3">
                    <p class="text-sm font-medium text-gray-700 mb-1">Tenants:</p>
                    <div class="flex flex-wrap gap-2">
                        ${tenant.tenantNames.map(name => `
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">${name}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="mb-3 text-sm">
                    ${tenant.dateOccupied ? `<p class="text-gray-600"><i class="fas fa-calendar text-purple-500 mr-1"></i>Date Occupied: ${new Date(tenant.dateOccupied).toLocaleDateString()}</p>` : ''}
                    ${tenant.electricitySubmeter ? `<p class="text-gray-600"><i class="fas fa-bolt text-yellow-500 mr-1"></i>Electricity: ${tenant.electricitySubmeter}</p>` : ''}
                    ${tenant.waterSubmeter ? `<p class="text-gray-600"><i class="fas fa-tint text-blue-500 mr-1"></i>Water: ${tenant.waterSubmeter}</p>` : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="viewTenant('${tenant.id}')" 
                            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                        <i class="fas fa-eye mr-2"></i>View Details
                    </button>
                    ${isAuthenticated ? `
                    <button onclick="editTenant('${tenant.id}')" 
                            class="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTenant('${tenant.id}')" 
                            class="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const priceFilter = document.getElementById('priceFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredTenants = tenants.filter(tenant => {
        const matchesSearch = !searchTerm || 
            tenant.apartmentName.toLowerCase().includes(searchTerm) ||
            tenant.location.toLowerCase().includes(searchTerm) ||
            tenant.tenantNames.some(name => name.toLowerCase().includes(searchTerm));

        const matchesPrice = !priceFilter || checkPriceRange(tenant.price, priceFilter);

        return matchesSearch && matchesPrice;
    });

    renderTenants();
}

function checkPriceRange(price, range) {
    switch(range) {
        case '0-500': return price >= 0 && price <= 500;
        case '500-1000': return price > 500 && price <= 1000;
        case '1000-2000': return price > 1000 && price <= 2000;
        case '2000+': return price > 2000;
        default: return true;
    }
}

async function openTenantModal(tenant = null) {
    if (!auth.isAuthenticated()) {
        showError('Please login to add or edit tenants.');
        return;
    }

    const modal = document.getElementById('tenantModal');
    const form = document.getElementById('tenantForm');
    const title = document.getElementById('tenantModalTitle');
    
    if (typeof window.loadApartments === 'function') {
        await window.loadApartments();
    }
    if (typeof window.updateTenantDropdowns === 'function') {
        window.updateTenantDropdowns();
    }

    if (tenant) {
        title.textContent = 'Edit Tenants';
        document.getElementById('tenantId').value = tenant.id;
        document.getElementById('tenantApartmentName').value = tenant.apartmentName;
        document.getElementById('tenantLocation').value = tenant.location;
        document.getElementById('dateOccupied').value = tenant.dateOccupied || '';
        document.getElementById('electricitySubmeter').value = tenant.electricitySubmeter || '';
        document.getElementById('waterSubmeter').value = tenant.waterSubmeter || '';
        
        const container = document.getElementById('tenantNamesContainer');
        container.innerHTML = '';
        tenant.tenantNames.forEach((name, index) => {
            const div = document.createElement('div');
            div.className = 'flex gap-2 mb-2';
            div.innerHTML = `
                <input type="text" name="tenantName" value="${name}" placeholder="Enter tenant name" required
                       class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <button type="button" onclick="removeTenantName(this)" class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 ${index === 0 ? 'hidden' : ''}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(div);
        });
    } else {
        title.textContent = 'New Tenants';
        form.reset();
        document.getElementById('tenantId').value = '';
        const container = document.getElementById('tenantNamesContainer');
        container.innerHTML = `
            <div class="flex gap-2 mb-2">
                <input type="text" name="tenantName" placeholder="Enter tenant name" required
                       class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <button type="button" onclick="removeTenantName(this)" class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hidden">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    modal.classList.remove('hidden');
}

function closeTenantModal() {
    document.getElementById('tenantModal').classList.add('hidden');
    document.getElementById('tenantForm').reset();
}

async function handleTenantSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('tenantId').value;
    const tenantNameInputs = document.querySelectorAll('input[name="tenantName"]');
    const tenantNames = Array.from(tenantNameInputs).map(input => input.value.trim()).filter(name => name);
    
    if (tenantNames.length === 0) {
        showError('Please add at least one tenant name.');
        return;
    }
    
    const data = {
        apartmentName: document.getElementById('tenantApartmentName').value,
        location: document.getElementById('tenantLocation').value,
        tenantNames: tenantNames,
        dateOccupied: document.getElementById('dateOccupied').value,
        electricitySubmeter: document.getElementById('electricitySubmeter').value || null,
        waterSubmeter: document.getElementById('waterSubmeter').value || null
    };

    try {
        if (id) {
            await api.updateTenant(id, data);
        } else {
            await api.createTenant(data);
        }
        closeTenantModal();
        await loadTenants();
        showSuccess(id ? 'Tenants updated successfully!' : 'Tenants added successfully!');
    } catch (error) {
        showError('Failed to save tenants. Please try again.');
        console.error(error);
    }
}

async function viewTenant(id) {
    try {
        const tenant = await api.getTenant(id);
        const viewContent = document.getElementById('viewContent');
        const viewTitle = document.getElementById('viewTitle');

        viewTitle.textContent = tenant.apartmentName;
        viewContent.innerHTML = `
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Price</p>
                    <p class="text-2xl font-bold text-blue-600">$${tenant.price}/month</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Location</p>
                    <p class="text-lg font-semibold text-gray-800">${tenant.location}</p>
                </div>
            </div>
            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-2">Tenants</p>
                <div class="flex flex-wrap gap-2">
                    ${tenant.tenantNames.map(name => `
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg">${name}</span>
                    `).join('')}
                </div>
            </div>
            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-2">Details</p>
                <div class="space-y-2">
                    ${tenant.dateOccupied ? `
                        <p class="text-gray-800"><i class="fas fa-calendar text-purple-500 mr-2"></i>Date Occupied: ${new Date(tenant.dateOccupied).toLocaleDateString()}</p>
                    ` : ''}
                    ${tenant.electricitySubmeter ? `
                        <p class="text-gray-800"><i class="fas fa-bolt text-yellow-500 mr-2"></i>Electricity: ${tenant.electricitySubmeter}</p>
                    ` : ''}
                    ${tenant.waterSubmeter ? `
                        <p class="text-gray-800"><i class="fas fa-tint text-blue-500 mr-2"></i>Water: ${tenant.waterSubmeter}</p>
                    ` : ''}
                </div>
            </div>
            ${auth.isAuthenticated() ? `
            <div class="flex gap-3 mt-6">
                <button onclick="editTenant('${tenant.id}')" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-edit mr-2"></i>Edit
                </button>
                <button onclick="deleteTenant('${tenant.id}')" 
                        class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-trash mr-2"></i>Delete
                </button>
            </div>
            ` : ''}
        `;

        document.getElementById('viewModal').classList.remove('hidden');
    } catch (error) {
        showError('Failed to load tenant details.');
        console.error(error);
    }
}

function closeViewModal() {
    document.getElementById('viewModal').classList.add('hidden');
}

async function editTenant(id) {
    closeViewModal();
    try {
        const tenant = await api.getTenant(id);
        openTenantModal(tenant);
    } catch (error) {
        showError('Failed to load tenant for editing.');
        console.error(error);
    }
}

async function deleteTenant(id) {
    if (!auth.isAuthenticated()) {
        showError('Please login to delete tenants.');
        return;
    }

    if (!confirm('Are you sure you want to delete this tenant record?')) return;

    try {
        await api.deleteTenant(id);
        await loadTenants();
        showSuccess('Tenant deleted successfully!');
    } catch (error) {
        showError('Failed to delete tenant.');
        console.error(error);
    }
}

function showLoading(show) {
    document.getElementById('loadingState').classList.toggle('hidden', !show);
}

function showError(message) {
    alert(message);
}

function showSuccess(message) {
    alert(message);
}

