// ==================== travelCards.js v7 ====================

const REACTIONS = [
    { emoji: '❤️', key: 'love' },
    { emoji: '🔥', key: 'fire' },
    { emoji: '😍', key: 'wow' },
    { emoji: '📸', key: 'photo' },
    { emoji: '💸', key: 'money' }
];

function getSeason(dateStr) {
    if (!dateStr) return null;
    var month = new Date(dateStr).getMonth();
    if (month === 11 || month <= 1) return { emoji: '❄️', nameRu: 'Зима', color: '#a29bfe' };
    if (month >= 2 && month <= 4) return { emoji: '🌸', nameRu: 'Весна', color: '#fd79a8' };
    if (month >= 5 && month <= 7) return { emoji: '☀️', nameRu: 'Лето', color: '#fdcb6e' };
    return { emoji: '🍂', nameRu: 'Осень', color: '#e17055' };
}

function getDayCounter(dateStr, status) {
    if (!dateStr) return null;
    var target = new Date(dateStr);
    var now = new Date();
    var diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (status === 'want') {
        if (diffDays > 365) return { text: '⏳ ' + Math.floor(diffDays / 30) + ' мес.', urgent: false };
        if (diffDays > 30) return { text: '⏳ ' + Math.floor(diffDays / 7) + ' нед.', urgent: false };
        if (diffDays > 0) return { text: '⏳ ' + diffDays + ' дн.', urgent: diffDays <= 7 };
        if (diffDays === 0) return { text: '🎉 Сегодня!', urgent: true };
        return { text: '📅 Планируется', urgent: false };
    }
    if (status === 'visited') {
        var past = Math.abs(diffDays);
        if (past === 0) return { text: 'Сегодня', urgent: false };
        if (past < 7) return { text: past + ' дн. назад', urgent: false };
        if (past < 30) return { text: Math.floor(past / 7) + ' нед. назад', urgent: false };
        return { text: Math.floor(past / 30) + ' мес. назад', urgent: false };
    }
    return null;
}

