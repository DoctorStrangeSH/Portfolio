// ==================== travelCards.js v3 ====================

const REACTIONS = [
    { emoji: '❤️', key: 'love' },
    { emoji: '🔥', key: 'fire' },
    { emoji: '😍', key: 'wow' },
    { emoji: '📸', key: 'photo' },
    { emoji: '💸', key: 'money' }
];

function getSeason(dateStr) {
    if (!dateStr) return null;
    const month = new Date(dateStr).getMonth();
    if (month === 11 || month <= 1) return { emoji: '❄️', nameRu: 'Зима', color: '#0dcaf0' };
    if (month >= 2 && month <= 4) return { emoji: '🌸', nameRu: 'Весна', color: '#d63384' };
    if (month >= 5 && month <= 7) return { emoji: '☀️', nameRu: 'Лето', color: '#ffc107' };
    return { emoji: '🍂', nameRu: 'Осень', color: '#fd7e14' };
}

function getDayCounter(dateStr, status) {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (status === 'want') {
        if (diffDays > 365) return { text: `⏳ ${Math.floor(diffDays / 30)} мес.`, urgent: false };
        if (diffDays > 30) return { text: `⏳ ${Math.floor(diffDays / 7)} нед.`, urgent: false };
        if (diffDays > 0) return { text: `⏳ ${diffDays} дн.`, urgent: diffDays <= 7 };
        if (diffDays === 0) return { text: '🎉 Сегодня!', urgent: true };
        return { text: '📅 Планируется', urgent: false };
    }
    if (status === 'visited') {
        const past = Math.abs(diffDays);
        if (past === 0) return { text: 'Сегодня', urgent: false };
        if (past < 7) return { text: `${past} дн. назад`, urgent: false };
        if (past < 30) return { text: `${Math.floor(past / 7)} нед. назад`, urgent: false };
        return { text: `${Math.floor(past / 30)} мес. назад`, urgent: false };
    }
    return null;
}

