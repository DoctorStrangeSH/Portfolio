// ==================== places.js ====================
const db = window.db;

window.places = [];
window.currentFilter = 'all';
window.searchQuery = '';

// ========== КАТЕГОРИИ ==========
const CATEGORIES = {
    city: { emoji: '🏙️', name: 'Город' },
    nature: { emoji: '🌲', name: 'Природа' },
    mountains: { emoji: '🏔️', name: 'Горы' },
    beach: { emoji: '🏖️', name: 'Пляж' },
    sight: { emoji: '🏛️', name: 'Достопримечательность' },
    entertainment: { emoji: '🎭', name: 'Развлечение' },
    food: { emoji: '🍽️', name: 'Гастрономия' },
    other: { emoji: '📌', name: 'Другое' }
};

// ========== ПУТЬ К КОЛЛЕКЦИИ ==========
window.getCollectionPath = function () {
    if (window.currentList === 'my') return `users/${window.currentUser.uid}/places`;
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
                id: doc.id, ...doc.data(), _firestoreId: doc.id
            });
        });
        
        window.places.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        renderAll();
        renderCategoryFilters();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
};

// ========== ФИЛЬТРЫ КАТЕГОРИЙ ==========
function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;
    
    const allPlaces = window.places;
    const usedCategories = new Set(allPlaces.map(p => p.category || 'other'));
    
    let html = `<span class="category-chip ${window.currentFilter === 'all' ? 'active' : ''}" data-cat="all">Все (${allPlaces.length})</span>`;
    
    Object.entries(CATEGORIES).forEach(([key, val]) => {
        if (usedCategories.has(key) || window.currentFilter === key) {
            const count = allPlaces.filter(p => (p.category || 'other') === key).length;
            html += `<span class="category-chip ${window.currentFilter === key ? 'active' : ''}" data-cat="${key}">${val.emoji} ${val.name} (${count})</span>`;
        }
    });
    
    container.innerHTML = html;
    
    container.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            window.currentFilter = chip.dataset.cat;
            renderAll();
            renderCategoryFilters();
        });
    });
}

// ========== ПОЛУЧИТЬ ОТФИЛЬТРОВАННЫЕ МЕСТА ==========
function getFilteredPlaces() {
    let filtered = window.places;
    
    // Фильтр по категории
    if (window.currentFilter !== 'all') {
        filtered = filtered.filter(p => (p.category || 'other') === window.currentFilter);
    }
    
    // Поиск
    if (window.searchQuery) {
        const q = window.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.description || '').toLowerCase().includes(q)
        );
    }
    
    return filtered;
}

// ========== ОТРИСОВКА ==========
function renderAll() {
    const filtered = getFilteredPlaces();
    const wishlist = filtered.filter(p => p.status === 'want');
    const visited = filtered.filter(p => p.status === 'visited');
    
    document.getElementById('wishlistCount').textContent = wishlist.length;
    document.getElementById('visitedCount').textContent = visited.length;
    
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
        setTimeout(() => {
            const addBtn = emptyMsg.querySelector('.switch-to-add');
            if (addBtn) addBtn.onclick = () => {
                const addTab = document.querySelector('#mainTabs button[data-bs-target="#addTab"]');
                if (addTab) new bootstrap.Tab(addTab).show();
            };
        }, 100);
        return;
    }
    
    emptyMsg.classList.add('d-none');
    
    placesArray.forEach((place, index) => {
        const card = createPlaceCard(place, index);
        container.appendChild(card);
    });
    
    attachCardHandlers();
}