window.createTravelCard = function(place, index) {
    var col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in-up';
    col.style.animationDelay = (index * 0.03) + 's';
    
    var pmap = { high: { emoji: '🔥', name: 'Очень хочу' }, medium: { emoji: '🙂', name: 'Интересно' }, low: { emoji: '💭', name: 'Когда-нибудь' } };
    var pr = pmap[place.priority] || pmap.medium;
    var cat = window.TRAVEL_CATEGORIES[place.category] || window.TRAVEL_CATEGORIES.other;
    var season = getSeason(place.date);
    var dayCounter = getDayCounter(place.date, place.status);
    var photos = place.photos || [];
    var mainPhoto = photos.length > 0 ? photos[0] : 'https://placehold.co/400x250/5b5fef/white?text=✨+Нет+фото';
    var photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');
    var reactions = place.reactions || {};
    var tags = place.tags || [];
    var sliderId = 'slider-' + place._firestoreId;
    
    col.innerHTML = 
        '<div class="card h-100 shadow-sm mb-3 border-0 overflow-hidden" style="border-left:4px solid ' + (season ? season.color : '#5b5fef') + '">' +
            '<div class="position-relative">' +
                (photos.length > 1 ? 
                '<div class="photo-slider" id="' + sliderId + '">' +
                    '<img src="' + mainPhoto + '" class="card-img-top" style="cursor:pointer;height:200px;object-fit:cover" onclick="window.openGallery(' + photosJson + ',0)">' +
                    '<button class="slider-btn slider-prev" onclick="event.stopPropagation();window.slide_' + sliderId + '(-1)"><i class="bi bi-chevron-left"></i></button>' +
                    '<button class="slider-btn slider-next" onclick="event.stopPropagation();window.slide_' + sliderId + '(1)"><i class="bi bi-chevron-right"></i></button>' +
                    '<div class="slider-dots">' + photos.map(function(_, i) { return '<span class="slider-dot ' + (i===0?'active':'') + '" onclick="event.stopPropagation();window.slideTo_' + sliderId + '(' + i + ')"></span>'; }).join('') + '</div>' +
                '</div>' : 
                '<img src="' + mainPhoto + '" class="card-img-top" style="height:200px;object-fit:cover" ' + (photos.length>0?'onclick="window.openGallery(' + photosJson + ',0)" style="cursor:pointer"':'') + '>') +
                '<div style="position:absolute;bottom:0;left:0;right:0;height:50px;background:linear-gradient(transparent,rgba(0,0,0,0.5));pointer-events:none"></div>' +
                '<div class="position-absolute d-flex gap-1" style="top:10px;left:10px;z-index:3">' +
                    '<span class="badge" style="background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);color:white">' + cat.emoji + ' ' + cat.name + '</span>' +
                    (season ? '<span class="badge" style="background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);color:white">' + season.emoji + ' ' + season.nameRu + '</span>' : '') +
                '</div>' +
                (photos.length > 1 ? '<span class="position-absolute badge" style="top:10px;right:10px;z-index:3;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)"><i class="bi bi-images me-1"></i>' + photos.length + '</span>' : '') +
            '</div>' +
            '<div class="card-body d-flex flex-column p-3">' +
                '<div class="d-flex justify-content-between align-items-center mb-2">' +
                    '<span class="badge" style="background:var(--bg);color:var(--text);font-weight:500">' + pr.emoji + ' ' + pr.name + '</span>' +
                    (dayCounter ? '<span class="badge rounded-pill" style="background:' + (dayCounter.urgent ? '#ef4444' : '#3b82f6') + ';color:white">' + dayCounter.text + '</span>' : '') +
                '</div>' +
                '<h6 class="card-title mb-1">' + place.name + '</h6>' +
                (place.description ? '<p class="card-text small flex-grow-1" style="color:var(--text-secondary);line-height:1.4">' + place.description.substring(0, 100) + (place.description.length > 100 ? '...' : '') + '</p>' : '') +
                (tags.length > 0 ? '<div class="d-flex flex-wrap gap-1 mb-2">' + tags.slice(0,3).map(function(t) { return '<span class="badge" style="background:var(--border);color:var(--text-muted);font-size:0.7rem;cursor:pointer" onclick="window.travelState.searchQuery=\'' + t + '\';window.renderTravelContent()">#' + t + '</span>'; }).join('') + '</div>' : '') +
                '<div class="d-flex gap-3 small mb-2" style="color:var(--text-muted)">' +
                    (place.budget ? '<span><i class="bi bi-cash me-1"></i>' + window.formatBudget(place.budget) + '</span>' : '') +
                    (place.diary && place.diary.length ? '<span><i class="bi bi-journal-text me-1"></i>' + place.diary.length + '</span>' : '') +
                    (place.views ? '<span><i class="bi bi-eye me-1"></i>' + place.views + '</span>' : '') +
                '</div>' +
                (place.status === 'visited' ? '<div class="mb-2">' + window.renderStars(place.rating) + '</div>' : '') +
                '<div class="d-flex gap-1 mb-2" id="reactions-' + place._firestoreId + '">' + REACTIONS.map(function(r) { return '<button class="btn btn-sm reaction-btn ' + ((reactions[r.key]||0)>0?'active':'') + '" data-id="' + place._firestoreId + '" data-reaction="' + r.key + '" style="border-radius:20px;padding:2px 8px;font-size:0.75rem;background:' + ((reactions[r.key]||0)>0?'var(--primary)':'var(--bg)') + ';color:' + ((reactions[r.key]||0)>0?'white':'var(--text-muted)') + ';border:none">' + r.emoji + ' ' + (reactions[r.key]||0) + '</button>'; }).join('') + '</div>' +
                '<div class="mt-auto d-flex gap-1 flex-wrap">' +
                    (place.status === 'want' ? '<button class="btn btn-sm btn-outline-primary travel-mark-btn" data-id="' + place._firestoreId + '" style="border-radius:20px"><i class="bi bi-check-lg"></i></button>' : '') +
                    '<button class="btn btn-sm btn-outline-secondary comment-btn" data-id="' + place._firestoreId + '" data-type="place" style="border-radius:20px" title="Комментарии"><i class="bi bi-chat-dots"></i></button>' +
                    '<button class="btn btn-sm btn-outline-secondary travel-detail-btn" data-id="' + place._firestoreId + '" style="border-radius:20px"><i class="bi bi-info-circle"></i></button>' +
                    '<button class="btn btn-sm btn-outline-secondary travel-edit-btn" data-id="' + place._firestoreId + '" style="border-radius:20px"><i class="bi bi-pencil"></i></button>' +
                    '<button class="btn btn-sm btn-outline-danger travel-del-btn" data-id="' + place._firestoreId + '" style="border-radius:20px"><i class="bi bi-trash"></i></button>' +
                '</div>' +
                '<div class="text-end mt-1"><small style="color:var(--text-muted);font-size:0.7rem">' + window.timeAgo(place.createdAt) + '</small></div>' +
            '</div>' +
        '</div>';
    
    if (photos.length > 1) setTimeout(function() { window.initCardSlider(sliderId, photos); }, 100);
    return col;
};