window.createTravelCard = function(place, index) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in-up';
    col.style.animationDelay = `${index * 0.03}s`;
    
    const pmap = { high: { class: 'priority-high', emoji: '🔥', name: 'Очень хочу' }, medium: { class: 'priority-medium', emoji: '🙂', name: 'Интересно' }, low: { class: 'priority-low', emoji: '💭', name: 'Когда-нибудь' } };
    const pr = pmap[place.priority] || pmap.medium;
    const cat = window.TRAVEL_CATEGORIES[place.category] || window.TRAVEL_CATEGORIES.other;
    const season = getSeason(place.date);
    const dayCounter = getDayCounter(place.date, place.status);
    const photos = place.photos || [];
    const mainPhoto = photos.length > 0 ? photos[0] : 'https://placehold.co/400x250/e2e8f0/64748b?text=Нет+фото';
    const photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');
    const reactions = place.reactions || {};
    const tags = place.tags || [];
    const sliderId = `slider-${place._firestoreId}`;
    
    col.innerHTML = `
        <div class="card h-100 shadow-sm travel-card-v2 mb-3 border-0 overflow-hidden" style="border-left:5px solid ${season ? season.color : '#dee2e6'}">
            <div class="position-relative">
                ${photos.length > 1 ? `
                <div class="photo-slider" id="${sliderId}">
                    <img src="${mainPhoto}" class="card-img-top" style="cursor:pointer;height:220px;object-fit:cover" onclick="window.openGallery(${photosJson},0)">
                    <button class="slider-btn slider-prev" onclick="event.stopPropagation();window.slide_${sliderId}(-1)"><i class="bi bi-chevron-left"></i></button>
                    <button class="slider-btn slider-next" onclick="event.stopPropagation();window.slide_${sliderId}(1)"><i class="bi bi-chevron-right"></i></button>
                    <div class="slider-dots">${photos.map((_, i) => `<span class="slider-dot ${i===0?'active':''}" onclick="event.stopPropagation();window.slideTo_${sliderId}(${i})"></span>`).join('')}</div>
                </div>` : `
                <img src="${mainPhoto}" class="card-img-top" style="height:220px;object-fit:cover" ${photos.length>0?`onclick="window.openGallery(${photosJson},0)" style="cursor:pointer"`:''}>`}
                <div style="position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(transparent,rgba(0,0,0,0.7));pointer-events:none"></div>
                <h5 class="position-absolute text-white fw-bold" style="bottom:8px;left:12px;text-shadow:0 1px 3px rgba(0,0,0,0.5);font-size:1.1rem;z-index:2">${place.name}</h5>
                <div class="position-absolute d-flex gap-1" style="top:8px;left:8px;z-index:3">
                    <span class="badge bg-dark bg-opacity-50">${cat.emoji} ${cat.name}</span>
                    ${season ? `<span class="badge bg-dark bg-opacity-50">${season.emoji} ${season.nameRu}</span>` : ''}
                </div>
                ${photos.length > 1 ? `<span class="position-absolute badge bg-dark bg-opacity-50" style="top:8px;right:8px;z-index:3"><i class="bi bi-images me-1"></i>${photos.length}</span>` : ''}
            </div>
            <div class="card-body d-flex flex-column p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-light text-dark">${pr.emoji} ${pr.name}</span>
                    ${dayCounter ? `<span class="badge ${dayCounter.urgent ? 'bg-danger' : 'bg-info'}">${dayCounter.text}</span>` : ''}
                </div>
                ${place.description ? `<p class="card-text text-muted small flex-grow-1" style="line-height:1.4">${place.description}</p>` : ''}
                ${tags.length > 0 ? `<div class="d-flex flex-wrap gap-1 mb-2">${tags.map(t => `<span class="badge bg-light text-secondary" style="font-size:0.7rem;cursor:pointer" onclick="window.travelState.searchQuery='${t}';window.renderTravelContent()">#${t}</span>`).join('')}</div>` : ''}
                <div class="d-flex gap-3 text-muted small mb-2">
                    ${place.budget ? `<span><i class="bi bi-cash me-1"></i>${window.formatBudget(place.budget)}</span>` : ''}
                    ${place.diary?.length ? `<span><i class="bi bi-journal-text me-1"></i>${place.diary.length}</span>` : ''}
                    ${place.views ? `<span><i class="bi bi-eye me-1"></i>${place.views}</span>` : ''}
                </div>
                ${place.status === 'visited' ? `<div class="d-flex align-items-center gap-2 mb-2">${window.renderStars(place.rating)}</div>` : ''}
                <div class="d-flex gap-1 mb-2" id="reactions-${place._firestoreId}">
                    ${REACTIONS.map(r => `<button class="btn btn-sm btn-light reaction-btn ${(reactions[r.key] || 0) > 0 ? 'active' : ''}" data-id="${place._firestoreId}" data-reaction="${r.key}" style="border-radius:20px;padding:2px 8px;font-size:0.8rem">${r.emoji} ${reactions[r.key] || 0}</button>`).join('')}
                </div>
                <div class="mt-auto d-flex gap-1 flex-wrap">
                    ${place.status === 'want' ? `<button class="btn btn-sm btn-outline-success travel-mark-btn" data-id="${place._firestoreId}"><i class="bi bi-check-lg"></i> Посетил</button>` : ''}
                    <button class="btn btn-sm btn-outline-info travel-detail-btn" data-id="${place._firestoreId}"><i class="bi bi-info-circle"></i></button>
                    <button class="btn btn-sm btn-outline-warning travel-edit-btn" data-id="${place._firestoreId}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger travel-del-btn" data-id="${place._firestoreId}"><i class="bi bi-trash"></i></button>
                </div>
                <div class="text-end mt-1"><small class="text-muted" style="font-size:0.7rem">${window.timeAgo(place.createdAt)}</small></div>
            </div>
        </div>`;
    
    if (photos.length > 1) setTimeout(() => window.initCardSlider(sliderId, photos), 100);
    return col;
};

