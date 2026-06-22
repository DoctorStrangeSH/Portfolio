// ==================== privacy.js ====================

// Проверка: является ли пользователь другом
window.isFriend = function(uid) {
    if (!window.friends || !window.currentUser) return false;
    if (uid === window.currentUser.uid) return true; // Сам себе друг
    return window.friends.some(f => f.uid === uid);
};

// Проверка доступа к контенту
window.canViewContent = function(ownerUid, isShared) {
    if (!window.currentUser) return false;
    if (isShared) return true; // Совместные списки открыты
    if (ownerUid === window.currentUser.uid) return true;
    if (window.isFriend(ownerUid)) return true;
    return false;
};

// Показывает заглушку приватности
window.showPrivacyPlaceholder = function() {
    return `
        <div class="text-center py-5">
            <i class="bi bi-lock-fill text-muted" style="font-size:4rem"></i>
            <h5 class="mt-3">Приватный список</h5>
            <p class="text-muted">Этот пользователь делится местами только с друзьями.</p>
            <button class="btn btn-primary" onclick="window.sendFriendRequestPrompt()">
                <i class="bi bi-person-plus me-1"></i>Добавить в друзья
            </button>
        </div>`;
};

// Заглушка для отправки запроса
window.sendFriendRequestPrompt = function() {
    const modal = document.getElementById('friendsModal');
    if (modal) {
        new bootstrap.Modal(modal).show();
    }
};

console.log('✅ privacy.js загружен');