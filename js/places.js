// ==================== places.js v3 ====================
// Карта, дневник, бюджет, слайдер фото, время добавления, счётчик

const db = window.db;

window.places = [];
window.currentFilter = 'all';
window.searchQuery = '';
window.map = null;
window.mapMarkers = [];

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

// ========== КОЛЛЕКЦИЯ ==========
window.getCollectionPath = function () {
    if (window.currentList === 'my') return `users/${window.currentUser.uid}/places`;
    const fid = window.currentList.replace('shared_', '');
    return `shared/${[window.currentUser.uid, fid].sort().join('_')}/places`;
};

// ========== ЗАГРУЗКА ==========
window.loadPlaces = async function () {
    if (!window.currentUser) return;
    try {
        const path = window.getCollectionPath();
        const q = window.query(window.collection(db, path));
        const snap = await window.getDocs(q);
        window.places = [];
        snap.forEach(d => window.places.push({ id: d.id, ...d.data(), _firestoreId: d.id }));
        window.places.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        renderAll();
        renderCategoryFilters();
        if (document.querySelector('#mapTab.active') && window.map) {
            renderMapMarkers();
        }
        updateBudgetSummary();
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
};

// ========== ВРЕМЯ ДОБАВЛЕНИЯ ==========
function timeAgo(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'только что';
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} дн. назад`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} нед. назад`;
    const months = Math.floor(days / 30);
    return `${months} мес. назад`;
}

// ========== ФОРМАТИРОВАНИЕ БЮДЖЕТА ==========
function formatBudget(amount) {
    if (!amount) return '';
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + ' млн ₽';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + ' тыс ₽';
    return amount + ' ₽';
}

// ========== ФИЛЬТРЫ ==========
function renderCategoryFilters() {
    const c = document.getElementById('categoryFilters');
    if (!c) return;
    const used = new Set(window.places.map(p => p.category || 'other'));
    let h = `<span class="category-chip ${window.currentFilter === 'all' ? 'active' : ''}" data-cat="all">Все (${window.places.length})</span>`;
    Object.entries(CATEGORIES).forEach(([k, v]) => {
        if (used.has(k) || window.currentFilter === k) {
            const cnt = window.places.filter(p => (p.category || 'other') === k).length;
            h += `<span class="category-chip ${window.currentFilter === k ? 'active' : ''}" data-cat="${k}">${v.emoji} ${v.name} (${cnt})</span>`;
        }
    });
    c.innerHTML = h;
    c.querySelectorAll('.category-chip').forEach(ch => {
        ch.addEventListener('click', () => {
            window.currentFilter = ch.dataset.cat;
            renderAll();
            renderCategoryFilters();
        });
    });
}

