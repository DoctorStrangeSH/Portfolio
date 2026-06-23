// ==================== collections.js v2 ====================

window.createCollection = async function(type, title, items) {
    var docRef = await window.addDoc(window.collection(window.db, 'collections'), {
        type: type,
        title: title,
        userId: window.currentUser.uid,
        userName: window.currentUser.displayName || 'Пользователь',
        items: items,
        createdAt: Date.now(),
        public: true
    });
    
    return docRef.id;
};

window.shareCollection = function(collectionId) {
    var url = window.location.origin + window.location.pathname + '?collection=' + collectionId;
    
    var old = document.getElementById('shareCollectionModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="shareCollectionModal" tabindex="-1">' +
        '<div class="modal-dialog modal-dialog-centered">' +
        '<div class="modal-content border-0 shadow">' +
        '<div class="modal-header bg-success text-white"><h5 class="modal-title"><i class="bi bi-share me-2"></i>Поделиться подборкой</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body">' +
            '<p class="small text-muted">Скопируйте ссылку и отправьте друзьям:</p>' +
            '<div class="input-group">' +
                '<input type="text" class="form-control" value="' + url + '" id="shareUrl" readonly>' +
                '<button class="btn btn-primary" onclick="navigator.clipboard.writeText(document.getElementById(\'shareUrl\').value);alert(\'✅ Ссылка скопирована!\')"><i class="bi bi-clipboard"></i></button>' +
            '</div>' +
        '</div></div></div></div>');
    
    new bootstrap.Modal(document.getElementById('shareCollectionModal')).show();
};

window.showCollections = async function() {
    var old = document.getElementById('collectionsModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="collectionsModal" tabindex="-1">' +
        '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow">' +
        '<div class="modal-header bg-light"><h5 class="modal-title"><i class="bi bi-collection me-2"></i>Подборки</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body" id="collectionsBody"><div class="text-center"><div class="spinner-border"></div></div></div>' +
        '</div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('collectionsModal'));
    modal.show();
    
    var body = document.getElementById('collectionsBody');
    var uid = window.currentUser.uid;
    
    // Загружаем все подборки
    var snap = await window.getDocs(window.collection(window.db, 'collections'));
    var allCollections = [];
    snap.forEach(function(d) {
        allCollections.push({ id: d.id, data: d.data() });
    });
    
    allCollections.sort(function(a, b) { return (b.data.createdAt || 0) - (a.data.createdAt || 0); });
    
    if (!allCollections.length) {
        body.innerHTML = '<p class="text-center text-muted py-3">Пока нет подборок</p>';
        return;
    }
    
    body.innerHTML = '<div class="row g-3">' + allCollections.map(function(c) {
        var d = c.data;
        return '<div class="col-md-6">' +
            '<div class="card h-100">' +
                '<div class="card-body">' +
                    '<div class="d-flex justify-content-between mb-2">' +
                        '<span class="badge bg-' + (d.type === 'places' ? 'primary' : d.type === 'food' ? 'success' : 'warning') + '">' + (d.type === 'places' ? '✈️' : d.type === 'food' ? '🍽️' : '🎬') + '</span>' +
                        '<small class="text-muted">от ' + d.userName + '</small>' +
                    '</div>' +
                    '<h6>' + d.title + '</h6>' +
                    '<div class="d-flex flex-wrap gap-1 mb-2">' +
                        (d.items || []).slice(0, 5).map(function(item) {
                            return '<span class="badge bg-light text-dark">' + item + '</span>';
                        }).join(' ') +
                    '</div>' +
                    '<button class="btn btn-sm btn-outline-success" onclick="window.shareCollection(\'' + c.id + '\')"><i class="bi bi-share me-1"></i>Поделиться</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('') + '</div>';
};

console.log('✅ collections.js v2 загружен');