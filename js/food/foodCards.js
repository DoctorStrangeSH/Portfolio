// ==================== foodCards.js v2 ====================

window.createFoodCard = function(place, index) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in-up';
    col.style.animationDelay = `${index * 0.04}s`;
    
    const cuisine = window.CUISINE_TYPES[place.cuisine] || window.CUISINE_TYPES.other;
    const priceStr = window.formatPrice(place.price);
    const priceClass = `price-${place.price || 1}`;
    const photos = place.photos || [];
    const mainPhoto = photos.length > 0 ? photos[0] : 'https://placehold.co/400x200/e2e8f0/64748b?text=Нет+фото';
    const photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');
    
    let statusBadge = '';
    if (place.status === 'favourite') statusBadge = '<span class="visit-again-badge">⭐ Любимое</span>';
    else if (place.status === 'dislike') statusBadge = '<span class="visit-again-badge" style="background:rgba(220,53,69,0.9)">👎 Не понравилось</span>';
    
    let quickActions = '';
    if (place.status === 'want') quickActions = `<button class="btn btn-sm btn-outline-success food-mark-btn" data-id="${place._firestoreId}" data-status="visited"><i class="bi bi-check-lg"></i> Был</button><button class="btn btn-sm btn-outline-warning food-mark-btn" data-id="${place._firestoreId}" data-status="favourite"><i class="bi bi-star"></i> Любимое</button><button class="btn btn-sm btn-outline-danger food-mark-btn" data-id="${place._firestoreId}" data-status="dislike"><i class="bi bi-hand-thumbs-down"></i></button>`;
    else if (place.status === 'visited') quickActions = `<button class="btn btn-sm btn-outline-warning food-mark-btn" data-id="${place._firestoreId}" data-status="favourite"><i class="bi bi-star"></i> В любимые</button><button class="btn btn-sm btn-outline-danger food-mark-btn" data-id="${place._firestoreId}" data-status="dislike"><i class="bi bi-hand-thumbs-down"></i></button>`;
    else if (place.status === 'favourite' || place.status === 'dislike') quickActions = `<button class="btn btn-sm btn-outline-secondary food-mark-btn" data-id="${place._firestoreId}" data-status="visited"><i class="bi bi-arrow-repeat"></i> Переместить</button>`;
    
    col.innerHTML = `
        <div class="card h-100 shadow-sm restaurant-card mb-3 position-relative">
            ${statusBadge}
            <span class="food-type-badge position-absolute" style="top:10px;right:10px;z-index:3">${cuisine}</span>
            <img src="${mainPhoto}" class="card-img-top" alt="${place.name}" ${photos.length>0?`onclick="window.openGallery(${photosJson},0)" style="cursor:pointer"`:''}>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${place.name}</h5>
                <div class="d-flex align-items-center gap-2 mb-1"><span class="price-badge ${priceClass}">${priceStr}</span>${window.renderStars(place.rating)}</div>
                <p class="card-text text-muted small flex-grow-1">${place.description || ''}</p>
                ${place.address ? `<small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${place.address}</small>` : ''}
                ${place.bestDish ? `<small class="text-muted d-block"><i class="bi bi-star me-1"></i>Что заказать: ${place.bestDish}</small>` : ''}
                ${place.date ? `<small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${place.date}</small>` : ''}
                <div class="mt-2 d-flex gap-1 flex-wrap">
                    ${quickActions}
                    <button class="btn btn-sm btn-outline-info food-detail-btn" data-id="${place._firestoreId}"><i class="bi bi-info-circle"></i></button>
                    <button class="btn btn-sm btn-outline-warning food-edit-btn" data-id="${place._firestoreId}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger food-del-btn" data-id="${place._firestoreId}"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>`;
    return col;
};

