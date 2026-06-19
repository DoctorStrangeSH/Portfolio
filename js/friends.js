// ==================== friends.js ====================
const db = window.db;

// Состояние
window.friends = [];
window.currentList = 'my';

// ========== ЗАГРУЗКА ДРУЗЕЙ ==========
window.loadFriends = async function () {
    if (!window.currentUser) return;
    
    const userRef = window.doc(db, 'users', window.currentUser.uid);
    const userSnap = await window.getDoc(userRef);
    
    if (userSnap.exists()) {
        window.friends = userSnap.data().friends || [];
    } else {
        window.friends = [];
    }
    
    renderFriendsModal();
    renderListChips();
};

// ========== ОТОБРАЖЕНИЕ В МОДАЛКЕ ==========
function renderFriendsModal() {
    const container = document.getElementById('friendsList');
    if (!container) return;
    
    if (window.friends.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center py-2">Пока нет друзей</p>';
        return;
    }
    
    container.innerHTML = window.friends.map(friend => `
        <div class="d-flex justify-content-between align-items-center p-2 rounded hover-light mb-1">
            <div class="d-flex align-items-center gap-2">
                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                     style="width: 32px; height: 32px; font-size: 0.8rem;">
                    ${friend.name.charAt(0).toUpperCase()}
                </div>
                <span class="fw-medium">${friend.name}</span>
            </div>
            <button class="btn btn-sm btn-outline-danger remove-friend-btn" data-uid="${friend.uid}">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
    `).join('');
    
    // Вешаем обработчики на кнопки удаления
    container.querySelectorAll('.remove-friend-btn').forEach(btn => {
        btn.addEventListener('click', () => removeFriend(btn.dataset.uid));
    });
}

// ========== ФИШКИ СПИСКОВ ==========
function renderListChips() {
    const container = document.getElementById('listChips');
    if (!container) return;
    
    let html = `
        <span class="list-chip ${window.currentList === 'my' ? 'active' : ''}" data-list="my">
            🏠 Мои места
        </span>
    `;
    
    window.friends.forEach(friend => {
        const listId = 'shared_' + friend.uid;
        html += `
            <span class="list-chip ${window.currentList === listId ? 'active' : ''}" data-list="${listId}">
                ❤️ ${friend.name.split(' ')[0]}
            </span>
        `;
    });
    
    container.innerHTML = html;
    
    // Обработчики кликов
    container.querySelectorAll('.list-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            window.currentList = chip.dataset.list;
            renderListChips();
            if (window.loadPlaces) window.loadPlaces();
        });
    });
}

// ========== ДОБАВЛЕНИЕ ДРУГА ==========
async function addFriend(friendId) {
    if (!friendId) {
        alert('Введите ID друга');
        return;
    }
    
    if (friendId === window.currentUser.uid) {
        alert('Нельзя добавить самого себя');
        return;
    }
    
    if (window.friends.find(f => f.uid === friendId)) {
        alert('Этот пользователь уже у вас в друзьях');
        return;
    }
    
    // Проверяем существование пользователя
    const friendRef = window.doc(db, 'users', friendId);
    const friendSnap = await window.getDoc(friendRef);
    
    if (!friendSnap.exists()) {
        alert('Пользователь не найден. Попросите друга зайти на сайт, чтобы создать профиль.');
        return;
    }
    
    const friendData = friendSnap.data();
    const myData = {
        uid: window.currentUser.uid,
        name: window.currentUser.displayName,
        addedAt: Date.now()
    };
    const theirData = {
        uid: friendId,
        name: friendData.name,
        addedAt: Date.now()
    };
    
    // Добавляем друга мне
    const myRef = window.doc(db, 'users', window.currentUser.uid);
    await window.updateDoc(myRef, {
        friends: window.arrayUnion(theirData)
    });
    
    // Добавляем меня другу
    await window.updateDoc(friendRef, {
        friends: window.arrayUnion(myData)
    });
    
    document.getElementById('friendIdInput').value = '';
    await window.loadFriends();
    
    alert(`✅ ${friendData.name.split(' ')[0]} добавлен(а) в друзья!`);
}

// ========== УДАЛЕНИЕ ДРУГА ==========
async function removeFriend(friendUid) {
    const friend = window.friends.find(f => f.uid === friendUid);
    const friendName = friend ? friend.name.split(' ')[0] : 'этого пользователя';
    
    if (!confirm(`Удалить ${friendName} из друзей?`)) return;
    
    // Удаляем у себя
    const myRef = window.doc(db, 'users', window.currentUser.uid);
    const newMyFriends = window.friends.filter(f => f.uid !== friendUid);
    await window.updateDoc(myRef, { friends: newMyFriends });
    
    // Удаляем себя у друга
    const friendRef = window.doc(db, 'users', friendUid);
    const friendSnap = await window.getDoc(friendRef);
    if (friendSnap.exists()) {
        const theirFriends = (friendSnap.data().friends || []).filter(f => f.uid !== window.currentUser.uid);
        await window.updateDoc(friendRef, { friends: theirFriends });
    }
    
    // Если был выбран совместный список — переключаем на свой
    if (window.currentList === 'shared_' + friendUid) {
        window.currentList = 'my';
    }
    
    await window.loadFriends();
    if (window.loadPlaces) window.loadPlaces();
}

// ========== СЛУШАЕМ ИЗМЕНЕНИЯ ==========
function listenFriends() {
    if (!window.currentUser) return;
    
    const userRef = window.doc(db, 'users', window.currentUser.uid);
    window.onSnapshot(userRef, (snap) => {
        if (snap.exists() && window.currentUser) {
            window.friends = snap.data().friends || [];
            renderFriendsModal();
            renderListChips();
        }
    });
}

// ========== ОБРАБОТЧИКИ КНОПОК ==========
document.getElementById('addFriendBtn').addEventListener('click', () => {
    const input = document.getElementById('friendIdInput');
    addFriend(input.value.trim());
});

document.getElementById('copyIdBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.currentUser.uid);
    
    const btn = document.getElementById('copyIdBtn');
    const icon = btn.querySelector('i');
    icon.className = 'bi bi-check-lg';
    setTimeout(() => {
        icon.className = 'bi bi-clipboard';
    }, 1500);
});

// Экспорт для использования в app.js
window.listenFriends = listenFriends;