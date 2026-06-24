// ==================== dreamsList.js v2 ====================

window.dreamsState = {
    dreams: [],
    currentFilter: localStorage.getItem('dreamsFilter') || 'all',
    searchQuery: '',
    viewMode: localStorage.getItem('dreamsView') || 'kanban'
};

function getDreamsCollection() {
    if (window.currentList === 'my') return 'users/' + window.currentUser.uid + '/dreams';
    var fid = (window.currentList || 'my').replace('shared_', '');
    var ids = [window.currentUser.uid, fid].sort();
    return 'shared/' + ids[0] + '_' + ids[1] + '/dreams';
}

async function loadDreams() {
    if (!window.currentUser) return;
    try {
        var snap = await window.getDocs(window.collection(window.db, getDreamsCollection()));
        window.dreamsState.dreams = [];
        snap.forEach(function(d) { window.dreamsState.dreams.push(Object.assign({}, d.data(), { _firestoreId: d.id })); });
        window.dreamsState.dreams.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        renderDreamsContent();
    } catch (e) { console.error('loadDreams:', e); }
}

function getFilteredDreams() {
    var arr = window.dreamsState.dreams;
    if (window.dreamsState.currentFilter !== 'all') arr = arr.filter(function(d) { return d.status === window.dreamsState.currentFilter; });
    if (window.dreamsState.searchQuery) {
        var q = window.dreamsState.searchQuery.toLowerCase();
        arr = arr.filter(function(d) { return (d.title || '').toLowerCase().indexOf(q) !== -1; });
    }
    return arr;
}

function renderDreamsContent() {
    var filtered = getFilteredDreams();
    if (window.dreamsState.viewMode === 'kanban') renderKanban(filtered);
    else renderDreamsCards('dreamsContainer', filtered, 'dreamsEmpty');
    renderDreamsFilters();
    updateDreamsCounters();
}

function renderKanban(dreams) {
    var container = document.getElementById('dreamsContainer');
    if (!container) return;
    var statuses = Object.keys(window.DREAM_STATUSES);
    container.innerHTML = '<div class="row g-3">' + statuses.map(function(status) {
        var st = window.DREAM_STATUSES[status];
        var items = dreams.filter(function(d) { return d.status === status; });
        return '<div class="col-md-3"><div class="kanban-column" style="background:var(--card-bg);border-radius:16px;padding:16px;min-height:250px;border-top:4px solid ' + st.color + '">' +
            '<h6 class="mb-3 fw-bold" style="color:' + st.color + '">' + st.emoji + ' ' + st.name + ' <span class="badge bg-secondary rounded-pill">' + items.length + '</span></h6>' +
            '<div class="kanban-items">' + items.map(function(d) { return createDreamKanbanCard(d); }).join('') + '</div>' +
        '</div></div>';
    }).join('') + '</div>';
    
    container.querySelectorAll('[data-dream-id]').forEach(function(card) {
        card.addEventListener('click', function() { window.showDreamDetail(card.dataset.dreamId); });
    });
}

function createDreamKanbanCard(dream) {
    var cat = window.DREAM_CATEGORIES[dream.category] || window.DREAM_CATEGORIES.other;
    var progress = dream.progress || 0;
    var progressColor = progress >= 80 ? 'bg-success' : progress >= 40 ? 'bg-warning' : 'bg-info';
    return '<div class="card shadow-sm mb-2" style="cursor:pointer;border-radius:12px" data-dream-id="' + dream._firestoreId + '">' +
        '<div class="card-body p-3">' +
            '<small class="fw-bold">' + cat.emoji + ' ' + dream.title + '</small>' +
            '<div class="progress mt-2" style="height:6px;border-radius:3px"><div class="progress-bar ' + progressColor + '" style="width:' + progress + '%"></div></div>' +
            '<div class="d-flex justify-content-between align-items-center mt-1"><small class="text-muted">' + progress + '%</small><small>' + (dream.deadline || '') + '</small></div>' +
        '</div></div>';
}

window.showDreamDetail = function(dreamId) {
    var d = window.dreamsState.dreams.find(function(x) { return x._firestoreId === dreamId; });
    if (!d) return;
    var cat = window.DREAM_CATEGORIES[d.category] || window.DREAM_CATEGORIES.other;
    var st = window.DREAM_STATUSES[d.status] || window.DREAM_STATUSES.dreaming;
    var progress = d.progress || 0;
    var progressColor = progress >= 80 ? 'bg-success' : progress >= 40 ? 'bg-warning' : 'bg-info';
    document.getElementById('detailTitle').textContent = '💭 ' + d.title;
    document.getElementById('detailBody').innerHTML = 
        (d.photo ? '<img src="' + d.photo + '" class="rounded mb-3" style="max-height:250px;width:100%;object-fit:cover">' : '') +
        '<div class="row mb-3"><div class="col-6"><strong>Категория:</strong> ' + cat.emoji + ' ' + cat.name + '</div><div class="col-6"><strong>Статус:</strong> <span style="color:' + st.color + '">' + st.emoji + ' ' + st.name + '</span></div></div>' +
        '<p><strong>Прогресс:</strong></p><div class="progress mb-2" style="height:12px;border-radius:6px"><div class="progress-bar ' + progressColor + '" style="width:' + progress + '%">' + progress + '%</div></div>' +
        '<p><strong>Описание:</strong> ' + (d.description || '—') + '</p>' +
        '<p><strong>Дедлайн:</strong> ' + (d.deadline || '—') + '</p>' +
        '<p><strong>Стоимость:</strong> ' + (d.cost ? window.formatBudget(d.cost) : '—') + '</p>';
    new bootstrap.Modal(document.getElementById('placeDetailModal')).show();
};

