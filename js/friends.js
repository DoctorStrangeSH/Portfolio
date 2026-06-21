// ==================== friends.js v3 ====================
// Полностью рабочие заявки, подтверждение, отклонение, удаление

const db = window.db;

window.friends = [];
window.incomingRequests = [];
window.outgoingRequests = [];
window.currentList = 'my';

// ========== ЗАГРУЗКА ==========
window.loadFriends = async function () {
    if (!window.currentUser) return;
    
    try {
        const userRef = window.doc(db, 'users', window.currentUser.uid);
        const userSnap = await window.getDoc(userRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            window.friends = data.friends || [];
            window.incomingRequests = data.incomingRequests || [];
            window.outgoingRequests = data.outgoingRequests || [];
        } else {
            window.friends = [];
            window.incomingRequests = [];
            window.outgoingRequests = [];
        }
        
        renderFriendsModal();
        renderListChips();
        updateFriendsBadge();
    } catch (error) {
        console.error('Ошибка загрузки друзей:', error);
    }
};

// ========== БЕЙДЖ ==========
function updateFriendsBadge() {
    const badge = document.getElementById('friendsBadge');
    if (!badge) return;
    
    const count = window.incomingRequests.length;
    
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

// ========== ОТРИСОВКА МОДАЛКИ ==========
function renderFriendsModal() {
    renderIncomingRequests();
    renderOutgoingRequests();
    renderFriendsList();
}

function renderIncomingRequests() {
    const container = document.getElementById('incomingRequests');
    const badge = document.getElementById('incomingBadge');
    
    if (!container) return;
    
    if (!window.incomingRequests || window.incomingRequests.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center py-2">Нет входящих заявок</p>';
        if (badge) badge.classList.add('d-none');
        return;
    }
    
    if (badge) {
        badge.textContent = window.incomingRequests.length;
        badge.classList.remove('d-none');
    }
    
    container.innerHTML = window.incomingRequests.map(req => `
        <div class="request-item">
            <div>
                <strong>${req.name}</strong>
                <small class="text-muted ms-2">${timeAgoStr(req.sentAt)}</small>
            </div>
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-success accept-btn" data-uid="${req.uid}">
                    <i class="bi bi-check-lg"></i> Принять
                </button>
                <button class="btn btn-sm btn-outline-danger reject-btn" data-uid="${req.uid}">
                    <i class="bi bi-x-lg"></i> Отклонить
                </button>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.accept-btn').forEach(btn => {
        btn.onclick = () => acceptRequest(btn.dataset.uid);
    });
    container.querySelectorAll('.reject-btn').forEach(btn => {
        btn.onclick = () => rejectRequest(btn.dataset.uid);
    });
}

function renderOutgoingRequests() {
    const container = document.getElementById('outgoingRequests');
    if (!container) return;
    
    if (!window.outgoingRequests || window.outgoingRequests.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center py-2">Нет отправленных заявок</p>';
        return;
    }
    
    container.innerHTML = window.outgoingRequests.map(req => `
        <div class="request-item">
            <div>
                <strong>${req.name}</strong>
                <small class="text-muted ms-2">${timeAgoStr(req.sentAt)}</small>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span class="status-badge status-pending">⏳ Ожидает</span>
                <button class="btn btn-sm btn-outline-danger cancel-btn" data-uid="${req.uid}">
                    <i class="bi bi-x-lg"></i> Отменить
                </button>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.onclick = () => cancelRequest(btn.dataset.uid);
    });
}

function renderFriendsList() {
    const container = document.getElementById('friendsList');
    if (!container) return;
    
    if (!window.friends || window.friends.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center py-2">Пока нет друзей</p>';
        return;
    }
    
    container.innerHTML = window.friends.map(friend => `
        <div class="friend-item">
            <div class="d-flex align-items-center gap-2">
                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                     style="width: 32px; height: 32px; font-size: 0.8rem;">
                    ${(friend.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                    <strong>${friend.name}</strong>
                    <small class="text-muted d-block" style="font-size: 0.7rem;">Друзья с ${friend.addedAt ? new Date(friend.addedAt).toLocaleDateString() : 'недавно'}</small>
                </div>
            </div>
            <button class="btn btn-sm btn-outline-danger remove-friend-btn" data-uid="${friend.uid}">
                <i class="bi bi-person-x"></i> Удалить
            </button>
        </div>
    `).join('');
    
    container.querySelectorAll('.remove-friend-btn').forEach(btn => {
        btn.onclick = () => removeFriend(btn.dataset.uid);
    });
}

