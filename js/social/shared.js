// ==================== shared.js ====================

window.sharedState = {
    currentFriend: null
};

window.renderSharedSection = function(container) {
    if (!window.friends || !window.friends.length) {
        container.innerHTML = 
            '<div class="text-center py-5">' +
                '<i class="bi bi-people text-muted" style="font-size:4rem"></i>' +
                '<h5 class="mt-3">Нет друзей</h5>' +
                '<p class="text-muted">Добавьте друзей, чтобы создавать совместные списки.</p>' +
                '<button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#friendsModal">' +
                    '<i class="bi bi-person-plus me-1"></i>Добавить друзей' +
                '</button>' +
            '</div>';
        return;
    }
    
    var friendId = window.sharedState.currentFriend || window.friends[0].uid;
    var friend = window.friends.find(function(f) { return f.uid === friendId; });
    if (!friend) friend = window.friends[0];
    window.sharedState.currentFriend = friend.uid;
    
    container.innerHTML = 
        '<div class="row g-2 mb-3">' +
            '<div class="col-md-4">' +
                '<label class="form-label fw-medium">👤 Выберите друга</label>' +
                '<select class="form-select" id="sharedFriendSelect">' +
                    window.friends.map(function(f) {
                        return '<option value="' + f.uid + '" ' + (f.uid === friend.uid ? 'selected' : '') + '>' + f.name + '</option>';
                    }).join('') +
                '</select>' +
            '</div>' +
            '<div class="col-md-8 d-flex align-items-end gap-2">' +
                '<button class="btn btn-outline-primary btn-sm" onclick="window.showProfile(\'' + friend.uid + '\')"><i class="bi bi-person"></i> Профиль</button>' +
                '<button class="btn btn-outline-success btn-sm" onclick="window.showChat(\'' + [window.currentUser.uid, friend.uid].sort().join('_') + '\', \'Чат с ' + friend.name.split(' ')[0] + '\')"><i class="bi bi-chat-dots"></i> Чат</button>' +
                '<button class="btn btn-success btn-sm" onclick="window.addSharedItem(\'' + friend.uid + '\')"><i class="bi bi-plus-lg me-1"></i>Добавить</button>' +
            '</div>' +
        '</div>' +
        '<ul class="nav nav-tabs mb-3" id="sharedTabs">' +
            '<li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#sharedPlaces">✈️ Места</button></li>' +
            '<li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#sharedFood">🍽️ Рестораны</button></li>' +
            '<li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#sharedMovies">🎬 Кино</button></li>' +
            '<li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#sharedDreams">💭 Мечты</button></li>' +
        '</ul>' +
        '<div class="tab-content">' +
            '<div class="tab-pane fade show active" id="sharedPlaces"><div class="row g-3" id="sharedPlacesContainer"></div><div id="sharedPlacesEmpty" class="text-center py-3 d-none"><p class="text-muted">Нет совместных мест</p></div></div>' +
            '<div class="tab-pane fade" id="sharedFood"><div class="row g-3" id="sharedFoodContainer"></div><div id="sharedFoodEmpty" class="text-center py-3 d-none"><p class="text-muted">Нет совместных ресторанов</p></div></div>' +
            '<div class="tab-pane fade" id="sharedMovies"><div class="row g-3" id="sharedMoviesContainer"></div><div id="sharedMoviesEmpty" class="text-center py-3 d-none"><p class="text-muted">Нет совместных фильмов</p></div></div>' +
            '<div class="tab-pane fade" id="sharedDreams"><div class="row g-3" id="sharedDreamsContainer"></div><div id="sharedDreamsEmpty" class="text-center py-3 d-none"><p class="text-muted">Нет совместных мечт</p></div></div>' +
        '</div>';
    
    document.getElementById('sharedFriendSelect').addEventListener('change', function() {
        window.sharedState.currentFriend = this.value;
        loadSharedContent();
    });
    
    loadSharedContent();
};

async function loadSharedContent() {
    var fid = window.sharedState.currentFriend;
    if (!fid) return;
    var ids = [window.currentUser.uid, fid].sort();
    var basePath = 'shared/' + ids[0] + '_' + ids[1];
    
    // Места
    var placesSnap = await window.getDocs(window.collection(window.db, basePath + '/places'));
    var places = []; placesSnap.forEach(function(d) { places.push(Object.assign({}, d.data(), { _firestoreId: d.id })); });
    renderSharedCards('sharedPlacesContainer', places, 'sharedPlacesEmpty', 'place');
    
    // Рестораны
    var foodSnap = await window.getDocs(window.collection(window.db, basePath + '/food'));
    var food = []; foodSnap.forEach(function(d) { food.push(Object.assign({}, d.data(), { _firestoreId: d.id })); });
    renderSharedCards('sharedFoodContainer', food, 'sharedFoodEmpty', 'food');
    
    // Кино
    var moviesSnap = await window.getDocs(window.collection(window.db, basePath + '/movies'));
    var movies = []; moviesSnap.forEach(function(d) { movies.push(Object.assign({}, d.data(), { _firestoreId: d.id })); });
    renderSharedCards('sharedMoviesContainer', movies, 'sharedMoviesEmpty', 'movie');
    
    // Мечты
    var dreamsSnap = await window.getDocs(window.collection(window.db, basePath + '/dreams'));
    var dreams = []; dreamsSnap.forEach(function(d) { dreams.push(Object.assign({}, d.data(), { _firestoreId: d.id })); });
    renderSharedCards('sharedDreamsContainer', dreams, 'sharedDreamsEmpty', 'dream');
}

function renderSharedCards(containerId, arr, emptyId, type) {
    var c = document.getElementById(containerId);
    var e = document.getElementById(emptyId);
    if (!c || !e) return;
    c.innerHTML = '';
    if (!arr.length) { e.classList.remove('d-none'); return; }
    e.classList.add('d-none');
    
    arr.forEach(function(item, i) {
        var card;
        if (type === 'place' && window.createTravelCard) card = window.createTravelCard(item, i);
        if (type === 'food' && window.createFoodCard) card = window.createFoodCard(item, i);
        if (type === 'movie' && window.createMovieCard) card = window.createMovieCard(item, i);
        if (type === 'dream' && window.createDreamCard) card = window.createDreamCard(item, i);
        if (card) c.appendChild(card);
    });
}

window.addSharedItem = function(friendUid) {
    var type = prompt('Что добавить? (place/food/movie/dream):', 'place');
    if (!type) return;
    
    var title = prompt('Название:');
    if (!title) return;
    
    var ids = [window.currentUser.uid, friendUid].sort();
    var path = 'shared/' + ids[0] + '_' + ids[1] + '/' + type + 's';
    
    window.addDoc(window.collection(window.db, path), {
        name: title,
        title: title,
        status: 'want',
        author: window.currentUser.displayName || 'Я',
        createdAt: Date.now()
    });
    
    loadSharedContent();
    alert('✅ Добавлено!');
};

console.log('✅ shared.js загружен');