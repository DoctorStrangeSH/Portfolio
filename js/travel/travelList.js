// ==================== travelList.js v3 ====================

window.travelState = {
    places: [],
    currentFilter: 'all',
    searchQuery: '',
    currentList: 'my'
};

const TRAVEL_CATEGORIES = {
    city: { emoji: '🏙️', name: 'Город', color: '#6c5ce7' },
    nature: { emoji: '🌲', name: 'Природа', color: '#00b894' },
    mountains: { emoji: '🏔️', name: 'Горы', color: '#a29bfe' },
    beach: { emoji: '🏖️', name: 'Пляж', color: '#74b9ff' },
    sight: { emoji: '🏛️', name: 'Достопримечательность', color: '#fdcb6e' },
    entertainment: { emoji: '🎭', name: 'Развлечение', color: '#e17055' },
    food: { emoji: '🍽️', name: 'Гастрономия', color: '#fd79a8' },
    other: { emoji: '📌', name: 'Другое', color: '#636e72' }
};
window.TRAVEL_CATEGORIES = TRAVEL_CATEGORIES;

function getTravelCollection() {
    if (window.currentList === 'my') return 'users/' + window.currentUser.uid + '/places';
    var fid = (window.currentList || 'my').replace('shared_', '');
    var ids = [window.currentUser.uid, fid].sort();
    return 'shared/' + ids[0] + '_' + ids[1] + '/places';
}

async function loadTravelPlaces() {
    if (!window.currentUser) return;
    try {
        var snap = await window.getDocs(window.collection(window.db, getTravelCollection()));
        window.travelState.places = [];
        snap.forEach(function(d) { window.travelState.places.push(Object.assign({}, d.data(), { _firestoreId: d.id })); });
        window.travelState.places.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        renderTravelContent();
    } catch (e) { console.error('loadTravelPlaces:', e); }
}

function getFilteredTravelPlaces() {
    var arr = window.travelState.places;
    if (window.travelState.currentFilter !== 'all') arr = arr.filter(function(p) { return (p.category || 'other') === window.travelState.currentFilter; });
    if (window.travelState.searchQuery) {
        var q = window.travelState.searchQuery.toLowerCase();
        arr = arr.filter(function(p) { return (p.name || '').toLowerCase().indexOf(q) !== -1 || (p.description || '').toLowerCase().indexOf(q) !== -1; });
    }
    return arr;
}

function renderTravelContent() {
    var filtered = getFilteredTravelPlaces();
    var wish = filtered.filter(function(p) { return p.status === 'want'; });
    var vis = filtered.filter(function(p) { return p.status === 'visited'; });
    
    var wc = document.getElementById('travelWishCount'); if (wc) wc.textContent = wish.length;
    var vc = document.getElementById('travelVisCount'); if (vc) vc.textContent = vis.length;
    
    renderTravelCards('travelWishlist', wish, 'travelWishEmpty');
    renderTravelCards('travelVisited', vis, 'travelVisEmpty');
    renderTravelFilters();
    updateTravelBudget();
}

function renderTravelFilters() {
    var c = document.getElementById('travelFilters');
    if (!c) return;
    var used = {};
    window.travelState.places.forEach(function(p) { used[p.category || 'other'] = true; });
    var h = '<span class="category-chip ' + (window.travelState.currentFilter === 'all' ? 'active' : '') + '" data-cat="all">Все (' + window.travelState.places.length + ')</span>';
    Object.entries(TRAVEL_CATEGORIES).forEach(function(e) {
        if (used[e[0]] || window.travelState.currentFilter === e[0]) {
            var cnt = window.travelState.places.filter(function(p) { return (p.category || 'other') === e[0]; }).length;
            h += '<span class="category-chip ' + (window.travelState.currentFilter === e[0] ? 'active' : '') + '" data-cat="' + e[0] + '">' + e[1].emoji + ' ' + e[1].name + ' (' + cnt + ')</span>';
        }
    });
    c.innerHTML = h;
    c.querySelectorAll('.category-chip').forEach(function(ch) {
        ch.addEventListener('click', function() {
            window.travelState.currentFilter = ch.dataset.cat;
            renderTravelContent();
        });
    });
}