function renderDreamsCards(containerId, arr, emptyId) {
    var c = document.getElementById(containerId);
    var e = document.getElementById(emptyId);
    if (!c || !e) return;
    c.innerHTML = '';
    if (arr.length === 0) { e.classList.remove('d-none'); return; }
    e.classList.add('d-none');
    arr.forEach(function(d, i) { if (window.createDreamCard) { var card = window.createDreamCard(d, i); if (card) c.appendChild(card); } });
}

function renderDreamsFilters() {
    var c = document.getElementById('dreamsFilters');
    if (!c) return;
    var h = '<div class="d-flex gap-2 flex-wrap mb-2">';
    h += '<span class="category-chip ' + (window.dreamsState.currentFilter === 'all' ? 'active' : '') + '" data-filter="all">Все</span>';
    Object.keys(window.DREAM_STATUSES).forEach(function(key) {
        var st = window.DREAM_STATUSES[key];
        h += '<span class="category-chip ' + (window.dreamsState.currentFilter === key ? 'active' : '') + '" data-filter="' + key + '">' + st.emoji + ' ' + st.name + '</span>';
    });
    h += '</div><div class="btn-group btn-group-sm">' +
        '<button class="btn btn-outline-secondary ' + (window.dreamsState.viewMode === 'kanban' ? 'active' : '') + '" data-view="kanban"><i class="bi bi-columns-gap"></i> Плитки</button>' +
        '<button class="btn btn-outline-secondary ' + (window.dreamsState.viewMode === 'grid' ? 'active' : '') + '" data-view="grid"><i class="bi bi-grid-3x3-gap"></i> Сетка</button>' +
    '</div>';
    c.innerHTML = h;
    c.querySelectorAll('[data-filter]').forEach(function(ch) { ch.addEventListener('click', function() { window.dreamsState.currentFilter = ch.dataset.filter; localStorage.setItem('dreamsFilter', window.dreamsState.currentFilter); renderDreamsContent(); }); });
    c.querySelectorAll('[data-view]').forEach(function(btn) { btn.addEventListener('click', function() { window.dreamsState.viewMode = btn.dataset.view; localStorage.setItem('dreamsView', window.dreamsState.viewMode); renderDreamsContent(); }); });
}

function updateDreamsCounters() {
    var all = window.dreamsState.dreams;
    var el;
    el = document.getElementById('dreamsAllCount'); if (el) el.textContent = all.length;
    el = document.getElementById('dreamsInProgressCount'); if (el) el.textContent = all.filter(function(d){return d.status==='doing'||d.status==='planning';}).length;
    el = document.getElementById('dreamsDoneCount'); if (el) el.textContent = all.filter(function(d){return d.status==='done';}).length;
}

window.renderDreamsSection = function(container) {
    container.innerHTML = 
        '<div class="fade-in">' +
            '<div class="row g-2 mb-3"><div class="col-md-6"><div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input type="text" class="form-control" id="dreamsSearch" placeholder="Поиск..."></div></div><div class="col-md-6 text-end"><button class="btn btn-success btn-sm" id="dreamsAddBtn"><i class="bi bi-plus-lg me-1"></i>Добавить мечту</button></div></div>' +
            '<div id="dreamsFilters" class="mb-3"></div>' +
            '<div class="row g-2 mb-3">' +
                '<div class="col-4"><div class="card text-center p-2"><small class="text-muted">Всего</small><strong id="dreamsAllCount">0</strong></div></div>' +
                '<div class="col-4"><div class="card text-center p-2"><small class="text-muted">В процессе</small><strong id="dreamsInProgressCount">0</strong></div></div>' +
                '<div class="col-4"><div class="card text-center p-2"><small class="text-muted">✅ Сделано</small><strong id="dreamsDoneCount">0</strong></div></div>' +
            '</div>' +
            '<div id="dreamsContainer"></div>' +
            '<div id="dreamsEmpty" class="text-center py-5 d-none"><i class="bi bi-star text-muted" style="font-size:4rem"></i><p class="text-muted mt-2">Пока нет мечт</p></div>' +
        '</div>';
    
    document.getElementById('dreamsAddBtn').addEventListener('click', function() { showDreamAddModal(); });
    document.getElementById('dreamsSearch').addEventListener('input', function() { window.dreamsState.searchQuery = this.value; renderDreamsContent(); });
    loadDreams();
};

window.loadDreams = loadDreams;
window.renderDreamsContent = renderDreamsContent;
window.getDreamsCollection = getDreamsCollection;

console.log('✅ dreamsList.js v2 загружен');