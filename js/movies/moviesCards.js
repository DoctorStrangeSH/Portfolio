// ==================== moviesCards.js v3 ====================

window.createMovieCard = function(movie, index) {
    var col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3 fade-in-up';
    col.style.animationDelay = (index * 0.03) + 's';
    
    var poster = movie.poster;
    if (poster && poster.indexOf('image.tmdb.org') !== -1) poster = poster.replace('https://image.tmdb.org', window.TMDB_PROXY_URL + '/image');
    if (!poster) poster = 'https://placehold.co/300x450/5b5fef/white?text=🎬';
    
    var genres = movie.genres || [];
    var runtime = '';
    if (movie.mediaType === 'tv' && movie.seasons) runtime = movie.seasons + ' сез.';
    else if (movie.runtime) runtime = Math.floor(movie.runtime/60) + 'ч ' + (movie.runtime%60) + 'мин';
    var type = movie.mediaType === 'tv' ? '📺' : '🎬';
    
    var statusBadge = '';
    if (movie.status === 'favourite') statusBadge = '<span class="position-absolute badge" style="top:8px;left:8px;z-index:3;background:#10b981;color:white">⭐</span>';
    else if (movie.status === 'dislike') statusBadge = '<span class="position-absolute badge" style="top:8px;left:8px;z-index:3;background:#ef4444;color:white">👎</span>';
    
    var quickActions = '';
    if (movie.status === 'want') quickActions = '<button class="btn btn-sm btn-outline-primary movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="watched" style="border-radius:20px"><i class="bi bi-check-lg"></i></button><button class="btn btn-sm btn-outline-success movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="favourite" style="border-radius:20px"><i class="bi bi-star"></i></button><button class="btn btn-sm btn-outline-danger movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="dislike" style="border-radius:20px"><i class="bi bi-hand-thumbs-down"></i></button>';
    else if (movie.status === 'watched') quickActions = '<button class="btn btn-sm btn-outline-success movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="favourite" style="border-radius:20px"><i class="bi bi-star"></i></button><button class="btn btn-sm btn-outline-danger movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="dislike" style="border-radius:20px"><i class="bi bi-hand-thumbs-down"></i></button>';
    else quickActions = '<button class="btn btn-sm btn-outline-secondary movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="watched" style="border-radius:20px"><i class="bi bi-arrow-repeat"></i></button>';
    
    col.innerHTML = 
        '<div class="card h-100 shadow-sm mb-3 border-0 overflow-hidden">' +
            '<div class="position-relative">' + statusBadge +
                '<img src="' + poster + '" class="card-img-top" style="height:280px;object-fit:cover">' +
                '<span class="position-absolute badge" style="top:8px;right:8px;z-index:3;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)">' + type + '</span>' +
                '<div style="position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(transparent,rgba(0,0,0,0.7))"></div>' +
            '</div>' +
            '<div class="card-body d-flex flex-column p-2">' +
                '<h6 class="card-title mb-1" style="font-size:0.85rem">' + movie.title + '</h6>' +
                '<div class="d-flex justify-content-between align-items-center mb-1"><small style="color:var(--text-muted)">' + (movie.year||'—') + '</small>' + window.renderStars(movie.rating) + '</div>' +
                (movie.tmdbRating ? '<small style="color:var(--text-muted)">TMDB: ' + movie.tmdbRating + '</small>' : '') +
                (genres.length ? '<div class="d-flex flex-wrap gap-1 mb-1">' + genres.slice(0,2).map(function(g) { return '<span class="badge" style="background:var(--border);color:var(--text-muted);font-size:0.65rem">' + g + '</span>'; }).join('') + '</div>' : '') +
                (runtime ? '<small class="d-block" style="color:var(--text-muted)">⏱️ ' + runtime + '</small>' : '') +
                '<div class="mt-auto d-flex gap-1 flex-wrap pt-1">' + quickActions +
                    '<button class="btn btn-sm btn-outline-secondary comment-btn" data-id="' + movie._firestoreId + '" data-type="movie" style="border-radius:20px"><i class="bi bi-chat-dots"></i></button>' +
                    '<button class="btn btn-sm btn-outline-secondary movie-detail-btn" data-id="' + movie._firestoreId + '" style="border-radius:20px"><i class="bi bi-info-circle"></i></button>' +
                    '<button class="btn btn-sm btn-outline-secondary movie-edit-btn" data-id="' + movie._firestoreId + '" style="border-radius:20px"><i class="bi bi-pencil"></i></button>' +
                    '<button class="btn btn-sm btn-outline-danger movie-del-btn" data-id="' + movie._firestoreId + '" style="border-radius:20px"><i class="bi bi-trash"></i></button>' +
                '</div>' +
            '</div>' +
        '</div>';
    return col;
};

