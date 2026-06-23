// ==================== friends.js v9 ====================
const db = window.db;

window.friends = [];
window.incomingRequests = [];
window.outgoingRequests = [];
window.currentList = 'my';
window.currentFriendId = null;

window.loadFriends = async function () {
    if (!window.currentUser) return;
    const uid = window.currentUser.uid;
    try {
        var userSnap = await window.getDoc(window.doc(db, 'users', uid));
        if (userSnap.exists()) {
            window.friends = userSnap.data().friends || [];
        } else {
            await window.setDoc(window.doc(db, 'users', uid), {
                name: window.currentUser.displayName || 'Пользователь',
                email: window.currentUser.email || '',
                friends: [],
                createdAt: Date.now()
            });
            window.friends = [];
        }
        
        var snap = await window.getDocs(window.collection(db, 'friendRequests'));
        window.incomingRequests = [];
        window.outgoingRequests = [];
        snap.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            if (data.toUid === uid && data.status === 'pending') window.incomingRequests.push(data);
            if (data.fromUid === uid && data.status === 'pending') window.outgoingRequests.push(data);
        });
        
        console.log('📊 Друзья:', window.friends.length, 'Входящие:', window.incomingRequests.length, 'Исходящие:', window.outgoingRequests.length);
        renderAllFriends();
    } catch (e) { console.error('loadFriends error:', e); }
};

function renderAllFriends() {
    renderListChips();
    renderFriendsModal();
    updateBadge();
}

function updateBadge() {
    var b = document.getElementById('friendsBadge');
    if (!b) return;
    b.textContent = window.incomingRequests.length;
    window.incomingRequests.length > 0 ? b.classList.remove('d-none') : b.classList.add('d-none');
}

function renderListChips() {
    var containers = ['listChips', 'travelListChips', 'foodListChips', 'moviesListChips', 'dreamsListChips'];
    var c = null;
    containers.forEach(function(id) { if (!c) c = document.getElementById(id); });
    if (!c) return;
    
    var h = '<span class="list-chip ' + (window.currentList === 'my' ? 'active' : '') + '" data-list="my">🏠 Мои</span>';
    
    window.friends.forEach(function(f) {
        var listId = 'shared_' + f.uid;
        h += '<span class="list-chip ' + (window.currentList === listId ? 'active' : '') + '" data-list="' + listId + '" data-friend-uid="' + f.uid + '">';
        h += '❤️ ' + (f.name || '?').split(' ')[0] + ' ';
        h += '<span class="friend-actions" style="font-size:0.8rem">';
        h += '<span onclick="event.stopPropagation();window.showProfile(\'' + f.uid + '\')" style="cursor:pointer" title="Профиль">👤</span> ';
        h += '<span onclick="event.stopPropagation();window.showChat(\'' + [window.currentUser.uid, f.uid].sort().join('_') + '\', \'Чат с ' + (f.name || '?').split(' ')[0] + '\')" style="cursor:pointer" title="Чат">💬</span>';
        h += '</span></span>';
    });
    
    c.innerHTML = h;
    
    c.querySelectorAll('.list-chip').forEach(function(chip) {
        chip.addEventListener('click', function(e) {
            if (e.target.closest('.friend-actions')) return;
            window.currentList = chip.dataset.list;
            window.currentFriendId = chip.dataset.friendUid || null;
            renderAllFriends();
            reloadAllLists();
        });
    });
}

function reloadAllLists() {
    if (window.loadTravelPlaces) window.loadTravelPlaces();
    if (window.loadFoodPlaces) window.loadFoodPlaces();
    if (window.loadMovies) window.loadMovies();
    if (window.loadDreams) window.loadDreams();
}