// ========== КАРТОЧКА ==========
function createPlaceCard(place, index) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in-up';
    col.style.animationDelay = `${index * 0.05}s`;
    
    const priorityMap = {
        high: { class: 'priority-high', emoji: '🔥' },
        medium: { class: 'priority-medium', emoji: '🙂' },
        low: { class: 'priority-low', emoji: '💭' }
    };
    const priority = priorityMap[place.priority] || priorityMap.medium;
    
    const cat = CATEGORIES[place.category] || CATEGORIES.other;
    
    const photos = place.photos || [];
    const mainPhoto = photos.length > 0 
        ? photos[0] 
        : 'https://placehold.co/400x200/e2e8f0/64748b?text=Нет+фото';
    
    const photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');
    
    // Миниатюры
    let thumbnailsHTML = '';
    if (photos.length > 1) {
        thumbnailsHTML = '<div class="d-flex gap-1 mt-2 flex-wrap">';
        photos.forEach((photo, i) => {
            thumbnailsHTML += `<img src="${photo}" class="photo-thumb" 
                onclick="event.stopPropagation();window.openGallery(${photosJson},${i})" alt="Фото">`;
        });
        thumbnailsHTML += '</div>';
    }
    
    // Альбом
    let albumHTML = '';
    if (place.album) {
        albumHTML = `<a href="${place.album}" target="_blank" class="btn btn-sm btn-outline-info mt-2 w-100">
            <i class="bi bi-images me-1"></i>Альбом</a>`;
    }
    
    // Звёзды
    let starsHTML = '';
    if (place.status === 'visited') {
        const f = '<i class="bi bi-star-fill active"></i>'.repeat(place.rating || 0);
        const e = '<i class="bi bi-star"></i>'.repeat(5 - (place.rating || 0));
        starsHTML = `<div class="d-flex justify-content-between align-items-center mt-2">
            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${place.date || '—'}</small>
            <span class="star-rating">${f}${e}</span></div>`;
    }
    
    // Автор
    let authorHTML = '';
    if (place.author && window.currentList !== 'my') {
        authorHTML = `<small class="text-muted d-block mb-1">✍️ ${place.author}</small>`;
    }
    
    // Кнопка "Был здесь"
    let markBtn = '';
    if (place.status === 'want') {
        markBtn = `<button class="btn btn-sm btn-outline-success mark-btn" data-id="${place._firestoreId}">
            <i class="bi bi-check-lg me-1"></i>Был(а) здесь</button>`;
    }
    
    col.innerHTML = `
        <div class="card h-100 shadow-sm ${priority.class} mb-3 position-relative">
            <span class="category-badge">${cat.emoji} ${cat.name}</span>
            <img src="${mainPhoto}" class="card-img-top" alt="${place.name}"
                 ${photos.length > 0 ? `onclick="window.openGallery(${photosJson},0)" style="cursor:pointer"` : ''}>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${priority.emoji} ${place.name}</h5>
                ${authorHTML}
                <p class="card-text text-muted small flex-grow-1">${place.description || ''}</p>
                ${thumbnailsHTML}
                ${starsHTML}
                ${albumHTML}
                <div class="mt-2 d-flex gap-1">
                    ${markBtn}
                    <button class="btn btn-sm btn-outline-warning edit-btn" data-id="${place._firestoreId}">
                        <i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger del-btn" data-id="${place._firestoreId}">
                        <i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>`;
    
    return col;
}

