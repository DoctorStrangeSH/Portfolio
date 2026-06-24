// ==================== shared.js — Вкладка Совместно ====================

window.sharedState = { currentFriend: null, currentTab: 'places' };

window.renderSharedSection = function(container) {
    if (!window.friends || !window.friends.length) {
        container.innerHTML = '<div class="text-center py-5 fade-in"><i class="bi bi-people text-muted" style="font-size:4rem"></i><h5 class="mt-3">Нет друзей</h5><p class="text-muted">Добавьте друзей для совместных списков</p><button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#friendsModal"><i class="bi bi-person-plus me-1"></i>Добавить</button></div>';
        return;
    }
    
    var friend = window.friends.find(function(f) { return f.uid === window.sharedState.currentFriend; }) || window.friends[0];
    window.sharedState.currentFriend = friend.uid;
    
    container.innerHTML = 
        '<div class="fade-in">' +
            '<div class="row g-2 mb-3 align-items-end">' +
                '<div class="col-md-4"><label class="form-label fw-medium">👤 Друг</label><select class="form-select" id="sharedFriendSelect">' + window.friends.map(function(f) { return '<option value="' + f.uid + '" ' + (f.uid === friend.uid ? 'selected' : '') + '>' + f.name + '</option>'; }).join('') + '</select></div>' +
                '<div class="col-md-8 d-flex gap-2">' +
                    '<button class="btn btn-outline-primary btn-sm" onclick="window.showProfile(\'' + friend.uid + '\')"><i class="bi bi-person"></i> Профиль</button>' +
                    '<button class="btn btn-outline-success btn-sm" onclick="window.showChat(\'' + [window.currentUser.uid, friend.uid].sort().join('_') + '\', \'Чат с ' + friend.name.split(' ')[0] + '\')"><i class="bi bi-chat-dots"></i> Чат</button>' +
                    '<button class="btn btn-success btn-sm" onclick="window.addSharedItem()"><i class="bi bi-plus-lg me-1"></i>Добавить</button>' +
                '</div>' +
            '</div>' +
            '<ul class="nav nav-tabs mb-3" id="sharedTabs">' +
                '<li class="nav-item"><button class="nav-link active" data-tab="places">✈️ Места</button></li>' +
                '<li class="nav-item"><button class="nav-link" data-tab="food">🍽️ Рестораны</button></li>' +
                '<li class="nav-item"><button class="nav-link" data-tab="movies">🎬 Кино</button></li>' +
                '<li class="nav-item"><button class="nav-link" data-tab="dreams">💭 Мечты</button></li>' +
            '</ul>' +
            '<div id="sharedContent"><div class="text-center py-3"><div class="spinner-border"></div></div></div>' +
        '</div>';
    
    document.getElementById('sharedFriendSelect').addEventListener('change', function() {
        window.sharedState.currentFriend = this.value;
        loadSharedContent();
    });
    
    document.querySelectorAll('#sharedTabs button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#sharedTabs button').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            window.sharedState.currentTab = btn.dataset.tab;
            loadSharedContent();
        });
    });
    
    loadSharedContent();
};

async function loadSharedContent() {
    var fid = window.sharedState.currentFriend;
    var tab = window.sharedState.currentTab;
    if (!fid) return;
    
    var ids = [window.currentUser.uid, fid].sort();
    var path = 'shared/' + ids[0] + '_' + ids[1] + '/' + tab;
    
    var snap = await window.getDocs(window.collection(window.db, path));
    var items = [];
    snap.forEach(function(d) { items.push(Object.assign({}, d.data(), { _firestoreId: d.id })); });
    
    var container = document.getElementById('sharedContent');
    if (!items.length) {
        container.innerHTML = '<p class="text-center text-muted py-4">Пока ничего нет. Добавьте первое!</p>';
        return;
    }
    
    container.innerHTML = '<div class="row g-3">';
    items.forEach(function(item, i) {
        var card;
        if (tab === 'places' && window.createTravelCard) card = window.createTravelCard(item, i);
        if (tab === 'food' && window.createFoodCard) card = window.createFoodCard(item, i);
        if (tab === 'movies' && window.createMovieCard) card = window.createMovieCard(item, i);
        if (tab === 'dreams' && window.createDreamCard) card = window.createDreamCard(item, i);
        if (card) container.querySelector('.row').appendChild(card);
    });
    container.innerHTML += '</div>';
}

window.addSharedItem = function() {
    var tab = window.sharedState.currentTab;
    var title = prompt('Название:');
    if (!title) return;
    
    var fid = window.sharedState.currentFriend;
    var ids = [window.currentUser.uid, fid].sort();
    var path = 'shared/' + ids[0] + '_' + ids[1] + '/' + tab;
    
    window.addDoc(window.collection(window.db, path), {
        name: title, title: title, status: 'want',
        author: window.currentUser.displayName || 'Я', createdAt: Date.now()
    });
    loadSharedContent();
    alert('✅ Добавлено!');
};

console.log('✅ shared.js загружен');