// ========== ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ (на document) ==========
document.addEventListener('click', async (e) => {
    const markBtn = e.target.closest('.food-mark-btn');
if (markBtn) {
    const id = markBtn.dataset.id;
    const newStatus = markBtn.dataset.status;
    
    const updateData = { status: newStatus };
    if (newStatus === 'visited') {
        updateData.date = new Date().toISOString().split('T')[0];
    }
    
    await window.updateDoc(window.doc(window.db, window.getFoodCollection(), id), updateData);
    window.loadFoodPlaces();
    return;
}
    
    const editBtn = e.target.closest('.food-edit-btn');
    if (editBtn) {
        const p = window.foodState.places.find(x => x._firestoreId === editBtn.dataset.id);
        if (p) showFoodEditModal(p);
        return;
    }
    
    const delBtn = e.target.closest('.food-del-btn');
    if (delBtn) {
        const p = window.foodState.places.find(x => x._firestoreId === delBtn.dataset.id);
        if (!confirm(`Удалить "${p?.name || 'ресторан'}"?`)) return;
        await window.deleteDoc(window.doc(window.db, window.getFoodCollection(), delBtn.dataset.id));
        window.loadFoodPlaces();
        return;
    }
    
    const detailBtn = e.target.closest('.food-detail-btn');
    if (detailBtn) {
        const p = window.foodState.places.find(x => x._firestoreId === detailBtn.dataset.id);
        if (!p) return;
        document.getElementById('detailTitle').textContent = '🍽️ ' + p.name;
        document.getElementById('detailBody').innerHTML = `
            <p><strong>Кухня:</strong> ${window.CUISINE_TYPES[p.cuisine] || '—'}</p>
            <p><strong>Чек:</strong> ${window.formatPrice(p.price)}</p>
            <p><strong>Адрес:</strong> ${p.address || '—'}</p>
            <p><strong>Оценка:</strong> ${window.renderStars(p.rating)}</p>
            <p><strong>Описание:</strong> ${p.description || '—'}</p>
            <p><strong>Что заказать:</strong> ${p.bestDish || '—'}</p>
            <p><strong>Дата посещения:</strong> ${p.date || '—'}</p>
            ${p.notes ? `<hr><h6>📝 Заметки</h6><p>${p.notes}</p>` : ''}`;
        new bootstrap.Modal(document.getElementById('placeDetailModal')).show();
        return;
    }
});

