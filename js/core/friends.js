// ==================== friends.js v11 ====================
const db = window.db;

window.friends = [];
window.incomingRequests = [];
window.outgoingRequests = [];
window.currentList = 'my';
window.currentFriendId = null;

window.loadFriends = async function () {
    if (!window.currentUser) return;
    var uid = window.currentUser.uid;
    try {
        // Загружаем дружбы где я участник
        var snap1 = await window.getDocs(window.collection(db, 'friendships'));
        window.friends = [];
        snap1.forEach(function(doc) {
            var data = doc.data();
            if (data.user1 === uid || data.user2 === uid) {
                var friendUid = data.user1 === uid ? data.user2 : data.user1;
                var friendName = data.user1 === uid ? data.name2 : data.name1;
                window.friends.push({ uid: friendUid, name: friendName, addedAt: data.createdAt });
            }
        });
        
        // Загружаем заявки
        var snap2 = await window.getDocs(window.collection(db, 'friendRequests'));
        window.incomingRequests = [];
        window.outgoingRequests = [];
        snap2.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            if (data.toUid === uid && data.status === 'pending') window.incomingRequests.push(data);
            if (data.fromUid === uid && data.status === 'pending') window.outgoingRequests.push(data);
        });
        
        console.log('📊 Друзья:', window.friends.length, 'Входящие:', window.incomingRequests.length, 'Исходящие:', window.outgoingRequests.length);
        renderAllFriends();
    } catch (e) { console.error('loadFriends error:', e); }
};

window.isFriend = function(uid) {
    if (!window.friends || !window.currentUser) return false;
    if (uid === window.currentUser.uid) return true;
    return window.friends.some(function(f) { return f.uid === uid; });
};

window.addFriendById = function(uid) {
    var input = document.getElementById('friendIdInput');
    if (input) input.value = uid;
    sendRequest(uid);
    var profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
    if (profileModal) profileModal.hide();
    setTimeout(function() {
        new bootstrap.Modal(document.getElementById('friendsModal')).show();
    }, 500);
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
                        '<div><strong>' + f.name + '</strong></div>' +
                    '</div>' +
                    '<div class="d-flex gap-1">' +
                        '<button class="btn btn-sm btn-outline-info view-friend-btn" data-uid="' + f.uid + '" title="Профиль"><i class="bi bi-person"></i></button>' +
                        '<button class="btn btn-sm btn-outline-danger remove-btn" data-uid="' + f.uid + '" title="Удалить"><i class="bi bi-person-x"></i></button>' +
                    '</div>' +
                '</div>';
            }).join('');
            fl.querySelectorAll('.remove-btn').forEach(function(b) { b.onclick = function() { removeFriend(b.dataset.uid); }; });
            fl.querySelectorAll('.view-friend-btn').forEach(function(b) {
                b.onclick = function() {
                    window.showProfile(b.dataset.uid);
                    var modal = bootstrap.Modal.getInstance(document.getElementById('friendsModal'));
                    if (modal) modal.hide();
                };
            });
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
    
    if (window.friends.find(function(f) { return f.uid === friendUid; })) {
        await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
        await window.loadFriends();
        alert('⚠️ Вы уже друзья!');
        return;
    }
    
    // Создаём дружбу в отдельной коллекции
    await window.addDoc(window.collection(db, 'friendships'), {
        user1: myUid,
        name1: myName,
        user2: friendUid,
        name2: friendName,
        createdAt: Date.now()
    });
    
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
    
    // Находим и удаляем дружбу
    var snap = await window.getDocs(window.collection(db, 'friendships'));
    snap.forEach(async function(doc) {
        var data = doc.data();
        if ((data.user1 === window.currentUser.uid && data.user2 === friendUid) ||
            (data.user2 === window.currentUser.uid && data.user1 === friendUid)) {
            await window.deleteDoc(window.doc(db, 'friendships', doc.id));
        }
    });
    
    if (window.currentList === 'shared_' + friendUid) {
        window.currentList = 'my';
        window.currentFriendId = null;
    }
    
    await window.loadFriends();
    reloadAllLists();
}

window.listenFriends = function() {
    if (!window.currentUser) return;
    window.onSnapshot(window.collection(db, 'friendships'), function() {
        if (window.loadFriends) window.loadFriends();
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

console.log('✅ friends.js v11 загружен');