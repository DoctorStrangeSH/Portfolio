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
            return (m.title || '').toLowerCase().indexOf(q) !== -1;
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

// ========== ПОИСК ЧЕРЕЗ OMDb ==========
async function searchOMDb(query) {
    if (!window.OMDB_API_KEY || window.OMDB_API_KEY === 'ВАШ_OMDB_КЛЮЧ') {
        alert('Добавьте OMDb API ключ в js/core/utils.js');
        return null;
    }
    try {
        var url = 'https://www.omdbapi.com/?apikey=' + window.OMDB_API_KEY + '&s=' + encodeURIComponent(query);
        var resp = await fetch(url);
        var data = await resp.json();
        if (data.Response === 'True') return data.Search || [];
        return [];
    } catch (e) {
        console.error('OMDb error:', e);
        return [];
    }
}

async function getOMDbDetails(imdbId) {
    try {
        var url = 'https://www.omdbapi.com/?apikey=' + window.OMDB_API_KEY + '&i=' + imdbId + '&plot=full';
        var resp = await fetch(url);
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
        '<div id="omdbSearch" class="d-none mb-3"><div class="card"><div class="card-body"><h6><i class="bi bi-search me-2"></i>Результаты поиска</h6><div class="row g-2" id="omdbResults"></div><button class="btn btn-sm btn-outline-secondary mt-2" id="omdbClose">Закрыть</button></div></div></div>' +
        '<div id="moviesFilters" class="mb-3"></div>' +
        '<div class="row g-2 mb-3"><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Всего</small><strong id="moviesAllCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Хочу</small><strong id="moviesWantCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">Посмотрел</small><strong id="moviesWatchedCount">0</strong></div></div><div class="col-3"><div class="card text-center p-2"><small class="text-muted">⭐ Любимые</small><strong id="moviesFavCount">0</strong></div></div></div>' +
        '<div class="row g-3" id="moviesContainer"></div>' +
        '<div id="moviesEmpty" class="text-center py-5 d-none"><i class="bi bi-film text-muted" style="font-size:4rem"></i><p class="text-muted mt-2">Пока нет фильмов</p></div>';
    
    document.getElementById('moviesAddBtn').addEventListener('click', function() {
        var query = prompt('🔍 Введите название фильма:');
        if (query) searchAndShowOMDb(query);
    });
    
    document.getElementById('omdbClose').addEventListener('click', function() {
        document.getElementById('omdbSearch').classList.add('d-none');
    });
    
    document.getElementById('moviesSearch').addEventListener('input', function() {
        window.moviesState.searchQuery = this.value;
        renderMoviesContent();
    });
    
    if (window.renderListChips) window.renderListChips();
    loadMovies();
};

async function searchAndShowOMDb(query) {
    var results = await searchOMDb(query);
    var panel = document.getElementById('omdbSearch');
    var container = document.getElementById('omdbResults');
    
    if (!results || !results.length) {
        alert('Ничего не найдено');
        return;
    }
    
    panel.classList.remove('d-none');
    container.innerHTML = results.slice(0, 6).map(function(f) {
        return '<div class="col-md-4 col-lg-2"><div class="card h-100" style="cursor:pointer" onclick="window.addMovieFromOMDb(\'' + f.imdbID + '\')">' +
            '<img src="' + (f.Poster !== 'N/A' ? f.Poster : 'https://placehold.co/300x450?text=Нет+постера') + '" class="card-img-top" style="height:200px;object-fit:cover">' +
            '<div class="card-body p-2 text-center"><small class="fw-bold">' + f.Title + '</small><br><small class="text-muted">' + f.Year + '</small></div>' +
            '</div></div>';
    }).join('');
}

window.addMovieFromOMDb = async function(imdbId) {
    var details = await getOMDbDetails(imdbId);
    if (!details) return alert('Не удалось загрузить');
    
    var data = {
        title: details.Title || '',
        year: details.Year || '',
        poster: details.Poster !== 'N/A' ? details.Poster : '',
        overview: details.Plot || '',
        rating: Math.round((parseFloat(details.imdbRating) || 0) / 2),
        imdbRating: details.imdbRating || 0,
        genres: details.Genre ? details.Genre.split(', ') : [],
        runtime: parseInt(details.Runtime) || 0,
        director: details.Director || '',
        actors: details.Actors || '',
        country: details.Country || '',
        imdbId: imdbId,
        status: 'want',
        author: window.currentUser ? window.currentUser.displayName.split(' ')[0] : 'Я',
        createdAt: Date.now()
    };
    
    await window.addDoc(window.collection(window.db, getMoviesCollection()), data);
    document.getElementById('omdbSearch').classList.add('d-none');
    window.loadMovies();
    alert('✅ ' + data.title + ' добавлен!');
};

window.loadMovies = loadMovies;
window.renderMoviesContent = renderMoviesContent;
window.getMoviesCollection = getMoviesCollection;

console.log('✅ moviesList.js загружен');