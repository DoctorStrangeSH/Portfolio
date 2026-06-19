// ==================== places.js ====================
const db = window.db;

// Состояние
window.places = [];

// ========== ПОЛУЧИТЬ ПУТЬ К КОЛЛЕКЦИИ ==========
window.getCollectionPath = function () {
    if (window.currentList === 'my') {
        return `users/${window.currentUser.uid}/places`;
    }
    const friendId = window.currentList.replace('shared_', '');
    const ids = [window.currentUser.uid, friendId].sort();
    return `shared/${ids[0]}_${ids[1]}/places`;
};

// ========== ЗАГРУЗКА МЕСТ ==========
window.loadPlaces = async function () {
    if (!window.currentUser) return;
    
    try {
        const path = window.getCollectionPath();
        const q = window.query(window.collection(db, path));
        const snapshot = await window.getDocs(q);
        
        window.places = [];
        snapshot.forEach(doc => {
            window.places.push({
                id: doc.id,
                ...doc.data(),
                _firestoreId: doc.id
            });
        });
        
        window.places.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        console.log('✅ Загружено мест:', window.places.length);
        renderAll();
    } catch (error) {
        console.error('❌ Ошибка загрузки мест:', error);
    }
};

// ========== ОТРИСОВКА ==========
function renderAll() {
    const wishlist = window.places.filter(p => p.status === 'want');
    const visited = window.places.filter(p => p.status === 'visited');
    
    renderSection('wishlistContainer', wishlist, 'wishlistEmpty');
    renderSection('visitedContainer', visited, 'visitedEmpty');
}

window.renderAll = renderAll;

function renderSection(containerId, placesArray, emptyId) {
    const container = document.getElementById(containerId);
    const emptyMsg = document.getElementById(emptyId);
    
    if (!container || !emptyMsg) return;
    
    container.innerHTML = '';
    
    if (placesArray.length === 0) {
        emptyMsg.classList.remove('d-none');
        // Вешаем обработчик на кнопку "Добавить первое"
        setTimeout(() => {
            const addBtn = emptyMsg.querySelector('.switch-to-add');
            if (addBtn) {
                addBtn.onclick = function() {
                    const addTab = document.querySelector('#mainTabs button[data-bs-target="#addTab"]');
                    if (addTab) {
                        const tab = new bootstrap.Tab(addTab);
                        tab.show();
                    }
                };
            }
        }, 100);
        return;
    }
    
    emptyMsg.classList.add('d-none');
    
    placesArray.forEach(place => {
        const card = createPlaceCard(place);
        container.appendChild(card);
    });
    
    attachCardHandlers();
}

