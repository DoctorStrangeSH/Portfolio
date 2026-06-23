// ==================== moviesCards.js ====================

window.createMovieCard = function(movie, index) {
    var col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3 fade-in-up';
    col.style.animationDelay = (index * 0.03) + 's';
    
    var poster = movie.poster || 'https://placehold.co/300x450/1a1a2e/eee?text=Нет+постера';
    var genres = movie.genres || [];
    var runtime = movie.runtime ? Math.floor(movie.runtime / 60) + 'ч ' + (movie.runtime % 60) + 'мин' : '';
    var type = movie.mediaType === 'tv' ? '📺' : '🎬';
    
    var statusBadge = '';
    if (movie.status === 'favourite') statusBadge = '<span class="visit-again-badge">⭐ Любимое</span>';
    else if (movie.status === 'dislike') statusBadge = '<span class="visit-again-badge" style="background:rgba(220,53,69,0.9)">👎 Не понравилось</span>';
    
    var quickActions = '';
    if (movie.status === 'want') {
        quickActions = 
            '<button class="btn btn-sm btn-outline-success movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="watched"><i class="bi bi-check-lg"></i></button>' +
            '<button class="btn btn-sm btn-outline-warning movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="favourite"><i class="bi bi-star"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="dislike"><i class="bi bi-hand-thumbs-down"></i></button>';
    } else if (movie.status === 'watched') {
        quickActions = 
            '<button class="btn btn-sm btn-outline-warning movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="favourite"><i class="bi bi-star"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="dislike"><i class="bi bi-hand-thumbs-down"></i></button>';
    } else {
        quickActions = '<button class="btn btn-sm btn-outline-secondary movie-mark-btn" data-id="' + movie._firestoreId + '" data-status="watched"><i class="bi bi-arrow-repeat"></i></button>';
    }
    
    col.innerHTML = 
        '<div class="card h-100 shadow-sm movie-card mb-3 border-0 overflow-hidden">' +
            statusBadge +
            '<div class="position-relative">' +
                '<img src="' + poster + '" class="card-img-top" alt="' + movie.title + '" style="height:300px;object-fit:cover">' +
                '<span class="position-absolute badge bg-dark bg-opacity-50" style="top:8px;right:8px;z-index:3">' + type + '</span>' +
                '<div style="position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(transparent,rgba(0,0,0,0.8));pointer-events:none"></div>' +
            '</div>' +
            '<div class="card-body d-flex flex-column p-2">' +
                '<h6 class="card-title mb-1" style="font-size:0.9rem">' + movie.title + '</h6>' +
                '<div class="d-flex justify-content-between align-items-center mb-1"><small class="text-muted">' + (movie.year || '—') + '</small><small>' + window.renderStars(movie.rating) + '</small></div>' +
                (movie.tmdbRating ? '<small class="text-muted">TMDB: ' + movie.tmdbRating + '</small>' : '') +
                (genres.length > 0 ? '<div class="d-flex flex-wrap gap-1 mb-1">' + genres.slice(0,2).map(function(g) { return '<span class="badge bg-light text-secondary" style="font-size:0.6rem">' + g + '</span>'; }).join('') + '</div>' : '') +
                (runtime ? '<small class="text-muted d-block">⏱️ ' + runtime + '</small>' : '') +
                '<div class="mt-auto d-flex gap-1 flex-wrap pt-1">' +
                    quickActions +
                    '<button class="btn btn-sm btn-outline-info movie-detail-btn" data-id="' + movie._firestoreId + '"><i class="bi bi-info-circle"></i></button>' +
                    '<button class="btn btn-sm btn-outline-warning movie-edit-btn" data-id="' + movie._firestoreId + '"><i class="bi bi-pencil"></i></button>' +
                    '<button class="btn btn-sm btn-outline-danger movie-del-btn" data-id="' + movie._firestoreId + '"><i class="bi bi-trash"></i></button>' +
                '</div>' +
            '</div>' +
        '</div>';
    return col;
};

