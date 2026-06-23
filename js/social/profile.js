// ==================== profile.js ====================

window.showProfile = function(userId) {
    if (!userId) userId = window.currentUser?.uid;
    if (!userId) return;
    
    var old = document.getElementById('profileModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="profileModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow"><div class="modal-body p-4" id="profileBody">' +
            '<div class="text-center"><div class="spinner-border"></div></div>' +
        '</div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('profileModal'));
    modal.show();
    
    loadProfileData(userId);
};

async function loadProfileData(userId) {
    var body = document.getElementById('profileBody');
    
    // Загружаем профиль
    var profileSnap = await window.getDoc(window.doc(window.db, 'profiles', userId));
    var profile = profileSnap.exists() ? profileSnap.data() : {};
    
    // Загружаем статистику
    var placesSnap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/places'));
    var foodSnap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/food'));
    var moviesSnap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/movies'));
    var dreamsSnap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/dreams'));
    
    var places = [];
    var food = [];
    var movies = [];
    var dreams = [];
    
    placesSnap.forEach(function(d) { places.push(d.data()); });
    foodSnap.forEach(function(d) { food.push(d.data()); });
    moviesSnap.forEach(function(d) { movies.push(d.data()); });
    dreamsSnap.forEach(function(d) { dreams.push(d.data()); });
    
    var visited = places.filter(function(p) { return p.status === 'visited'; }).length;
    var foodVisited = food.filter(function(f) { return f.status === 'visited' || f.status === 'favourite'; }).length;
    var moviesWatched = movies.filter(function(m) { return m.status === 'watched' || m.status === 'favourite'; }).length;
    var dreamsDone = dreams.filter(function(d) { return d.status === 'done'; }).length;
    var totalBudget = places.reduce(function(s, p) { return s + (parseInt(p.budget) || 0); }, 0);
    
    var userName = profile.name || 'Пользователь';
    var userPhoto = profile.photo || 'https://placehold.co/100/0d6efd/white?text=' + userName.charAt(0).toUpperCase();
    var userBio = profile.bio || 'Здесь пока ничего нет...';
    var isOwner = userId === window.currentUser?.uid;
    
    body.innerHTML = 
        '<div class="text-center mb-4">' +
            '<img src="' + userPhoto + '" class="rounded-circle mb-2" style="width:100px;height:100px;object-fit:cover;border:3px solid #0d6efd">' +
            '<h4 class="mb-1">' + userName + '</h4>' +
            '<p class="text-muted">' + userBio + '</p>' +
            (isOwner ? '<button class="btn btn-sm btn-outline-primary" onclick="window.editProfile()"><i class="bi bi-pencil me-1"></i>Редактировать</button>' : '') +
        '</div>' +
        '<div class="row g-2 mb-3">' +
            '<div class="col-3"><div class="card text-center p-2"><div style="font-size:1.5rem">✈️</div><strong>' + places.length + '</strong><small class="text-muted d-block">Мест</small></div></div>' +
            '<div class="col-3"><div class="card text-center p-2"><div style="font-size:1.5rem">🍽️</div><strong>' + food.length + '</strong><small class="text-muted d-block">Ресторанов</small></div></div>' +
            '<div class="col-3"><div class="card text-center p-2"><div style="font-size:1.5rem">🎬</div><strong>' + movies.length + '</strong><small class="text-muted d-block">Фильмов</small></div></div>' +
            '<div class="col-3"><div class="card text-center p-2"><div style="font-size:1.5rem">💭</div><strong>' + dreams.length + '</strong><small class="text-muted d-block">Мечт</small></div></div>' +
        '</div>' +
        '<div class="row g-2 mb-3">' +
            '<div class="col-6"><div class="card text-center p-2 bg-success bg-opacity-10"><small class="text-muted">✅ Посещено мест</small><strong>' + visited + '</strong></div></div>' +
            '<div class="col-6"><div class="card text-center p-2 bg-primary bg-opacity-10"><small class="text-muted">💰 Бюджет путешествий</small><strong>' + window.formatBudget(totalBudget) + '</strong></div></div>' +
        '</div>' +
        '<div class="row g-2">' +
            '<div class="col-4"><div class="card text-center p-2 bg-warning bg-opacity-10"><small class="text-muted">🍽️ Ресторанов</small><strong>' + foodVisited + '</strong></div></div>' +
            '<div class="col-4"><div class="card text-center p-2 bg-info bg-opacity-10"><small class="text-muted">🎬 Фильмов</small><strong>' + moviesWatched + '</strong></div></div>' +
            '<div class="col-4"><div class="card text-center p-2 bg-success bg-opacity-10"><small class="text-muted">✨ Мечт сделано</small><strong>' + dreamsDone + '</strong></div></div>' +
        '</div>';
}

window.editProfile = function() {
    var bio = prompt('О себе:', '');
    if (bio === null) return;
    
    window.setDoc(window.doc(window.db, 'profiles', window.currentUser.uid), {
        name: window.currentUser.displayName || 'Пользователь',
        photo: window.currentUser.photoURL || '',
        bio: bio || '',
        updatedAt: Date.now()
    });
    
    window.showProfile(window.currentUser.uid);
};

console.log('✅ profile.js загружен');