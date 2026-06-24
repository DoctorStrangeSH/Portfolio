// ==================== planTrip.js v2 ====================

window.showPlanTrip = function() {
    var old = document.getElementById('planTripModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="planTripModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered">' +
        '<div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white"><h5 class="modal-title"><i class="bi bi-calendar-plus me-2"></i>Планируем поездку</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-4">' +
            '<form id="planTripForm" autocomplete="off">' +
                '<div class="mb-3"><label class="form-label fw-medium">Название *</label><input type="text" class="form-control rounded-pill" id="ptName" required placeholder="Выходные в Питере"></div>' +
                '<div class="mb-3"><label class="form-label fw-medium">Дата</label><input type="date" class="form-control rounded-pill" id="ptDate"></div>' +
                '<div class="mb-3"><label class="form-label fw-medium">Описание</label><textarea class="form-control" id="ptDesc" rows="2" style="border-radius:16px"></textarea></div>' +
                '<div class="mb-3"><label class="form-label fw-medium">👥 Пригласить друзей</label><div id="ptFriendsList"></div></div>' +
                '<div class="d-flex gap-2"><button type="submit" class="btn btn-primary flex-grow-1 rounded-pill"><i class="bi bi-check-lg me-1"></i>Создать</button><button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Отмена</button></div>' +
            '</form>' +
        '</div></div></div></div>');
    
    var friendsList = document.getElementById('ptFriendsList');
    if (window.friends && window.friends.length > 0) {
        friendsList.innerHTML = window.friends.map(function(f) {
            return '<div class="form-check"><input class="form-check-input" type="checkbox" value="' + f.uid + '" id="ptFriend_' + f.uid + '"><label class="form-check-label" for="ptFriend_' + f.uid + '">' + f.name + '</label></div>';
        }).join('');
    } else {
        friendsList.innerHTML = '<p style="color:var(--text-muted)">Нет друзей</p>';
    }
    
    var modal = new bootstrap.Modal(document.getElementById('planTripModal'));
    modal.show();
    
    document.getElementById('planTripForm').onsubmit = async function(e) {
        e.preventDefault();
        var name = document.getElementById('ptName').value.trim();
        if (!name) return alert('Введите название!');
        
        var invited = [];
        document.querySelectorAll('#ptFriendsList input:checked').forEach(function(cb) { invited.push(cb.value); });
        
        var data = {
            name: name, date: document.getElementById('ptDate').value,
            description: document.getElementById('ptDesc').value.trim(),
            createdBy: window.currentUser.uid,
            creatorName: window.currentUser.displayName || 'Пользователь',
            invited: invited, status: 'active', createdAt: Date.now()
        };
        
        var docRef = await window.addDoc(window.collection(window.db, 'trips'), data);
        await window.setDoc(window.doc(window.db, 'chats', docRef.id), { name: name, type: 'trip', createdAt: Date.now() });
        
        modal.hide();
        alert('✅ План создан!');
    };
};

console.log('✅ planTrip.js v2 загружен');