// ========== ОБРАБОТЧИКИ ==========
window.attachTravelHandlers = function() {
    document.querySelectorAll('.travel-mark-btn').forEach(b => {
        b.onclick = async () => {
            const p = window.travelState.places.find(x => x._firestoreId === b.dataset.id);
            if (!p) return;
            const date = prompt('📅 Дата поездки (ГГГГ-ММ-ДД):', new Date().toISOString().split('T')[0]);
            if (date === null) return;
            const rating = prompt('⭐ Оценка (1-5):', '5');
            if (rating === null) return;
            const r = Math.min(5, Math.max(1, parseInt(rating) || 5));
            await window.updateDoc(window.doc(window.db, window.getTravelCollection(), b.dataset.id), { status: 'visited', date: date || new Date().toISOString().split('T')[0], rating: r });
            window.loadTravelPlaces();
        };
    });
    
    document.querySelectorAll('.travel-edit-btn').forEach(b => {
        b.onclick = () => {
            const p = window.travelState.places.find(x => x._firestoreId === b.dataset.id);
            if (p) showTravelEditModal(p);
        };
    });
    
    document.querySelectorAll('.travel-del-btn').forEach(b => {
        b.onclick = async () => {
            const p = window.travelState.places.find(x => x._firestoreId === b.dataset.id);
            if (!confirm(`Удалить "${p?.name || 'место'}"?`)) return;
            await window.deleteDoc(window.doc(window.db, window.getTravelCollection(), b.dataset.id));
            window.loadTravelPlaces();
        };
    });
    
    document.querySelectorAll('.travel-detail-btn').forEach(b => {
        b.onclick = async () => {
            const p = window.travelState.places.find(x => x._firestoreId === b.dataset.id);
            if (!p) return;
            await window.updateDoc(window.doc(window.db, window.getTravelCollection(), b.dataset.id), { views: (p.views || 0) + 1 });
            p.views = (p.views || 0) + 1;
            window.showTravelDetail(p);
        };
    });
    
    document.querySelectorAll('.reaction-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const reaction = btn.dataset.reaction;
            const p = window.travelState.places.find(x => x._firestoreId === id);
            if (!p) return;
            const reactions = { ...(p.reactions || {}) };
            reactions[reaction] = (reactions[reaction] || 0) + 1;
            await window.updateDoc(window.doc(window.db, window.getTravelCollection(), id), { reactions });
            p.reactions = reactions;
            const container = document.getElementById(`reactions-${id}`);
            if (container) {
                container.querySelectorAll('.reaction-btn').forEach(b => {
                    const r = b.dataset.reaction;
                    const emojis = { love: '❤️', fire: '🔥', wow: '😍', photo: '📸', money: '💸' };
                    b.textContent = `${emojis[r]} ${reactions[r] || 0}`;
                    b.classList.toggle('active', (reactions[r] || 0) > 0);
                });
            }
        };
    });
};

