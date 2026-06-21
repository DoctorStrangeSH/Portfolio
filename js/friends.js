// ==================== friends.js v6 ====================
const db = window.db;

window.friends = [];
window.incomingRequests = [];
window.outgoingRequests = [];
window.currentList = 'my';

// ========== ЗАГРУЗКА ==========
window.loadFriends = async function () {
    if (!window.currentUser) return;
    const uid = window.currentUser.uid;
    
    try {
        // Друзья из профиля
        const userSnap = await window.getDoc(window.doc(db, 'users', uid));
        if (userSnap.exists()) {
            window.friends = userSnap.data().friends || [];
        }
        
        // Все заявки из коллекции
        const snap = await window.getDocs(window.collection(db, 'friendRequests'));
        
        window.incomingRequests = [];
        window.outgoingRequests = [];
        
        snap.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            
            if (data.toUid === uid && data.status === 'pending') {
                window.incomingRequests.push(data);
            }
            if (data.fromUid === uid && data.status === 'pending') {
                window.outgoingRequests.push(data);
            }
        });
        
        console.log('📊 Загружено:', {
            friends: window.friends.length,
            incoming: window.incomingRequests.length,
            outgoing: window.outgoingRequests.length
        });
        
        renderAllFriends();
    } catch (e) {
        console.error('❌ loadFriends error:', e);
    }
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

// ========== ФИШКИ ==========
function renderListChips() {
    const c = document.getElementById('listChips');
    if (!c) return;
    let h = `<span class="list-chip ${window.currentList==='my'?'active':''}" data-list="my">🏠 Мои</span>`;
    window.friends.forEach(f => {
        h += `<span class="list-chip ${window.currentList==='shared_'+f.uid?'active':''}" data-list="shared_${f.uid}">❤️ ${(f.name||'?').split(' ')[0]}</span>`;
    });
    c.innerHTML = h;
    c.querySelectorAll('.list-chip').forEach(ch => {
        ch.addEventListener('click', () => {
            window.currentList = ch.dataset.list;
            renderListChips();
            if (window.loadPlaces) window.loadPlaces();
        });
    });
}

// ========== МОДАЛКА ==========
function renderFriendsModal() {
    const inc = document.getElementById('incomingRequests');
    const out = document.getElementById('outgoingRequests');
    const fl = document.getElementById('friendsList');
    const badge = document.getElementById('incomingBadge');

    // Входящие
    if (inc) {
        if (!window.incomingRequests.length) {
            inc.innerHTML = '<p class="text-muted small text-center py-2">Нет входящих заявок</p>';
            if (badge) badge.classList.add('d-none');
        } else {
            if (badge) { badge.textContent = window.incomingRequests.length; badge.classList.remove('d-none'); }
            inc.innerHTML = window.incomingRequests.map(r => `
                <div class="request-item">
                    <div>
                        <strong>${r.fromName}</strong>
                        <small class="text-muted ms-2">${timeAgoStr(r.createdAt)}</small>
                    </div>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-success accept-btn" data-id="${r.id}">
                            <i class="bi bi-check-lg"></i> Принять
                        </button>
                        <button class="btn btn-sm btn-outline-danger reject-btn" data-id="${r.id}">
                            <i class="bi bi-x-lg"></i> Отклонить
                        </button>
                    </div>
                </div>
            `).join('');
            inc.querySelectorAll('.accept-btn').forEach(b => b.onclick = () => acceptRequest(b.dataset.id));
            inc.querySelectorAll('.reject-btn').forEach(b => b.onclick = () => rejectRequest(b.dataset.id));
        }
    }

    // Исходящие
    if (out) {
        if (!window.outgoingRequests.length) {
            out.innerHTML = '<p class="text-muted small text-center py-2">Нет отправленных заявок</p>';
        } else {
            out.innerHTML = window.outgoingRequests.map(r => `
                <div class="request-item">
                    <div>
                        <strong>${r.toName}</strong>
                        <small class="text-muted ms-2">${timeAgoStr(r.createdAt)}</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="status-badge status-pending">⏳ Ожидает</span>
                        <button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${r.id}">
                            <i class="bi bi-x-lg"></i> Отменить
                        </button>
                    </div>
                </div>
            `).join('');
            out.querySelectorAll('.cancel-btn').forEach(b => b.onclick = () => cancelRequest(b.dataset.id));
        }
    }

    // Друзья
    if (fl) {
        if (!window.friends.length) {
            fl.innerHTML = '<p class="text-muted small text-center py-2">Пока нет друзей</p>';
        } else {
            fl.innerHTML = window.friends.map(f => `
                <div class="friend-item">
                    <div class="d-flex align-items-center gap-2">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                             style="width: 32px; height: 32px; font-size: 0.8rem;">
                            ${(f.name||'?').charAt(0).toUpperCase()}
                        </div>
                        <strong>${f.name}</strong>
                    </div>
                    <button class="btn btn-sm btn-outline-danger remove-btn" data-uid="${f.uid}">
                        <i class="bi bi-person-x"></i> Удалить
                    </button>
                </div>
            `).join('');
            fl.querySelectorAll('.remove-btn').forEach(b => b.onclick = () => removeFriend(b.dataset.uid));
        }
    }
}

