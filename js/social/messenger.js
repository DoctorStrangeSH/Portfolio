// ==================== messenger.js v2 ====================

window.showMessenger = function() {
    var old = document.getElementById('messengerModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="messengerModal" tabindex="-1">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow" style="height:80vh;border-radius:20px">' +
        '<div class="modal-header bg-primary text-white" style="border-radius:20px 20px 0 0"><h5 class="modal-title"><i class="bi bi-chat-dots me-2"></i>Сообщения</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-0"><div id="messengerBody"></div></div>' +
        '</div></div></div>');
    
    new bootstrap.Modal(document.getElementById('messengerModal')).show();
    loadDialogs();
};

function loadDialogs() {
    var body = document.getElementById('messengerBody');
    if (!window.friends || !window.friends.length) {
        body.innerHTML = '<p class="text-center text-muted py-5">Нет друзей</p>';
        return;
    }
    
    body.innerHTML = '<div class="list-group list-group-flush">' + window.friends.map(function(f) {
        var chatId = [window.currentUser.uid, f.uid].sort().join('_');
        return '<a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center dialog-item" data-chat-id="' + chatId + '" data-friend-name="' + f.name + '">' +
            '<div class="d-flex align-items-center gap-2"><div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width:44px;height:44px;font-weight:bold">' + f.name.charAt(0).toUpperCase() + '</div>' +
            '<div><strong>' + f.name + '</strong><br><small class="text-muted">Нажмите для чата</small></div></div>' +
            '<span class="badge bg-danger rounded-pill unread-badge d-none" id="unread-' + chatId + '">0</span></a>';
    }).join('') + '</div>';
    
    body.querySelectorAll('.dialog-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
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

console.log('✅ messenger.js v2 загружен');