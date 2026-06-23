// ==================== friends.js v8 ====================
const db = window.db;

window.friends = [];
window.incomingRequests = [];
window.outgoingRequests = [];
window.currentList = 'my';
window.currentFriendId = null;
window.currentFriendName = '';

window.loadFriends = async function () {
    if (!window.currentUser) return;
    const uid = window.currentUser.uid;
    try {
        const userSnap = await window.getDoc(window.doc(db, 'users', uid));
        if (userSnap.exists()) {
            window.friends = userSnap.data().friends || [];
        }
        const snap = await window.getDocs(window.collection(db, 'friendRequests'));
        window.incomingRequests = [];
        window.outgoingRequests = [];
        snap.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            if (data.toUid === uid && data.status === 'pending') window.incomingRequests.push(data);
            if (data.fromUid === uid && data.status === 'pending') window.outgoingRequests.push(data);
        });
        renderAllFriends();
    } catch (e) { console.error('loadFriends error:', e); }
};

function renderAllFriends() {
    renderListChips();
    renderFriendsModal();
    updateBadge();
}

function updateBadge() {
    const b = document.getElementById('friendsBadge');
    if (!b) return;
    b.textContent = window.incomingRequests.length;
    window.incomingRequests.length > 0 ? b.classList.remove('d-none') : b.classList.add('d-none');
}

function renderListChips() {
    const containers = ['listChips', 'travelListChips', 'foodListChips', 'moviesListChips', 'dreamsListChips'];
    var c = null;
    containers.forEach(function(id) {
        if (!c) c = document.getElementById(id);
    });
    if (!c) return;
    
    var h = '<span class="list-chip ' + (window.currentList === 'my' ? 'active' : '') + '" data-list="my">🏠 Мои</span>';
    
    window.friends.forEach(function(f) {
        var listId = 'shared_' + f.uid;
        h += '<span class="list-chip ' + (window.currentList === listId ? 'active' : '') + '" data-list="' + listId + '" data-friend-name="' + (f.name || 'Друг') + '" data-friend-uid="' + f.uid + '">';
        h += '❤️ ' + (f.name || '?').split(' ')[0] + ' ';
        h += '<span class="friend-actions" style="font-size:0.8rem">';
        h += '<span onclick="event.stopPropagation();window.showProfile(\'' + f.uid + '\')" style="cursor:pointer" title="Профиль">👤</span> ';
        h += '<span onclick="event.stopPropagation();window.showChat(\'' + [window.currentUser.uid, f.uid].sort().join('_') + '\', \'Чат с ' + (f.name || '?').split(' ')[0] + '\')" style="cursor:pointer" title="Чат">💬</span>';
        h += '</span>';
        h += '</span>';
    });
    
    c.innerHTML = h;
    
    c.querySelectorAll('.list-chip').forEach(function(chip) {
        chip.addEventListener('click', function(e) {
            if (e.target.closest('.friend-actions')) return;
            window.currentList = chip.dataset.list;
            window.currentFriendId = chip.dataset.friendUid || null;
            window.currentFriendName = chip.dataset.friendName || '';
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
                        '<div><strong>' + f.name + '</strong><br><small class="text-muted" style="font-size:0.7rem">Друзья с ' + new Date(f.addedAt).toLocaleDateString() + '</small></div>' +
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
                    // Закрываем модалку друзей
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

async function sendRequest(targetId) {
    if (!targetId) { alert('Введите ID друга'); return; }
    if (targetId === window.currentUser.uid) { alert('Нельзя добавить себя'); return; }
    if (window.friends.find(function(f) { return f.uid === targetId; })) { alert('Уже в друзьях'); return; }
    if (window.outgoingRequests.find(function(r) { return r.toUid === targetId; })) { alert('Заявка уже отправлена'); return; }
    if (window.incomingRequests.find(function(r) { return r.fromUid === targetId; })) {
        var req = window.incomingRequests.find(function(r) { return r.fromUid === targetId; });
        await acceptRequest(req.id);
        return;
    }
    var targetSnap = await window.getDoc(window.doc(db, 'users', targetId));
    if (!targetSnap.exists()) { alert('Пользователь не найден. Попросите друга зайти на сайт.'); return; }
    var targetName = targetSnap.data().name || 'Пользователь';
    await window.addDoc(window.collection(db, 'friendRequests'), {
        fromUid: window.currentUser.uid,
        fromName: window.currentUser.displayName,
        toUid: targetId,
        toName: targetName,
        status: 'pending',
        createdAt: Date.now()
    });
    document.getElementById('friendIdInput').value = '';
    await window.loadFriends();
    alert('✅ Заявка отправлена!');
}

async function acceptRequest(requestId) {
    var req = window.incomingRequests.find(function(r) { return r.id === requestId; });
    if (!req) return;
    
    var myRef = window.doc(db, 'users', window.currentUser.uid);
    var friendRef = window.doc(db, 'users', req.fromUid);
    
    // Добавляю друга себе
    await window.updateDoc(myRef, {
        friends: window.arrayUnion({ uid: req.fromUid, name: req.fromName, addedAt: Date.now() })
    });
    
    // Добавляю себя другу (ВОТ ЧТО БЫЛО ПРОПУЩЕНО!)
    var friendSnap = await window.getDoc(friendRef);
    if (friendSnap.exists()) {
        var friendData = friendSnap.data();
        var newFriends = (friendData.friends || []).filter(function(f) { return f.uid !== window.currentUser.uid; });
        newFriends.push({ uid: window.currentUser.uid, name: window.currentUser.displayName, addedAt: Date.now() });
        await window.updateDoc(friendRef, { friends: newFriends });
    } else {
        await window.setDoc(friendRef, {
            name: req.fromName,
            friends: [{ uid: window.currentUser.uid, name: window.currentUser.displayName, addedAt: Date.now() }],
            createdAt: Date.now()
        });
    }
    
    await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
    
    // Лог активности
    if (window.logActivity) {
        window.logActivity('friend_added', req.fromName, '');
    }
    
    await window.loadFriends();
    alert('✅ ' + req.fromName + ' теперь ваш друг!');
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
    
    // Удаляю у себя
    await window.updateDoc(window.doc(db, 'users', window.currentUser.uid), {
        friends: window.friends.filter(function(f) { return f.uid !== friendUid; })
    });
    
    // Удаляю себя у друга
    var friendRef = window.doc(db, 'users', friendUid);
    var friendSnap = await window.getDoc(friendRef);
    if (friendSnap.exists()) {
        var friendData = friendSnap.data();
        await window.updateDoc(friendRef, {
            friends: (friendData.friends || []).filter(function(f) { return f.uid !== window.currentUser.uid; })
        });
    }
    
    if (window.currentList === 'shared_' + friendUid) {
        window.currentList = 'my';
        window.currentFriendId = null;
    }
    
    await window.loadFriends();
    reloadAllLists();
}

window.listenFriends = function () {
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

// Кнопки
document.getElementById('addFriendBtn').addEventListener('click', function() {
    var input = document.getElementById('friendIdInput');
    if (input) sendRequest(input.value.trim());
});

document.getElementById('copyIdBtn').addEventListener('click', function() {
    if (!window.currentUser) return;
    navigator.clipboard.writeText(window.currentUser.uid);
    alert('✅ ID скопирован!');
});

console.log('✅ friends.js v8 загружен');