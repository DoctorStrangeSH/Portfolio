// ==================== friends.js v5 (коллекция friendRequests) ====================
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
        // Загружаем друзей из профиля
        const userSnap = await window.getDoc(window.doc(db, 'users', uid));
        if (userSnap.exists()) {
            window.friends = userSnap.data().friends || [];
        }
        
        // Загружаем входящие заявки (где я получатель)
        const incSnap = await window.getDocs(
            window.query(window.collection(db, 'friendRequests'), 
                window.where ? undefined : undefined) // обойдёмся без where для простоты
        );
        
        // Вручную фильтруем
        const allRequests = [];
        const incQ = window.query(
            window.collection(db, 'friendRequests'),
        );
        const incSnapshot = await window.getDocs(incQ);
        
        window.incomingRequests = [];
        window.outgoingRequests = [];
        
        incSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.toUid === uid) {
                window.incomingRequests.push({ id: doc.id, ...data });
            }
            if (data.fromUid === uid) {
                window.outgoingRequests.push({ id: doc.id, ...data });
            }
        });
        
        renderAllFriends();
    } catch (e) {
        console.error('loadFriends error:', e);
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
    const n = window.incomingRequests.length;
    b.textContent = n;
    n > 0 ? b.classList.remove('d-none') : b.classList.add('d-none');
}

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

function renderFriendsModal() {
    const inc = document.getElementById('incomingRequests');
    const out = document.getElementById('outgoingRequests');
    const fl = document.getElementById('friendsList');
    const badge = document.getElementById('incomingBadge');

    if (inc) {
        if (!window.incomingRequests.length) {
            inc.innerHTML = '<p class="text-muted small text-center py-2">Нет входящих заявок</p>';
            if (badge) badge.classList.add('d-none');
        } else {
            if (badge) { badge.textContent = window.incomingRequests.length; badge.classList.remove('d-none'); }
            inc.innerHTML = window.incomingRequests.map(r => `
                <div class="request-item">
                    <strong>${r.fromName}</strong>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-success accept-btn" data-id="${r.id}">✅ Принять</button>
                        <button class="btn btn-sm btn-outline-danger reject-btn" data-id="${r.id}">❌</button>
                    </div>
                </div>
            `).join('');
            inc.querySelectorAll('.accept-btn').forEach(b => b.onclick = () => acceptRequest(b.dataset.id));
            inc.querySelectorAll('.reject-btn').forEach(b => b.onclick = () => rejectRequest(b.dataset.id));
        }
    }

    if (out) {
        if (!window.outgoingRequests.length) {
            out.innerHTML = '<p class="text-muted small text-center py-2">Нет отправленных заявок</p>';
        } else {
            out.innerHTML = window.outgoingRequests.map(r => `
                <div class="request-item">
                    <strong>${r.toName}</strong>
                    <span class="text-warning small">⏳ Ожидает</span>
                </div>
            `).join('');
        }
    }

    if (fl) {
        if (!window.friends.length) {
            fl.innerHTML = '<p class="text-muted small text-center py-2">Пока нет друзей</p>';
        } else {
            fl.innerHTML = window.friends.map(f => `
                <div class="friend-item">
                    <strong>${f.name}</strong>
                    <button class="btn btn-sm btn-outline-danger remove-btn" data-uid="${f.uid}">Удалить</button>
                </div>
            `).join('');
            fl.querySelectorAll('.remove-btn').forEach(b => b.onclick = () => removeFriend(b.dataset.uid));
        }
    }
}

// ========== ОТПРАВКА ==========
async function sendRequest(targetId) {
    console.log('📤 Отправка заявки:', targetId);
    
    if (!targetId) { alert('Введите ID'); return; }
    if (targetId === window.currentUser.uid) { alert('Нельзя себя'); return; }
    if (window.friends.find(f => f.uid === targetId)) { alert('Уже друг'); return; }
    if (window.outgoingRequests.find(r => r.toUid === targetId)) { alert('Уже отправлена'); return; }

    const targetSnap = await window.getDoc(window.doc(db, 'users', targetId));
    if (!targetSnap.exists()) { alert('Пользователь не найден'); return; }

    const targetData = targetSnap.data();
    
    await window.addDoc(window.collection(db, 'friendRequests'), {
        fromUid: window.currentUser.uid,
        fromName: window.currentUser.displayName,
        toUid: targetId,
        toName: targetData.name,
        status: 'pending',
        createdAt: Date.now()
    });

    await window.loadFriends();
    document.getElementById('friendIdInput').value = '';
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
    await window.updateDoc(window.doc(db, 'users', req.fromUid), {
        friends: window.arrayUnion({ uid: window.currentUser.uid, name: window.currentUser.displayName, addedAt: Date.now() })
    });

    // Удаляем заявку
    await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
    
    await window.loadFriends();
    alert(`✅ ${req.fromName} теперь друг!`);
}

// ========== ОТКЛОНИТЬ ==========
async function rejectRequest(requestId) {
    await window.deleteDoc(window.doc(db, 'friendRequests', requestId));
    await window.loadFriends();
}

// ========== УДАЛИТЬ ДРУГА ==========
async function removeFriend(friendUid) {
    if (!confirm('Удалить из друзей?')) return;
    await window.updateDoc(window.doc(db, 'users', window.currentUser.uid), {
        friends: window.friends.filter(f => f.uid !== friendUid)
    });
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
    window.onSnapshot(window.collection(db, 'friendRequests'), async () => {
        await window.loadFriends();
    });
};

// ========== КНОПКИ ==========
document.getElementById('addFriendBtn').addEventListener('click', () => {
    const input = document.getElementById('friendIdInput');
    if (input) sendRequest(input.value.trim());
});

document.getElementById('copyIdBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.currentUser?.uid || '');
    alert('ID скопирован!');
});

console.log('✅ friends.js v5 загружен (коллекция friendRequests)');