// ==================== comments.js ====================

window.showComments = function(itemId, itemType) {
    var old = document.getElementById('commentsModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="commentsModal" tabindex="-1">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow">' +
        '<div class="modal-header bg-light"><h5 class="modal-title"><i class="bi bi-chat-dots me-2"></i>Комментарии</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body">' +
            '<div id="commentsList" style="max-height:350px;overflow-y:auto"></div>' +
            '<div class="input-group mt-3">' +
                '<input type="text" class="form-control" id="commentInput" placeholder="Написать комментарий...">' +
                '<button class="btn btn-primary" id="commentSendBtn"><i class="bi bi-send"></i></button>' +
            '</div>' +
        '</div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('commentsModal'));
    modal.show();
    
    loadComments(itemId);
    
    document.getElementById('commentSendBtn').onclick = async function() {
        var text = document.getElementById('commentInput').value.trim();
        if (!text) return;
        
        await window.addDoc(window.collection(window.db, 'comments'), {
            itemId: itemId,
            itemType: itemType,
            userId: window.currentUser.uid,
            userName: window.currentUser.displayName || 'Пользователь',
            text: text,
            createdAt: Date.now()
        });
        
        document.getElementById('commentInput').value = '';
        loadComments(itemId);
    };
    
    document.getElementById('commentInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('commentSendBtn').click();
    });
};

async function loadComments(itemId) {
    var container = document.getElementById('commentsList');
    var snap = await window.getDocs(window.collection(window.db, 'comments'));
    
    var comments = [];
    snap.forEach(function(d) {
        var c = d.data();
        c.id = d.id;
        if (c.itemId === itemId) comments.push(c);
    });
    
    comments.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
    
    if (!comments.length) {
        container.innerHTML = '<p class="text-muted text-center py-3">Пока нет комментариев</p>';
        return;
    }
    
    container.innerHTML = comments.map(function(c) {
        var time = window.timeAgo(c.createdAt);
        var isOwner = c.userId === window.currentUser?.uid;
        
        return '<div class="d-flex gap-2 mb-2 p-2 rounded" style="background:#f8f9fa">' +
            '<div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;font-size:0.8rem;flex-shrink:0">' + (c.userName || '?').charAt(0).toUpperCase() + '</div>' +
            '<div class="flex-grow-1">' +
                '<div class="d-flex justify-content-between"><strong>' + c.userName + '</strong><small class="text-muted">' + time + '</small></div>' +
                '<p class="mb-0 small">' + c.text + '</p>' +
            '</div>' +
            (isOwner ? '<button class="btn btn-sm text-danger delete-comment-btn" data-id="' + c.id + '" style="flex-shrink:0"><i class="bi bi-trash"></i></button>' : '') +
        '</div>';
    }).join('');
    
    container.querySelectorAll('.delete-comment-btn').forEach(function(btn) {
        btn.onclick = async function() {
            await window.deleteDoc(window.doc(window.db, 'comments', btn.dataset.id));
            loadComments(itemId);
        };
    });
    
    container.scrollTop = container.scrollHeight;
}

console.log('✅ comments.js загружен');