// ==================== moviesList.js ====================

window.moviesState = {
    movies: [],
    currentFilter: localStorage.getItem('moviesFilter') || 'all',
    searchQuery: ''
};

function getMoviesCollection() {
    if (window.currentList === 'my') return `users/${window.currentUser.uid}/movies`;
    const fid = (window.currentList || 'my').replace('shared_', '');
    return `shared/${[window.currentUser.uid, fid].sort().join('_')}/movies`;
}

async function loadMovies() {
    if (!window.currentUser) return;
    try {
        const snap = await window.getDocs(window.collection(window.db, getMoviesCollection()));
        window.moviesState.movies = [];
        snap.forEach(d => window.moviesState.movies.push({ id: d.id, ...d.data(), _firestoreId: d.id }));
        window.moviesState.movies.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        renderMoviesContent();
    } catch (e) { console.error('loadMovies:', e); }
}

function getFilteredMovies() {
    let arr = window.moviesState.movies;
    if (window.moviesState.currentFilter !== 'all') arr = arr.filter(m => m.status === window.moviesState.currentFilter);
    if (window.moviesState.searchQuery) {
        const q = window.moviesState.searchQuery.toLowerCase();
        arr = arr.filter(m => (m.title||'').toLowerCase().includes(q) || (m.overview||'').toLowerCase().includes(q));
    }
    return arr;
}

function renderMoviesContent() {
    const filtered = getFilteredMovies();
    renderMoviesCards('moviesContainer', filtered, 'moviesEmpty');
    renderMoviesFilters();
    updateMoviesCounters();
}

function renderMoviesFilters() {
    const c = document.getElementById('moviesFilters');
    if (!c) return;
    let h = '<div class="d-flex gap-2 flex-wrap">';
    h += `<span class="category-chip ${window.moviesState.currentFilter==='all'?'active':''}" data-filter="all">Все</span>`;
    h += `<span class="category-chip ${window.moviesState.currentFilter==='want'?'active':''}" data-filter="want">🔖 Хочу</span>`;
    h += `<span class="category-chip ${window.moviesState.currentFilter==='watched'?'active':''}" data-filter="watched">✅ Посмотрел</span>`;
    h += `<span class="category-chip ${window.moviesState.currentFilter==='favourite'?'active':''}" data-filter="favourite">⭐ Любимые</span>`;
    h += `<span class="category-chip ${window.moviesState.currentFilter==='dislike'?'active':''}" data-filter="dislike">👎 Не понравилось</span>`;
    h += '</div>';
    c.innerHTML = h;
    c.querySelectorAll('[data-filter]').forEach(ch => {
        ch.addEventListener('click', () => {
            window.moviesState.currentFilter = ch.dataset.filter;
            localStorage.setItem('moviesFilter', window.moviesState.currentFilter);
            renderMoviesContent();
        });
    });
}

function updateMoviesCounters() {
    const all = window.moviesState.movies;
    document.getElementById('moviesAllCount')?.textContent = all.length;
    document.getElementById('moviesWantCount')?.textContent = all.filter(m=>m.status==='want').length;
    document.getElementById('moviesWatchedCount')?.textContent = all.filter(m=>m.status==='watched'||m.status==='favourite').length;
    document.getElementById('moviesFavCount')?.textContent = all.filter(m=>m.status==='favourite').length;
}

function renderMoviesCards(containerId, arr, emptyId) {
    const c = document.getElementById(containerId);
    const e = document.getElementById(emptyId);
    if (!c||!e) return;
    c.innerHTML = '';
    if (!arr.length) { e.classList.remove('d-none'); return; }
    e.classList.add('d-none');
    arr.forEach((m,i)=>{ if(window.createMovieCard){ const card=window.createMovieCard(m,i); if(card)c.appendChild(card); } });
}

// ========== ПОИСК ЧЕРЕЗ КИНОПОИСК ==========
async function searchKinopoisk(query) {
    if (!window.KINOPOISK_API_KEY || window.KINOPOISK_API_KEY === 'ВАШ_КЛЮЧ_СЮДА') {
        alert('⚠️ Добавьте API ключ Кинопоиска в js/core/utils.js');
        return [];
    }
    try {
        const resp = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=1`, {
            headers: { 'X-API-KEY': window.KINOPOISK_API_KEY }
        });
        const data = await resp.json();
        return data.films || [];
    } catch (e) { console.error(e); return []; }
}

async function getKinopoiskDetails(filmId) {
    try {
        const resp = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}`, {
            headers: { 'X-API-KEY': window.KINOPOISK_API_KEY }
        });
        return await resp.json();
    } catch (e) { return null; }
}

