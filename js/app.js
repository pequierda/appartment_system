let apartments = [];
let filteredApartments = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    if (auth.isAuthenticated()) {
        loadApartments();
    }
}

function setupEventListeners() {
    document.getElementById('addApartmentBtn').addEventListener('click', () => openModal());
    document.getElementById('closeModal').addEventListener('click', () => closeModal());
    document.getElementById('cancelBtn').addEventListener('click', () => closeModal());
    document.getElementById('apartmentForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('closeViewModal').addEventListener('click', () => closeViewModal());
    
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('priceFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);

    document.getElementById('apartmentImage').addEventListener('change', handleImagePreview);

    document.getElementById('apartmentModal').addEventListener('click', (e) => {
        if (e.target.id === 'apartmentModal') closeModal();
    });

    document.getElementById('viewModal').addEventListener('click', (e) => {
        if (e.target.id === 'viewModal') closeViewModal();
    });
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.add('hidden');
    }
}

async function loadApartments() {
    showLoading(true);
    try {
        apartments = await api.getAllApartments();
        filteredApartments = apartments;
        renderApartments();
    } catch (error) {
        showError('Failed to load apartments. Please try again.');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function renderApartments() {
    const grid = document.getElementById('apartmentsGrid');
    const emptyState = document.getElementById('emptyState');
    const isAuthenticated = auth.isAuthenticated();
    
    if (filteredApartments.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    grid.innerHTML = filteredApartments.map(apartment => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            <div class="relative h-48 bg-gray-200">
                ${apartment.imageUrl 
                    ? `<img src="${apartment.imageUrl}" alt="${apartment.name}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center"><i class="fas fa-home text-4xl text-gray-400"></i></div>`
                }
                <div class="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    $${apartment.price}/mo
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${apartment.name}</h3>
                <p class="text-gray-600 mb-3 flex items-center">
                    <i class="fas fa-map-marker-alt text-blue-600 mr-2"></i>
                    ${apartment.location}
                </p>
                <div class="mb-4">
                    <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        apartment.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }">
                        <i class="fas ${apartment.status === 'available' ? 'fa-check-circle' : 'fa-times-circle'} mr-1"></i>
                        ${apartment.status === 'available' ? 'Available' : 'Occupied'}
                    </span>
                </div>
                <p class="text-gray-700 text-sm mb-4 line-clamp-2">${apartment.description}</p>
                <div class="flex gap-2">
                    <button onclick="viewApartment('${apartment.id}')" 
                            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                        <i class="fas fa-eye mr-2"></i>View Details
                    </button>
                    ${isAuthenticated ? `
                    <button onclick="editApartment('${apartment.id}')" 
                            class="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteApartment('${apartment.id}')" 
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

    filteredApartments = apartments.filter(apartment => {
        const matchesSearch = !searchTerm || 
            apartment.name.toLowerCase().includes(searchTerm) ||
            apartment.location.toLowerCase().includes(searchTerm) ||
            apartment.description.toLowerCase().includes(searchTerm);

        const matchesPrice = !priceFilter || checkPriceRange(apartment.price, priceFilter);

        const matchesStatus = !statusFilter || apartment.status === statusFilter;

        return matchesSearch && matchesPrice && matchesStatus;
    });

    renderApartments();
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

function openModal(apartment = null) {
    if (!auth.isAuthenticated()) {
        showError('Please login to add or edit apartments.');
        return;
    }

    const modal = document.getElementById('apartmentModal');
    const form = document.getElementById('apartmentForm');
    const title = document.getElementById('modalTitle');

    if (apartment) {
        title.textContent = 'Edit Apartment';
        document.getElementById('apartmentId').value = apartment.id;
        document.getElementById('apartmentName').value = apartment.name;
        document.getElementById('location').value = apartment.location;
        document.getElementById('price').value = apartment.price;
        document.getElementById('status').value = apartment.status || 'available';
        document.getElementById('description').value = apartment.description;
        
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        if (apartment.imageUrl) {
            previewImg.src = apartment.imageUrl;
            imagePreview.classList.remove('hidden');
        } else {
            imagePreview.classList.add('hidden');
        }
        document.getElementById('apartmentImage').value = '';
    } else {
        title.textContent = 'Add New Apartment';
        form.reset();
        document.getElementById('apartmentId').value = '';
        document.getElementById('imagePreview').classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('apartmentModal').classList.add('hidden');
    document.getElementById('apartmentForm').reset();
    document.getElementById('imagePreview').classList.add('hidden');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('apartmentId').value;
    const imageFile = document.getElementById('apartmentImage').files[0];
    let imageUrl = null;
    
    if (imageFile) {
        imageUrl = await convertImageToBase64(imageFile);
    } else {
        const existingImg = document.getElementById('previewImg').src;
        if (existingImg && existingImg.startsWith('data:') || existingImg.startsWith('http')) {
            imageUrl = existingImg;
        }
    }
    
    const data = {
        name: document.getElementById('apartmentName').value,
        location: document.getElementById('location').value,
        price: parseFloat(document.getElementById('price').value),
        status: document.getElementById('status').value,
        description: document.getElementById('description').value,
        imageUrl: imageUrl
    };

    try {
        if (id) {
            await api.updateApartment(id, data);
        } else {
            await api.createApartment(data);
        }
        closeModal();
        await loadApartments();
        showSuccess(id ? 'Apartment updated successfully!' : 'Apartment added successfully!');
    } catch (error) {
        showError('Failed to save apartment. Please try again.');
        console.error(error);
    }
}

function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function viewApartment(id) {
    try {
        const apartment = await api.getApartment(id);
        const viewContent = document.getElementById('viewContent');
        const viewTitle = document.getElementById('viewTitle');

        viewTitle.textContent = apartment.name;
        viewContent.innerHTML = `
            <div class="mb-4">
                ${apartment.imageUrl 
                    ? `<img src="${apartment.imageUrl}" alt="${apartment.name}" class="w-full h-64 object-cover rounded-lg">`
                    : `<div class="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center"><i class="fas fa-home text-6xl text-gray-400"></i></div>`
                }
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Price</p>
                    <p class="text-2xl font-bold text-blue-600">$${apartment.price}/month</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Location</p>
                    <p class="text-lg font-semibold text-gray-800">${apartment.location}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Status</p>
                    <p class="text-lg font-semibold ${
                        apartment.status === 'available' ? 'text-green-600' : 'text-red-600'
                    }">
                        <i class="fas ${apartment.status === 'available' ? 'fa-check-circle' : 'fa-times-circle'} mr-1"></i>
                        ${apartment.status === 'available' ? 'Available' : 'Occupied'}
                    </p>
                </div>
            </div>
            <div>
                <p class="text-sm text-gray-600 mb-2">Description</p>
                <p class="text-gray-800">${apartment.description}</p>
            </div>
            ${auth.isAuthenticated() ? `
            <div class="flex gap-3 mt-6">
                <button onclick="editApartment('${apartment.id}')" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-edit mr-2"></i>Edit
                </button>
                <button onclick="deleteApartment('${apartment.id}')" 
                        class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-trash mr-2"></i>Delete
                </button>
            </div>
            ` : ''}
        `;

        document.getElementById('viewModal').classList.remove('hidden');
    } catch (error) {
        showError('Failed to load apartment details.');
        console.error(error);
    }
}

function closeViewModal() {
    document.getElementById('viewModal').classList.add('hidden');
}

async function editApartment(id) {
    closeViewModal();
    try {
        const apartment = await api.getApartment(id);
        openModal(apartment);
    } catch (error) {
        showError('Failed to load apartment for editing.');
        console.error(error);
    }
}

async function deleteApartment(id) {
    if (!auth.isAuthenticated()) {
        showError('Please login to delete apartments.');
        return;
    }

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

function showLoading(show) {
    document.getElementById('loadingState').classList.toggle('hidden', !show);
}

function showError(message) {
    alert(message);
}

function showSuccess(message) {
    alert(message);
}

