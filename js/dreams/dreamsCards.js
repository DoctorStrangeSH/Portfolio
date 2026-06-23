// ==================== dreamsCards.js ====================

window.createDreamCard = function(dream, index) {
    var col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3 fade-in-up';
    col.style.animationDelay = (index * 0.03) + 's';
    
    var cat = window.DREAM_CATEGORIES[dream.category] || window.DREAM_CATEGORIES.other;
    var st = window.DREAM_STATUSES[dream.status] || window.DREAM_STATUSES.dreaming;
    var progress = dream.progress || 0;
    var progressColor = progress >= 80 ? 'bg-success' : progress >= 40 ? 'bg-warning' : 'bg-info';
    var photo = dream.photo || 'https://placehold.co/400x250/e8f0fe/' + cat.color.replace('#', '') + '?text=' + encodeURIComponent(cat.emoji + '+Мечта');
    
    col.innerHTML = 
        '<div class="card h-100 shadow-sm dream-card mb-3 border-0 overflow-hidden" style="border-top:4px solid ' + cat.color + '">' +
            '<div class="position-relative">' +
                '<img src="' + photo + '" class="card-img-top" alt="' + dream.title + '" style="height:180px;object-fit:cover">' +
                '<span class="position-absolute badge" style="top:8px;right:8px;z-index:3;background:' + st.color + ';color:white">' + st.emoji + ' ' + st.name + '</span>' +
                '<span class="position-absolute badge bg-dark bg-opacity-50" style="top:8px;left:8px;z-index:3">' + cat.emoji + ' ' + cat.name + '</span>' +
            '</div>' +
            '<div class="card-body d-flex flex-column p-3">' +
                '<h6 class="card-title mb-2">' + dream.title + '</h6>' +
                '<div class="progress mb-2" style="height:8px;border-radius:4px"><div class="progress-bar ' + progressColor + '" style="width:' + progress + '%"></div></div>' +
                '<div class="d-flex justify-content-between align-items-center mb-2"><small class="fw-bold">' + progress + '%</small>' + (dream.deadline ? '<small class="text-muted">⏳ ' + dream.deadline + '</small>' : '') + '</div>' +
                (dream.description ? '<p class="card-text text-muted small flex-grow-1">' + dream.description.substring(0, 80) + (dream.description.length > 80 ? '...' : '') + '</p>' : '') +
                (dream.cost > 0 ? '<small class="text-muted">💰 ' + window.formatBudget(dream.cost) + '</small>' : '') +
                '<div class="mt-auto d-flex gap-1 flex-wrap pt-1">' +
                    '<button class="btn btn-sm btn-outline-primary dream-progress-btn" data-id="' + dream._firestoreId + '" title="Обновить прогресс"><i class="bi bi-graph-up"></i></button>' +
                    '<button class="btn btn-sm btn-outline-info dream-detail-btn" data-id="' + dream._firestoreId + '"><i class="bi bi-info-circle"></i></button>' +
                    '<button class="btn btn-sm btn-outline-warning dream-edit-btn" data-id="' + dream._firestoreId + '"><i class="bi bi-pencil"></i></button>' +
                    '<button class="btn btn-sm btn-outline-danger dream-del-btn" data-id="' + dream._firestoreId + '"><i class="bi bi-trash"></i></button>' +
                '</div>' +
            '</div>' +
        '</div>';
    return col;
};

// ========== ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ ==========
document.addEventListener('click', async function(e) {
    var progressBtn = e.target.closest('.dream-progress-btn');
    if (progressBtn) {
        var id = progressBtn.dataset.id;
        var d = window.dreamsState.dreams.find(function(x) { return x._firestoreId === id; });
        if (!d) return;
        var newProgress = prompt('Прогресс (0-100):', d.progress || 0);
        if (newProgress === null) return;
        newProgress = Math.min(100, Math.max(0, parseInt(newProgress) || 0));
        await window.updateDoc(window.doc(window.db, window.getDreamsCollection(), id), { progress: newProgress });
        window.loadDreams();
        return;
    }
    
    var delBtn = e.target.closest('.dream-del-btn');
    if (delBtn) {
        var d = window.dreamsState.dreams.find(function(x) { return x._firestoreId === delBtn.dataset.id; });
        if (!confirm('Удалить мечту "' + (d ? d.title : '') + '"?')) return;
        await window.deleteDoc(window.doc(window.db, window.getDreamsCollection(), delBtn.dataset.id));
        window.loadDreams();
        return;
    }
    
    var detailBtn = e.target.closest('.dream-detail-btn');
    if (detailBtn) {
        var d = window.dreamsState.dreams.find(function(x) { return x._firestoreId === detailBtn.dataset.id; });
        if (!d) return;
        showDreamDetailModal(d);
        return;
    }
    
    var editBtn = e.target.closest('.dream-edit-btn');
    if (editBtn) {
        var d = window.dreamsState.dreams.find(function(x) { return x._firestoreId === editBtn.dataset.id; });
        if (d) showDreamEditModal(d);
        return;
    }
});

