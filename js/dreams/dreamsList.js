// ==================== dreamsList.js ====================

window.dreamsState = {
    dreams: [],
    currentFilter: localStorage.getItem('dreamsFilter') || 'all',
    searchQuery: '',
    viewMode: localStorage.getItem('dreamsView') || 'kanban' // kanban или grid
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
        snap.forEach(function(d) {
            var m = d.data();
            m._firestoreId = d.id;
            window.dreamsState.dreams.push(m);
        });
        window.dreamsState.dreams.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        renderDreamsContent();
    } catch (e) { console.error('loadDreams:', e); }
}

function getFilteredDreams() {
    var arr = window.dreamsState.dreams;
    if (window.dreamsState.currentFilter !== 'all') {
        arr = arr.filter(function(d) { return d.status === window.dreamsState.currentFilter; });
    }
    if (window.dreamsState.searchQuery) {
        var q = window.dreamsState.searchQuery.toLowerCase();
        arr = arr.filter(function(d) { return (d.title || '').toLowerCase().indexOf(q) !== -1; });
    }
    return arr;
}

function renderDreamsContent() {
    var filtered = getFilteredDreams();
    
    if (window.dreamsState.viewMode === 'kanban') {
        renderKanban(filtered);
    } else {
        renderDreamsCards('dreamsContainer', filtered, 'dreamsEmpty');
    }
    
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
        
        return '<div class="col-md-3">' +
            '<div class="kanban-column" style="background:#f8f9fa;border-radius:12px;padding:12px;min-height:300px">' +
                '<h6 class="mb-3" style="color:' + st.color + '">' + st.emoji + ' ' + st.name + ' <span class="badge bg-secondary">' + items.length + '</span></h6>' +
                '<div class="kanban-items">' + items.map(function(d) {
                    return createDreamKanbanCard(d);
                }).join('') + '</div>' +
            '</div>' +
        '</div>';
    }).join('') + '</div>';
}

function createDreamKanbanCard(dream) {
    var cat = window.DREAM_CATEGORIES[dream.category] || window.DREAM_CATEGORIES.other;
    var progress = dream.progress || 0;
    var progressColor = progress >= 80 ? 'bg-success' : progress >= 40 ? 'bg-warning' : 'bg-info';
    
    return '<div class="card shadow-sm mb-2" style="cursor:pointer" onclick="window.showDreamDetail(\'' + dream._firestoreId + '\')">' +
        '<div class="card-body p-2">' +
            '<small class="fw-bold">' + cat.emoji + ' ' + dream.title + '</small>' +
            '<div class="progress mt-1" style="height:6px"><div class="progress-bar ' + progressColor + '" style="width:' + progress + '%"></div></div>' +
            '<div class="d-flex justify-content-between align-items-center mt-1"><small class="text-muted">' + progress + '%</small><small>' + (dream.deadline || '') + '</small></div>' +
        '</div>' +
    '</div>';
}

function renderDreamsCards(containerId, arr, emptyId) {
    var c = document.getElementById(containerId);
    var e = document.getElementById(emptyId);
    if (!c || !e) return;
    c.innerHTML = '';
    if (arr.length === 0) { e.classList.remove('d-none'); return; }
    e.classList.add('d-none');
    arr.forEach(function(d, i) {
        if (window.createDreamCard) {
            var card = window.createDreamCard(d, i);
            if (card) c.appendChild(card);
        }
    });
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
    h += '</div>';
    
    // Переключатель вида
    h += '<div class="btn-group btn-group-sm">' +
        '<button class="btn btn-outline-secondary ' + (window.dreamsState.viewMode === 'kanban' ? 'active' : '') + '" data-view="kanban"><i class="bi bi-columns-gap"></i> Канбан</button>' +
        '<button class="btn btn-outline-secondary ' + (window.dreamsState.viewMode === 'grid' ? 'active' : '') + '" data-view="grid"><i class="bi bi-grid-3x3-gap"></i> Сетка</button>' +
    '</div>';
    
    c.innerHTML = h;
    
    c.querySelectorAll('[data-filter]').forEach(function(ch) {
        ch.addEventListener('click', function() {
            window.dreamsState.currentFilter = ch.dataset.filter;
            localStorage.setItem('dreamsFilter', window.dreamsState.currentFilter);
            renderDreamsContent();
        });
    });
    
    c.querySelectorAll('[data-view]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            window.dreamsState.viewMode = btn.dataset.view;
            localStorage.setItem('dreamsView', window.dreamsState.viewMode);
            renderDreamsContent();
        });
    });
}

function updateDreamsCounters() {
    var all = window.dreamsState.dreams;
    var el = document.getElementById('dreamsAllCount'); if (el) el.textContent = all.length;
    el = document.getElementById('dreamsDoneCount'); if (el) el.textContent = all.filter(function(d){return d.status==='done';}).length;
    el = document.getElementById('dreamsInProgressCount'); if (el) el.textContent = all.filter(function(d){return d.status==='doing'||d.status==='planning';}).length;
}

