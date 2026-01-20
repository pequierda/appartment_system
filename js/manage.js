let apartments = [];
window.apartments = apartments;

document.addEventListener('DOMContentLoaded', () => {
    setupManageListeners();
    if (auth && auth.isAuthenticated()) {
        loadApartments();
    }
});

function setupManageListeners() {
    document.getElementById('manageApartmentsBtn').addEventListener('click', () => openManageModal());
    document.getElementById('closeManageModal').addEventListener('click', () => closeManageModal());
    document.getElementById('cancelManageBtn').addEventListener('click', () => closeManageModal());
    document.getElementById('manageApartmentForm').addEventListener('submit', handleManageSubmit);

    document.getElementById('manageApartmentsModal').addEventListener('click', (e) => {
        if (e.target.id === 'manageApartmentsModal') closeManageModal();
    });
}

async function loadApartments() {
    try {
        apartments = await api.getAllApartments();
        window.apartments = apartments;
        renderApartmentsList();
        if (typeof updateTenantDropdowns === 'function') {
            updateTenantDropdowns();
        }
    } catch (error) {
        console.error('Error loading apartments:', error);
        apartments = [];
        window.apartments = apartments;
        renderApartmentsList();
    }
}

function renderApartmentsList() {
    const listContainer = document.getElementById('apartmentsList');
    if (!listContainer) return;

    if (!Array.isArray(apartments) || apartments.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-building text-4xl mb-2"></i>
                <p>No apartments added yet</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = apartments.map(apt => `
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-500 transition">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h5 class="font-semibold text-gray-800 text-lg">${apt.name}</h5>
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">${apt.unit || 'No Unit'}</span>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>
                            <i class="fas fa-map-marker-alt text-blue-600 mr-1"></i>
                            <span>${apt.location}</span>
                        </div>
                        <div>
                            <i class="fas fa-dollar-sign text-green-600 mr-1"></i>
                            <span>$${apt.price}/month</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editApartmentFromList('${apt.id}')" 
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="deleteApartmentFromList('${apt.id}')" 
                            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function editApartmentFromList(id) {
    try {
        const apartment = await api.getApartment(id);
        openManageModal(apartment);
    } catch (error) {
        showError('Failed to load apartment for editing.');
        console.error(error);
    }
}

async function deleteApartmentFromList(id) {
    if (!confirm('Are you sure you want to delete this apartment?')) return;

    try {
        await api.deleteApartment(id);
        await loadApartments();
        showSuccess('Apartment deleted successfully!');
    } catch (error) {
        showError('Failed to delete apartment.');
        console.error(error);
    }
}

window.editApartmentFromList = editApartmentFromList;
window.deleteApartmentFromList = deleteApartmentFromList;

window.loadApartments = loadApartments;
window.updateTenantDropdowns = updateTenantDropdowns;

function updateTenantDropdowns() {
    const apartmentSelect = document.getElementById('tenantApartmentName');
    const locationSelect = document.getElementById('tenantLocation');
    
    if (!apartmentSelect || !locationSelect) return;

    const apts = window.apartments || apartments || [];
    
    if (!Array.isArray(apts) || apts.length === 0) {
        apartmentSelect.innerHTML = '<option value="">No apartments available. Please add apartments first.</option>';
        locationSelect.innerHTML = '<option value="">No locations available</option>';
        return;
    }

    apartmentSelect.innerHTML = '<option value="">Select Apartment</option>';
    locationSelect.innerHTML = '<option value="">Select Location</option>';

    const uniqueLocations = [...new Set(apts.map(apt => apt.location))];

    apts.forEach(apt => {
        const option = document.createElement('option');
        option.value = apt.name;
        option.textContent = `${apt.name} - ${apt.unit || ''}`;
        apartmentSelect.appendChild(option);
    });

    uniqueLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationSelect.appendChild(option);
    });

    apartmentSelect.addEventListener('change', (e) => {
        const selectedApartment = apts.find(apt => apt.name === e.target.value);
        if (selectedApartment) {
            locationSelect.value = selectedApartment.location;
        }
    });
}

window.addTenantNameField = addTenantNameField;
window.removeTenantName = removeTenantName;

function openManageModal(apartment = null) {
    const modal = document.getElementById('manageApartmentsModal');
    const form = document.getElementById('manageApartmentForm');
    const title = document.getElementById('manageModalTitle');

    if (apartment) {
        title.textContent = 'Edit Apartment';
        document.getElementById('manageApartmentId').value = apartment.id;
        document.getElementById('manageApartmentName').value = apartment.name;
        document.getElementById('manageUnit').value = apartment.unit || '';
        document.getElementById('manageLocation').value = apartment.location;
        document.getElementById('managePrice').value = apartment.price;
    } else {
        title.textContent = 'Manage Apartment';
        form.reset();
        document.getElementById('manageApartmentId').value = '';
    }

    modal.classList.remove('hidden');
}

function closeManageModal() {
    document.getElementById('manageApartmentsModal').classList.add('hidden');
    document.getElementById('manageApartmentForm').reset();
}

async function handleManageSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('manageApartmentId').value;
    const data = {
        name: document.getElementById('manageApartmentName').value,
        unit: document.getElementById('manageUnit').value,
        location: document.getElementById('manageLocation').value,
        price: parseFloat(document.getElementById('managePrice').value)
    };

    try {
        if (id) {
            await api.updateApartment(id, data);
            showSuccess('Apartment updated successfully!');
        } else {
            await api.createApartment(data);
            showSuccess('Apartment added successfully!');
        }
        await loadApartments();
        document.getElementById('manageApartmentForm').reset();
        document.getElementById('manageApartmentId').value = '';
        document.getElementById('manageModalTitle').textContent = 'Manage Apartment';
    } catch (error) {
        showError('Failed to save apartment. Please try again.');
        console.error(error);
    }
}

function addTenantNameField() {
    const container = document.getElementById('tenantNamesContainer');
    const div = document.createElement('div');
    div.className = 'flex gap-2 mb-2';
    div.innerHTML = `
        <input type="text" name="tenantName" placeholder="Enter tenant name" required
               class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
        <button type="button" onclick="removeTenantName(this)" class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
    
    const firstRemoveBtn = container.querySelector('.flex.gap-2:first-child button');
    if (container.children.length > 1 && firstRemoveBtn) {
        firstRemoveBtn.classList.remove('hidden');
    }
}

function removeTenantName(btn) {
    const container = document.getElementById('tenantNamesContainer');
    btn.parentElement.remove();
    
    if (container.children.length === 1) {
        const firstRemoveBtn = container.querySelector('.flex.gap-2:first-child button');
        if (firstRemoveBtn) {
            firstRemoveBtn.classList.add('hidden');
        }
    }
}