// ========== МОДАЛКА ДОБАВЛЕНИЯ ==========
window.showFoodAddModal = function() {
    const old = document.getElementById('foodAddModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="foodAddModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-light"><h5 class="modal-title"><i class="bi bi-plus-circle me-2"></i>Новый ресторан</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body" id="foodAddModalBody"></div>
                </div>
            </div>
        </div>`);
    
    document.getElementById('foodAddModalBody').innerHTML = `
        <form id="foodAddForm" autocomplete="off">
            <div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label fw-medium">Название *</label><input type="text" class="form-control" id="faName" required></div><div class="col-md-6"><label class="form-label fw-medium">Тип кухни</label><select class="form-select" id="faCuisine">${Object.entries(window.CUISINE_TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div></div>
            <div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label fw-medium">Чек</label><select class="form-select" id="faPrice"><option value="1">₽ Недорого</option><option value="2" selected>₽₽ Средне</option><option value="3">₽₽₽ Дорого</option></select></div><div class="col-md-4"><label class="form-label fw-medium">Оценка</label><div class="d-flex gap-1" id="faStars"></div></div><div class="col-md-4"><label class="form-label fw-medium">Статус</label><select class="form-select" id="faStatus"><option value="want" selected>🔖 Хочу</option><option value="visited">✅ Посетил</option></select></div></div>
            <div class="mb-3"><label class="form-label fw-medium">Адрес</label><input type="text" class="form-control" id="faAddress"></div>
            <div class="mb-3"><label class="form-label fw-medium">Фото блюд</label><textarea class="form-control" id="faPhotos" rows="2" placeholder="Ссылки через запятую"></textarea></div>
            <div class="mb-3"><label class="form-label fw-medium">Описание</label><textarea class="form-control" id="faDesc" rows="2"></textarea></div>
            <div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label fw-medium">Что заказать</label><input type="text" class="form-control" id="faBestDish"></div><div class="col-md-6"><label class="form-label fw-medium">Дата посещения</label><input type="date" class="form-control" id="faDate"></div></div>
            <div class="mb-3"><label class="form-label fw-medium">📝 Заметки</label><textarea class="form-control" id="faNotes" rows="2"></textarea></div>
            <div class="d-flex gap-2"><button type="submit" class="btn btn-success flex-grow-1"><i class="bi bi-plus-circle me-1"></i>Добавить</button><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Отмена</button></div>
        </form>`;
    
    window.setupStarRating('faStars', 0);
    
    const modal = new bootstrap.Modal(document.getElementById('foodAddModal'));
    modal.show();
    
    document.getElementById('foodAddForm').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('faName').value.trim();
        if (!name) return alert('Введите название!');
        const pr = document.getElementById('faPhotos').value.trim();
        const data = {
            name, cuisine: document.getElementById('faCuisine').value,
            price: parseInt(document.getElementById('faPrice').value),
            rating: window.getStarRating('faStars'),
            status: document.getElementById('faStatus').value,
            address: document.getElementById('faAddress').value.trim(),
            photos: pr ? pr.split(',').map(s=>s.trim()).filter(s=>s) : [],
            description: document.getElementById('faDesc').value.trim(),
            bestDish: document.getElementById('faBestDish').value.trim(),
            date: document.getElementById('faDate').value,
            notes: document.getElementById('faNotes').value.trim(),
            author: window.currentUser?.displayName?.split(' ')[0]||'Я',
            createdAt: Date.now()
        };
        await window.addDoc(window.collection(window.db, window.getFoodCollection()), data);
        modal.hide();
        window.loadFoodPlaces();
        alert('✅ Ресторан добавлен!');
    };
};

// ========== МОДАЛКА РЕДАКТИРОВАНИЯ ==========
function showFoodEditModal(place) {
    const old = document.getElementById('foodEditModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="foodEditModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-light"><h5 class="modal-title">✏️ Редактировать</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body" id="foodEditModalBody"></div>
                </div>
            </div>
        </div>`);
    
    document.getElementById('foodEditModalBody').innerHTML = `
        <form id="foodEditForm" autocomplete="off">
            <div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label fw-medium">Название *</label><input type="text" class="form-control" id="feName" required value="${place.name}"></div><div class="col-md-6"><label class="form-label fw-medium">Тип кухни</label><select class="form-select" id="feCuisine">${Object.entries(window.CUISINE_TYPES).map(([k,v])=>`<option value="${k}" ${place.cuisine===k?'selected':''}>${v}</option>`).join('')}</select></div></div>
            <div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label fw-medium">Чек</label><select class="form-select" id="fePrice"><option value="1" ${place.price===1?'selected':''}>₽ Недорого</option><option value="2" ${place.price===2?'selected':''}>₽₽ Средне</option><option value="3" ${place.price===3?'selected':''}>₽₽₽ Дорого</option></select></div><div class="col-md-4"><label class="form-label fw-medium">Оценка</label><div class="d-flex gap-1" id="feStars"></div></div><div class="col-md-4"><label class="form-label fw-medium">Статус</label><select class="form-select" id="feStatus"><option value="want" ${place.status==='want'?'selected':''}>🔖 Хочу</option><option value="visited" ${place.status==='visited'?'selected':''}>✅ Посетил</option><option value="favourite" ${place.status==='favourite'?'selected':''}>⭐ Любимое</option><option value="dislike" ${place.status==='dislike'?'selected':''}>👎 Не понравилось</option></select></div></div>
            <div class="mb-3"><label class="form-label fw-medium">Адрес</label><input type="text" class="form-control" id="feAddress" value="${place.address||''}"></div>
            <div class="mb-3"><label class="form-label fw-medium">Фото блюд</label><textarea class="form-control" id="fePhotos" rows="2">${(place.photos||[]).join(', ')}</textarea></div>
            <div class="mb-3"><label class="form-label fw-medium">Описание</label><textarea class="form-control" id="feDesc" rows="2">${place.description||''}</textarea></div>
            <div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label fw-medium">Что заказать</label><input type="text" class="form-control" id="feBestDish" value="${place.bestDish||''}"></div><div class="col-md-6"><label class="form-label fw-medium">Дата посещения</label><input type="date" class="form-control" id="feDate" value="${place.date||''}"></div></div>
            <div class="mb-3"><label class="form-label fw-medium">📝 Заметки</label><textarea class="form-control" id="feNotes" rows="2">${place.notes||''}</textarea></div>
            <div class="d-flex gap-2"><button type="submit" class="btn btn-success flex-grow-1">💾 Сохранить</button><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Отмена</button></div>
        </form>`;
    
    window.setupStarRating('feStars', place.rating||0);
    
    const modal = new bootstrap.Modal(document.getElementById('foodEditModal'));
    modal.show();
    
    document.getElementById('foodEditForm').onsubmit = async (e) => {
        e.preventDefault();
        const pr = document.getElementById('fePhotos').value.trim();
        const data = {
            name: document.getElementById('feName').value.trim(),
            cuisine: document.getElementById('feCuisine').value,
            price: parseInt(document.getElementById('fePrice').value),
            rating: window.getStarRating('feStars'),
            status: document.getElementById('feStatus').value,
            address: document.getElementById('feAddress').value.trim(),
            photos: pr ? pr.split(',').map(s=>s.trim()).filter(s=>s) : [],
            description: document.getElementById('feDesc').value.trim(),
            bestDish: document.getElementById('feBestDish').value.trim(),
            date: document.getElementById('feDate').value,
            notes: document.getElementById('feNotes').value.trim(),
            updatedAt: Date.now()
        };
        await window.updateDoc(window.doc(window.db, window.getFoodCollection(), place._firestoreId), data);
        modal.hide();
        window.loadFoodPlaces();
    };
}

console.log('✅ foodCards.js загружен');