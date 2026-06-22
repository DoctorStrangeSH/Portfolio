// ==================== travelList.js ====================
// Главный модуль раздела путешествий

window.travelState = {
    places: [],
    currentFilter: 'all',
    searchQuery: '',
    currentList: 'my'
};

const TRAVEL_CATEGORIES = {
    city: { emoji: '🏙️', name: 'Город' },
    nature: { emoji: '🌲', name: 'Природа' },
    mountains: { emoji: '🏔️', name: 'Горы' },
    beach: { emoji: '🏖️', name: 'Пляж' },
    sight: { emoji: '🏛️', name: 'Достопримечательность' },
    entertainment: { emoji: '🎭', name: 'Развлечение' },
    food: { emoji: '🍽️', name: 'Гастрономия' },
    other: { emoji: '📌', name: 'Другое' }
};

window.TRAVEL_CATEGORIES = TRAVEL_CATEGORIES;

function getTravelCollection() {
    if (window.currentList === 'my') return `users/${window.currentUser.uid}/places`;
    const fid = (window.currentList || 'my').replace('shared_', '');
    return `shared/${[window.currentUser.uid, fid].sort().join('_')}/places`;
}

async function loadTravelPlaces() {
    if (!window.currentUser) return;
    try {
        const snap = await window.getDocs(window.collection(window.db, getTravelCollection()));
        window.travelState.places = [];
        snap.forEach(d => window.travelState.places.push({ id: d.id, ...d.data(), _firestoreId: d.id }));
        window.travelState.places.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        renderTravelContent();
    } catch (e) {
        console.error('loadTravelPlaces:', e);
    }
}

function getFilteredTravelPlaces() {
    let arr = window.travelState.places;
    if (window.travelState.currentFilter !== 'all') {
        arr = arr.filter(p => (p.category || 'other') === window.travelState.currentFilter);
    }
    if (window.travelState.searchQuery) {
        const q = window.travelState.searchQuery.toLowerCase();
        arr = arr.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    return arr;
}

function renderTravelContent() {
    const filtered = getFilteredTravelPlaces();
    const wish = filtered.filter(p => p.status === 'want');
    const vis = filtered.filter(p => p.status === 'visited');
    
    const wishCount = document.getElementById('travelWishCount');
    const visCount = document.getElementById('travelVisCount');
    if (wishCount) wishCount.textContent = wish.length;
    if (visCount) visCount.textContent = vis.length;
    
    renderTravelCards('travelWishlist', wish, 'travelWishEmpty');
    renderTravelCards('travelVisited', vis, 'travelVisEmpty');
    renderTravelFilters();
}

function renderTravelFilters() {
    const c = document.getElementById('travelFilters');
    if (!c) return;
    const used = new Set(window.travelState.places.map(p => p.category || 'other'));
    let h = `<span class="category-chip ${window.travelState.currentFilter === 'all' ? 'active' : ''}" data-cat="all">Все (${window.travelState.places.length})</span>`;
    Object.entries(TRAVEL_CATEGORIES).forEach(([k, v]) => {
        if (used.has(k) || window.travelState.currentFilter === k) {
            const cnt = window.travelState.places.filter(p => (p.category || 'other') === k).length;
            h += `<span class="category-chip ${window.travelState.currentFilter === k ? 'active' : ''}" data-cat="${k}">${v.emoji} ${v.name} (${cnt})</span>`;
        }
    });
    c.innerHTML = h;
    c.querySelectorAll('.category-chip').forEach(ch => {
        ch.addEventListener('click', () => {
            window.travelState.currentFilter = ch.dataset.cat;
            renderTravelContent();
        });
    });
}

function renderTravelCards(containerId, arr, emptyId) {
    const c = document.getElementById(containerId);
    const e = document.getElementById(emptyId);
    if (!c || !e) return;
    c.innerHTML = '';
    if (arr.length === 0) {
        e.classList.remove('d-none');
        return;
    }
    e.classList.add('d-none');
    arr.forEach((place, i) => {
        const card = window.createTravelCard(place, i);
        if (card) c.appendChild(card);
    });
    window.attachTravelHandlers();
}

// ========== РЕНДЕР РАЗДЕЛА ==========
window.renderTravelSection = function(container) {
    container.innerHTML = `
        <!-- Фишки списков -->
        <div class="d-flex gap-2 flex-wrap align-items-center mb-3 overflow-auto pb-1" id="travelListChips"></div>
        
        <!-- Поиск и фильтры -->
        <div class="row g-2 mb-3">
            <div class="col-md-6">
                <div class="input-group">
                    <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="travelSearch" placeholder="Поиск...">
                </div>
            </div>
            <div class="col-md-6">
                <div class="d-flex gap-2 flex-wrap" id="travelFilters"></div>
            </div>
        </div>
        
        <!-- Бюджет -->
        <div id="travelBudget" class="budget-summary d-none mb-3"></div>
        
        <!-- Вкладки -->
        <ul class="nav nav-tabs mb-3" id="travelTabs">
            <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#travelWishlistTab">🌍 Хочу <span class="badge bg-secondary ms-1" id="travelWishCount">0</span></button></li>
            <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#travelVisitedTab">✅ Посетил <span class="badge bg-secondary ms-1" id="travelVisCount">0</span></button></li>
            <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#travelAddTab">➕ Добавить</button></li>
            <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#travelMapTab">🗺️ Карта</button></li>
        </ul>
        
        <div class="tab-content">
            <div class="tab-pane fade show active" id="travelWishlistTab">
                <div class="row g-3" id="travelWishlist"></div>
                <div id="travelWishEmpty" class="text-center py-5 d-none"><i class="bi bi-map text-muted" style="font-size:4rem"></i><p class="text-muted mt-2">Пока нет мест</p></div>
            </div>
            <div class="tab-pane fade" id="travelVisitedTab">
                <div class="row g-3" id="travelVisited"></div>
                <div id="travelVisEmpty" class="text-center py-5 d-none"><p class="text-muted">Вы пока нигде не были</p></div>
            </div>
            <div class="tab-pane fade" id="travelAddTab"><div id="travelFormContainer"></div></div>
            <div class="tab-pane fade" id="travelMapTab"><div id="travelMapContainer" style="height:70vh;border-radius:12px"></div></div>
        </div>
    `;
    
    // Загружаем форму
    import('./travelForm.js').then(mod => mod.renderTravelForm());
    
    // Загружаем карту
    import('./travelMap.js').then(mod => mod.initTravelMap());
    
    // Поиск
    document.getElementById('travelSearch').addEventListener('input', function() {
        window.travelState.searchQuery = this.value;
        renderTravelContent();
    });
    
    // Обновляем фишки списков
    if (window.renderListChips) window.renderListChips();
    
    // Загружаем места
    loadTravelPlaces();
};

window.loadTravelPlaces = loadTravelPlaces;
window.renderTravelContent = renderTravelContent;
window.getTravelCollection = getTravelCollection;

console.log('✅ travelList.js загружен');