// ========== МОДАЛЬНОЕ РЕДАКТИРОВАНИЕ ==========
function showTravelEditModal(place) {
    const old = document.getElementById('travelEditModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="travelEditModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-light"><h5 class="modal-title">✏️ Редактировать место</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body" id="travelEditModalBody"></div>
                </div>
            </div>
        </div>`);
    
    document.getElementById('travelEditModalBody').innerHTML = `
        <form id="travelEditForm" autocomplete="off">
            <div class="row g-3 mb-3">
                <div class="col-md-6"><label class="form-label fw-medium">Название *</label><input type="text" class="form-control" id="teName" required value="${place.name}"></div>
                <div class="col-md-6"><label class="form-label fw-medium">Местоположение</label><input type="text" class="form-control" id="teLocation" value="${place.location || ''}"></div>
            </div>
            <div class="row g-3 mb-3">
                <div class="col-md-4"><label class="form-label fw-medium">Категория</label><select class="form-select" id="teCategory">${Object.entries(window.TRAVEL_CATEGORIES).map(([k,v]) => `<option value="${k}" ${place.category === k ? 'selected' : ''}>${v.emoji} ${v.name}</option>`).join('')}</select></div>
                <div class="col-md-4"><label class="form-label fw-medium">Приоритет</label><select class="form-select" id="tePriority"><option value="high" ${place.priority === 'high' ? 'selected' : ''}>🔥 Очень хочу</option><option value="medium" ${place.priority === 'medium' ? 'selected' : ''}>🙂 Интересно</option><option value="low" ${place.priority === 'low' ? 'selected' : ''}>💭 Когда-нибудь</option></select></div>
                <div class="col-md-4"><label class="form-label fw-medium">Бюджет</label><input type="number" class="form-control" id="teBudget" value="${place.budget || ''}"></div>
            </div>
            <div class="mb-3"><label class="form-label fw-medium">Фото</label><textarea class="form-control" id="tePhotos" rows="2">${(place.photos || []).join(', ')}</textarea></div>
            <div class="mb-3"><label class="form-label fw-medium">Описание</label><textarea class="form-control" id="teDesc" rows="2">${place.description || ''}</textarea></div>
            <div class="mb-3"><label class="form-label fw-medium">Теги</label><input type="text" class="form-control" id="teTags" value="${(place.tags || []).join(', ')}"></div>
            <div class="mb-3"><label class="form-label fw-medium">Статус</label><select class="form-select" id="teStatus"><option value="want" ${place.status === 'want' ? 'selected' : ''}>🌍 Хочу</option><option value="visited" ${place.status === 'visited' ? 'selected' : ''}>✅ Посетил</option></select></div>
            <div id="teVisitedFields" class="${place.status === 'visited' ? '' : 'd-none'}"><div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label fw-medium">Дата</label><input type="date" class="form-control" id="teDate" value="${place.date || ''}"></div><div class="col-md-6"><label class="form-label fw-medium">Оценка</label><div class="d-flex gap-1" id="teStars"></div></div></div></div>
            <div class="d-flex gap-2"><button type="submit" class="btn btn-success flex-grow-1">💾 Сохранить</button><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Отмена</button></div>
        </form>`;
    
    window.setupStarRating('teStars', place.rating || 0);
    document.getElementById('teStatus').onchange = function() { document.getElementById('teVisitedFields').classList.toggle('d-none', this.value !== 'visited'); };
    
    const modal = new bootstrap.Modal(document.getElementById('travelEditModal'));
    modal.show();
    
    document.getElementById('travelEditForm').onsubmit = async (e) => {
        e.preventDefault();
        const status = document.getElementById('teStatus').value;
        const pr = document.getElementById('tePhotos').value.trim();
        const tr = document.getElementById('teTags').value.trim();
        const data = {
            name: document.getElementById('teName').value.trim(),
            location: document.getElementById('teLocation').value.trim(),
            category: document.getElementById('teCategory').value,
            priority: document.getElementById('tePriority').value,
            budget: parseInt(document.getElementById('teBudget').value) || 0,
            photos: pr ? pr.split(',').map(s => s.trim()).filter(s => s) : [],
            description: document.getElementById('teDesc').value.trim(),
            tags: tr ? tr.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [],
            status, date: status === 'visited' ? document.getElementById('teDate').value : '',
            rating: status === 'visited' ? window.getStarRating('teStars') : 0,
            updatedAt: Date.now()
        };
        await window.updateDoc(window.doc(window.db, window.getTravelCollection(), place._firestoreId), data);
        modal.hide();
        window.loadTravelPlaces();
    };
}

window.showTravelDetail = function(place) {
    document.getElementById('detailTitle').textContent = place.name;
    const cat = window.TRAVEL_CATEGORIES[place.category] || window.TRAVEL_CATEGORIES.other;
    const season = getSeason(place.date);
    const dayCounter = getDayCounter(place.date, place.status);
    const tags = place.tags || [];
    let diaryHTML = '<p class="text-muted">Нет записей</p>';
    if (place.diary?.length) diaryHTML = place.diary.map(e => `<div class="diary-entry"><div class="diary-date">📅 ${e.date || ''}</div><p class="mb-1">${e.text}</p></div>`).join('');
    document.getElementById('detailBody').innerHTML = `
        <div class="row mb-3"><div class="col-6"><strong>Категория:</strong> ${cat.emoji} ${cat.name}</div>${season ? `<div class="col-6"><strong>Сезон:</strong> ${season.emoji} ${season.nameRu}</div>` : ''}${dayCounter ? `<div class="col-6"><strong>Когда:</strong> ${dayCounter.text}</div>` : ''}</div>
        <p><strong>Описание:</strong> ${place.description || '—'}</p>
        <p><strong>Бюджет:</strong> ${place.budget ? window.formatBudget(place.budget) : '—'}</p>
        ${place.location ? `<p><strong>Местоположение:</strong> ${place.location}</p>` : ''}
        ${tags.length ? `<p><strong>Теги:</strong> ${tags.map(t => `<span class="badge bg-light text-dark me-1">#${t}</span>`).join('')}</p>` : ''}
        <p><strong>Добавлено:</strong> ${window.timeAgo(place.createdAt)}</p><p><strong>Просмотров:</strong> ${place.views || 0}</p>
        ${place.status === 'visited' ? `<p><strong>Оценка:</strong> ${window.renderStars(place.rating)}</p>` : ''}
        <hr><h6>📝 Дневник</h6>${diaryHTML}`;
    new bootstrap.Modal(document.getElementById('placeDetailModal')).show();
};

console.log('✅ travelCards.js загружен');