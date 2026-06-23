// ==================== moviesList.js (TMDB) ====================

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

// ========== ПОИСК TMDB ==========
async function searchTMDB(query) {
    if (!window.TMDB_PROXY_URL) {
        alert('TMDB_PROXY_URL не настроен!');
        return [];
    }
    
    var url = window.TMDB_PROXY_URL.replace(/\/$/, '') + '/proxy/search/movie?query=' + encodeURIComponent(query) + '&language=ru-RU&page=1';
    
    console.log('🔍 Ищем:', url);  // ← ВРЕМЕННО
    
    try {
        var resp = await fetch(url);
        console.log('📡 Ответ:', resp.status);  // ← ВРЕМЕННО
        var data = await resp.json();
        console.log('📦 Данные:', data);  // ← ВРЕМЕННО
        return data.results || [];
    } catch (e) {
        console.error('❌ Ошибка:', e);
        return [];
    }
}

async function getTMDBDetails(movieId) {
    try {
        var url = window.TMDB_PROXY_URL.replace(/\/$/, '') + '/proxy/movie/' + movieId + '?language=ru-RU&append_to_response=credits';
        var resp = await fetch(url);
        return await resp.json();
    } catch (e) { return null; }
}

// ========== РЕНДЕР РАЗДЕЛА ==========
window.renderMoviesSection = function(container) {
    container.innerHTML = 
        '<div class="d-flex gap-2 flex-wrap align-items-center mb-3 overflow-auto pb-1" id="moviesListChips"></div>' +
        '<div class="row g-2 mb-3">' +
            '<div class="col-md-6"><div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input type="text" class="form-control" id="moviesSearch" placeholder="Поиск по названию..."></div></div>' +
            '<div class="col-md-6 text-end"><button class="btn btn-success btn-sm" id="moviesAddBtn"><i class="bi bi-plus-lg me-1"></i>Добавить фильм</button></div>' +
        '</div>' +
        '<div id="tmdbSearch" class="d-none mb-3"><div class="card border-0 shadow-sm"><div class="card-body">' +
            '<div class="d-flex justify-content-between align-items-center mb-2"><h6 class="mb-0"><i class="bi bi-search me-2"></i>Результаты TMDB</h6><button class="btn btn-sm btn-outline-secondary" id="tmdbClose">✕</button></div>' +
            '<div class="row g-2" id="tmdbResults"></div>' +
        '</div></div></div>' +
        '<div id="moviesFilters" class="mb-3"></div>' +
        '<div class="row g-2 mb-3"><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Всего</small><strong id="moviesAllCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Хочу</small><strong id="moviesWantCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Посмотрел</small><strong id="moviesWatchedCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">⭐ Любимые</small><strong id="moviesFavCount">0</strong></div></div></div>' +
        '<div class="row g-3" id="moviesContainer"></div>' +
        '<div id="moviesEmpty" class="text-center py-5 d-none"><i class="bi bi-film text-muted" style="font-size:4rem"></i><p class="text-muted mt-2">Пока нет фильмов</p></div>';
    
    document.getElementById('moviesAddBtn').addEventListener('click', function() {
        var query = prompt('🔍 Введите название фильма (можно на русском):');
        if (query) searchAndShowTMDB(query);
    });
    
    document.getElementById('tmdbClose').addEventListener('click', function() {
        document.getElementById('tmdbSearch').classList.add('d-none');
    });
    
    document.getElementById('moviesSearch').addEventListener('input', function() {
        window.moviesState.searchQuery = this.value;
        renderMoviesContent();
    });
    
    if (window.renderListChips) window.renderListChips();
    loadMovies();
};

async function searchAndShowTMDB(query) {
    var results = await searchTMDB(query);
    var panel = document.getElementById('tmdbSearch');
    var container = document.getElementById('tmdbResults');
    
    if (!results || !results.length) {
        alert('Ничего не найдено');
        return;
    }
    
    panel.classList.remove('d-none');
    container.innerHTML = results.slice(0, 6).map(function(m) {
        var poster = m.poster_path ? 'https://image.tmdb.org/t/p/w300' + m.poster_path : 'https://placehold.co/300x450?text=Нет+постера';
        var title = m.title || m.name || 'Без названия';
        var year = m.release_date ? m.release_date.split('-')[0] : (m.first_air_date ? m.first_air_date.split('-')[0] : '—');
        
        return '<div class="col-md-4 col-lg-2"><div class="card h-100" style="cursor:pointer" onclick="window.addMovieFromTMDB(' + m.id + ', \'' + (m.media_type || 'movie') + '\')">' +
            '<img src="' + poster + '" class="card-img-top" style="height:200px;object-fit:cover">' +
            '<div class="card-body p-2 text-center"><small class="fw-bold">' + title + '</small><br><small class="text-muted">' + year + ' | ⭐ ' + (m.vote_average || '—') + '</small></div>' +
            '</div></div>';
    }).join('');
    
    panel.scrollIntoView({ behavior: 'smooth' });
}

window.addMovieFromTMDB = async function(movieId, mediaType) {
    var details = await getTMDBDetails(movieId);
    if (!details) return alert('Не удалось загрузить');
    
    var data = {
        title: details.title || details.name || '',
        originalTitle: details.original_title || details.original_name || '',
        year: (details.release_date || details.first_air_date || '').split('-')[0],
        poster: details.poster_path ? 'https://image.tmdb.org/t/p/w500' + details.poster_path : '',
        backdrop: details.backdrop_path ? 'https://image.tmdb.org/t/p/w1280' + details.backdrop_path : '',
        overview: details.overview || '',
        rating: Math.round((details.vote_average || 0) / 2),
        tmdbRating: details.vote_average || 0,
        genres: details.genres ? details.genres.map(function(g) { return g.name; }) : [],
        runtime: details.runtime || details.episode_run_time?.[0] || 0,
        tagline: details.tagline || '',
        countries: details.production_countries ? details.production_countries.map(function(c) { return c.name; }) : [],
        mediaType: mediaType || 'movie',
        status: 'want',
        author: window.currentUser ? window.currentUser.displayName.split(' ')[0] : 'Я',
        createdAt: Date.now()
    };
    
    await window.addDoc(window.collection(window.db, getMoviesCollection()), data);
    document.getElementById('tmdbSearch').classList.add('d-none');
    window.loadMovies();
    alert('✅ ' + data.title + ' добавлен!');
};

window.loadMovies = loadMovies;
window.renderMoviesContent = renderMoviesContent;
window.getMoviesCollection = getMoviesCollection;

console.log('✅ moviesList.js загружен (TMDB)');