window.attachTravelHandlers = function() {
    document.querySelectorAll('.travel-mark-btn').forEach(function(b) {
        b.onclick = async function() {
            var p = window.travelState.places.find(function(x) { return x._firestoreId === b.dataset.id; });
            if (!p) return;
            var date = prompt('📅 Дата (ГГГГ-ММ-ДД):', new Date().toISOString().split('T')[0]);
            if (date === null) return;
            var rating = prompt('⭐ Оценка (1-5):', '5');
            if (rating === null) return;
            await window.updateDoc(window.doc(window.db, window.getTravelCollection(), b.dataset.id), {
                status: 'visited', date: date || new Date().toISOString().split('T')[0],
                rating: Math.min(5, Math.max(1, parseInt(rating) || 5))
            });
            if (window.logActivity) window.logActivity('place_visited', p.name, '');
            window.loadTravelPlaces();
        };
    });
    
    document.querySelectorAll('.travel-edit-btn').forEach(function(b) {
        b.onclick = function() {
            var p = window.travelState.places.find(function(x) { return x._firestoreId === b.dataset.id; });
            if (p) showTravelEditModal(p);
        };
    });
    
    document.querySelectorAll('.travel-del-btn').forEach(function(b) {
        b.onclick = async function() {
            var p = window.travelState.places.find(function(x) { return x._firestoreId === b.dataset.id; });
            if (!confirm('Удалить "' + (p?p.name:'место') + '"?')) return;
            await window.deleteDoc(window.doc(window.db, window.getTravelCollection(), b.dataset.id));
            window.loadTravelPlaces();
        };
    });
    
    document.querySelectorAll('.travel-detail-btn').forEach(function(b) {
        b.onclick = async function() {
            var p = window.travelState.places.find(function(x) { return x._firestoreId === b.dataset.id; });
            if (!p) return;
            await window.updateDoc(window.doc(window.db, window.getTravelCollection(), b.dataset.id), { views: (p.views||0)+1 });
            p.views = (p.views||0)+1;
            window.showTravelDetail(p);
        };
    });
    
    document.querySelectorAll('.reaction-btn').forEach(function(btn) {
        btn.onclick = async function(e) {
            e.stopPropagation();
            var id = btn.dataset.id;
            var reaction = btn.dataset.reaction;
            var p = window.travelState.places.find(function(x) { return x._firestoreId === id; });
            if (!p) return;
            var reactions = Object.assign({}, p.reactions || {});
            if (reactions[reaction] && reactions[reaction] > 0) { delete reactions[reaction]; }
            else { reactions[reaction] = 1; }
            await window.updateDoc(window.doc(window.db, window.getTravelCollection(), id), { reactions: reactions });
            p.reactions = reactions;
            var container = document.getElementById('reactions-' + id);
            if (container) {
                container.querySelectorAll('.reaction-btn').forEach(function(b) {
                    var r = b.dataset.reaction;
                    var emojis = { love:'❤️', fire:'🔥', wow:'😍', photo:'📸', money:'💸' };
                    b.textContent = emojis[r] + ' ' + (reactions[r]||0);
                    b.classList.toggle('active', (reactions[r]||0) > 0);
                    b.style.background = (reactions[r]||0) > 0 ? 'var(--primary)' : 'var(--bg)';
                    b.style.color = (reactions[r]||0) > 0 ? 'white' : 'var(--text-muted)';
                });
            }
        };
    });
};

