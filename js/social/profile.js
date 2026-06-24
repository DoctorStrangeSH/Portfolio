// ==================== profile.js v3 ====================

window.showProfile = function(userId) {
    if (!userId) userId = window.currentUser?.uid;
    if (!userId) return;
    
    var old = document.getElementById('profileModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="profileModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-body p-0" id="profileBody"><div class="text-center py-4"><div class="spinner-border text-primary"></div></div></div>' +
        '</div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('profileModal'));
    modal.show();
    
    loadProfileData(userId);
};

async function loadProfileData(userId) {
    var body = document.getElementById('profileBody');
    var isOwner = userId === window.currentUser?.uid;
    
    if (!isOwner && !window.isFriend(userId)) {
        body.innerHTML = 
            '<div class="text-center py-5">' +
                '<div style="font-size:4rem">🔒</div>' +
                '<h5 class="mt-3 fw-bold">Приватный профиль</h5>' +
                '<p style="color:var(--text-secondary)">Пользователь делится только с друзьями</p>' +
                '<button class="btn btn-primary btn-lg rounded-pill mt-2" onclick="window.addFriendById(\'' + userId + '\')">' +
                    '<i class="bi bi-person-plus me-2"></i>Добавить в друзья' +
                '</button>' +
            '</div>';
        return;
    }
    
    var profileRef = window.doc(window.db, 'profiles', userId);
    var profileSnap = await window.getDoc(profileRef);
    if (!profileSnap.exists()) {
        var userSnap = await window.getDoc(window.doc(window.db, 'users', userId));
        var name = 'Пользователь';
        if (userSnap.exists()) name = userSnap.data().name || name;
        await window.setDoc(profileRef, { name: name, photo: '', bio: '', createdAt: Date.now() });
    }
    
    var profile = (await window.getDoc(profileRef)).data();
    
    var placesSnap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/places'));
    var foodSnap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/food'));
    var moviesSnap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/movies'));
    var dreamsSnap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/dreams'));
    
    var places = []; placesSnap.forEach(function(d) { places.push(d.data()); });
    var food = []; foodSnap.forEach(function(d) { food.push(d.data()); });
    var movies = []; moviesSnap.forEach(function(d) { movies.push(d.data()); });
    var dreams = []; dreamsSnap.forEach(function(d) { dreams.push(d.data()); });
    
    var visited = places.filter(function(p) { return p.status === 'visited'; }).length;
    var foodVisited = food.filter(function(f) { return f.status === 'visited' || f.status === 'favourite'; }).length;
    var moviesWatched = movies.filter(function(m) { return m.status === 'watched' || m.status === 'favourite'; }).length;
    var dreamsDone = dreams.filter(function(d) { return d.status === 'done'; }).length;
    var totalBudget = places.reduce(function(s, p) { return s + (parseInt(p.budget) || 0); }, 0);
    
    var userName = profile.name || 'Пользователь';
    var userPhoto = profile.photo || 'https://placehold.co/100/5b5fef/white?text=' + encodeURIComponent(userName.charAt(0).toUpperCase());
    
    body.innerHTML = 
        '<div style="background:linear-gradient(135deg, var(--primary), var(--primary-dark));padding:40px 20px 30px;text-align:center;color:white">' +
            '<img src="' + userPhoto + '" class="rounded-circle mb-3" style="width:96px;height:96px;object-fit:cover;border:4px solid rgba(255,255,255,0.3)">' +
            '<h4 class="fw-bold mb-1">' + userName + '</h4>' +
            '<p class="opacity-75 small mb-3">' + (profile.bio || 'Здесь пока ничего нет...') + '</p>' +
            '<div class="d-flex justify-content-center flex-wrap gap-2">' +
                (isOwner ? '<button class="btn btn-light btn-sm rounded-pill" onclick="window.editProfile()"><i class="bi bi-pencil me-1"></i>Ред.</button>' : '') +
                (isOwner ? '<button class="btn btn-light btn-sm rounded-pill" onclick="window.setMyNickname()"><i class="bi bi-at me-1"></i>Ник</button>' : '') +
                '<button class="btn btn-light btn-sm rounded-pill" onclick="window.showCollections()"><i class="bi bi-collection me-1"></i>Подборки</button>' +
                '<button class="btn btn-light btn-sm rounded-pill" onclick="window.showPublicMap(\'' + userId + '\')"><i class="bi bi-map me-1"></i>Карта</button>' +
                (!isOwner ? '<button class="btn btn-light btn-sm rounded-pill" onclick="window.switchToFriend(\'' + userId + '\', \'' + userName + '\')"><i class="bi bi-eye me-1"></i>Списки</button>' : '') +
                (!isOwner ? '<button class="btn btn-light btn-sm rounded-pill" onclick="window.showChat(\'' + [window.currentUser.uid, userId].sort().join('_') + '\', \'' + userName.split(' ')[0] + '\')"><i class="bi bi-chat-dots me-1"></i>Чат</button>' : '') +
            '</div>' +
        '</div>' +
        '<div class="p-4">' +
            '<div class="row g-2 mb-3">' +
                '<div class="col-3"><div class="card text-center p-3 border-0" style="background:var(--bg)"><div style="font-size:1.5rem">✈️</div><strong>' + places.length + '</strong><small class="d-block" style="color:var(--text-muted)">Мест</small></div></div>' +
                '<div class="col-3"><div class="card text-center p-3 border-0" style="background:var(--bg)"><div style="font-size:1.5rem">🍽️</div><strong>' + food.length + '</strong><small class="d-block" style="color:var(--text-muted)">Ресторанов</small></div></div>' +
                '<div class="col-3"><div class="card text-center p-3 border-0" style="background:var(--bg)"><div style="font-size:1.5rem">🎬</div><strong>' + movies.length + '</strong><small class="d-block" style="color:var(--text-muted)">Фильмов</small></div></div>' +
                '<div class="col-3"><div class="card text-center p-3 border-0" style="background:var(--bg)"><div style="font-size:1.5rem">💭</div><strong>' + dreams.length + '</strong><small class="d-block" style="color:var(--text-muted)">Мечт</small></div></div>' +
            '</div>' +
            '<div class="row g-2">' +
                '<div class="col-6"><div class="card text-center p-3 border-0" style="background:linear-gradient(135deg, #10b98120, #10b98110)"><small style="color:var(--success)">✅ Посещено</small><strong>' + visited + '</strong></div></div>' +
                '<div class="col-6"><div class="card text-center p-3 border-0" style="background:linear-gradient(135deg, #5b5fef20, #5b5fef10)"><small style="color:var(--primary)">💰 Бюджет</small><strong>' + window.formatBudget(totalBudget) + '</strong></div></div>' +
            '</div>' +
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

window.setMyNickname = function() {
    var nick = prompt('Придумайте уникальный ник (латиница, цифры, _):', '');
    if (!nick) return;
    window.saveNickname(nick).then(function(success) {
        if (success) { alert('✅ Ник @' + nick.toLowerCase() + ' установлен!'); window.showProfile(window.currentUser.uid); }
    });
};

window.switchToFriend = function(uid, name) {
    window.currentList = 'shared_' + uid;
    window.currentFriendId = uid;
    var modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
    if (modal) modal.hide();
    document.querySelectorAll('#sectionMenu button').forEach(function(b) { b.classList.remove('active'); });
    var sharedBtn = document.querySelector('#sectionMenu button[data-section="shared"]');
    if (sharedBtn) {
        sharedBtn.classList.add('active');
        window.currentSection = 'shared';
        localStorage.setItem('currentSection', 'shared');
        if (window.renderSharedSection) window.renderSharedSection(document.getElementById('sectionContainer'));
    }
};

console.log('✅ profile.js v3 загружен');