function getFilteredPlaces() {
    let arr = window.places;
    if (window.currentFilter !== 'all') arr = arr.filter(p => (p.category || 'other') === window.currentFilter);
    if (window.searchQuery) {
        const q = window.searchQuery.toLowerCase();
        arr = arr.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    return arr;
}

// ========== БЮДЖЕТ ==========
function updateBudgetSummary() {
    const visited = window.places.filter(p => p.status === 'visited' && p.budget);
    const total = visited.reduce((s, p) => s + (parseInt(p.budget) || 0), 0);
    const container = document.getElementById('budgetSummary');
    if (container) {
        if (total > 0) {
            container.innerHTML = `💰 Общий бюджет путешествий: <strong>${formatBudget(total)}</strong> (${visited.length} поездок)`;
            container.classList.remove('d-none');
        } else {
            container.classList.add('d-none');
        }
    }
}

// ========== ОТРИСОВКА ==========
function renderAll() {
    const filtered = getFilteredPlaces();
    const wish = filtered.filter(p => p.status === 'want');
    const vis = filtered.filter(p => p.status === 'visited');
    document.getElementById('wishlistCount').textContent = wish.length;
    document.getElementById('visitedCount').textContent = vis.length;
    renderSection('wishlistContainer', wish, 'wishlistEmpty');
    renderSection('visitedContainer', vis, 'visitedEmpty');
}

window.renderAll = renderAll;

function renderSection(cid, arr, eid) {
    const c = document.getElementById(cid);
    const e = document.getElementById(eid);
    if (!c || !e) return;
    c.innerHTML = '';
    if (arr.length === 0) {
        e.classList.remove('d-none');
        setTimeout(() => {
            const b = e.querySelector('.switch-to-add');
            if (b) b.onclick = () => {
                const t = document.querySelector('#mainTabs button[data-bs-target="#addTab"]');
                if (t) new bootstrap.Tab(t).show();
            };
        }, 100);
        return;
    }
    e.classList.add('d-none');
    arr.forEach((p, i) => c.appendChild(createCard(p, i)));
    attachHandlers();
}

// ========== КАРТОЧКА (СЛАЙДЕР + БЮДЖЕТ + ВРЕМЯ + СЧЁТЧИК) ==========
function createCard(place, index) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in-up';
    col.style.animationDelay = `${index * 0.04}s`;

    const pmap = { high: { c: 'priority-high', e: '🔥' }, medium: { c: 'priority-medium', e: '🙂' }, low: { c: 'priority-low', e: '💭' } };
    const pr = pmap[place.priority] || pmap.medium;
    const cat = CATEGORIES[place.category] || CATEGORIES.other;

    const photos = place.photos || [];
    const mainPhoto = photos.length > 0 ? photos[0] : 'https://placehold.co/400x200/e2e8f0/64748b?text=Нет+фото';
    const photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');

    // Слайдер
    let sliderHTML = '';
    if (photos.length > 1) {
        sliderHTML = `
            <div class="photo-slider" id="slider-${place._firestoreId}">
                <img src="${mainPhoto}" class="card-img-top" alt="${place.name}" style="cursor:pointer" onclick="window.openGallery(${photosJson},0)">
                <button class="slider-btn slider-prev" onclick="event.stopPropagation();window.slidePhoto('${place._firestoreId}',-1)"><i class="bi bi-chevron-left"></i></button>
                <button class="slider-btn slider-next" onclick="event.stopPropagation();window.slidePhoto('${place._firestoreId}',1)"><i class="bi bi-chevron-right"></i></button>
                <div class="slider-dots">${photos.map((_, i) => `<span class="slider-dot ${i===0?'active':''}" onclick="event.stopPropagation();window.slideTo('${place._firestoreId}',${i})"></span>`).join('')}</div>
            </div>`;
    } else {
        sliderHTML = `<img src="${mainPhoto}" class="card-img-top" alt="${place.name}" ${photos.length>0?`onclick="window.openGallery(${photosJson},0)" style="cursor:pointer"`:''}>`;
    }

    // Бюджет
    const budgetBadge = place.budget ? `<span class="budget-badge">💰 ${formatBudget(place.budget)}</span>` : '';

    // Время
    const timeStr = timeAgo(place.createdAt);

    // Счётчик
    const views = place.views || 0;

    // Звёзды
    let starsHTML = '';
    if (place.status === 'visited') {
        const f = '<i class="bi bi-star-fill active"></i>'.repeat(place.rating || 0);
        const em = '<i class="bi bi-star"></i>'.repeat(5 - (place.rating || 0));
        starsHTML = `<div class="d-flex justify-content-between align-items-center mt-2"><small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${place.date||'—'}</small><span class="star-rating">${f}${em}</span></div>`;
    }

    let authorHTML = '';
    if (place.author && window.currentList !== 'my') authorHTML = `<small class="text-muted d-block mb-1">✍️ ${place.author}</small>`;

    let markBtn = '';
    if (place.status === 'want') {
        markBtn = `<button class="btn btn-sm btn-outline-success mark-btn" data-id="${place._firestoreId}"><i class="bi bi-check-lg me-1"></i>Был(а)</button>`;
    }

    // Дневник
    const diaryCount = (place.diary || []).length;
    const diaryBadge = diaryCount > 0 ? `<span class="badge bg-info ms-1">📝 ${diaryCount}</span>` : '';

    col.innerHTML = `
        <div class="card h-100 shadow-sm ${pr.c} mb-3 position-relative">
            ${budgetBadge}
            <span class="category-badge">${cat.emoji} ${cat.name}</span>
            ${sliderHTML}
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${pr.e} ${place.name}${diaryBadge}</h5>
                ${authorHTML}
                <p class="card-text text-muted small flex-grow-1">${place.description || ''}</p>
                ${starsHTML}
                <div class="d-flex justify-content-between align-items-center mt-1">
                    <span class="time-ago">${timeStr}</span>
                    <span class="view-count"><i class="bi bi-eye me-1"></i>${views}</span>
                </div>
                <div class="mt-2 d-flex gap-1 flex-wrap">
                    ${markBtn}
                    <button class="btn btn-sm btn-outline-info detail-btn" data-id="${place._firestoreId}"><i class="bi bi-journal-text"></i></button>
                    <button class="btn btn-sm btn-outline-warning edit-btn" data-id="${place._firestoreId}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger del-btn" data-id="${place._firestoreId}"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>`;

    // Сохраняем фото для слайдера
    if (!window.sliderData) window.sliderData = {};
    window.sliderData[place._firestoreId] = { photos, current: 0 };

    return col;
}

