// ==================== chat.js v2 ====================

window.showChat = function(chatId, chatName) {
    var old = document.getElementById('chatModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="chatModal" tabindex="-1">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow" style="height:75vh;border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white;padding:16px 20px">' +
            '<div class="d-flex align-items-center gap-2">' +
                '<div class="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center" style="width:36px;height:36px;font-weight:700">' + (chatName || '💬').charAt(0).toUpperCase() + '</div>' +
                '<div><h6 class="mb-0">' + (chatName || 'Чат') + '</h6></div>' +
            '</div>' +
            '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>' +
        '</div>' +
        '<div class="modal-body d-flex flex-column p-0" style="background:var(--bg)">' +
            '<div id="chatMessages" style="flex-grow:1;overflow-y:auto;padding:16px"></div>' +
            '<div style="background:var(--surface);border-top:1px solid var(--border);padding:12px 16px">' +
                '<div class="input-group">' +
                    '<input type="text" class="form-control" id="chatInput" placeholder="Написать..." style="border-radius:50px;border:2px solid var(--border)">' +
                    '<button class="btn btn-primary" id="chatSendBtn" style="border-radius:50px;margin-left:8px"><i class="bi bi-send-fill"></i></button>' +
                '</div>' +
            '</div>' +
        '</div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('chatModal'));
    modal.show();
    
    var chatPath = 'chats/' + chatId + '/messages';
    var messagesContainer = document.getElementById('chatMessages');
    
    window.onSnapshot(window.collection(window.db, chatPath), function(snap) {
        var messages = [];
        snap.forEach(function(d) {
            var data = d.data();
            data.id = d.id;
            messages.push(data);
        });
        messages.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
        
        messagesContainer.innerHTML = messages.map(function(m) {
            var isMine = m.userId === window.currentUser?.uid;
            return '<div class="mb-2 d-flex ' + (isMine ? 'justify-content-end' : 'justify-content-start') + '">' +
                '<div style="max-width:75%;padding:10px 14px;border-radius:' + (isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px') + ';' +
                    (isMine ? 'background:var(--primary);color:white' : 'background:var(--surface);color:var(--text);border:1px solid var(--border)') + '">' +
                    (!isMine ? '<small class="fw-bold d-block mb-1" style="color:var(--primary)">' + (m.userName || 'Пользователь') + '</small>' : '') +
                    '<span style="font-size:0.9rem">' + m.text + '</span>' +
                    '<small class="d-block mt-1" style="font-size:0.65rem;' + (isMine ? 'opacity:0.7' : 'color:var(--text-muted)') + '">' + window.timeAgo(m.createdAt) + '</small>' +
                '</div>' +
            '</div>';
        }).join('');
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
    
    document.getElementById('chatSendBtn').onclick = async function() {
        var text = document.getElementById('chatInput').value.trim();
        if (!text) return;
        
        await window.addDoc(window.collection(window.db, chatPath), {
            userId: window.currentUser.uid,
            userName: window.currentUser.displayName || 'Пользователь',
            text: text,
            createdAt: Date.now(),
            read: false
        });
        
        document.getElementById('chatInput').value = '';
    };
    
    document.getElementById('chatInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('chatSendBtn').click();
    });
    
    setTimeout(function() { document.getElementById('chatInput').focus(); }, 500);
};

console.log('✅ chat.js v2 загружен');