function updateTravelBudget() {
    var el = document.getElementById('travelBudget');
    if (!el) return;
    var visited = window.travelState.places.filter(function(p) { return p.status === 'visited' && p.budget; });
    var total = visited.reduce(function(s, p) { return s + (parseInt(p.budget) || 0); }, 0);
    if (total > 0) {
        el.innerHTML = '💰 Общий бюджет: <strong>' + window.formatBudget(total) + '</strong> (' + visited.length + ' поездок)';
        el.classList.remove('d-none');
    } else { el.classList.add('d-none'); }
}

function renderTravelCards(containerId, arr, emptyId) {
    var c = document.getElementById(containerId);
    var e = document.getElementById(emptyId);
    if (!c || !e) return;
    c.innerHTML = '';
    if (arr.length === 0) { e.classList.remove('d-none'); return; }
    e.classList.add('d-none');
    arr.forEach(function(place, i) {
        if (window.createTravelCard) {
            var card = window.createTravelCard(place, i);
            if (card) c.appendChild(card);
        }
    });
    if (window.attachTravelHandlers) window.attachTravelHandlers();
}

window.renderTravelSection = function(container) {
    container.innerHTML = 
        '<div class="fade-in">' +
            '<div class="row g-2 mb-3">' +
                '<div class="col-md-6"><div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input type="text" class="form-control" id="travelSearch" placeholder="Поиск..."></div></div>' +
                '<div class="col-md-6 text-end"><button class="btn btn-success btn-sm" id="travelAddBtn"><i class="bi bi-plus-lg me-1"></i>Добавить место</button></div>' +
            '</div>' +
            '<div id="travelFilters" class="mb-2"></div>' +
            '<div id="travelBudget" class="budget-summary d-none mb-3"></div>' +
            '<ul class="nav nav-tabs mb-3" id="travelTabs">' +
                '<li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#travelWishlistTab">🌍 Хочу <span class="badge bg-primary ms-1" id="travelWishCount">0</span></button></li>' +
                '<li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#travelVisitedTab">✅ Посетил <span class="badge bg-success ms-1" id="travelVisCount">0</span></button></li>' +
                '<li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#travelMapTab">🗺️ Карта</button></li>' +
            '</ul>' +
            '<div class="tab-content">' +
                '<div class="tab-pane fade" id="travelWishlistTab"><div class="row g-3" id="travelWishlist"></div><div id="travelWishEmpty" class="text-center py-5 d-none"><i class="bi bi-map text-muted" style="font-size:4rem"></i><p class="text-muted mt-2">Пока нет мест</p></div></div>' +
                '<div class="tab-pane fade" id="travelVisitedTab"><div class="row g-3" id="travelVisited"></div><div id="travelVisEmpty" class="text-center py-5 d-none"><p class="text-muted">Вы пока нигде не были</p></div></div>' +
                '<div class="tab-pane fade" id="travelMapTab"><div id="travelMapContainer" style="height:65vh;border-radius:16px"></div></div>' +
            '</div>' +
        '</div>';
    
    if (window.initTravelMap) window.initTravelMap();
    
    document.getElementById('travelSearch').addEventListener('input', function() {
        window.travelState.searchQuery = this.value;
        renderTravelContent();
    });
    
    document.getElementById('travelAddBtn').addEventListener('click', function() {
        if (window.showTravelAddModal) window.showTravelAddModal();
    });
    
    document.querySelectorAll('#travelTabs button[data-bs-toggle="tab"]').forEach(function(btn) {
        btn.addEventListener('shown.bs.tab', function(e) {
            localStorage.setItem('travelActiveTab', e.target.dataset.bsTarget.replace('#', ''));
            if (e.target.dataset.bsTarget === '#travelMapTab' && window.travelMap) {
                setTimeout(function() { window.travelMap.container.fitToViewport(); }, 300);
            }
        });
    });
    
    setTimeout(function() {
        var saved = localStorage.getItem('travelActiveTab') || 'travelWishlistTab';
        var tab = document.querySelector('#travelTabs button[data-bs-target="#' + saved + '"]');
        if (tab) new bootstrap.Tab(tab).show();
    }, 400);
    
    loadTravelPlaces();
};

window.loadTravelPlaces = loadTravelPlaces;
window.renderTravelContent = renderTravelContent;
window.getTravelCollection = getTravelCollection;

console.log('✅ travelList.js v3 загружен');