function timeAgoStr(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'только что';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'вчера';
    return `${days} дн. назад`;
}

// ========== ФИШКИ ==========
function renderListChips() {
    const container = document.getElementById('listChips');
    if (!container) return;
    
    let html = `<span class="list-chip ${window.currentList === 'my' ? 'active' : ''}" data-list="my">🏠 Мои</span>`;
    
    window.friends.forEach(friend => {
        const listId = 'shared_' + friend.uid;
        html += `<span class="list-chip ${window.currentList === listId ? 'active' : ''}" data-list="${listId}">❤️ ${(friend.name || 'Друг').split(' ')[0]}</span>`;
    });
    
    container.innerHTML = html;
    
    container.querySelectorAll('.list-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            window.currentList = chip.dataset.list;
            renderListChips();
            if (window.loadPlaces) window.loadPlaces();
        });
    });
}

// ========== ОТПРАВКА ЗАЯВКИ ==========
async function sendRequest(targetId) {
    const statusEl = document.getElementById('requestStatus');
    
    if (!targetId) {
        if (statusEl) statusEl.innerHTML = '<span class="text-danger">Введите ID друга</span>';
        return;
    }
    
    if (targetId === window.currentUser.uid) {
        if (statusEl) statusEl.innerHTML = '<span class="text-danger">Нельзя добавить самого себя</span>';
        return;
    }
    
    if (window.friends.find(f => f.uid === targetId)) {
        if (statusEl) statusEl.innerHTML = '<span class="text-warning">Уже в друзьях</span>';
        return;
    }
    
    if (window.outgoingRequests.find(r => r.uid === targetId)) {
        if (statusEl) statusEl.innerHTML = '<span class="text-warning">Заявка уже отправлена</span>';
        return;
    }
    
    // Проверяем существование
    const targetRef = window.doc(db, 'users', targetId);
    const targetSnap = await window.getDoc(targetRef);
    
    if (!targetSnap.exists()) {
        if (statusEl) statusEl.innerHTML = '<span class="text-danger">Пользователь не найден</span>';
        return;
    }
    
    const targetData = targetSnap.data();
    const myData = {
        uid: window.currentUser.uid,
        name: window.currentUser.displayName,
        sentAt: Date.now()
    };
    const theirData = {
        uid: targetId,
        name: targetData.name,
        sentAt: Date.now()
    };
    
    // Обновляю СЕБЯ — добавляю в исходящие
    const myRef = window.doc(db, 'users', window.currentUser.uid);
    const myNewOutgoing = [...window.outgoingRequests, theirData];
    await window.updateDoc(myRef, { outgoingRequests: myNewOutgoing });
    
    // Обновляю ДРУГА — добавляю во входящие
    const friendNewIncoming = [...(targetData.incomingRequests || []), myData];
    await window.updateDoc(targetRef, { incomingRequests: friendNewIncoming });
    
    // Очищаю поле
    document.getElementById('friendIdInput').value = '';
    if (statusEl) statusEl.innerHTML = '<span class="text-success">✅ Заявка отправлена!</span>';
    
    // Перезагружаю данные
    await refreshLocalData();
}

// ========== ПРИНЯТЬ ==========
async function acceptRequest(fromUid) {
    const request = window.incomingRequests.find(r => r.uid === fromUid);
    if (!request) return;
    
    const myRef = window.doc(db, 'users', window.currentUser.uid);
    const friendRef = window.doc(db, 'users', fromUid);
    
    // Обновляю себя
    const myNewFriends = [...window.friends, { uid: fromUid, name: request.name, addedAt: Date.now() }];
    const myNewIncoming = window.incomingRequests.filter(r => r.uid !== fromUid);
    await window.updateDoc(myRef, { friends: myNewFriends, incomingRequests: myNewIncoming });
    
    // Обновляю друга
    const friendSnap = await window.getDoc(friendRef);
    if (friendSnap.exists()) {
        const fData = friendSnap.data();
        const fNewFriends = [...(fData.friends || []), { uid: window.currentUser.uid, name: window.currentUser.displayName, addedAt: Date.now() }];
        const fNewOutgoing = (fData.outgoingRequests || []).filter(r => r.uid !== window.currentUser.uid);
        await window.updateDoc(friendRef, { friends: fNewFriends, outgoingRequests: fNewOutgoing });
    }
    
    await refreshLocalData();
    alert(`✅ ${request.name} теперь ваш друг!`);
}

