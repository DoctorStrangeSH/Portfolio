// ==================== foodCards.js v4 ====================

window.createFoodCard = function(place, index) {
    var col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in-up';
    col.style.animationDelay = (index * 0.04) + 's';
    
    var cuisine = window.CUISINE_TYPES[place.cuisine] || window.CUISINE_TYPES.other;
    var priceStr = window.formatPrice(place.price);
    var photos = place.photos || [];
    var mainPhoto = photos.length > 0 ? photos[0] : 'https://placehold.co/400x200/5b5fef/white?text=🍽️+Нет+фото';
    var bestDishes = place.bestDishes || (place.bestDish ? [place.bestDish] : []);
    
    var photoHTML = photos.length > 0 ?
        '<div class="position-relative"><img src="' + mainPhoto + '" class="card-img-top" style="height:170px;object-fit:cover;cursor:pointer" onclick="window.openGallery(' + JSON.stringify(photos).replace(/"/g,'&quot;') + ',0)">' +
        (photos.length > 1 ? '<span class="position-absolute badge" style="top:10px;right:10px;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)"><i class="bi bi-images me-1"></i>' + photos.length + '</span>' : '') + '</div>' :
        '<img src="' + mainPhoto + '" class="card-img-top" style="height:170px;object-fit:cover">';
    
    var statusBadge = '';
    if (place.status === 'favourite') statusBadge = '<span class="position-absolute badge" style="top:10px;left:10px;z-index:3;background:#10b981;color:white">⭐ Любимое</span>';
    else if (place.status === 'dislike') statusBadge = '<span class="position-absolute badge" style="top:10px;left:10px;z-index:3;background:#ef4444;color:white">👎 Не понравилось</span>';
    
    var quickActions = '';
    if (place.status === 'want') quickActions = '<button class="btn btn-sm btn-outline-primary food-mark-btn" data-id="' + place._firestoreId + '" data-status="visited" style="border-radius:20px"><i class="bi bi-check-lg"></i></button><button class="btn btn-sm btn-outline-success food-mark-btn" data-id="' + place._firestoreId + '" data-status="favourite" style="border-radius:20px"><i class="bi bi-star"></i></button><button class="btn btn-sm btn-outline-danger food-mark-btn" data-id="' + place._firestoreId + '" data-status="dislike" style="border-radius:20px"><i class="bi bi-hand-thumbs-down"></i></button>';
    else if (place.status === 'visited') quickActions = '<button class="btn btn-sm btn-outline-success food-mark-btn" data-id="' + place._firestoreId + '" data-status="favourite" style="border-radius:20px"><i class="bi bi-star"></i></button><button class="btn btn-sm btn-outline-danger food-mark-btn" data-id="' + place._firestoreId + '" data-status="dislike" style="border-radius:20px"><i class="bi bi-hand-thumbs-down"></i></button>';
    else quickActions = '<button class="btn btn-sm btn-outline-secondary food-mark-btn" data-id="' + place._firestoreId + '" data-status="visited" style="border-radius:20px"><i class="bi bi-arrow-repeat"></i></button>';
    
    col.innerHTML = 
        '<div class="card h-100 shadow-sm mb-3 border-0 overflow-hidden">' +
            '<div class="position-relative">' + statusBadge + photoHTML +
                '<span class="position-absolute badge" style="top:10px;right:10px;z-index:3;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)">' + cuisine + '</span>' +
            '</div>' +
            '<div class="card-body d-flex flex-column p-3">' +
                '<h6 class="card-title mb-1">' + place.name + '</h6>' +
                '<div class="d-flex align-items-center gap-2 mb-2"><span style="font-weight:700;color:' + (place.price>=3?'#ef4444':'#10b981') + '">' + priceStr + '</span>' + window.renderStars(place.rating) + '</div>' +
                (place.description ? '<p class="small flex-grow-1" style="color:var(--text-secondary)">' + place.description.substring(0, 80) + '</p>' : '') +
                (place.address ? '<small style="color:var(--text-muted)"><i class="bi bi-geo-alt me-1"></i>' + place.address + '</small>' : '') +
                (bestDishes.length > 0 ? '<small class="d-block" style="color:var(--text-muted)"><i class="bi bi-star me-1"></i>' + bestDishes.join(', ') + '</small>' : '') +
                '<div class="mt-auto d-flex gap-1 flex-wrap pt-2">' + quickActions +
                    '<button class="btn btn-sm btn-outline-secondary comment-btn" data-id="' + place._firestoreId + '" data-type="food" style="border-radius:20px"><i class="bi bi-chat-dots"></i></button>' +
                    '<button class="btn btn-sm btn-outline-secondary food-detail-btn" data-id="' + place._firestoreId + '" style="border-radius:20px"><i class="bi bi-info-circle"></i></button>' +
                    '<button class="btn btn-sm btn-outline-secondary food-edit-btn" data-id="' + place._firestoreId + '" style="border-radius:20px"><i class="bi bi-pencil"></i></button>' +
                    '<button class="btn btn-sm btn-outline-danger food-del-btn" data-id="' + place._firestoreId + '" style="border-radius:20px"><i class="bi bi-trash"></i></button>' +
                '</div>' +
            '</div>' +
        '</div>';
    return col;
};

document.addEventListener('click', async function(e) {
    var markBtn = e.target.closest('.food-mark-btn');
    if (markBtn) {
        var updateData = { status: markBtn.dataset.status };
        if (markBtn.dataset.status === 'visited') updateData.date = new Date().toISOString().split('T')[0];
        await window.updateDoc(window.doc(window.db, window.getFoodCollection(), markBtn.dataset.id), updateData);
        window.loadFoodPlaces();
        return;
    }
    
    var editBtn = e.target.closest('.food-edit-btn');
    if (editBtn) {
        var p = window.foodState.places.find(function(x) { return x._firestoreId === editBtn.dataset.id; });
        if (p) showFoodEditModal(p);
        return;
    }
    
    var delBtn = e.target.closest('.food-del-btn');
    if (delBtn) {
        if (!confirm('Удалить?')) return;
        await window.deleteDoc(window.doc(window.db, window.getFoodCollection(), delBtn.dataset.id));
        window.loadFoodPlaces();
        return;
    }
    
    var detailBtn = e.target.closest('.food-detail-btn');
    if (detailBtn) {
        var p = window.foodState.places.find(function(x) { return x._firestoreId === detailBtn.dataset.id; });
        if (!p) return;
        document.getElementById('detailTitle').textContent = '🍽️ ' + p.name;
        document.getElementById('detailBody').innerHTML = 
            '<p><strong>Кухня:</strong> ' + (window.CUISINE_TYPES[p.cuisine]||'—') + '</p>' +
            '<p><strong>Чек:</strong> ' + window.formatPrice(p.price) + '</p>' +
            '<p><strong>Оценка:</strong> ' + window.renderStars(p.rating) + '</p>' +
            '<p><strong>Описание:</strong> ' + (p.description||'—') + '</p>' +
            '<p><strong>Что заказать:</strong> ' + ((p.bestDishes||[]).join(', ')||'—') + '</p>' +
            '<button class="btn btn-sm btn-outline-primary rounded-pill mt-2" onclick="window.showComments(\'' + p._firestoreId + '\', \'food\')"><i class="bi bi-chat-dots me-1"></i>Комментарии</button>';
        new bootstrap.Modal(document.getElementById('placeDetailModal')).show();
        return;
    }
    
    var commentBtn = e.target.closest('.comment-btn');
    if (commentBtn) window.showComments(commentBtn.dataset.id, commentBtn.dataset.type);
});

window.showFoodAddModal = function() {
    var old = document.getElementById('foodAddModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="foodAddModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5 class="modal-title"><i class="bi bi-plus-circle me-2"></i>Новый ресторан</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-4"><form id="foodAddForm">' +
            '<div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label">Название *</label><input type="text" class="form-control rounded-pill" id="faName" required></div><div class="col-md-6"><label class="form-label">Кухня</label><select class="form-select rounded-pill" id="faCuisine">' + Object.entries(window.CUISINE_TYPES).map(function(e) { return '<option value="' + e[0] + '">' + e[1] + '</option>'; }).join('') + '</select></div></div>' +
            '<div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label">Чек</label><select class="form-select rounded-pill" id="faPrice"><option value="1">₽</option><option value="2" selected>₽₽</option><option value="3">₽₽₽</option></select></div><div class="col-md-4"><label class="form-label">Оценка</label><div class="d-flex gap-1" id="faStars"></div></div><div class="col-md-4"><label class="form-label">Статус</label><select class="form-select rounded-pill" id="faStatus"><option value="want" selected>🔖 Хочу</option><option value="visited">✅ Посетил</option></select></div></div>' +
            '<div class="mb-3"><label class="form-label">Адрес</label><input type="text" class="form-control rounded-pill" id="faAddress"></div>' +
            '<div class="mb-3"><label class="form-label">Фото (ссылки)</label><textarea class="form-control" id="faPhotos" rows="2" style="border-radius:16px"></textarea></div>' +
            '<div class="mb-3"><label class="form-label">Описание</label><textarea class="form-control" id="faDesc" rows="2" style="border-radius:16px"></textarea></div>' +
            '<div class="mb-3"><label class="form-label">🍽️ Что заказать (через запятую)</label><input type="text" class="form-control rounded-pill" id="faBestDishes">' +
            '<div class="d-flex gap-2"><button type="submit" class="btn btn-primary rounded-pill flex-grow-1">Добавить</button><button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Отмена</button></div>' +
        '</form></div></div></div></div>');
    
    window.setupStarRating('faStars', 0);
    var modal = new bootstrap.Modal(document.getElementById('foodAddModal'));
    modal.show();
    
    document.getElementById('foodAddForm').onsubmit = async function(e) {
        e.preventDefault();
        var name = document.getElementById('faName').value.trim();
        if (!name) return alert('Введите название!');
        var pr = document.getElementById('faPhotos').value.trim();
        var data = {
            name: name, cuisine: document.getElementById('faCuisine').value,
            price: parseInt(document.getElementById('faPrice').value),
            rating: window.getStarRating('faStars'),
            status: document.getElementById('faStatus').value,
            address: document.getElementById('faAddress').value.trim(),
            photos: pr ? pr.split(',').map(function(s){return s.trim();}) : [],
            description: document.getElementById('faDesc').value.trim(),
            bestDishes: document.getElementById('faBestDishes').value.split(',').map(function(s){return s.trim();}).filter(function(s){return s;}),
            author: window.currentUser ? window.currentUser.displayName.split(' ')[0] : 'Я',
            createdAt: Date.now()
        };
        await window.addDoc(window.collection(window.db, window.getFoodCollection()), data);
        if (window.logActivity) window.logActivity('food_added', name, '');
        modal.hide();
        window.loadFoodPlaces();
        alert('✅ Добавлено!');
    };
};

function showFoodEditModal(place) {
    var old = document.getElementById('foodEditModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="foodEditModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5 class="modal-title">✏️ Редактировать</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-4"><form id="foodEditForm">' +
            '<div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label">Название</label><input type="text" class="form-control rounded-pill" id="feName" value="' + place.name + '"></div><div class="col-md-6"><label class="form-label">Кухня</label><select class="form-select rounded-pill" id="feCuisine">' + Object.entries(window.CUISINE_TYPES).map(function(e) { return '<option value="' + e[0] + '" ' + (place.cuisine===e[0]?'selected':'') + '>' + e[1] + '</option>'; }).join('') + '</select></div></div>' +
            '<div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label">Чек</label><select class="form-select rounded-pill" id="fePrice"><option value="1" ' + (place.price===1?'selected':'') + '>₽</option><option value="2" ' + (place.price===2?'selected':'') + '>₽₽</option><option value="3" ' + (place.price===3?'selected':'') + '>₽₽₽</option></select></div><div class="col-md-4"><label class="form-label">Оценка</label><div class="d-flex gap-1" id="feStars"></div></div><div class="col-md-4"><label class="form-label">Статус</label><select class="form-select rounded-pill" id="feStatus"><option value="want" ' + (place.status==='want'?'selected':'') + '>🔖 Хочу</option><option value="visited" ' + (place.status==='visited'?'selected':'') + '>✅ Посетил</option><option value="favourite" ' + (place.status==='favourite'?'selected':'') + '>⭐ Любимое</option><option value="dislike" ' + (place.status==='dislike'?'selected':'') + '>👎 Не понравилось</option></select></div></div>' +
            '<div class="mb-3"><label class="form-label">Фото</label><textarea class="form-control" id="fePhotos" rows="2" style="border-radius:16px">' + (place.photos||[]).join(', ') + '</textarea></div>' +
            '<div class="mb-3"><label class="form-label">Описание</label><textarea class="form-control" id="feDesc" rows="2" style="border-radius:16px">' + (place.description||'') + '</textarea></div>' +
            '<div class="mb-3"><label class="form-label">Что заказать</label><input type="text" class="form-control rounded-pill" id="feBestDishes" value="' + (place.bestDishes||[]).join(', ') + '">' +
            '<div class="d-flex gap-2"><button type="submit" class="btn btn-primary rounded-pill flex-grow-1">💾 Сохранить</button><button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Отмена</button></div>' +
        '</form></div></div></div></div>');
    
    window.setupStarRating('feStars', place.rating||0);
    var modal = new bootstrap.Modal(document.getElementById('foodEditModal'));
    modal.show();
    
    document.getElementById('foodEditForm').onsubmit = async function(e) {
        e.preventDefault();
        var pr = document.getElementById('fePhotos').value.trim();
        await window.updateDoc(window.doc(window.db, window.getFoodCollection(), place._firestoreId), {
            name: document.getElementById('feName').value.trim(),
            cuisine: document.getElementById('feCuisine').value,
            price: parseInt(document.getElementById('fePrice').value),
            rating: window.getStarRating('feStars'),
            status: document.getElementById('feStatus').value,
            photos: pr ? pr.split(',').map(function(s){return s.trim();}) : [],
            description: document.getElementById('feDesc').value.trim(),
            bestDishes: document.getElementById('feBestDishes').value.split(',').map(function(s){return s.trim();}).filter(function(s){return s;}),
            updatedAt: Date.now()
        });
        modal.hide();
        window.loadFoodPlaces();
    };
}

console.log('✅ foodCards.js v4 загружен');