function showTravelAddModal() {
    var old = document.getElementById('travelAddModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="travelAddModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5 class="modal-title"><i class="bi bi-plus-circle me-2"></i>Новое место</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-4"><form id="travelAddForm" autocomplete="off">' +
            '<div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label fw-medium">Название *</label><input type="text" class="form-control rounded-pill" id="taName" required></div><div class="col-md-6"><label class="form-label fw-medium">Местоположение</label><input type="text" class="form-control rounded-pill" id="taLocation"></div></div>' +
            '<div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label fw-medium">Категория</label><select class="form-select rounded-pill" id="taCategory">' + Object.entries(window.TRAVEL_CATEGORIES).map(function(e) { return '<option value="' + e[0] + '">' + e[1].emoji + ' ' + e[1].name + '</option>'; }).join('') + '</select></div><div class="col-md-4"><label class="form-label fw-medium">Приоритет</label><select class="form-select rounded-pill" id="taPriority"><option value="high">🔥 Очень хочу</option><option value="medium" selected>🙂 Интересно</option><option value="low">💭 Когда-нибудь</option></select></div><div class="col-md-4"><label class="form-label fw-medium">Бюджет</label><input type="number" class="form-control rounded-pill" id="taBudget"></div></div>' +
            '<div class="mb-3"><label class="form-label fw-medium">📸 Фото (ссылки через запятую)</label><textarea class="form-control" id="taPhotos" rows="2" style="border-radius:16px"></textarea></div>' +
            '<div class="mb-3"><label class="form-label fw-medium">📝 Описание</label><textarea class="form-control" id="taDesc" rows="2" style="border-radius:16px"></textarea></div>' +
            '<div class="mb-3"><label class="form-label fw-medium">🏷️ Теги</label><input type="text" class="form-control rounded-pill" id="taTags">' +
            '<div class="mb-3"><label class="form-label fw-medium">Статус</label><select class="form-select rounded-pill" id="taStatus"><option value="want" selected>🌍 Хочу</option><option value="visited">✅ Посетил</option></select></div>' +
            '<div id="taVisitedFields" class="d-none"><div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label fw-medium">Дата</label><input type="date" class="form-control rounded-pill" id="taDate"></div><div class="col-md-6"><label class="form-label fw-medium">Оценка</label><div class="d-flex gap-1" id="taStars"></div></div></div></div>' +
            '<div class="d-flex gap-2"><button type="submit" class="btn btn-primary rounded-pill flex-grow-1"><i class="bi bi-plus-circle me-1"></i>Добавить</button><button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Отмена</button></div>' +
        '</form></div></div></div></div>');
    
    window.setupStarRating('taStars', 0);
    document.getElementById('taStatus').onchange = function() { document.getElementById('taVisitedFields').classList.toggle('d-none', this.value !== 'visited'); };
    var modal = new bootstrap.Modal(document.getElementById('travelAddModal'));
    modal.show();
    
    document.getElementById('travelAddForm').onsubmit = async function(e) {
        e.preventDefault();
        var name = document.getElementById('taName').value.trim();
        if (!name) return alert('Введите название!');
        var status = document.getElementById('taStatus').value;
        var pr = document.getElementById('taPhotos').value.trim();
        var tr = document.getElementById('taTags').value.trim();
        var data = {
            name: name, location: document.getElementById('taLocation').value.trim(),
            category: document.getElementById('taCategory').value,
            priority: document.getElementById('taPriority').value,
            budget: parseInt(document.getElementById('taBudget').value)||0,
            photos: pr ? pr.split(',').map(function(s){return s.trim();}).filter(function(s){return s;}) : [],
            description: document.getElementById('taDesc').value.trim(),
            tags: tr ? tr.split(',').map(function(s){return s.trim().toLowerCase();}).filter(function(s){return s;}) : [],
            status: status, date: status==='visited' ? document.getElementById('taDate').value : '',
            rating: status==='visited' ? window.getStarRating('taStars') : 0,
            author: window.currentUser ? window.currentUser.displayName.split(' ')[0] : 'Я',
            createdAt: Date.now(), views: 0, reactions: {}, diary: []
        };
        await window.addDoc(window.collection(window.db, window.getTravelCollection()), data);
        if (window.logActivity) window.logActivity('place_added', name, '');
        modal.hide();
        window.loadTravelPlaces();
        alert('✅ Место добавлено!');
    };
}

window.showTravelAddModal = showTravelAddModal;

