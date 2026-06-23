// ==================== moviesList.js ====================

window.moviesState = {
    movies: [],
    currentFilter: localStorage.getItem('moviesFilter') || 'all',
    searchQuery: ''
};

function getMoviesCollection() {
    if (window.currentList === 'my') return 'users/' + window.currentUser.uid + '/movies';
    var fid = (window.currentList || 'my').replace('shared_', '');
    var ids = [window.currentUser.uid, fid].sort();
    return 'shared/' + ids[0] + '_' + ids[1] + '/movies';
}

async function loadMovies() {
    if (!window.currentUser) return;
    try {
        var snap = await window.getDocs(window.collection(window.db, getMoviesCollection()));
        window.moviesState.movies = [];
        snap.forEach(function(d) {
            var m = d.data();
            m._firestoreId = d.id;
            window.moviesState.movies.push(m);
        });
        window.moviesState.movies.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        renderMoviesContent();
    } catch (e) { console.error('loadMovies:', e); }
}

function getFilteredMovies() {
    var arr = window.moviesState.movies;
    if (window.moviesState.currentFilter !== 'all') {
        arr = arr.filter(function(m) { return m.status === window.moviesState.currentFilter; });
    }
    if (window.moviesState.searchQuery) {
        var q = window.moviesState.searchQuery.toLowerCase();
        arr = arr.filter(function(m) {
            return (m.title || '').toLowerCase().indexOf(q) !== -1 ||
                   (m.overview || '').toLowerCase().indexOf(q) !== -1;
        });
    }
    return arr;
}

function renderMoviesContent() {
    var filtered = getFilteredMovies();
    renderMoviesCards('moviesContainer', filtered, 'moviesEmpty');
    renderMoviesFilters();
    updateMoviesCounters();
}

function renderMoviesFilters() {
    var c = document.getElementById('moviesFilters');
    if (!c) return;
    var h = '<div class="d-flex gap-2 flex-wrap">';
    h += '<span class="category-chip ' + (window.moviesState.currentFilter === 'all' ? 'active' : '') + '" data-filter="all">Все</span>';
    h += '<span class="category-chip ' + (window.moviesState.currentFilter === 'want' ? 'active' : '') + '" data-filter="want">🔖 Хочу</span>';
    h += '<span class="category-chip ' + (window.moviesState.currentFilter === 'watched' ? 'active' : '') + '" data-filter="watched">✅ Посмотрел</span>';
    h += '<span class="category-chip ' + (window.moviesState.currentFilter === 'favourite' ? 'active' : '') + '" data-filter="favourite">⭐ Любимые</span>';
    h += '<span class="category-chip ' + (window.moviesState.currentFilter === 'dislike' ? 'active' : '') + '" data-filter="dislike">👎 Не понравилось</span>';
    h += '</div>';
    c.innerHTML = h;
    c.querySelectorAll('[data-filter]').forEach(function(ch) {
        ch.addEventListener('click', function() {
            window.moviesState.currentFilter = ch.dataset.filter;
            localStorage.setItem('moviesFilter', window.moviesState.currentFilter);
            renderMoviesContent();
        });
    });
}

function updateMoviesCounters() {
    var all = window.moviesState.movies;
    var el = document.getElementById('moviesAllCount'); if (el) el.textContent = all.length;
    el = document.getElementById('moviesWantCount'); if (el) el.textContent = all.filter(function(m){return m.status==='want';}).length;
    el = document.getElementById('moviesWatchedCount'); if (el) el.textContent = all.filter(function(m){return m.status==='watched'||m.status==='favourite';}).length;
    el = document.getElementById('moviesFavCount'); if (el) el.textContent = all.filter(function(m){return m.status==='favourite';}).length;
}

function renderMoviesCards(containerId, arr, emptyId) {
    var c = document.getElementById(containerId);
    var e = document.getElementById(emptyId);
    if (!c || !e) return;
    c.innerHTML = '';
    if (arr.length === 0) { e.classList.remove('d-none'); return; }
    e.classList.add('d-none');
    arr.forEach(function(m, i) {
        if (window.createMovieCard) {
            var card = window.createMovieCard(m, i);
            if (card) c.appendChild(card);
        }
    });
}

// ========== ПОИСК КИНОПОИСК (kinopoisk.dev) ==========
async function searchKinopoisk(query) {
    if (!window.KINOPOISK_API_KEY || window.KINOPOISK_API_KEY === 'ВАШ_КЛЮЧ_СЮДА' || window.KINOPOISK_API_KEY.indexOf('ВАШ') !== -1) {
        alert('Добавьте API ключ в js/core/utils.js');
        return [];
    }
    try {
        var url = 'https://api.kinopoisk.dev/v1.4/movie/search?page=1&limit=6&query=' + encodeURIComponent(query);
        var resp = await fetch(url, {
            headers: { 'X-API-KEY': window.KINOPOISK_API_KEY }
        });
        if (!resp.ok) {
            console.error('Ошибка API:', resp.status);
            return [];
        }
        var data = await resp.json();
        return data.docs || [];
    } catch (e) {
        console.error('Поиск не удался:', e);
        return [];
    }
}

async function getKinopoiskDetails(filmId) {
    try {
        var url = 'https://api.kinopoisk.dev/v1.4/movie/' + filmId;
        var resp = await fetch(url, {
            headers: { 'X-API-KEY': window.KINOPOISK_API_KEY }
        });
        if (!resp.ok) return null;
        return await resp.json();
    } catch (e) { return null; }
}