// ========== ДЕТАЛИ ==========
function showDreamDetailModal(dream) {
    var cat = window.DREAM_CATEGORIES[dream.category] || window.DREAM_CATEGORIES.other;
    var st = window.DREAM_STATUSES[dream.status] || window.DREAM_STATUSES.dreaming;
    var progress = dream.progress || 0;
    var progressColor = progress >= 80 ? 'bg-success' : progress >= 40 ? 'bg-warning' : 'bg-info';
    
    document.getElementById('detailTitle').textContent = '💭 ' + dream.title;
    document.getElementById('detailBody').innerHTML = 
        (dream.photo ? '<img src="' + dream.photo + '" class="rounded mb-3" style="max-height:250px;width:100%;object-fit:cover">' : '') +
        '<div class="row mb-3"><div class="col-6"><strong>Категория:</strong> ' + cat.emoji + ' ' + cat.name + '</div><div class="col-6"><strong>Статус:</strong> <span style="color:' + st.color + '">' + st.emoji + ' ' + st.name + '</span></div></div>' +
        '<p><strong>Прогресс:</strong></p><div class="progress mb-2" style="height:12px"><div class="progress-bar ' + progressColor + '" style="width:' + progress + '%">' + progress + '%</div></div>' +
        '<p><strong>Описание:</strong> ' + (dream.description || '—') + '</p>' +
        '<p><strong>Дедлайн:</strong> ' + (dream.deadline || '—') + '</p>' +
        '<p><strong>Стоимость:</strong> ' + (dream.cost ? window.formatBudget(dream.cost) : '—') + '</p>' +
        (dream.links && dream.links.length > 0 ? '<p><strong>Ссылки:</strong> ' + dream.links.map(function(l) { return '<a href="' + l + '" target="_blank" class="me-2">🔗</a>'; }).join('') + '</p>' : '');
    
    new bootstrap.Modal(document.getElementById('placeDetailModal')).show();
}

// ========== РЕДАКТИРОВАНИЕ ==========
function showDreamEditModal(dream) {
    var old = document.getElementById('dreamEditModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="dreamEditModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 shadow">' +
        '<div class="modal-header bg-light"><h5 class="modal-title">✏️ Редактировать мечту</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body"><form id="dreamEditForm" autocomplete="off">' +
            '<div class="row g-3 mb-3"><div class="col-md-8"><label class="form-label">Название</label><input type="text" class="form-control" id="deTitle" value="' + dream.title + '"></div><div class="col-md-4"><label class="form-label">Категория</label><select class="form-select" id="deCategory">' + Object.entries(window.DREAM_CATEGORIES).map(function(e) { return '<option value="' + e[0] + '" ' + (dream.category === e[0] ? 'selected' : '') + '>' + e[1].emoji + ' ' + e[1].name + '</option>'; }).join('') + '</select></div></div>' +
            '<div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label">Прогресс</label><input type="range" class="form-range" id="deProgress" min="0" max="100" value="' + (dream.progress || 0) + '" oninput="document.getElementById(\'deProgressVal\').textContent=this.value+\'%\'"><small id="deProgressVal">' + (dream.progress || 0) + '%</small></div><div class="col-md-4"><label class="form-label">Дедлайн</label><input type="date" class="form-control" id="deDeadline" value="' + (dream.deadline || '') + '"></div><div class="col-md-4"><label class="form-label">Стоимость</label><input type="number" class="form-control" id="deCost" value="' + (dream.cost || '') + '"></div></div>' +
            '<div class="mb-3"><label class="form-label">Фото</label><input type="text" class="form-control" id="dePhoto" value="' + (dream.photo || '') + '"></div>' +
            '<div class="mb-3"><label class="form-label">Описание</label><textarea class="form-control" id="deDesc" rows="2">' + (dream.description || '') + '</textarea></div>' +
            '<div class="mb-3"><label class="form-label">Статус</label><select class="form-select" id="deStatus">' + Object.entries(window.DREAM_STATUSES).map(function(e) { return '<option value="' + e[0] + '" ' + (dream.status === e[0] ? 'selected' : '') + '>' + e[1].emoji + ' ' + e[1].name + '</option>'; }).join('') + '</select></div>' +
            '<div class="d-flex gap-2"><button type="submit" class="btn btn-success flex-grow-1">💾 Сохранить</button><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Отмена</button></div>' +
        '</form></div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('dreamEditModal'));
    modal.show();
    
    document.getElementById('dreamEditForm').onsubmit = async function(e) {
        e.preventDefault();
        await window.updateDoc(window.doc(window.db, window.getDreamsCollection(), dream._firestoreId), {
            title: document.getElementById('deTitle').value.trim(),
            category: document.getElementById('deCategory').value,
            progress: parseInt(document.getElementById('deProgress').value) || 0,
            deadline: document.getElementById('deDeadline').value || '',
            cost: parseInt(document.getElementById('deCost').value) || 0,
            photo: document.getElementById('dePhoto').value.trim(),
            description: document.getElementById('deDesc').value.trim(),
            status: document.getElementById('deStatus').value,
            updatedAt: Date.now()
        });
        modal.hide();
        window.loadDreams();
    };
}

console.log('✅ dreamsCards.js загружен');