// ========== РЕНДЕР РАЗДЕЛА ==========
window.renderDreamsSection = function(container) {
    container.innerHTML = 
        '<div class="d-flex gap-2 flex-wrap align-items-center mb-3 overflow-auto pb-1" id="dreamsListChips"></div>' +
        '<div class="row g-2 mb-3">' +
            '<div class="col-md-6"><div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input type="text" class="form-control" id="dreamsSearch" placeholder="Поиск..."></div></div>' +
            '<div class="col-md-6 text-end"><button class="btn btn-success btn-sm" id="dreamsAddBtn"><i class="bi bi-plus-lg me-1"></i>Добавить мечту</button></div>' +
        '</div>' +
        '<div id="dreamsFilters" class="mb-3"></div>' +
        '<div class="row g-2 mb-3">' +
            '<div class="col-4"><div class="card text-center p-2"><small class="text-muted">Всего</small><strong id="dreamsAllCount">0</strong></div></div>' +
            '<div class="col-4"><div class="card text-center p-2"><small class="text-muted">В процессе</small><strong id="dreamsInProgressCount">0</strong></div></div>' +
            '<div class="col-4"><div class="card text-center p-2"><small class="text-muted">✅ Сделано</small><strong id="dreamsDoneCount">0</strong></div></div>' +
        '</div>' +
        '<div id="dreamsContainer"></div>' +
        '<div id="dreamsEmpty" class="text-center py-5 d-none"><i class="bi bi-star text-muted" style="font-size:4rem"></i><p class="text-muted mt-2">Пока нет мечт. Добавьте первую!</p></div>';
    
    document.getElementById('dreamsAddBtn').addEventListener('click', function() {
        showDreamAddModal();
    });
    
    document.getElementById('dreamsSearch').addEventListener('input', function() {
        window.dreamsState.searchQuery = this.value;
        renderDreamsContent();
    });
    
    if (window.renderListChips) window.renderListChips();
    loadDreams();
};

// ========== МОДАЛКА ДОБАВЛЕНИЯ ==========
function showDreamAddModal() {
    var old = document.getElementById('dreamAddModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="dreamAddModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered">' +
        '<div class="modal-content border-0 shadow">' +
        '<div class="modal-header bg-light"><h5 class="modal-title"><i class="bi bi-star me-2"></i>Новая мечта</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body"><form id="dreamAddForm" autocomplete="off">' +
            '<div class="row g-3 mb-3">' +
                '<div class="col-md-8"><label class="form-label fw-medium">Название *</label><input type="text" class="form-control" id="daTitle" required placeholder="Моя мечта..."></div>' +
                '<div class="col-md-4"><label class="form-label fw-medium">Категория</label><select class="form-select" id="daCategory">' + Object.entries(window.DREAM_CATEGORIES).map(function(e) { return '<option value="' + e[0] + '">' + e[1].emoji + ' ' + e[1].name + '</option>'; }).join('') + '</select></div>' +
            '</div>' +
            '<div class="row g-3 mb-3">' +
                '<div class="col-md-4"><label class="form-label fw-medium">Прогресс (%)</label><input type="range" class="form-range" id="daProgress" min="0" max="100" value="0" oninput="document.getElementById(\'daProgressVal\').textContent=this.value+\'%\'"><small id="daProgressVal">0%</small></div>' +
                '<div class="col-md-4"><label class="form-label fw-medium">Дедлайн</label><input type="date" class="form-control" id="daDeadline"></div>' +
                '<div class="col-md-4"><label class="form-label fw-medium">Стоимость (₽)</label><input type="number" class="form-control" id="daCost" placeholder="0"></div>' +
            '</div>' +
            '<div class="mb-3"><label class="form-label fw-medium">📸 Фото (ссылка)</label><input type="text" class="form-control" id="daPhoto" placeholder="https://i.ibb.co/..."></div>' +
            '<div class="mb-3"><label class="form-label fw-medium">📝 Описание</label><textarea class="form-control" id="daDesc" rows="2" placeholder="Почему это важно..."></textarea></div>' +
            '<div class="mb-3"><label class="form-label fw-medium">🔗 Ссылки (через запятую)</label><input type="text" class="form-control" id="daLinks" placeholder="https://..."></div>' +
            '<div class="mb-3"><label class="form-label fw-medium">Статус</label><select class="form-select" id="daStatus">' + Object.entries(window.DREAM_STATUSES).map(function(e) { return '<option value="' + e[0] + '">' + e[1].emoji + ' ' + e[1].name + '</option>'; }).join('') + '</select></div>' +
            '<div class="d-flex gap-2"><button type="submit" class="btn btn-success flex-grow-1"><i class="bi bi-plus-circle me-1"></i>Добавить мечту</button><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Отмена</button></div>' +
        '</form></div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('dreamAddModal'));
    modal.show();
    
    document.getElementById('dreamAddForm').onsubmit = async function(e) {
        e.preventDefault();
        var title = document.getElementById('daTitle').value.trim();
        if (!title) return alert('Введите название!');
        
        var linksRaw = document.getElementById('daLinks').value.trim();
        
        var data = {
            title: title,
            category: document.getElementById('daCategory').value,
            progress: parseInt(document.getElementById('daProgress').value) || 0,
            deadline: document.getElementById('daDeadline').value || '',
            cost: parseInt(document.getElementById('daCost').value) || 0,
            photo: document.getElementById('daPhoto').value.trim(),
            description: document.getElementById('daDesc').value.trim(),
            links: linksRaw ? linksRaw.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [],
            status: document.getElementById('daStatus').value,
            author: window.currentUser ? window.currentUser.displayName.split(' ')[0] : 'Я',
            createdAt: Date.now()
        };
        
        await window.addDoc(window.collection(window.db, getDreamsCollection()), data);
        modal.hide();
        window.loadDreams();
        alert('✅ Мечта добавлена!');
    };
}

window.loadDreams = loadDreams;
window.renderDreamsContent = renderDreamsContent;
window.getDreamsCollection = getDreamsCollection;

console.log('✅ dreamsList.js загружен');