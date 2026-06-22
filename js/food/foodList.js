// ==================== foodList.js ====================

window.foodState = {
    places: [],
    currentFilter: 'all',
    searchQuery: '',
    priceFilter: 'all'
};

function getFoodCollection() {
    if (window.currentList === 'my') return `users/${window.currentUser.uid}/food`;
    const fid = (window.currentList || 'my').replace('shared_', '');
    return `shared/${[window.currentUser.uid, fid].sort().join('_')}/food`;
}

async function loadFoodPlaces() {
    if (!window.currentUser) return;
    try {
        const snap = await window.getDocs(window.collection(window.db, getFoodCollection()));
        window.foodState.places = [];
        snap.forEach(d => window.foodState.places.push({ id: d.id, ...d.data(), _firestoreId: d.id }));
        window.foodState.places.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        renderFoodContent();
    } catch (e) {
        console.error('loadFoodPlaces:', e);
    }
}

function getFilteredFoodPlaces() {
    let arr = window.foodState.places;
    if (window.foodState.currentFilter !== 'all') {
        arr = arr.filter(p => p.status === window.foodState.currentFilter);
    }
    if (window.foodState.priceFilter !== 'all') {
        arr = arr.filter(p => p.price === parseInt(window.foodState.priceFilter));
    }
    if (window.foodState.searchQuery) {
        const q = window.foodState.searchQuery.toLowerCase();
        arr = arr.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.cuisine || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        );
    }
    return arr;
}

function renderFoodContent() {
    const filtered = getFilteredFoodPlaces();
    renderFoodCards('foodContainer', filtered, 'foodEmpty');
    renderFoodFilters();
    updateFoodCounters();
}

function renderFoodFilters() {
    const c = document.getElementById('foodFilters');
    if (!c) return;
    
    // Фильтр по кухне
    const cuisines = new Set(window.foodState.places.map(p => p.cuisine || 'other'));
    let h = '<div class="d-flex gap-2 flex-wrap">';
    h += `<span class="category-chip ${window.foodState.currentFilter === 'all' ? 'active' : ''}" data-filter="all">Все</span>`;
    h += `<span class="category-chip ${window.foodState.currentFilter === 'want' ? 'active' : ''}" data-filter="want">🔖 Хочу</span>`;
    h += `<span class="category-chip ${window.foodState.currentFilter === 'visited' ? 'active' : ''}" data-filter="visited">✅ Посетил</span>`;
    h += `<span class="category-chip ${window.foodState.currentFilter === 'favourite' ? 'active' : ''}" data-filter="favourite">⭐ Любимые</span>`;
    h += `<span class="category-chip ${window.foodState.currentFilter === 'dislike' ? 'active' : ''}" data-filter="dislike">👎 Не понравилось</span>`;
    h += '</div>';
    
    // Фильтр по цене
    h += '<div class="d-flex gap-2 mt-2">';
    h += `<span class="category-chip ${window.foodState.priceFilter === 'all' ? 'active' : ''}" data-price="all">💰 Все</span>`;
    h += `<span class="category-chip ${window.foodState.priceFilter === '1' ? 'active' : ''}" data-price="1">₽</span>`;
    h += `<span class="category-chip ${window.foodState.priceFilter === '2' ? 'active' : ''}" data-price="2">₽₽</span>`;
    h += `<span class="category-chip ${window.foodState.priceFilter === '3' ? 'active' : ''}" data-price="3">₽₽₽</span>`;
    h += '</div>';
    
    c.innerHTML = h;
    
    c.querySelectorAll('[data-filter]').forEach(ch => {
        ch.addEventListener('click', () => {
            window.foodState.currentFilter = ch.dataset.filter;
            renderFoodContent();
        });
    });
    
    c.querySelectorAll('[data-price]').forEach(ch => {
        ch.addEventListener('click', () => {
            window.foodState.priceFilter = ch.dataset.price;
            renderFoodContent();
        });
    });
}

function updateFoodCounters() {
    const all = window.foodState.places;
    document.getElementById('foodAllCount').textContent = all.length;
    document.getElementById('foodWantCount').textContent = all.filter(p => p.status === 'want').length;
    document.getElementById('foodVisitedCount').textContent = all.filter(p => p.status === 'visited' || p.status === 'favourite' || p.status === 'dislike').length;
    document.getElementById('foodFavCount').textContent = all.filter(p => p.status === 'favourite').length;
}

function renderFoodCards(containerId, arr, emptyId) {
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
        const card = window.createFoodCard(place, i);
        if (card) c.appendChild(card);
    });
    window.attachFoodHandlers();
}

// ========== РЕНДЕР РАЗДЕЛА ==========
window.renderFoodSection = function(container) {
    container.innerHTML = `
        <div class="d-flex gap-2 flex-wrap align-items-center mb-3 overflow-auto pb-1" id="foodListChips"></div>
        
        <div class="row g-2 mb-3">
            <div class="col-md-6">
                <div class="input-group">
                    <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="foodSearch" placeholder="Поиск по названию или кухне...">
                </div>
            </div>
            <div class="col-md-6 text-end">
                <button class="btn btn-success btn-sm" id="foodAddBtn"><i class="bi bi-plus-lg me-1"></i>Добавить ресторан</button>
            </div>
        </div>
        
        <div id="foodFilters" class="mb-3"></div>
        
        <!-- Статистика -->
        <div class="row g-2 mb-3">
            <div class="col-3"><div class="card text-center p-2"><small class="text-muted">Всего</small><strong id="foodAllCount">0</strong></div></div>
            <div class="col-3"><div class="card text-center p-2"><small class="text-muted">Хочу</small><strong id="foodWantCount">0</strong></div></div>
            <div class="col-3"><div class="card text-center p-2"><small class="text-muted">Посетил</small><strong id="foodVisitedCount">0</strong></div></div>
            <div class="col-3"><div class="card text-center p-2"><small class="text-muted">⭐ Любимые</small><strong id="foodFavCount">0</strong></div></div>
        </div>
        
        <div class="row g-3" id="foodContainer"></div>
        <div id="foodEmpty" class="text-center py-5 d-none">
            <i class="bi bi-cup-hot text-muted" style="font-size:4rem"></i>
            <p class="text-muted mt-2">Пока нет ресторанов</p>
        </div>
        
        <!-- Форма (скрыта) -->
        <div id="foodFormWrapper" class="d-none mt-3"></div>
    `;
    
    // Кнопка добавления
    document.getElementById('foodAddBtn').addEventListener('click', () => {
        const wrapper = document.getElementById('foodFormWrapper');
        wrapper.classList.toggle('d-none');
        if (!wrapper.classList.contains('d-none')) {
            window.renderFoodForm();
        }
    });
    
    // Поиск
    document.getElementById('foodSearch').addEventListener('input', function() {
        window.foodState.searchQuery = this.value;
        renderFoodContent();
    });
    
    // Фишки списков
    if (window.renderListChips) window.renderListChips();
    
    // Загружаем
    import('./foodCards.js').then(() => {
        import('./foodForm.js').then(() => {
            loadFoodPlaces();
        });
    });
};

window.loadFoodPlaces = loadFoodPlaces;
window.renderFoodContent = renderFoodContent;
window.getFoodCollection = getFoodCollection;

console.log('✅ foodList.js загружен');