function renderFriendsModal() {
    var inc = document.getElementById('incomingRequests');
    var out = document.getElementById('outgoingRequests');
    var fl = document.getElementById('friendsList');
    var badge = document.getElementById('incomingBadge');

    if (inc) {
        if (!window.incomingRequests.length) {
            inc.innerHTML = '<p class="text-muted small text-center py-2">Нет входящих заявок</p>';
            if (badge) badge.classList.add('d-none');
        } else {
            if (badge) { badge.textContent = window.incomingRequests.length; badge.classList.remove('d-none'); }
            inc.innerHTML = window.incomingRequests.map(function(r) {
                return '<div class="request-item"><div><strong>' + r.fromName + '</strong><small class="text-muted ms-2">' + timeAgoStr(r.createdAt) + '</small></div>' +
                '<div class="d-flex gap-1"><button class="btn btn-sm btn-success accept-btn" data-id="' + r.id + '"><i class="bi bi-check-lg"></i> Принять</button><button class="btn btn-sm btn-outline-danger reject-btn" data-id="' + r.id + '"><i class="bi bi-x-lg"></i></button></div></div>';
            }).join('');
            inc.querySelectorAll('.accept-btn').forEach(function(b) { b.onclick = function() { acceptRequest(b.dataset.id); }; });
            inc.querySelectorAll('.reject-btn').forEach(function(b) { b.onclick = function() { rejectRequest(b.dataset.id); }; });
        }
    }

    if (out) {
        if (!window.outgoingRequests.length) {
            out.innerHTML = '<p class="text-muted small text-center py-2">Нет отправленных заявок</p>';
        } else {
            out.innerHTML = window.outgoingRequests.map(function(r) {
                return '<div class="request-item"><div><strong>' + r.toName + '</strong><small class="text-muted ms-2">' + timeAgoStr(r.createdAt) + '</small></div>' +
                '<div class="d-flex align-items-center gap-2"><span class="status-badge status-pending">⏳ Ожидает</span><button class="btn btn-sm btn-outline-danger cancel-btn" data-id="' + r.id + '"><i class="bi bi-x-lg"></i> Отменить</button></div></div>';
            }).join('');
            out.querySelectorAll('.cancel-btn').forEach(function(b) { b.onclick = function() { cancelRequest(b.dataset.id); }; });
        }
    }

    if (fl) {
        if (!window.friends.length) {
            fl.innerHTML = '<p class="text-muted small text-center py-2">Пока нет друзей</p>';
        } else {
            fl.innerHTML = window.friends.map(function(f) {
                return '<div class="friend-item">' +
                    '<div class="d-flex align-items-center gap-2">' +
                        '<div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;font-size:0.8rem">' + (f.name || '?').charAt(0).toUpperCase() + '</div>' +
                        '<strong>' + f.name + '</strong>' +
                    '</div>' +
                    '<button class="btn btn-sm btn-outline-danger remove-btn" data-uid="' + f.uid + '"><i class="bi bi-person-x"></i> Удалить</button>' +
                '</div>';
            }).join('');
            fl.querySelectorAll('.remove-btn').forEach(function(b) { b.onclick = function() { removeFriend(b.dataset.uid); }; });
        }
    }
}

function timeAgoStr(ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    if (diff < 60000) return 'только что';
    var m = Math.floor(diff / 60000); if (m < 60) return m + ' мин. назад';
    var h = Math.floor(m / 60); if (h < 24) return h + ' ч. назад';
    var d = Math.floor(h / 24); if (d === 1) return 'вчера';
    return d + ' дн. назад';
}

// ========== ОТПРАВКА ЗАЯВКИ ==========
async function sendRequest(targetId) {
    if (!targetId) { alert('Введите ID друга'); return; }
    if (targetId === window.currentUser.uid) { alert('Нельзя добавить себя'); return; }
    if (window.friends.find(function(f) { return f.uid === targetId; })) { alert('Уже в друзьях'); return; }
    if (window.outgoingRequests.find(function(r) { return r.toUid === targetId; })) { alert('Заявка уже отправлена'); return; }
    
    // Если есть входящая от этого человека — сразу принимаем
    var existingReq = window.incomingRequests.find(function(r) { return r.fromUid === targetId; });
    if (existingReq) {
        await acceptRequest(existingReq.id);
        return;
    }
    
    var targetSnap = await window.getDoc(window.doc(db, 'users', targetId));
    if (!targetSnap.exists()) {
        alert('Пользователь не найден. Попросите друга зайти на сайт.');
        return;
    }
    
    var targetName = targetSnap.data().name || 'Пользователь';
    
    await window.addDoc(window.collection(db, 'friendRequests'), {
        fromUid: window.currentUser.uid,
        fromName: window.currentUser.displayName || 'Пользователь',
        toUid: targetId,
        toName: targetName,
        status: 'pending',
        createdAt: Date.now()
    });
    
    document.getElementById('friendIdInput').value = '';
    await window.loadFriends();
    alert('✅ Заявка отправлена!');
}

