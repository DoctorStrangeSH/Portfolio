// ==================== chat.js ====================

window.showChat = function(chatId, chatName) {
    var old = document.getElementById('chatModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="chatModal" tabindex="-1">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow" style="height:80vh">' +
        '<div class="modal-header bg-primary text-white">' +
        '<h5 class="modal-title"><i class="bi bi-chat-dots me-2"></i>' + (chatName || 'Чат') + '</h5>' +
        '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>' +
        '</div>' +
        '<div class="modal-body d-flex flex-column p-0">' +
            '<div id="chatMessages" style="flex-grow:1;overflow-y:auto;padding:15px;background:#f5f5f5"></div>' +
            '<div class="input-group p-2 bg-white border-top">' +
                '<input type="text" class="form-control" id="chatInput" placeholder="Сообщение...">' +
                '<button class="btn btn-primary" id="chatSendBtn"><i class="bi bi-send"></i></button>' +
            '</div>' +
        '</div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('chatModal'));
    modal.show();
    
    var chatPath = 'chats/' + chatId + '/messages';
    var messagesContainer = document.getElementById('chatMessages');
    
    // Загружаем сообщения
    window.onSnapshot(window.collection(window.db, chatPath), function(snap) {
        var messages = [];
        snap.forEach(function(d) {
            messages.push(d.data());
        });
        messages.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
        
        messagesContainer.innerHTML = messages.map(function(m) {
            var isMine = m.userId === window.currentUser?.uid;
            return '<div class="mb-2 d-flex ' + (isMine ? 'justify-content-end' : 'justify-content-start') + '">' +
                '<div class="p-2 rounded" style="max-width:75%;' + (isMine ? 'background:#0d6efd;color:white' : 'background:white') + '">' +
                    (!isMine ? '<small class="fw-bold d-block">' + (m.userName || 'Пользователь') + '</small>' : '') +
                    '<span>' + m.text + '</span>' +
                    '<small class="d-block ' + (isMine ? 'text-white-50' : 'text-muted') + '" style="font-size:0.65rem">' + window.timeAgo(m.createdAt) + '</small>' +
                '</div>' +
            '</div>';
        }).join('');
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
    
    // Отправка сообщения
    document.getElementById('chatSendBtn').onclick = async function() {
        var text = document.getElementById('chatInput').value.trim();
        if (!text) return;
        
        await window.addDoc(window.collection(window.db, chatPath), {
            userId: window.currentUser.uid,
            userName: window.currentUser.displayName || 'Пользователь',
            text: text,
            createdAt: Date.now()
        });
        
        document.getElementById('chatInput').value = '';
    };
    
    document.getElementById('chatInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('chatSendBtn').click();
    });
};

console.log('✅ chat.js загружен');