// ========== ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ ==========
document.addEventListener('click', async (e) => {
    const markBtn = e.target.closest('.movie-mark-btn');
    if (markBtn) {
        const id = markBtn.dataset.id;
        const newStatus = markBtn.dataset.status;
        const updateData = { status: newStatus };
        if (newStatus === 'watched') updateData.date = new Date().toISOString().split('T')[0];
        await window.updateDoc(window.doc(window.db, window.getMoviesCollection(), id), updateData);
        window.loadMovies();
        return;
    }
    
    const editBtn = e.target.closest('.movie-edit-btn');
    if (editBtn) {
        const m = window.moviesState.movies.find(x=>x._firestoreId===editBtn.dataset.id);
        if (m) showMovieEditModal(m);
        return;
    }
    
    const delBtn = e.target.closest('.movie-del-btn');
    if (delBtn) {
        const m = window.moviesState.movies.find(x=>x._firestoreId===delBtn.dataset.id);
        if (!confirm(`Удалить "${m?.title||'фильм'}"?`)) return;
        await window.deleteDoc(window.doc(window.db, window.getMoviesCollection(), delBtn.dataset.id));
        window.loadMovies();
        return;
    }
    
    const detailBtn = e.target.closest('.movie-detail-btn');
    if (detailBtn) {
        const m = window.moviesState.movies.find(x=>x._firestoreId===detailBtn.dataset.id);
        if (!m) return;
        document.getElementById('detailTitle').textContent = '🎬 ' + m.title;
        document.getElementById('detailBody').innerHTML = `
            ${m.poster?`<img src="${m.poster}" class="rounded mb-3" style="max-height:300px">`:''}
            <p><strong>Год:</strong> ${m.year||'—'} | <strong>КП:</strong> ${m.kpRating||'—'}</p>
            <p><strong>Жанры:</strong> ${(m.genres||[]).join(', ')||'—'}</p>
            <p><strong>Длительность:</strong> ${m.runtime?`${Math.floor(m.runtime/60)}ч ${m.runtime%60}мин`:'—'}</p>
            <p><strong>Страна:</strong> ${(m.countries||[]).join(', ')||'—'}</p>
            <p><strong>Слоган:</strong> ${m.slogan||'—'}</p>
            <p><strong>Описание:</strong> ${m.overview||'—'}</p>
            <p><strong>Мой рейтинг:</strong> ${window.renderStars(m.rating)}</p>
            <p><strong>Рецензия:</strong> ${m.review||'—'}</p>
            <p><strong>Смотрел с:</strong> ${m.watchedWith||'—'}</p>
            <p><strong>Дата:</strong> ${m.date||'—'}</p>`;
        new bootstrap.Modal(document.getElementById('placeDetailModal')).show();
        return;
    }
});

// ========== МОДАЛКА РЕДАКТИРОВАНИЯ ==========
function showMovieEditModal(movie) {
    const old = document.getElementById('movieEditModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="movieEditModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 shadow">
                <div class="modal-header bg-light"><h5 class="modal-title">✏️ Редактировать</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                <div class="modal-body"><form id="movieEditForm" autocomplete="off">
                    <div class="row g-3 mb-3"><div class="col-md-8"><label class="form-label">Название</label><input type="text" class="form-control" id="meTitle" value="${movie.title||''}"></div><div class="col-md-4"><label class="form-label">Год</label><input type="text" class="form-control" id="meYear" value="${movie.year||''}"></div></div>
                    <div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label">Мой рейтинг</label><div class="d-flex gap-1" id="meStars"></div></div><div class="col-md-6"><label class="form-label">Статус</label><select class="form-select" id="meStatus"><option value="want" ${movie.status==='want'?'selected':''}>🔖 Хочу</option><option value="watched" ${movie.status==='watched'?'selected':''}>✅ Посмотрел</option><option value="favourite" ${movie.status==='favourite'?'selected':''}>⭐ Любимое</option><option value="dislike" ${movie.status==='dislike'?'selected':''}>👎 Не понравилось</option></select></div></div>
                    <div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label">С кем</label><input type="text" class="form-control" id="meWatchedWith" value="${movie.watchedWith||''}"></div><div class="col-md-4"><label class="form-label">Дата</label><input type="date" class="form-control" id="meDate" value="${movie.date||''}"></div><div class="col-md-4"><label class="form-label">Длительность</label><input type="number" class="form-control" id="meRuntime" value="${movie.runtime||''}"></div></div>
                    <div class="mb-3"><label class="form-label">Рецензия</label><textarea class="form-control" id="meReview" rows="3">${movie.review||''}</textarea></div>
                    <div class="d-flex gap-2"><button type="submit" class="btn btn-success flex-grow-1">💾 Сохранить</button><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Отмена</button></div>
                </form></div>
            </div></div>
        </div>`);
    
    window.setupStarRating('meStars', movie.rating||0);
    const modal = new bootstrap.Modal(document.getElementById('movieEditModal'));
    modal.show();
    document.getElementById('movieEditForm').onsubmit = async (e) => {
        e.preventDefault();
        await window.updateDoc(window.doc(window.db, window.getMoviesCollection(), movie._firestoreId), {
            title: document.getElementById('meTitle').value.trim(),
            year: document.getElementById('meYear').value.trim(),
            rating: window.getStarRating('meStars'),
            status: document.getElementById('meStatus').value,
            watchedWith: document.getElementById('meWatchedWith').value.trim(),
            date: document.getElementById('meDate').value||'',
            runtime: parseInt(document.getElementById('meRuntime').value)||0,
            review: document.getElementById('meReview').value.trim(),
            updatedAt: Date.now()
        });
        modal.hide();
        window.loadMovies();
    };
}

console.log('✅ moviesCards.js загружен');