document.addEventListener('click', async function(e) {
    var markBtn = e.target.closest('.movie-mark-btn');
    if (markBtn) {
        var updateData = { status: markBtn.dataset.status };
        if (markBtn.dataset.status === 'watched') updateData.date = new Date().toISOString().split('T')[0];
        await window.updateDoc(window.doc(window.db, window.getMoviesCollection(), markBtn.dataset.id), updateData);
        window.loadMovies();
        return;
    }
    
    var editBtn = e.target.closest('.movie-edit-btn');
    if (editBtn) {
        var m = window.moviesState.movies.find(function(x) { return x._firestoreId === editBtn.dataset.id; });
        if (m) showMovieEditModal(m);
        return;
    }
    
    var delBtn = e.target.closest('.movie-del-btn');
    if (delBtn) {
        if (!confirm('Удалить?')) return;
        await window.deleteDoc(window.doc(window.db, window.getMoviesCollection(), delBtn.dataset.id));
        window.loadMovies();
        return;
    }
    
    var detailBtn = e.target.closest('.movie-detail-btn');
    if (detailBtn) {
        var m = window.moviesState.movies.find(function(x) { return x._firestoreId === detailBtn.dataset.id; });
        if (!m) return;
        document.getElementById('detailTitle').textContent = '🎬 ' + m.title;
        document.getElementById('detailBody').innerHTML = 
            '<p><strong>Год:</strong> ' + (m.year||'—') + ' | <strong>TMDB:</strong> ' + (m.tmdbRating||'—') + '</p>' +
            '<p><strong>Жанры:</strong> ' + ((m.genres||[]).join(', ')||'—') + '</p>' +
            '<p><strong>Описание:</strong> ' + (m.overview||'—') + '</p>' +
            '<p><strong>Оценка:</strong> ' + window.renderStars(m.rating) + '</p>' +
            '<button class="btn btn-sm btn-outline-primary rounded-pill mt-2" onclick="window.showComments(\'' + m._firestoreId + '\', \'movie\')"><i class="bi bi-chat-dots me-1"></i>Комментарии</button>';
        new bootstrap.Modal(document.getElementById('placeDetailModal')).show();
        return;
    }
    
    var commentBtn = e.target.closest('.comment-btn');
    if (commentBtn) window.showComments(commentBtn.dataset.id, commentBtn.dataset.type);
});

function showMovieEditModal(movie) {
    var old = document.getElementById('movieEditModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="movieEditModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5>✏️ Редактировать</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-4"><form id="movieEditForm">' +
            '<div class="row g-3 mb-3"><div class="col-md-8"><label class="form-label">Название</label><input type="text" class="form-control rounded-pill" id="meTitle" value="' + (movie.title||'') + '"></div><div class="col-md-4"><label class="form-label">Год</label><input type="text" class="form-control rounded-pill" id="meYear" value="' + (movie.year||'') + '"></div></div>' +
            '<div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label">Оценка</label><div class="d-flex gap-1" id="meStars"></div></div><div class="col-md-6"><label class="form-label">Статус</label><select class="form-select rounded-pill" id="meStatus"><option value="want" ' + (movie.status==='want'?'selected':'') + '>🔖 Хочу</option><option value="watched" ' + (movie.status==='watched'?'selected':'') + '>✅ Посмотрел</option><option value="favourite" ' + (movie.status==='favourite'?'selected':'') + '>⭐ Любимое</option><option value="dislike" ' + (movie.status==='dislike'?'selected':'') + '>👎 Не понравилось</option></select></div></div>' +
            '<div class="mb-3"><label class="form-label">Рецензия</label><textarea class="form-control" id="meReview" rows="3" style="border-radius:16px">' + (movie.review||'') + '</textarea></div>' +
            '<div class="d-flex gap-2"><button type="submit" class="btn btn-primary rounded-pill flex-grow-1">💾 Сохранить</button><button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Отмена</button></div>' +
        '</form></div></div></div></div>');
    
    window.setupStarRating('meStars', movie.rating||0);
    var modal = new bootstrap.Modal(document.getElementById('movieEditModal'));
    modal.show();
    document.getElementById('movieEditForm').onsubmit = async function(e) {
        e.preventDefault();
        await window.updateDoc(window.doc(window.db, window.getMoviesCollection(), movie._firestoreId), {
            title: document.getElementById('meTitle').value.trim(),
            year: document.getElementById('meYear').value.trim(),
            rating: window.getStarRating('meStars'),
            status: document.getElementById('meStatus').value,
            review: document.getElementById('meReview').value.trim(),
            updatedAt: Date.now()
        });
        modal.hide();
        window.loadMovies();
    };
}

console.log('✅ moviesCards.js v3 загружен');