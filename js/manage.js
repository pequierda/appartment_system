let apartments = [];

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
        if (typeof updateTenantDropdowns === 'function') {
            updateTenantDropdowns();
        }
    } catch (error) {
        console.error('Error loading apartments:', error);
    }
}

window.loadApartments = loadApartments;
window.updateTenantDropdowns = updateTenantDropdowns;

function updateTenantDropdowns() {
    const apartmentSelect = document.getElementById('tenantApartmentName');
    const locationSelect = document.getElementById('tenantLocation');
    
    if (!apartmentSelect || !locationSelect) return;

    apartmentSelect.innerHTML = '<option value="">Select Apartment</option>';
    locationSelect.innerHTML = '<option value="">Select Location</option>';

    const uniqueLocations = [...new Set(apartments.map(apt => apt.location))];

    apartments.forEach(apt => {
        const option = document.createElement('option');
        option.value = apt.name;
        option.textContent = `${apt.name} - ${apt.unit}`;
        apartmentSelect.appendChild(option);
    });

    uniqueLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationSelect.appendChild(option);
    });

    apartmentSelect.addEventListener('change', (e) => {
        const selectedApartment = apartments.find(apt => apt.name === e.target.value);
        if (selectedApartment) {
            locationSelect.value = selectedApartment.location;
        }
    });
}

window.addTenantNameField = addTenantNameField;
window.removeTenantName = removeTenantName;
}

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
        } else {
            await api.createApartment(data);
        }
        closeManageModal();
        await loadApartments();
        showSuccess(id ? 'Apartment updated successfully!' : 'Apartment added successfully!');
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