function timeAgoStr(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'только что';
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} мин. назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч. назад`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'вчера';
    return `${d} дн. назад`;
}

// ========== ОТПРАВКА ==========
async function sendRequest(targetId) {
    console.log('📤 sendRequest:', targetId);
    
    if (!targetId) { alert('Введите ID друга'); return; }
    if (targetId === window.currentUser.uid) { alert('Нельзя добавить себя'); return; }
    if (window.friends.find(f => f.uid === targetId)) { alert('Уже в друзьях'); return; }
    if (window.outgoingRequests.find(r => r.toUid === targetId)) { alert('Заявка уже отправлена'); return; }
    if (window.incomingRequests.find(r => r.fromUid === targetId)) { 
        // Если есть входящая от этого человека — сразу принимаем
        const req = window.incomingRequests.find(r => r.fromUid === targetId);
        await acceptRequest(req.id);
        return;
    }

    const targetSnap = await window.getDoc(window.doc(db, 'users', targetId));
    if (!targetSnap.exists()) { alert('Пользователь не найден'); return; }

    const targetData = targetSnap.data();
    
    await window.addDoc(window.collection(db, 'friendRequests'), {
        fromUid: window.currentUser.uid,
        fromName: window.currentUser.displayName,
        toUid: targetId,
        toName: targetData.name || 'Пользователь',
        status: 'pending',
        createdAt: Date.now()
    });

    document.getElementById('friendIdInput').value = '';
    await window.loadFriends();
    alert('✅ Заявка отправлена!');
}

// ========== ПРИНЯТЬ ==========
async function acceptRequest(requestId) {
    const req = window.incomingRequests.find(r => r.id === requestId);
    if (!req) return;

    // Добавляем друг другу в друзья
    await window.updateDoc(window.doc(db, 'users', window.currentUser.uid), {
        friends: window.arrayUnion({ uid: req.fromUid, name: req.fromName, addedAt: Date.now() })
    });
    
    const friendRef = window.doc(db, 'users', req.fromUid);
    const friendSnap = await window.getDoc(friendRef);
    if (friendSnap.exists()) {
        await window.updateDoc(friendRef, {
            friends: window.arrayUnion({ uid: window.currentUser.uid, name: window.currentUser.displayName, addedAt: Date.now() })
        });
    }

    // Удаляем заявку
    await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
    
    await window.loadFriends();
    alert(`✅ ${req.fromName} теперь ваш друг!`);
}

// ========== ОТКЛОНИТЬ ==========
async function rejectRequest(requestId) {
    await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
    await window.loadFriends();
}

// ========== ОТМЕНИТЬ ==========
async function cancelRequest(requestId) {
    await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
    await window.loadFriends();
}

// ========== УДАЛИТЬ ДРУГА ==========
async function removeFriend(friendUid) {
    if (!confirm('Удалить из друзей?')) return;
    
    await window.updateDoc(window.doc(db, 'users', window.currentUser.uid), {
        friends: window.friends.filter(f => f.uid !== friendUid)
    });
    
    const friendRef = window.doc(db, 'users', friendUid);
    const friendSnap = await window.getDoc(friendRef);
    if (friendSnap.exists()) {
        const fData = friendSnap.data();
        await window.updateDoc(friendRef, {
            friends: (fData.friends || []).filter(f => f.uid !== window.currentUser.uid)
        });
    }
    
    if (window.currentList === 'shared_' + friendUid) window.currentList = 'my';
    await window.loadFriends();
    if (window.loadPlaces) window.loadPlaces();
}

// ========== СЛУШАТЕЛЬ ==========
window.listenFriends = function () {
    if (!window.currentUser) return;
    
    // Слушаем профиль
    window.onSnapshot(window.doc(db, 'users', window.currentUser.uid), (snap) => {
        if (snap.exists()) {
            window.friends = snap.data().friends || [];
            renderAllFriends();
        }
    });
    
    // Слушаем заявки
    window.onSnapshot(window.collection(db, 'friendRequests'), () => {
        if (window.loadFriends) window.loadFriends();
    });
};

// ========== КНОПКИ ==========
document.getElementById('addFriendBtn').addEventListener('click', () => {
    const input = document.getElementById('friendIdInput');
    if (input) sendRequest(input.value.trim());
});

document.getElementById('copyIdBtn').addEventListener('click', () => {
    if (!window.currentUser) return;
    navigator.clipboard.writeText(window.currentUser.uid);
    alert('✅ ID скопирован!');
});

console.log('✅ friends.js v6 загружен');