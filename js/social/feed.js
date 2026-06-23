// ==================== feed.js ====================

window.showFeed = function() {
    var old = document.getElementById('feedModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="feedModal" tabindex="-1">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow">' +
        '<div class="modal-header bg-light"><h5 class="modal-title"><i class="bi bi-lightning-charge me-2"></i>Активность</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body" id="feedBody"><div class="text-center"><div class="spinner-border"></div></div></div>' +
        '</div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('feedModal'));
    modal.show();
    
    loadFeed();
};

async function loadFeed() {
    var body = document.getElementById('feedBody');
    
    var snap = await window.getDocs(window.query(
        window.collection(window.db, 'activity'),
        // Получаем последние 50 активностей
    ));
    
    var activities = [];
    snap.forEach(function(d) {
        activities.push(d.data());
    });
    
    activities.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    activities = activities.slice(0, 30);
    
    if (!activities.length) {
        body.innerHTML = '<p class="text-center text-muted py-3">Пока нет активности</p>';
        return;
    }
    
    var icons = {
        place_added: '✈️',
        food_added: '🍽️',
        movie_added: '🎬',
        dream_added: '💭',
        place_visited: '✅',
        food_favourite: '⭐',
        movie_watched: '🎬',
        friend_added: '👥'
    };
    
    body.innerHTML = activities.map(function(a) {
        var icon = icons[a.type] || '📌';
        var time = window.timeAgo(a.createdAt);
        
        return '<div class="d-flex align-items-start gap-2 mb-3 p-2 rounded" style="background:#f8f9fa">' +
            '<img src="' + (a.userPhoto || 'https://placehold.co/32') + '" class="rounded-circle" style="width:32px;height:32px;object-fit:cover">' +
            '<div>' +
                '<strong>' + a.userName + '</strong> <span class="text-muted">' + getActionText(a.type, a.title) + '</span>' +
                '<div><small class="text-muted">' + time + '</small></div>' +
            '</div>' +
        '</div>';
    }).join('');
}

function getActionText(type, title) {
    var actions = {
        place_added: 'добавил(а) новое место',
        food_added: 'добавил(а) ресторан',
        movie_added: 'добавил(а) фильм',
        dream_added: 'добавил(а) мечту',
        place_visited: 'посетил(а)',
        food_favourite: 'добавил(а) в любимые ресторан',
        movie_watched: 'посмотрел(а)',
        friend_added: 'добавил(а) нового друга'
    };
    return (actions[type] || 'обновил(а)') + ' <strong>' + title + '</strong>';
}

console.log('✅ feed.js загружен');