// ========== ОБРАБОТЧИКИ ==========
function attachCardHandlers() {
    document.querySelectorAll('.mark-btn').forEach(btn => {
        btn.onclick = async () => {
            await window.updateDoc(window.doc(db, window.getCollectionPath(), btn.dataset.id), {
                status: 'visited',
                date: new Date().toISOString().split('T')[0],
                rating: 0
            });
            await window.loadPlaces();
        };
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => {
            const place = window.places.find(p => p._firestoreId === btn.dataset.id);
            if (!place) return;
            fillForm(place);
            new bootstrap.Tab(document.querySelector('#mainTabs button[data-bs-target="#addTab"]')).show();
        };
    });
    
    document.querySelectorAll('.del-btn').forEach(btn => {
        btn.onclick = async () => {
            const place = window.places.find(p => p._firestoreId === btn.dataset.id);
            if (!confirm(`Удалить "${place?.name || 'место'}"?`)) return;
            await window.deleteDoc(window.doc(db, window.getCollectionPath(), btn.dataset.id));
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
    document.getElementById('categoryInput').value = place.category || 'other';
    document.getElementById('statusInput').value = place.status;
    
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Редактировать';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-check-lg me-1"></i>Сохранить';
    document.getElementById('cancelEditBtn').classList.remove('d-none');
    
    const vf = document.getElementById('visitedFields');
    if (place.status === 'visited') {
        vf.classList.remove('d-none');
        document.getElementById('dateInput').value = place.date || '';
        setupStarRating(place.rating || 0);
    } else {
        vf.classList.add('d-none');
        setupStarRating(0);
    }
}

function setupStarRating(initial = 0) {
    const c = document.getElementById('starRating');
    if (!c) return;
    c.innerHTML = '';
    const ri = document.getElementById('ratingInput');
    if (ri) ri.value = initial;
    for (let i = 1; i <= 5; i++) {
        const s = document.createElement('i');
        s.className = i <= initial ? 'bi bi-star-fill active' : 'bi bi-star';
        s.dataset.value = i; s.style.cursor = 'pointer';
        s.addEventListener('mouseenter', () => c.querySelectorAll('i').forEach((st, idx) => st.className = idx < i ? 'bi bi-star-fill active' : 'bi bi-star'));
        s.addEventListener('mouseleave', () => { const v = parseInt(ri?.value)||0; c.querySelectorAll('i').forEach((st, idx) => st.className = idx < v ? 'bi bi-star-fill active' : 'bi bi-star'); });
        s.addEventListener('click', () => { if(ri) ri.value = i; c.querySelectorAll('i').forEach((st, idx) => st.className = idx < i ? 'bi bi-star-fill active' : 'bi bi-star'); });
        c.appendChild(s);
    }
}
window.setupStarRating = setupStarRating;

window.openGallery = function (photos, start = 0) {
    if (!photos?.length) return;
    const modal = new bootstrap.Modal(document.getElementById('photoModal'));
    const mp = document.getElementById('modalMainPhoto');
    const tc = document.getElementById('modalThumbnails');
    let idx = start;
    function show(i) { idx = i; mp.src = photos[i]; tc.querySelectorAll('img').forEach((t,j) => t.classList.toggle('active-thumb', j===i)); }
    tc.innerHTML = '';
    photos.forEach((p,i) => { const t = document.createElement('img'); t.src = p; t.className = 'photo-thumb'; if(i===start) t.classList.add('active-thumb'); t.addEventListener('click', () => show(i)); tc.appendChild(t); });
    show(start); modal.show();
};

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

// Кнопки формы
document.getElementById('cancelEditBtn')?.addEventListener('click', resetForm);
document.getElementById('statusInput')?.addEventListener('change', function() {
    const vf = document.getElementById('visitedFields');
    if (this.value === 'visited') { vf.classList.remove('d-none'); setupStarRating(parseInt(document.getElementById('ratingInput')?.value)||0); }
    else vf.classList.add('d-none');
});

// Отправка формы
document.getElementById('placeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    const name = document.getElementById('nameInput').value.trim();
    if (!name) return alert('Введите название!');
    
    const pr = document.getElementById('photosInput').value.trim();
    const status = document.getElementById('statusInput').value;
    
    const data = {
        name,
        category: document.getElementById('categoryInput').value,
        photos: pr ? pr.split(',').map(s => s.trim()).filter(s => s) : [],
        album: document.getElementById('albumInput').value.trim() || '',
        description: document.getElementById('descInput').value.trim(),
        priority: document.getElementById('priorityInput').value,
        status,
        date: status === 'visited' ? document.getElementById('dateInput').value : '',
        rating: status === 'visited' ? parseInt(document.getElementById('ratingInput').value) || 0 : 0,
        author: window.currentUser?.displayName?.split(' ')[0] || 'Я',
        updatedAt: Date.now()
    };
    
    try {
        if (editId) {
            await window.updateDoc(window.doc(db, window.getCollectionPath(), editId), data);
        } else {
            data.createdAt = Date.now();
            await window.addDoc(window.collection(db, window.getCollectionPath()), data);
        }
        resetForm();
        await window.loadPlaces();
        new bootstrap.Tab(document.querySelector('#mainTabs button[data-bs-target="#wishlistTab"]')).show();
        alert(editId ? '✅ Место обновлено!' : '✅ Место добавлено!');
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('❌ Ошибка: ' + (error.message || 'Не удалось сохранить'));
    }
});

// Поиск
document.getElementById('searchInput')?.addEventListener('input', function() {
    window.searchQuery = this.value;
    renderAll();
    renderCategoryFilters();
});

// Кнопки "Добавить первое"
document.addEventListener('click', (e) => {
    if (e.target.closest('.switch-to-add')) {
        new bootstrap.Tab(document.querySelector('#mainTabs button[data-bs-target="#addTab"]')).show();
    }
});

setupStarRating(0);
console.log('✅ places.js v2 загружен (категории, поиск, фильтры)');