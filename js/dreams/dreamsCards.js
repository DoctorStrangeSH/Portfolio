// ==================== dreamsCards.js v3 ====================

window.createDreamCard = function(dream, index) {
    var col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3 fade-in-up';
    col.style.animationDelay = (index * 0.03) + 's';
    
    var cat = window.DREAM_CATEGORIES[dream.category] || window.DREAM_CATEGORIES.other;
    var st = window.DREAM_STATUSES[dream.status] || window.DREAM_STATUSES.dreaming;
    var progress = dream.progress || 0;
    var progressColor = progress >= 80 ? 'bg-success' : progress >= 40 ? 'bg-warning' : 'bg-info';
    var photo = dream.photo || 'https://placehold.co/400x250/' + cat.color.replace('#','') + '/white?text=' + encodeURIComponent(cat.emoji);
    
    col.innerHTML = 
        '<div class="card h-100 shadow-sm mb-3 border-0 overflow-hidden" style="border-top:4px solid ' + cat.color + '">' +
            '<div class="position-relative">' +
                '<img src="' + photo + '" class="card-img-top" style="height:160px;object-fit:cover">' +
                '<span class="position-absolute badge" style="top:8px;right:8px;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);color:white">' + st.emoji + ' ' + st.name + '</span>' +
            '</div>' +
            '<div class="card-body d-flex flex-column p-3">' +
                '<h6 class="card-title mb-2">' + cat.emoji + ' ' + dream.title + '</h6>' +
                '<div class="progress mb-2" style="height:8px;border-radius:4px"><div class="progress-bar ' + progressColor + '" style="width:' + progress + '%"></div></div>' +
                '<div class="d-flex justify-content-between mb-2"><small class="fw-bold">' + progress + '%</small>' + (dream.deadline ? '<small style="color:var(--text-muted)">⏳ ' + dream.deadline + '</small>' : '') + '</div>' +
                (dream.cost > 0 ? '<small style="color:var(--text-muted)">💰 ' + window.formatBudget(dream.cost) + '</small>' : '') +
                '<div class="mt-auto d-flex gap-1 pt-2">' +
                    '<button class="btn btn-sm btn-outline-primary dream-progress-btn" data-id="' + dream._firestoreId + '" style="border-radius:20px"><i class="bi bi-graph-up"></i></button>' +
                    '<button class="btn btn-sm btn-outline-secondary dream-detail-btn" data-id="' + dream._firestoreId + '" style="border-radius:20px"><i class="bi bi-info-circle"></i></button>' +
                    '<button class="btn btn-sm btn-outline-secondary dream-edit-btn" data-id="' + dream._firestoreId + '" style="border-radius:20px"><i class="bi bi-pencil"></i></button>' +
                    '<button class="btn btn-sm btn-outline-danger dream-del-btn" data-id="' + dream._firestoreId + '" style="border-radius:20px"><i class="bi bi-trash"></i></button>' +
                '</div>' +
            '</div>' +
        '</div>';
    return col;
};

document.addEventListener('click', async function(e) {
    var progressBtn = e.target.closest('.dream-progress-btn');
    if (progressBtn) {
        var d = window.dreamsState.dreams.find(function(x) { return x._firestoreId === progressBtn.dataset.id; });
        if (!d) return;
        var newProgress = prompt('Прогресс (0-100):', d.progress || 0);
        if (newProgress === null) return;
        newProgress = Math.min(100, Math.max(0, parseInt(newProgress) || 0));
        await window.updateDoc(window.doc(window.db, window.getDreamsCollection(), progressBtn.dataset.id), { progress: newProgress });
        window.loadDreams();
        return;
    }
    
    var delBtn = e.target.closest('.dream-del-btn');
    if (delBtn) {
        if (!confirm('Удалить?')) return;
        await window.deleteDoc(window.doc(window.db, window.getDreamsCollection(), delBtn.dataset.id));
        window.loadDreams();
        return;
    }
    
    var detailBtn = e.target.closest('.dream-detail-btn');
    if (detailBtn) {
        window.showDreamDetail(detailBtn.dataset.id);
        return;
    }
    
    var editBtn = e.target.closest('.dream-edit-btn');
    if (editBtn) {
        var d = window.dreamsState.dreams.find(function(x) { return x._firestoreId === editBtn.dataset.id; });
        if (d) showDreamEditModal(d);
        return;
    }
});

function showDreamEditModal(dream) {
    var old = document.getElementById('dreamEditModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="dreamEditModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5>✏️ Редактировать</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-4"><form id="dreamEditForm">' +
            '<div class="row g-3 mb-3"><div class="col-md-8"><label class="form-label">Название</label><input type="text" class="form-control rounded-pill" id="deTitle" value="' + dream.title + '"></div><div class="col-md-4"><label class="form-label">Категория</label><select class="form-select rounded-pill" id="deCategory">' + Object.entries(window.DREAM_CATEGORIES).map(function(e) { return '<option value="' + e[0] + '" ' + (dream.category===e[0]?'selected':'') + '>' + e[1].emoji + ' ' + e[1].name + '</option>'; }).join('') + '</select></div></div>' +
            '<div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label">Прогресс</label><input type="range" class="form-range" id="deProgress" value="' + (dream.progress||0) + '" oninput="document.getElementById(\'dePv\').textContent=this.value+\'%\'"><small id="dePv">' + (dream.progress||0) + '%</small></div><div class="col-md-4"><label class="form-label">Дедлайн</label><input type="date" class="form-control rounded-pill" id="deDeadline" value="' + (dream.deadline||'') + '"></div><div class="col-md-4"><label class="form-label">Стоимость</label><input type="number" class="form-control rounded-pill" id="deCost" value="' + (dream.cost||'') + '"></div></div>' +
            '<div class="mb-3"><label class="form-label">Описание</label><textarea class="form-control" id="deDesc" rows="2" style="border-radius:16px">' + (dream.description||'') + '</textarea></div>' +
            '<div class="d-flex gap-2"><button type="submit" class="btn btn-primary rounded-pill flex-grow-1">💾 Сохранить</button><button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Отмена</button></div>' +
        '</form></div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('dreamEditModal'));
    modal.show();
    document.getElementById('dreamEditForm').onsubmit = async function(e) {
        e.preventDefault();
        await window.updateDoc(window.doc(window.db, window.getDreamsCollection(), dream._firestoreId), {
            title: document.getElementById('deTitle').value.trim(),
            category: document.getElementById('deCategory').value,
            progress: parseInt(document.getElementById('deProgress').value)||0,
            deadline: document.getElementById('deDeadline').value||'',
            cost: parseInt(document.getElementById('deCost').value)||0,
            description: document.getElementById('deDesc').value.trim(),
            updatedAt: Date.now()
        });
        modal.hide();
        window.loadDreams();
    };
}

console.log('✅ dreamsCards.js v3 загружен');