// ========== СЛАЙДЕР ==========
window.slidePhoto = function (id, dir) {
    const data = window.sliderData?.[id];
    if (!data) return;
    data.current = (data.current + dir + data.photos.length) % data.photos.length;
    updateSlider(id);
};

window.slideTo = function (id, idx) {
    const data = window.sliderData?.[id];
    if (!data) return;
    data.current = idx;
    updateSlider(id);
};

function updateSlider(id) {
    const data = window.sliderData?.[id];
    if (!data) return;
    const slider = document.getElementById('slider-' + id);
    if (!slider) return;
    const img = slider.querySelector('img');
    const dots = slider.querySelectorAll('.slider-dot');
    if (img) img.src = data.photos[data.current];
    dots.forEach((d, i) => d.classList.toggle('active', i === data.current));
}

// ========== ОБРАБОТЧИКИ ==========
function attachHandlers() {
    document.querySelectorAll('.mark-btn').forEach(b => {
        b.onclick = async () => {
            await window.updateDoc(window.doc(db, window.getCollectionPath(), b.dataset.id), {
                status: 'visited', date: new Date().toISOString().split('T')[0], rating: 0
            });
            await window.loadPlaces();
        };
    });
    document.querySelectorAll('.edit-btn').forEach(b => {
        b.onclick = () => {
            const p = window.places.find(x => x._firestoreId === b.dataset.id);
            if (!p) return;
            fillForm(p);
            new bootstrap.Tab(document.querySelector('#mainTabs button[data-bs-target="#addTab"]')).show();
        };
    });
    document.querySelectorAll('.del-btn').forEach(b => {
        b.onclick = async () => {
            const p = window.places.find(x => x._firestoreId === b.dataset.id);
            if (!confirm(`Удалить "${p?.name || 'место'}"?`)) return;
            await window.deleteDoc(window.doc(db, window.getCollectionPath(), b.dataset.id));
            await window.loadPlaces();
        };
    });
    document.querySelectorAll('.detail-btn').forEach(b => {
        b.onclick = async () => {
            const p = window.places.find(x => x._firestoreId === b.dataset.id);
            if (!p) return;
            // Увеличиваем счётчик
            await window.updateDoc(window.doc(db, window.getCollectionPath(), b.dataset.id), {
                views: (p.views || 0) + 1
            });
            p.views = (p.views || 0) + 1;
            showDetailModal(p);
        };
    });
}

