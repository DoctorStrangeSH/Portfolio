// ==================== comments.js v2 ====================

window.showComments = function(itemId, itemType) {
    var old = document.getElementById('commentsModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="commentsModal" tabindex="-1">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5 class="modal-title"><i class="bi bi-chat-dots me-2"></i>Комментарии</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-0 d-flex flex-column" style="height:60vh">' +
            '<div id="commentsList" style="flex-grow:1;overflow-y:auto;padding:16px"></div>' +
            '<div style="background:var(--surface);border-top:1px solid var(--border);padding:12px 16px">' +
                '<div class="input-group"><input type="text" class="form-control" id="commentInput" placeholder="Комментарий..." style="border-radius:50px"><button class="btn btn-primary" id="commentSendBtn" style="border-radius:50px;margin-left:8px"><i class="bi bi-send-fill"></i></button></div>' +
            '</div>' +
        '</div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('commentsModal'));
    modal.show();
    
    loadComments(itemId);
    
    document.getElementById('commentSendBtn').onclick = async function() {
        var text = document.getElementById('commentInput').value.trim();
        if (!text) return;
        
        await window.addDoc(window.collection(window.db, 'comments'), {
            itemId: itemId, itemType: itemType,
            userId: window.currentUser.uid,
            userName: window.currentUser.displayName || 'Пользователь',
            text: text, createdAt: Date.now()
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
    snap.forEach(function(d) { var c = d.data(); c.id = d.id; if (c.itemId === itemId) comments.push(c); });
    comments.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
    
    if (!comments.length) {
        container.innerHTML = '<div class="text-center py-4" style="color:var(--text-muted)">Пока нет комментариев</div>';
        return;
    }
    
    container.innerHTML = comments.map(function(c) {
        var isOwner = c.userId === window.currentUser?.uid;
        return '<div class="d-flex gap-2 mb-3">' +
            '<div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:32px;height:32px;background:var(--primary);color:white;font-weight:700;font-size:0.8rem">' + (c.userName || '?').charAt(0).toUpperCase() + '</div>' +
            '<div class="flex-grow-1">' +
                '<div class="p-3 rounded-3" style="background:var(--bg)">' +
                    '<div class="d-flex justify-content-between mb-1"><strong>' + c.userName + '</strong><small style="color:var(--text-muted)">' + window.timeAgo(c.createdAt) + '</small></div>' +
                    '<p class="mb-0 small">' + c.text + '</p>' +
                '</div>' +
                (isOwner ? '<button class="btn btn-sm text-danger mt-1 delete-comment-btn" data-id="' + c.id + '" style="font-size:0.7rem"><i class="bi bi-trash"></i> Удалить</button>' : '') +
            '</div>' +
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

console.log('✅ comments.js v2 загружен');