function showTravelEditModal(place) {
    var old = document.getElementById('travelEditModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="travelEditModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5 class="modal-title">✏️ Редактировать</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-4"><form id="travelEditForm" autocomplete="off">' +
            '<div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label">Название</label><input type="text" class="form-control rounded-pill" id="teName" value="' + place.name + '"></div><div class="col-md-6"><label class="form-label">Местоположение</label><input type="text" class="form-control rounded-pill" id="teLocation" value="' + (place.location||'') + '"></div></div>' +
            '<div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label">Категория</label><select class="form-select rounded-pill" id="teCategory">' + Object.entries(window.TRAVEL_CATEGORIES).map(function(e) { return '<option value="' + e[0] + '" ' + (place.category===e[0]?'selected':'') + '>' + e[1].emoji + ' ' + e[1].name + '</option>'; }).join('') + '</select></div><div class="col-md-4"><label class="form-label">Приоритет</label><select class="form-select rounded-pill" id="tePriority"><option value="high" ' + (place.priority==='high'?'selected':'') + '>🔥 Очень</option><option value="medium" ' + (place.priority==='medium'?'selected':'') + '>🙂 Интересно</option><option value="low" ' + (place.priority==='low'?'selected':'') + '>💭 Когда</option></select></div><div class="col-md-4"><label class="form-label">Бюджет</label><input type="number" class="form-control rounded-pill" id="teBudget" value="' + (place.budget||'') + '"></div></div>' +
            '<div class="mb-3"><label class="form-label">Фото</label><textarea class="form-control" id="tePhotos" rows="2" style="border-radius:16px">' + (place.photos||[]).join(', ') + '</textarea></div>' +
            '<div class="mb-3"><label class="form-label">Описание</label><textarea class="form-control" id="teDesc" rows="2" style="border-radius:16px">' + (place.description||'') + '</textarea></div>' +
            '<div class="mb-3"><label class="form-label">Теги</label><input type="text" class="form-control rounded-pill" id="teTags" value="' + (place.tags||[]).join(', ') + '">' +
            '<div class="d-flex gap-2"><button type="submit" class="btn btn-primary rounded-pill flex-grow-1">💾 Сохранить</button><button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Отмена</button></div>' +
        '</form></div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('travelEditModal'));
    modal.show();
    
    document.getElementById('travelEditForm').onsubmit = async function(e) {
        e.preventDefault();
        var pr = document.getElementById('tePhotos').value.trim();
        var tr = document.getElementById('teTags').value.trim();
        await window.updateDoc(window.doc(window.db, window.getTravelCollection(), place._firestoreId), {
            name: document.getElementById('teName').value.trim(),
            location: document.getElementById('teLocation').value.trim(),
            category: document.getElementById('teCategory').value,
            priority: document.getElementById('tePriority').value,
            budget: parseInt(document.getElementById('teBudget').value)||0,
            photos: pr ? pr.split(',').map(function(s){return s.trim();}).filter(function(s){return s;}) : [],
            description: document.getElementById('teDesc').value.trim(),
            tags: tr ? tr.split(',').map(function(s){return s.trim().toLowerCase();}).filter(function(s){return s;}) : [],
            updatedAt: Date.now()
        });
        modal.hide();
        window.loadTravelPlaces();
    };
}

window.showTravelDetail = function(place) {
    document.getElementById('detailTitle').textContent = place.name;
    var cat = window.TRAVEL_CATEGORIES[place.category]||window.TRAVEL_CATEGORIES.other;
    var season = getSeason(place.date);
    var dayCounter = getDayCounter(place.date, place.status);
    document.getElementById('detailBody').innerHTML = 
        '<div class="row mb-3"><div class="col-6"><strong>Категория:</strong> ' + cat.emoji + ' ' + cat.name + '</div>' + (season?'<div class="col-6"><strong>Сезон:</strong> ' + season.emoji + ' ' + season.nameRu + '</div>':'') + (dayCounter?'<div class="col-6"><strong>Когда:</strong> ' + dayCounter.text + '</div>':'') + '</div>' +
        '<p><strong>Описание:</strong> ' + (place.description||'—') + '</p>' +
        '<p><strong>Бюджет:</strong> ' + (place.budget?window.formatBudget(place.budget):'—') + '</p>' +
        '<p><strong>Добавлено:</strong> ' + window.timeAgo(place.createdAt) + '</p><p><strong>Просмотров:</strong> ' + (place.views||0) + '</p>' +
        (place.status==='visited'?'<p><strong>Оценка:</strong> ' + window.renderStars(place.rating) + '</p>':'') +
        '<button class="btn btn-sm btn-outline-primary rounded-pill mt-2" onclick="window.showComments(\'' + place._firestoreId + '\', \'place\')"><i class="bi bi-chat-dots me-1"></i>Комментарии</button>';
    new bootstrap.Modal(document.getElementById('placeDetailModal')).show();
};

document.addEventListener('click', function(e) {
    var commentBtn = e.target.closest('.comment-btn');
    if (commentBtn) window.showComments(commentBtn.dataset.id, commentBtn.dataset.type);
});

console.log('✅ travelCards.js v7 загружен');