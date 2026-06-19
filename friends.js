// ==================== friends.js ====================
// Управление друзьями

window.friends = [];
window.currentList = 'my';

async function loadFriends() {
    try {
        window.friends = await window.API.getFriends();
        renderListChips();
    } catch (error) {
        console.error('Ошибка загрузки друзей:', error);
    }
}

function renderListChips() {
    const container = document.getElementById('listChips');
    
    if (!container) {
        return;
    }
    
    let html = `<span class="list-chip ${window.currentList === 'my' ? 'active' : ''}" data-list="my">
        🏠 Мои
    </span>`;
    
    window.friends.forEach(friend => {
        const listId = 'shared_' + friend.uid;
        html += `<span class="list-chip ${window.currentList === listId ? 'active' : ''}" data-list="${listId}">
            ❤️ ${friend.name.split(' ')[0]}
            <span class="remove-friend" data-uid="${friend.uid}" title="Удалить">×</span>
        </span>`;
    });
    
    html += `<span class="add-friend-chip" data-bs-toggle="modal" data-bs-target="#addFriendModal">
        + Добавить друга
    </span>`;
    
    container.innerHTML = html;
    
    // Клики по фишкам
    container.querySelectorAll('.list-chip').forEach(chip => {
        chip.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-friend')) {
                return;
            }
            
            window.currentList = chip.dataset.list;
            renderListChips();
            
            if (window.loadPlaces) {
                window.loadPlaces();
            }
        });
    });
    
    // Клики по крестикам
    container.querySelectorAll('.remove-friend').forEach(btn => {
        btn.addEventListener('click', async (event) => {
            event.stopPropagation();
            await removeFriend(btn.dataset.uid);
        });
    });
}

async function addFriend(targetId) {
    try {
        const result = await window.API.addFriend(targetId);
        await loadFriends();
        alert('✅ ' + result.friend.name.split(' ')[0] + ' добавлен(а)!');
    } catch (error) {
        alert('❌ ' + (error.message || 'Не удалось добавить друга'));
    }
}

async function removeFriend(friendId) {
    if (!confirm('Удалить из друзей?')) {
        return;
    }
    
    try {
        await window.API.removeFriend(friendId);
        
        if (window.currentList === 'shared_' + friendId) {
            window.currentList = 'my';
        }
        
        await loadFriends();
        
        if (window.loadPlaces) {
            window.loadPlaces();
        }
    } catch (error) {
        alert('❌ Ошибка при удалении');
    }
}

// Настройка кнопок
document.addEventListener('DOMContentLoaded', () => {
    const addFriendBtn = document.getElementById('addFriendBtn');
    const friendIdInput = document.getElementById('friendIdInput');
    const copyIdBtn = document.getElementById('copyIdBtn');
    
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', () => {
            const targetId = friendIdInput.value.trim();
            addFriend(targetId);
        });
    }
    
    if (copyIdBtn && window.currentUser) {
        copyIdBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.currentUser.uid);
            alert('✅ ID скопирован!');
        });
    }
});

window.loadFriends = loadFriends;
window.addFriend = addFriend;
window.removeFriend = removeFriend;