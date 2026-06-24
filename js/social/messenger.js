// ==================== messenger.js v3 ====================

window.showMessenger = function() {
    var old = document.getElementById('messengerModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="messengerModal" tabindex="-1">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow" style="height:75vh;border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5 class="modal-title"><i class="bi bi-chat-dots me-2"></i>Сообщения</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-0"><div id="messengerBody"><div class="text-center py-4"><div class="spinner-border text-primary"></div></div></div></div>' +
        '</div></div></div>');
    
    new bootstrap.Modal(document.getElementById('messengerModal')).show();
    loadDialogs();
};

function loadDialogs() {
    var body = document.getElementById('messengerBody');
    
    if (!window.friends || !window.friends.length) {
        body.innerHTML = '<div class="text-center py-5" style="color:var(--text-muted)"><div style="font-size:3rem">💬</div><p class="mt-2">Нет друзей для чата</p></div>';
        return;
    }
    
    body.innerHTML = window.friends.map(function(f) {
        var chatId = [window.currentUser.uid, f.uid].sort().join('_');
        return '<div class="p-3 d-flex align-items-center gap-3 dialog-item" style="cursor:pointer;border-bottom:1px solid var(--border);transition:var(--transition)" data-chat-id="' + chatId + '" data-friend-name="' + f.name + '" onmouseenter="this.style.background=\'var(--bg)\'" onmouseleave="this.style.background=\'transparent\'">' +
            '<div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:48px;height:48px;background:linear-gradient(135deg,var(--primary),var(--primary-light));color:white;font-weight:700;font-size:1.1rem">' + f.name.charAt(0).toUpperCase() + '</div>' +
            '<div class="flex-grow-1"><strong>' + f.name + '</strong><br><small style="color:var(--text-muted)">Нажмите, чтобы открыть чат</small></div>' +
            '<span class="badge bg-danger rounded-pill unread-badge d-none" id="unread-' + chatId + '">0</span>' +
            '<i class="bi bi-chevron-right" style="color:var(--text-muted)"></i>' +
        '</div>';
    }).join('');
    
    body.querySelectorAll('.dialog-item').forEach(function(item) {
        item.addEventListener('click', function() {
            bootstrap.Modal.getInstance(document.getElementById('messengerModal')).hide();
            setTimeout(function() { window.showChat(item.dataset.chatId, item.dataset.friendName); }, 300);
        });
    });
}

window.listenUnreadMessages = function() {
    if (!window.currentUser || !window.friends) return;
    window.friends.forEach(function(f) {
        var chatId = [window.currentUser.uid, f.uid].sort().join('_');
        window.onSnapshot(window.collection(window.db, 'chats/' + chatId + '/messages'), function(snap) {
            var count = 0;
            snap.forEach(function(doc) { if (doc.data().userId !== window.currentUser.uid && !doc.data().read) count++; });
            var badge = document.getElementById('unread-' + chatId);
            if (badge) { badge.textContent = count; badge.classList.toggle('d-none', count === 0); }
            updateMessagesBadge();
        });
    });
};

function updateMessagesBadge() {
    var total = 0;
    document.querySelectorAll('.unread-badge').forEach(function(b) { total += parseInt(b.textContent) || 0; });
    var badge = document.getElementById('messagesBadge');
    if (badge) { badge.textContent = total; badge.classList.toggle('d-none', total === 0); }
}

console.log('✅ messenger.js v3 загружен');