// ========== ПРИНЯТЬ ЗАЯВКУ ==========
async function acceptRequest(requestId) {
    var req = window.incomingRequests.find(function(r) { return r.id === requestId; });
    if (!req) return;
    
    var myUid = window.currentUser.uid;
    var friendUid = req.fromUid;
    var myName = window.currentUser.displayName || 'Пользователь';
    var friendName = req.fromName;
    
    // Проверяем — не друзья ли уже
    if (window.friends.find(function(f) { return f.uid === friendUid; })) {
        // Уже друзья — просто удаляем заявку
        await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
        await window.loadFriends();
        return;
    }
    
    // Добавляю друга себе
    var myRef = window.doc(db, 'users', myUid);
    var myNewFriends = window.friends.filter(function(f) { return f.uid !== friendUid; });
    myNewFriends.push({ uid: friendUid, name: friendName, addedAt: Date.now() });
    await window.updateDoc(myRef, { friends: myNewFriends });
    
    // Добавляю себя другу
    var friendRef = window.doc(db, 'users', friendUid);
    var friendSnap = await window.getDoc(friendRef);
    if (friendSnap.exists()) {
        var friendData = friendSnap.data();
        var friendNewFriends = (friendData.friends || []).filter(function(f) { return f.uid !== myUid; });
        friendNewFriends.push({ uid: myUid, name: myName, addedAt: Date.now() });
        await window.updateDoc(friendRef, { friends: friendNewFriends });
    } else {
        await window.setDoc(friendRef, {
            name: friendName,
            friends: [{ uid: myUid, name: myName, addedAt: Date.now() }],
            createdAt: Date.now()
        });
    }
    
    // Удаляем заявку
    await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
    
    if (window.logActivity) window.logActivity('friend_added', friendName, '');
    
    await window.loadFriends();
    alert('✅ ' + friendName + ' теперь ваш друг!');
}

async function rejectRequest(requestId) {
    await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
    await window.loadFriends();
}

async function cancelRequest(requestId) {
    if (!confirm('Отменить заявку?')) return;
    await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
    await window.loadFriends();
}

async function removeFriend(friendUid) {
    if (!confirm('Удалить из друзей?')) return;
    
    await window.updateDoc(window.doc(db, 'users', window.currentUser.uid), {
        friends: window.friends.filter(function(f) { return f.uid !== friendUid; })
    });
    
    var friendRef = window.doc(db, 'users', friendUid);
    var friendSnap = await window.getDoc(friendRef);
    if (friendSnap.exists()) {
        await window.updateDoc(friendRef, {
            friends: (friendSnap.data().friends || []).filter(function(f) { return f.uid !== window.currentUser.uid; })
        });
    }
    
    if (window.currentList === 'shared_' + friendUid) {
        window.currentList = 'my';
        window.currentFriendId = null;
    }
    
    await window.loadFriends();
    reloadAllLists();
}

window.listenFriends = function() {
    if (!window.currentUser) return;
    window.onSnapshot(window.doc(db, 'users', window.currentUser.uid), function(snap) {
        if (snap.exists()) {
            window.friends = snap.data().friends || [];
            renderAllFriends();
        }
    });
    window.onSnapshot(window.collection(db, 'friendRequests'), function() {
        if (window.loadFriends) window.loadFriends();
    });
};

document.getElementById('addFriendBtn').addEventListener('click', function() {
    var input = document.getElementById('friendIdInput');
    if (input) sendRequest(input.value.trim());
});

document.getElementById('copyIdBtn').addEventListener('click', function() {
    if (!window.currentUser) return;
    navigator.clipboard.writeText(window.currentUser.uid);
    alert('✅ ID скопирован!');
});

console.log('✅ friends.js v9 загружен');