// ========== ОТКЛОНИТЬ ==========
async function rejectRequest(fromUid) {
    const myRef = window.doc(db, 'users', window.currentUser.uid);
    const friendRef = window.doc(db, 'users', fromUid);
    
    const myNewIncoming = window.incomingRequests.filter(r => r.uid !== fromUid);
    await window.updateDoc(myRef, { incomingRequests: myNewIncoming });
    
    const fSnap = await window.getDoc(friendRef);
    if (fSnap.exists()) {
        const fData = fSnap.data();
        await window.updateDoc(friendRef, {
            outgoingRequests: (fData.outgoingRequests || []).filter(r => r.uid !== window.currentUser.uid)
        });
    }
    
    await refreshLocalData();
}

// ========== ОТМЕНИТЬ ==========
async function cancelRequest(toUid) {
    const myRef = window.doc(db, 'users', window.currentUser.uid);
    const friendRef = window.doc(db, 'users', toUid);
    
    const myNewOutgoing = window.outgoingRequests.filter(r => r.uid !== toUid);
    await window.updateDoc(myRef, { outgoingRequests: myNewOutgoing });
    
    const fSnap = await window.getDoc(friendRef);
    if (fSnap.exists()) {
        const fData = fSnap.data();
        await window.updateDoc(friendRef, {
            incomingRequests: (fData.incomingRequests || []).filter(r => r.uid !== window.currentUser.uid)
        });
    }
    
    await refreshLocalData();
}

// ========== УДАЛИТЬ ДРУГА ==========
async function removeFriend(friendUid) {
    const friend = window.friends.find(f => f.uid === friendUid);
    const name = friend?.name || 'друга';
    
    if (!confirm(`Удалить ${name} из друзей?`)) return;
    
    const myRef = window.doc(db, 'users', window.currentUser.uid);
    const friendRef = window.doc(db, 'users', friendUid);
    
    await window.updateDoc(myRef, {
        friends: window.friends.filter(f => f.uid !== friendUid)
    });
    
    const fSnap = await window.getDoc(friendRef);
    if (fSnap.exists()) {
        const fData = fSnap.data();
        await window.updateDoc(friendRef, {
            friends: (fData.friends || []).filter(f => f.uid !== window.currentUser.uid)
        });
    }
    
    if (window.currentList === 'shared_' + friendUid) {
        window.currentList = 'my';
    }
    
    await refreshLocalData();
    if (window.loadPlaces) window.loadPlaces();
}

// ========== ОБНОВЛЕНИЕ ЛОКАЛЬНЫХ ДАННЫХ ==========
async function refreshLocalData() {
    const userRef = window.doc(db, 'users', window.currentUser.uid);
    const userSnap = await window.getDoc(userRef);
    
    if (userSnap.exists()) {
        const data = userSnap.data();
        window.friends = data.friends || [];
        window.incomingRequests = data.incomingRequests || [];
        window.outgoingRequests = data.outgoingRequests || [];
    }
    
    renderFriendsModal();
    renderListChips();
    updateFriendsBadge();
}

// ========== СЛУШАТЕЛЬ ==========
window.listenFriends = function () {
    if (!window.currentUser) return;
    
    const userRef = window.doc(db, 'users', window.currentUser.uid);
    window.onSnapshot(userRef, (snap) => {
        if (snap.exists() && window.currentUser) {
            const data = snap.data();
            window.friends = data.friends || [];
            window.incomingRequests = data.incomingRequests || [];
            window.outgoingRequests = data.outgoingRequests || [];
            
            renderFriendsModal();
            renderListChips();
            updateFriendsBadge();
        }
    });
};

// ========== КНОПКИ (убираем старые обработчики) ==========
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addFriendBtn');
    const copyBtn = document.getElementById('copyIdBtn');
    
    // Удаляем старые обработчики клонированием
    if (addBtn) {
        const newBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        newBtn.addEventListener('click', () => {
            const input = document.getElementById('friendIdInput');
            if (input) sendRequest(input.value.trim());
        });
    }
    
    if (copyBtn) {
        const newBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newBtn, copyBtn);
        newBtn.addEventListener('click', () => {
            if (!window.currentUser) return;
            navigator.clipboard.writeText(window.currentUser.uid);
            const icon = newBtn.querySelector('i');
            if (icon) {
                icon.className = 'bi bi-check-lg';
                setTimeout(() => { icon.className = 'bi bi-clipboard'; }, 1500);
            }
        });
    }
});

console.log('✅ friends.js v3 загружен');