// ========== МОДАЛКА ДЕТАЛЕЙ (ДНЕВНИК) ==========
function showDetailModal(place) {
    document.getElementById('detailTitle').textContent = place.name;
    const cat = CATEGORIES[place.category] || CATEGORIES.other;
    
    let diaryHTML = '<p class="text-muted">Нет записей в дневнике</p>';
    if (place.diary && place.diary.length > 0) {
        diaryHTML = place.diary.map((entry, i) => `
            <div class="diary-entry">
                <div class="diary-date">📅 ${entry.date || 'Без даты'}</div>
                <p class="mb-1">${entry.text}</p>
                ${entry.photo ? `<img src="${entry.photo}" class="rounded mt-2" style="max-width:100%;max-height:200px">` : ''}
                <button class="btn btn-sm btn-outline-danger mt-1 del-diary-btn" data-place="${place._firestoreId}" data-index="${i}"><i class="bi bi-trash"></i></button>
            </div>
        `).join('');
    }
    
    document.getElementById('detailBody').innerHTML = `
        <p><strong>Категория:</strong> ${cat.emoji} ${cat.name}</p>
        <p><strong>Описание:</strong> ${place.description || '—'}</p>
        <p><strong>Бюджет:</strong> ${place.budget ? formatBudget(place.budget) : '—'}</p>
        <p><strong>Добавлено:</strong> ${timeAgo(place.createdAt)}</p>
        <p><strong>Просмотров:</strong> ${place.views || 0}</p>
        <hr>
        <h6>📝 Дневник</h6>
        ${diaryHTML}
        <button class="btn btn-sm btn-outline-primary mt-2" id="addDiaryFromDetail" data-place="${place._firestoreId}"><i class="bi bi-plus-lg"></i> Добавить запись</button>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('placeDetailModal'));
    modal.show();
    
    // Удаление записи дневника
    document.querySelectorAll('.del-diary-btn').forEach(b => {
        b.onclick = async () => {
            const placeId = b.dataset.place;
            const idx = parseInt(b.dataset.index);
            const p = window.places.find(x => x._firestoreId === placeId);
            if (!p) return;
            p.diary.splice(idx, 1);
            await window.updateDoc(window.doc(db, window.getCollectionPath(), placeId), { diary: p.diary });
            await window.loadPlaces();
            modal.hide();
        };
    });
    
    // Добавление записи из модалки
    document.getElementById('addDiaryFromDetail').onclick = async () => {
        const text = prompt('Текст записи:');
        if (!text) return;
        const p = window.places.find(x => x._firestoreId === place._firestoreId);
        if (!p) return;
        const diary = p.diary || [];
        diary.push({ date: new Date().toISOString().split('T')[0], text, photo: '' });
        await window.updateDoc(window.doc(db, window.getCollectionPath(), place._firestoreId), { diary });
        await window.loadPlaces();
        modal.hide();
        showDetailModal(window.places.find(x => x._firestoreId === place._firestoreId));
    };
}

// ========== ФОРМА ==========
function fillForm(place) {
    document.getElementById('editId').value = place._firestoreId;
    document.getElementById('nameInput').value = place.name;
    document.getElementById('locationInput').value = place.location || '';
    document.getElementById('photosInput').value = (place.photos || []).join(', ');
    document.getElementById('albumInput').value = place.album || '';
    document.getElementById('descInput').value = place.description || '';
    document.getElementById('priorityInput').value = place.priority || 'medium';
    document.getElementById('categoryInput').value = place.category || 'other';
    document.getElementById('budgetInput').value = place.budget || '';
    document.getElementById('statusInput').value = place.status;
    
    // Дневник в форме
    renderDiaryForm(place.diary || []);
    
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

function renderDiaryForm(diary) {
    const c = document.getElementById('diaryEntries');
    if (!c) return;
    window._tempDiary = diary || [];
    c.innerHTML = window._tempDiary.map((e, i) => `
        <div class="diary-entry d-flex gap-2 align-items-start">
            <div class="flex-grow-1">
                <input type="date" class="form-control form-control-sm mb-1 diary-date-input" value="${e.date||''}" data-idx="${i}">
                <input type="text" class="form-control form-control-sm diary-text-input" value="${e.text||''}" data-idx="${i}" placeholder="Текст записи">
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger del-diary-form-btn" data-idx="${i}"><i class="bi bi-trash"></i></button>
        </div>
    `).join('');
    
    c.querySelectorAll('.diary-date-input').forEach(inp => {
        inp.addEventListener('change', () => { window._tempDiary[inp.dataset.idx].date = inp.value; });
    });
    c.querySelectorAll('.diary-text-input').forEach(inp => {
        inp.addEventListener('change', () => { window._tempDiary[inp.dataset.idx].text = inp.value; });
    });
    c.querySelectorAll('.del-diary-form-btn').forEach(b => {
        b.addEventListener('click', () => {
            window._tempDiary.splice(b.dataset.idx, 1);
            renderDiaryForm(window._tempDiary);
        });
    });
}

document.getElementById('addDiaryEntry')?.addEventListener('click', () => {
    if (!window._tempDiary) window._tempDiary = [];
    window._tempDiary.push({ date: new Date().toISOString().split('T')[0], text: '', photo: '' });
    renderDiaryForm(window._tempDiary);
});

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

// ========== ГАЛЕРЕЯ ==========
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

// ========== КАРТА ==========
window.initMap = function () {
    if (window.map) return;
    const container = document.getElementById('mapContainer');
    if (!container) return;
    
    window.map = L.map('mapContainer').setView([55.76, 37.62], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18
    }).addTo(window.map);
    
    renderMapMarkers();
};

async function geocodeAddress(address) {
    try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const data = await resp.json();
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
    } catch (e) {}
    return null;
}

window.renderMapMarkers = async function () {
    if (!window.map) return;
    
    // Очищаем старые маркеры
    window.mapMarkers.forEach(m => window.map.removeLayer(m));
    window.mapMarkers = [];
    
    const filtered = getFilteredPlaces();
    
    for (const place of filtered) {
        let lat, lon;
        
        if (place.location) {
            const coords = await geocodeAddress(place.location);
            if (coords) {
                lat = coords.lat;
                lon = coords.lon;
            }
        }
        
        if (lat && lon) {
            const cat = CATEGORIES[place.category] || CATEGORIES.other;
            const marker = L.marker([lat, lon])
                .addTo(window.map)
                .bindPopup(`<strong>${cat.emoji} ${place.name}</strong><br>${place.description || ''}<br>${place.budget ? '💰 ' + formatBudget(place.budget) : ''}`);
            window.mapMarkers.push(marker);
        }
    }
    
    if (window.mapMarkers.length > 0) {
        const group = new L.featureGroup(window.mapMarkers);
        window.map.fitBounds(group.getBounds().pad(0.1));
    }
};

// ========== ФОРМА (ОТПРАВКА) ==========
function resetForm() {
    const form = document.getElementById('placeForm');
    if (form) form.reset();
    document.getElementById('editId').value = '';
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Новое место';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-circle me-1"></i>Добавить место';
    document.getElementById('cancelEditBtn').classList.add('d-none');
    document.getElementById('visitedFields').classList.add('d-none');
    document.getElementById('diaryEntries').innerHTML = '';
    window._tempDiary = [];
    setupStarRating(0);
}

document.getElementById('cancelEditBtn')?.addEventListener('click', resetForm);

document.getElementById('statusInput')?.addEventListener('change', function() {
    const vf = document.getElementById('visitedFields');
    if (this.value === 'visited') { vf.classList.remove('d-none'); setupStarRating(parseInt(document.getElementById('ratingInput')?.value)||0); }
    else vf.classList.add('d-none');
});

document.getElementById('placeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    const name = document.getElementById('nameInput').value.trim();
    if (!name) return alert('Введите название!');
    
    const pr = document.getElementById('photosInput').value.trim();
    const status = document.getElementById('statusInput').value;
    
    const data = {
        name,
        location: document.getElementById('locationInput').value.trim() || '',
        category: document.getElementById('categoryInput').value,
        photos: pr ? pr.split(',').map(s => s.trim()).filter(s => s) : [],
        album: document.getElementById('albumInput').value.trim() || '',
        description: document.getElementById('descInput').value.trim(),
        priority: document.getElementById('priorityInput').value,
        budget: parseInt(document.getElementById('budgetInput').value) || 0,
        diary: window._tempDiary || [],
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
            data.views = 0;
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

document.getElementById('searchInput')?.addEventListener('input', function() {
    window.searchQuery = this.value;
    renderAll();
    renderCategoryFilters();
});

document.addEventListener('click', (e) => {
    if (e.target.closest('.switch-to-add')) {
        new bootstrap.Tab(document.querySelector('#mainTabs button[data-bs-target="#addTab"]')).show();
    }
});

// ========== БЮДЖЕТ В ИНТЕРФЕЙСЕ ==========
const budgetSummary = document.createElement('div');
budgetSummary.id = 'budgetSummary';
budgetSummary.className = 'budget-summary d-none';
const tabsContainer = document.querySelector('#mainTabs')?.parentNode;
if (tabsContainer) {
    tabsContainer.insertBefore(budgetSummary, document.getElementById('mainTabs'));
}

setupStarRating(0);
console.log('✅ places.js v3 загружен (карта, дневник, бюджет, слайдер, время, счётчик)');