// ========== КАРТОЧКА ==========
function createPlaceCard(place) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    const priorityMap = {
        high: { class: 'priority-high', emoji: '🔥' },
        medium: { class: 'priority-medium', emoji: '🙂' },
        low: { class: 'priority-low', emoji: '💭' }
    };
    const priority = priorityMap[place.priority] || priorityMap.medium;
    
    const photos = place.photos || [];
    const mainPhoto = photos.length > 0 
        ? photos[0] 
        : 'https://placehold.co/400x200/e2e8f0/64748b?text=Нет+фото';
    
    const photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');
    
    let thumbnailsHTML = '';
    if (photos.length > 1) {
        thumbnailsHTML = '<div class="d-flex gap-1 mt-2 flex-wrap">';
        photos.forEach((photo, index) => {
            thumbnailsHTML += `
                <img src="${photo}" class="photo-thumb" 
                     onclick="event.stopPropagation(); window.openGallery(${photosJson}, ${index})"
                     alt="Фото ${index + 1}">
            `;
        });
        thumbnailsHTML += '</div>';
    }
    
    let albumHTML = '';
    if (place.album) {
        albumHTML = `
            <a href="${place.album}" target="_blank" class="btn btn-sm btn-outline-info mt-2 w-100">
                <i class="bi bi-images me-1"></i>Смотреть альбом
            </a>
        `;
    }
    
    let starsHTML = '';
    if (place.status === 'visited') {
        const filled = '<i class="bi bi-star-fill active"></i>'.repeat(place.rating || 0);
        const empty = '<i class="bi bi-star"></i>'.repeat(5 - (place.rating || 0));
        starsHTML = `
            <div class="d-flex justify-content-between align-items-center mt-2">
                <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${place.date || 'Дата не указана'}</small>
                <span class="star-rating">${filled}${empty}</span>
            </div>
        `;
    }
    
    let authorHTML = '';
    if (place.author && window.currentList !== 'my') {
        authorHTML = `<small class="text-muted d-block mb-1">✍️ ${place.author}</small>`;
    }
    
    let markButton = '';
    if (place.status === 'want') {
        markButton = `
            <button class="btn btn-sm btn-outline-success mark-btn" data-id="${place._firestoreId}">
                <i class="bi bi-check-lg me-1"></i>Был(а) здесь
            </button>
        `;
    }
    
    col.innerHTML = `
        <div class="card h-100 shadow-sm ${priority.class} mb-3">
            <img src="${mainPhoto}" class="card-img-top" alt="${place.name}"
                 ${photos.length > 0 ? `onclick="window.openGallery(${photosJson}, 0)" style="cursor:pointer"` : ''}>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${priority.emoji} ${place.name}</h5>
                ${authorHTML}
                <p class="card-text text-muted small flex-grow-1">${place.description || ''}</p>
                ${thumbnailsHTML}
                ${starsHTML}
                ${albumHTML}
                <div class="mt-2 d-flex gap-1">
                    ${markButton}
                    <button class="btn btn-sm btn-outline-warning edit-btn" data-id="${place._firestoreId}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger del-btn" data-id="${place._firestoreId}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// ========== ОБРАБОТЧИКИ ==========
function attachCardHandlers() {
    document.querySelectorAll('.mark-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            await window.updateDoc(window.doc(db, window.getCollectionPath(), id), {
                status: 'visited',
                date: new Date().toISOString().split('T')[0],
                rating: 0
            });
            await window.loadPlaces();
        };
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const place = window.places.find(p => p._firestoreId === id);
            if (!place) return;
            fillForm(place);
            const addTab = document.querySelector('#mainTabs button[data-bs-target="#addTab"]');
            if (addTab) new bootstrap.Tab(addTab).show();
        };
    });
    
    document.querySelectorAll('.del-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const place = window.places.find(p => p._firestoreId === id);
            if (!confirm(`Удалить "${place?.name || 'место'}"?`)) return;
            await window.deleteDoc(window.doc(db, window.getCollectionPath(), id));
            await window.loadPlaces();
        };
    });
}

// ========== ФОРМА ==========
function fillForm(place) {
    document.getElementById('editId').value = place._firestoreId;
    document.getElementById('nameInput').value = place.name;
    document.getElementById('photosInput').value = (place.photos || []).join(', ');
    document.getElementById('albumInput').value = place.album || '';
    document.getElementById('descInput').value = place.description || '';
    document.getElementById('priorityInput').value = place.priority || 'medium';
    document.getElementById('statusInput').value = place.status;
    
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Редактировать';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-check-lg me-1"></i>Сохранить';
    document.getElementById('cancelEditBtn').classList.remove('d-none');
    
    const visitedFields = document.getElementById('visitedFields');
    if (place.status === 'visited') {
        visitedFields.classList.remove('d-none');
        document.getElementById('dateInput').value = place.date || '';
        setupStarRating(place.rating || 0);
    } else {
        visitedFields.classList.add('d-none');
        setupStarRating(0);
    }
}

function setupStarRating(initial = 0) {
    const container = document.getElementById('starRating');
    if (!container) return;
    container.innerHTML = '';
    const ratingInput = document.getElementById('ratingInput');
    if (ratingInput) ratingInput.value = initial;
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = i <= initial ? 'bi bi-star-fill active' : 'bi bi-star';
        star.dataset.value = i;
        star.style.cursor = 'pointer';
        
        star.addEventListener('mouseenter', () => {
            container.querySelectorAll('i').forEach((s, idx) => {
                s.className = idx < i ? 'bi bi-star-fill active' : 'bi bi-star';
            });
        });
        
        star.addEventListener('mouseleave', () => {
            const val = parseInt(ratingInput?.value) || 0;
            container.querySelectorAll('i').forEach((s, idx) => {
                s.className = idx < val ? 'bi bi-star-fill active' : 'bi bi-star';
            });
        });
        
        star.addEventListener('click', () => {
            if (ratingInput) ratingInput.value = i;
            container.querySelectorAll('i').forEach((s, idx) => {
                s.className = idx < i ? 'bi bi-star-fill active' : 'bi bi-star';
            });
        });
        
        container.appendChild(star);
    }
}

window.setupStarRating = setupStarRating;

// ========== ГАЛЕРЕЯ ==========
window.openGallery = function (photos, startIndex = 0) {
    if (!photos || photos.length === 0) return;
    
    const modalEl = document.getElementById('photoModal');
    if (!modalEl) return;
    
    const modal = new bootstrap.Modal(modalEl);
    const mainPhoto = document.getElementById('modalMainPhoto');
    const thumbnailsContainer = document.getElementById('modalThumbnails');
    let currentIndex = startIndex;
    
    function showPhoto(index) {
        currentIndex = index;
        mainPhoto.src = photos[index];
        thumbnailsContainer.querySelectorAll('img').forEach((thumb, i) => {
            thumb.classList.toggle('active-thumb', i === index);
        });
    }
    
    thumbnailsContainer.innerHTML = '';
    photos.forEach((photo, index) => {
        const thumb = document.createElement('img');
        thumb.src = photo;
        thumb.className = 'photo-thumb';
        if (index === startIndex) thumb.classList.add('active-thumb');
        thumb.addEventListener('click', () => showPhoto(index));
        thumbnailsContainer.appendChild(thumb);
    });
    
    showPhoto(startIndex);
    modal.show();
};

// ========== ФОРМА ДОБАВЛЕНИЯ ==========
function resetForm() {
    const form = document.getElementById('placeForm');
    if (form) form.reset();
    document.getElementById('editId').value = '';
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Новое место';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-circle me-1"></i>Добавить место';
    document.getElementById('cancelEditBtn').classList.add('d-none');
    document.getElementById('visitedFields').classList.add('d-none');
    setupStarRating(0);
}

// Кнопка "Отмена"
document.getElementById('cancelEditBtn')?.addEventListener('click', resetForm);

// Переключение статуса
document.getElementById('statusInput')?.addEventListener('change', function () {
    const visitedFields = document.getElementById('visitedFields');
    if (this.value === 'visited') {
        visitedFields.classList.remove('d-none');
        setupStarRating(parseInt(document.getElementById('ratingInput')?.value) || 0);
    } else {
        visitedFields.classList.add('d-none');
    }
});

// Отправка формы
document.getElementById('placeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('editId').value;
    const name = document.getElementById('nameInput').value.trim();
    
    if (!name) {
        alert('Введите название места!');
        return;
    }
    
    const photosRaw = document.getElementById('photosInput').value.trim();
    const photos = photosRaw 
        ? photosRaw.split(',').map(s => s.trim()).filter(s => s.length > 0) 
        : [];
    
    const status = document.getElementById('statusInput').value;
    
    const data = {
        name: name,
        photos: photos,
        album: document.getElementById('albumInput').value.trim() || '',
        description: document.getElementById('descInput').value.trim(),
        priority: document.getElementById('priorityInput').value,
        status: status,
        date: status === 'visited' ? document.getElementById('dateInput').value : '',
        rating: status === 'visited' ? parseInt(document.getElementById('ratingInput').value) || 0 : 0,
        author: window.currentUser?.displayName?.split(' ')[0] || 'Я',
        updatedAt: Date.now()
    };
    
    console.log('📤 Отправка данных:', data);
    console.log('📁 Коллекция:', window.getCollectionPath());
    
    try {
        if (editId) {
            await window.updateDoc(window.doc(db, window.getCollectionPath(), editId), data);
            console.log('✅ Обновлено');
        } else {
            data.createdAt = Date.now();
            const docRef = await window.addDoc(window.collection(db, window.getCollectionPath()), data);
            console.log('✅ Добавлено, ID:', docRef.id);
        }
        
        resetForm();
        await window.loadPlaces();
        
        const wishlistTab = document.querySelector('#mainTabs button[data-bs-target="#wishlistTab"]');
        if (wishlistTab) new bootstrap.Tab(wishlistTab).show();
        
        alert(editId ? '✅ Место обновлено!' : '✅ Место добавлено!');
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        alert('❌ Ошибка: ' + (error.message || 'Не удалось сохранить'));
    }
});

// Кнопки "Добавить первое" — вешаем через делегирование
document.addEventListener('click', (e) => {
    if (e.target.closest('.switch-to-add')) {
        const addTab = document.querySelector('#mainTabs button[data-bs-target="#addTab"]');
        if (addTab) new bootstrap.Tab(addTab).show();
    }
});

// Инициализация
setupStarRating(0);
console.log('✅ places.js загружен');