// ========== РЕНДЕР РАЗДЕЛА ==========
window.renderMoviesSection = function(container) {
    container.innerHTML = 
        '<div class="d-flex gap-2 flex-wrap align-items-center mb-3 overflow-auto pb-1" id="moviesListChips"></div>' +
        '<div class="row g-2 mb-3">' +
            '<div class="col-md-6"><div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input type="text" class="form-control" id="moviesSearch" placeholder="Поиск..."></div></div>' +
            '<div class="col-md-6 text-end"><button class="btn btn-success btn-sm" id="moviesAddBtn"><i class="bi bi-plus-lg me-1"></i>Добавить фильм</button></div>' +
        '</div>' +
        '<div id="kpSearch" class="d-none mb-3"><div class="card"><div class="card-body"><h6><i class="bi bi-search me-2"></i>Результаты поиска</h6><div class="row g-2" id="kpResults"></div><button class="btn btn-sm btn-outline-secondary mt-2" id="kpClose">Закрыть</button></div></div></div>' +
        '<div id="moviesFilters" class="mb-3"></div>' +
        '<div class="row g-2 mb-3"><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Всего</small><strong id="moviesAllCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Хочу</small><strong id="moviesWantCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Посмотрел</small><strong id="moviesWatchedCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">⭐ Любимые</small><strong id="moviesFavCount">0</strong></div></div></div>' +
        '<div class="row g-3" id="moviesContainer"></div>' +
        '<div id="moviesEmpty" class="text-center py-5 d-none"><i class="bi bi-film text-muted" style="font-size:4rem"></i><p class="text-muted mt-2">Пока нет фильмов</p></div>';
    
    document.getElementById('moviesAddBtn').addEventListener('click', function() {
        var query = prompt('🔍 Введите название фильма:');
        if (query) searchAndShowKP(query);
    });
    
    document.getElementById('kpClose').addEventListener('click', function() {
        document.getElementById('kpSearch').classList.add('d-none');
    });
    
    document.getElementById('moviesSearch').addEventListener('input', function() {
        window.moviesState.searchQuery = this.value;
        renderMoviesContent();
    });
    
    if (window.renderListChips) window.renderListChips();
    loadMovies();
};

async function searchAndShowKP(query) {
    var results = await searchKinopoisk(query);
    var panel = document.getElementById('kpSearch');
    var container = document.getElementById('kpResults');
    
    if (!results.length) {
        alert('Ничего не найдено. Проверьте API ключ.');
        return;
    }
    
    panel.classList.remove('d-none');
    container.innerHTML = results.slice(0, 6).map(function(f) {
        var poster = f.poster ? f.poster.url || f.poster : '';
        var preview = f.poster ? f.poster.previewUrl || poster : '';
        var title = f.name || f.alternativeName || 'Без названия';
        var year = f.year || '—';
        var rating = f.rating ? f.rating.kp || f.rating.imdb || '—' : '—';
        
        return '<div class="col-md-4 col-lg-2"><div class="card h-100" style="cursor:pointer" onclick="window.addMovieFromKP(' + f.id + ')">' +
            '<img src="' + (preview || 'https://placehold.co/300x450?text=Нет+постера') + '" class="card-img-top" style="height:200px;object-fit:cover">' +
            '<div class="card-body p-2 text-center"><small class="fw-bold">' + title + '</small><br><small class="text-muted">' + year + ' | ⭐ ' + rating + '</small></div>' +
            '</div></div>';
    }).join('');
}

window.addMovieFromKP = async function(filmId) {
    var details = await getKinopoiskDetails(filmId);
    if (!details) {
        // Если детали не загрузились — добавляем базовые
        alert('Фильм добавлен с базовыми данными');
        await window.addDoc(window.collection(window.db, getMoviesCollection()), {
            title: 'Фильм ' + filmId,
            kpId: filmId,
            status: 'want',
            author: window.currentUser ? window.currentUser.displayName.split(' ')[0] : 'Я',
            createdAt: Date.now()
        });
    } else {
        var posterUrl = '';
        if (details.poster && details.poster.url) posterUrl = details.poster.url;
        
        await window.addDoc(window.collection(window.db, getMoviesCollection()), {
            title: details.name || details.alternativeName || 'Без названия',
            originalTitle: details.alternativeName || '',
            year: details.year || '',
            poster: posterUrl,
            overview: details.description || '',
            rating: details.rating ? Math.round((details.rating.kp || details.rating.imdb || 0) / 2) : 0,
            kpRating: details.rating ? (details.rating.kp || 0) : 0,
            imdbRating: details.rating ? (details.rating.imdb || 0) : 0,
            genres: details.genres ? details.genres.map(function(g) { return g.name; }) : [],
            runtime: details.movieLength || 0,
            slogan: details.slogan || '',
            countries: details.countries ? details.countries.map(function(c) { return c.name; }) : [],
            status: 'want',
            author: window.currentUser ? window.currentUser.displayName.split(' ')[0] : 'Я',
            createdAt: Date.now()
        });
    }
    
    document.getElementById('kpSearch').classList.add('d-none');
    window.loadMovies();
    alert('✅ Фильм добавлен!');
};

window.loadMovies = loadMovies;
window.renderMoviesContent = renderMoviesContent;
window.getMoviesCollection = getMoviesCollection;

console.log('✅ moviesList.js загружен');