// ========== РЕНДЕР РАЗДЕЛА ==========
window.renderMoviesSection = function(container) {
    container.innerHTML = `
        <div class="d-flex gap-2 flex-wrap align-items-center mb-3 overflow-auto pb-1" id="moviesListChips"></div>
        <div class="row g-2 mb-3">
            <div class="col-md-6"><div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input type="text" class="form-control" id="moviesSearch" placeholder="Поиск..."></div></div>
            <div class="col-md-6 text-end"><button class="btn btn-success btn-sm" id="moviesAddBtn"><i class="bi bi-plus-lg me-1"></i>Добавить фильм</button></div>
        </div>
        <div id="kpSearch" class="d-none mb-3"><div class="card"><div class="card-body"><h6><i class="bi bi-search me-2"></i>Результаты Кинопоиска</h6><div class="row g-2" id="kpResults"></div><button class="btn btn-sm btn-outline-secondary mt-2" id="kpClose">Закрыть</button></div></div></div>
        <div id="moviesFilters" class="mb-3"></div>
        <div class="row g-2 mb-3"><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Всего</small><strong id="moviesAllCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Хочу</small><strong id="moviesWantCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Посмотрел</small><strong id="moviesWatchedCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">⭐ Любимые</small><strong id="moviesFavCount">0</strong></div></div></div>
        <div class="row g-3" id="moviesContainer"></div>
        <div id="moviesEmpty" class="text-center py-5 d-none"><i class="bi bi-film text-muted" style="font-size:4rem"></i><p class="text-muted mt-2">Пока нет фильмов</p></div>`;
    
    document.getElementById('moviesAddBtn').addEventListener('click', () => {
        const query = prompt('🔍 Введите название фильма для поиска на Кинопоиске:');
        if (query) searchAndShowKP(query);
    });
    document.getElementById('kpClose')?.addEventListener('click', () => document.getElementById('kpSearch').classList.add('d-none'));
    document.getElementById('moviesSearch').addEventListener('input', function(){ window.moviesState.searchQuery=this.value; renderMoviesContent(); });
    if (window.renderListChips) window.renderListChips();
    loadMovies();
};

async function searchAndShowKP(query) {
    const results = await searchKinopoisk(query);
    const panel = document.getElementById('kpSearch');
    const container = document.getElementById('kpResults');
    if (!results.length) { alert('Ничего не найдено'); return; }
    panel.classList.remove('d-none');
    container.innerHTML = results.slice(0,6).map(f => `
        <div class="col-md-4 col-lg-2"><div class="card h-100" style="cursor:pointer" onclick="addMovieFromKP(${f.filmId})">
            <img src="${f.posterUrlPreview || 'https://placehold.co/300x450?text=Нет+постера'}" class="card-img-top" style="height:200px;object-fit:cover">
            <div class="card-body p-2 text-center"><small class="fw-bold">${f.nameRu || f.nameEn}</small><br><small class="text-muted">${f.year||'—'} | ⭐ ${f.rating||'—'}</small></div>
        </div></div>`).join('');
}

window.addMovieFromKP = async function(filmId) {
    const details = await getKinopoiskDetails(filmId);
    if (!details) return alert('Не удалось загрузить');
    const data = {
        title: details.nameRu || details.nameOriginal || '',
        originalTitle: details.nameOriginal || '',
        year: details.year || '',
        poster: details.posterUrl || '',
        overview: details.description || '',
        rating: Math.round((details.ratingKinopoisk || 0) / 2),
        kpRating: details.ratingKinopoisk || 0,
        genres: details.genres?.map(g=>g.genre) || [],
        runtime: details.filmLength || 0,
        slogan: details.slogan || '',
        countries: details.countries?.map(c=>c.country) || [],
        status: 'want',
        author: window.currentUser?.displayName?.split(' ')[0]||'Я',
        createdAt: Date.now()
    };
    await window.addDoc(window.collection(window.db, getMoviesCollection()), data);
    document.getElementById('kpSearch').classList.add('d-none');
    window.loadMovies();
    alert('✅ Фильм добавлен!');
};

window.loadMovies = loadMovies;
window.renderMoviesContent = renderMoviesContent;
window.getMoviesCollection = getMoviesCollection;

console.log('✅ moviesList.js загружен');