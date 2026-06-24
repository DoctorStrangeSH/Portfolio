// ==================== foodList.js v2 ====================

window.foodState = {
    places: [],
    currentFilter: localStorage.getItem('foodFilter') || 'all',
    searchQuery: '',
    priceFilter: localStorage.getItem('foodPriceFilter') || 'all'
};

function getFoodCollection() {
    if (window.currentList === 'my') return 'users/' + window.currentUser.uid + '/food';
    var fid = (window.currentList || 'my').replace('shared_', '');
    var ids = [window.currentUser.uid, fid].sort();
    return 'shared/' + ids[0] + '_' + ids[1] + '/food';
}

async function loadFoodPlaces() {
    if (!window.currentUser) return;
    try {
        var snap = await window.getDocs(window.collection(window.db, getFoodCollection()));
        window.foodState.places = [];
        snap.forEach(function(d) { window.foodState.places.push(Object.assign({}, d.data(), { _firestoreId: d.id })); });
        window.foodState.places.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        renderFoodContent();
    } catch (e) { console.error('loadFoodPlaces:', e); }
}

function getFilteredFoodPlaces() {
    var arr = window.foodState.places;
    if (window.foodState.currentFilter !== 'all') arr = arr.filter(function(p) { return p.status === window.foodState.currentFilter; });
    if (window.foodState.priceFilter !== 'all') arr = arr.filter(function(p) { return p.price === parseInt(window.foodState.priceFilter); });
    if (window.foodState.searchQuery) {
        var q = window.foodState.searchQuery.toLowerCase();
        arr = arr.filter(function(p) { return (p.name || '').toLowerCase().indexOf(q) !== -1 || ((window.CUISINE_TYPES[p.cuisine] || '')).toLowerCase().indexOf(q) !== -1; });
    }
    return arr;
}

function renderFoodContent() {
    var filtered = getFilteredFoodPlaces();
    renderFoodCards('foodContainer', filtered, 'foodEmpty');
    renderFoodFilters();
    updateFoodCounters();
}

function renderFoodFilters() {
    var c = document.getElementById('foodFilters');
    if (!c) return;
    var h = '<div class="d-flex gap-2 flex-wrap mb-2">';
    h += '<span class="category-chip ' + (window.foodState.currentFilter === 'all' ? 'active' : '') + '" data-filter="all">Все</span>';
    h += '<span class="category-chip ' + (window.foodState.currentFilter === 'want' ? 'active' : '') + '" data-filter="want">🔖 Хочу</span>';
    h += '<span class="category-chip ' + (window.foodState.currentFilter === 'visited' ? 'active' : '') + '" data-filter="visited">✅ Посетил</span>';
    h += '<span class="category-chip ' + (window.foodState.currentFilter === 'favourite' ? 'active' : '') + '" data-filter="favourite">⭐ Любимые</span>';
    h += '<span class="category-chip ' + (window.foodState.currentFilter === 'dislike' ? 'active' : '') + '" data-filter="dislike">👎 Не понравилось</span>';
    h += '</div><div class="d-flex gap-2">';
    h += '<span class="category-chip ' + (window.foodState.priceFilter === 'all' ? 'active' : '') + '" data-price="all">💰 Все</span>';
    h += '<span class="category-chip ' + (window.foodState.priceFilter === '1' ? 'active' : '') + '" data-price="1">₽</span>';
    h += '<span class="category-chip ' + (window.foodState.priceFilter === '2' ? 'active' : '') + '" data-price="2">₽₽</span>';
    h += '<span class="category-chip ' + (window.foodState.priceFilter === '3' ? 'active' : '') + '" data-price="3">₽₽₽</span>';
    h += '</div>';
    c.innerHTML = h;
    c.querySelectorAll('[data-filter]').forEach(function(ch) {
        ch.addEventListener('click', function() {
            window.foodState.currentFilter = ch.dataset.filter;
            localStorage.setItem('foodFilter', window.foodState.currentFilter);
            renderFoodContent();
        });
    });
    c.querySelectorAll('[data-price]').forEach(function(ch) {
        ch.addEventListener('click', function() {
            window.foodState.priceFilter = ch.dataset.price;
            localStorage.setItem('foodPriceFilter', window.foodState.priceFilter);
            renderFoodContent();
        });
    });
}

function updateFoodCounters() {
    var all = window.foodState.places;
    var el;
    el = document.getElementById('foodAllCount'); if (el) el.textContent = all.length;
    el = document.getElementById('foodWantCount'); if (el) el.textContent = all.filter(function(m){return m.status==='want';}).length;
    el = document.getElementById('foodVisitedCount'); if (el) el.textContent = all.filter(function(m){return m.status==='visited'||m.status==='favourite'||m.status==='dislike';}).length;
    el = document.getElementById('foodFavCount'); if (el) el.textContent = all.filter(function(m){return m.status==='favourite';}).length;
}

function renderFoodCards(containerId, arr, emptyId) {
    var c = document.getElementById(containerId);
    var e = document.getElementById(emptyId);
    if (!c || !e) return;
    c.innerHTML = '';
    if (arr.length === 0) { e.classList.remove('d-none'); return; }
    e.classList.add('d-none');
    arr.forEach(function(place, i) {
        if (window.createFoodCard) { var card = window.createFoodCard(place, i); if (card) c.appendChild(card); }
    });
}

window.renderFoodSection = function(container) {
    container.innerHTML = 
        '<div class="fade-in">' +
            '<div class="row g-2 mb-3"><div class="col-md-6"><div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input type="text" class="form-control" id="foodSearch" placeholder="Поиск..."></div></div><div class="col-md-6 text-end"><button class="btn btn-success btn-sm" id="foodAddBtn"><i class="bi bi-plus-lg me-1"></i>Добавить ресторан</button></div></div>' +
            '<div id="foodFilters" class="mb-3"></div>' +
            '<div class="row g-2 mb-3">' +
                '<div class="col-3"><div class="card text-center p-2"><small class="text-muted">Всего</small><strong id="foodAllCount">0</strong></div></div>' +
                '<div class="col-3"><div class="card text-center p-2"><small class="text-muted">Хочу</small><strong id="foodWantCount">0</strong></div></div>' +
                '<div class="col-3"><div class="card text-center p-2"><small class="text-muted">Посетил</small><strong id="foodVisitedCount">0</strong></div></div>' +
                '<div class="col-3"><div class="card text-center p-2"><small class="text-muted">⭐ Любимые</small><strong id="foodFavCount">0</strong></div></div>' +
            '</div>' +
            '<div class="row g-3" id="foodContainer"></div>' +
            '<div id="foodEmpty" class="text-center py-5 d-none"><i class="bi bi-cup-hot text-muted" style="font-size:4rem"></i><p class="text-muted mt-2">Пока нет ресторанов</p></div>' +
        '</div>';
    
    document.getElementById('foodAddBtn').addEventListener('click', function() { if (window.showFoodAddModal) window.showFoodAddModal(); });
    document.getElementById('foodSearch').addEventListener('input', function() { window.foodState.searchQuery = this.value; renderFoodContent(); });
    loadFoodPlaces();
};

window.loadFoodPlaces = loadFoodPlaces;
window.renderFoodContent = renderFoodContent;
window.getFoodCollection = getFoodCollection;

console.log('✅ foodList.js v2 загружен');