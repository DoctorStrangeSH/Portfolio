// ==================== collections.js v3 ====================

window.showCollections = function() {
    var old = document.getElementById('collectionsModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="collectionsModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5 class="modal-title"><i class="bi bi-collection me-2"></i>Подборки</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-4" id="collectionsBody"><div class="text-center"><div class="spinner-border text-primary"></div></div></div>' +
        '</div></div></div>');
    
    new bootstrap.Modal(document.getElementById('collectionsModal')).show();
    loadCollections();
};

async function loadCollections() {
    var body = document.getElementById('collectionsBody');
    var uid = window.currentUser.uid;
    
    var placesSnap = await window.getDocs(window.collection(window.db, 'users/' + uid + '/places'));
    var foodSnap = await window.getDocs(window.collection(window.db, 'users/' + uid + '/food'));
    var moviesSnap = await window.getDocs(window.collection(window.db, 'users/' + uid + '/movies'));
    
    var places = []; placesSnap.forEach(function(d) { places.push(d.data()); });
    var food = []; foodSnap.forEach(function(d) { food.push(d.data()); });
    var movies = []; moviesSnap.forEach(function(d) { movies.push(d.data()); });
    
    var topPlaces = places.filter(function(p) { return p.status === 'visited'; }).sort(function(a, b) { return (b.rating || 0) - (a.rating || 0); }).slice(0, 5);
    var topFood = food.filter(function(f) { return f.status === 'favourite'; }).slice(0, 5);
    var topMovies = movies.filter(function(m) { return m.status === 'favourite'; }).slice(0, 5);
    
    var shareUrl = window.location.origin + window.location.pathname + '?profile=' + uid;
    
    body.innerHTML = 
        '<div class="p-3 rounded-3 mb-3" style="background:var(--bg)">' +
            '<strong>🔗 Ваша публичная ссылка:</strong><br>' +
            '<code>' + shareUrl + '</code>' +
            '<button class="btn btn-sm btn-primary rounded-pill ms-2" onclick="navigator.clipboard.writeText(\'' + shareUrl + '\');this.innerHTML=\'✅ Скопировано!\';setTimeout(()=>this.innerHTML=\'📋 Копировать\',2000)">📋 Копировать</button>' +
        '</div>' +
        '<h6 class="fw-bold mb-2">✈️ Топ-5 путешествий</h6>' +
        (topPlaces.length ? topPlaces.map(function(p) { return '<span class="badge me-1 mb-1" style="background:var(--bg);color:var(--text);padding:6px 12px;border-radius:20px">⭐' + (p.rating||0) + ' ' + p.name + '</span>'; }).join('') : '<p style="color:var(--text-muted)">Нет данных</p>') +
        '<hr>' +
        '<h6 class="fw-bold mb-2">🍽️ Любимые рестораны</h6>' +
        (topFood.length ? topFood.map(function(f) { return '<span class="badge me-1 mb-1" style="background:var(--bg);color:var(--text);padding:6px 12px;border-radius:20px">⭐ ' + f.name + '</span>'; }).join('') : '<p style="color:var(--text-muted)">Нет данных</p>') +
        '<hr>' +
        '<h6 class="fw-bold mb-2">🎬 Любимые фильмы</h6>' +
        (topMovies.length ? topMovies.map(function(m) { return '<span class="badge me-1 mb-1" style="background:var(--bg);color:var(--text);padding:6px 12px;border-radius:20px">⭐' + (m.rating||0) + ' ' + m.title + '</span>'; }).join('') : '<p style="color:var(--text-muted)">Нет данных</p>');
}

console.log('✅ collections.js v3 загружен');