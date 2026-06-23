// ==================== planTrip.js ====================

window.showPlanTrip = function() {
    var old = document.getElementById('planTripModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="planTripModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered">' +
        '<div class="modal-content border-0 shadow">' +
        '<div class="modal-header bg-primary text-white">' +
        '<h5 class="modal-title"><i class="bi bi-calendar-plus me-2"></i>Планируем поездку</h5>' +
        '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>' +
        '</div>' +
        '<div class="modal-body">' +
            '<form id="planTripForm" autocomplete="off">' +
                '<div class="row g-3 mb-3">' +
                    '<div class="col-md-6"><label class="form-label fw-medium">Название поездки *</label><input type="text" class="form-control" id="ptName" required placeholder="Например: Выходные в Питере"></div>' +
                    '<div class="col-md-6"><label class="form-label fw-medium">Дата</label><input type="date" class="form-control" id="ptDate"></div>' +
                '</div>' +
                '<div class="mb-3"><label class="form-label fw-medium">Описание</label><textarea class="form-control" id="ptDesc" rows="2"></textarea></div>' +
                '<div class="mb-3">' +
                    '<label class="form-label fw-medium">👥 Пригласить друзей</label>' +
                    '<div id="ptFriendsList"></div>' +
                '</div>' +
                '<div class="mb-3"><label class="form-label fw-medium">📍 Места для голосования</label><div id="ptPlaces"><input type="text" class="form-control form-control-sm mb-1" placeholder="Вариант 1"><input type="text" class="form-control form-control-sm mb-1" placeholder="Вариант 2"><input type="text" class="form-control form-control-sm" placeholder="Вариант 3"></div></div>' +
                '<div class="d-flex gap-2"><button type="submit" class="btn btn-success flex-grow-1"><i class="bi bi-check-lg me-1"></i>Создать план</button><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Отмена</button></div>' +
            '</form>' +
        '</div></div></div></div>');
    
    // Список друзей для приглашения
    var friendsList = document.getElementById('ptFriendsList');
    if (window.friends && window.friends.length > 0) {
        friendsList.innerHTML = window.friends.map(function(f) {
            return '<div class="form-check"><input class="form-check-input" type="checkbox" value="' + f.uid + '" id="ptFriend_' + f.uid + '"><label class="form-check-label" for="ptFriend_' + f.uid + '">' + f.name + '</label></div>';
        }).join('');
    } else {
        friendsList.innerHTML = '<p class="text-muted small">Нет друзей для приглашения</p>';
    }
    
    var modal = new bootstrap.Modal(document.getElementById('planTripModal'));
    modal.show();
    
    document.getElementById('planTripForm').onsubmit = async function(e) {
        e.preventDefault();
        var name = document.getElementById('ptName').value.trim();
        if (!name) return alert('Введите название!');
        
        // Собираем выбранных друзей
        var invited = [];
        document.querySelectorAll('#ptFriendsList input:checked').forEach(function(cb) {
            invited.push(cb.value);
        });
        
        // Собираем места
        var placeOptions = [];
        document.querySelectorAll('#ptPlaces input').forEach(function(inp) {
            var val = inp.value.trim();
            if (val) placeOptions.push({ name: val, votes: [] });
        });
        
        var data = {
            name: name,
            date: document.getElementById('ptDate').value,
            description: document.getElementById('ptDesc').value.trim(),
            createdBy: window.currentUser.uid,
            creatorName: window.currentUser.displayName || 'Пользователь',
            invited: invited,
            places: placeOptions,
            status: 'active',
            createdAt: Date.now()
        };
        
        var docRef = await window.addDoc(window.collection(window.db, 'trips'), data);
        
        // Создаём чат для поездки
        await window.setDoc(window.doc(window.db, 'chats', docRef.id), {
            name: name,
            type: 'trip',
            createdAt: Date.now()
        });
        
        modal.hide();
        alert('✅ План поездки создан! Чат доступен в разделе друзей.');
    };
};

console.log('✅ planTrip.js загружен');