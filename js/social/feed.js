// ==================== feed.js v2 ====================

window.showFeed = function() {
    var old = document.getElementById('feedModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="feedModal" tabindex="-1">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow" style="border-radius:20px;overflow:hidden">' +
        '<div class="modal-header border-0" style="background:var(--primary);color:white">' +
            '<h5 class="modal-title"><i class="bi bi-lightning-charge me-2"></i>Активность</h5>' +
            '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>' +
        '</div>' +
        '<div class="modal-body p-0" id="feedBody"><div class="text-center py-4"><div class="spinner-border text-primary"></div></div></div>' +
        '</div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('feedModal'));
    modal.show();
    loadFeed();
};

async function loadFeed() {
    var body = document.getElementById('feedBody');
    
    var snap = await window.getDocs(window.collection(window.db, 'activity'));
    var activities = [];
    snap.forEach(function(d) { activities.push(d.data()); });
    activities.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    activities = activities.slice(0, 30);
    
    if (!activities.length) {
        body.innerHTML = '<div class="text-center py-5" style="color:var(--text-muted)"><div style="font-size:3rem">📭</div><p class="mt-2">Пока нет активности</p></div>';
        return;
    }
    
    var icons = { place_added: '✈️', food_added: '🍽️', movie_added: '🎬', dream_added: '💭', place_visited: '✅', food_favourite: '⭐', movie_watched: '🎬', friend_added: '👥' };
    var actions = { place_added: 'добавил(а)', food_added: 'добавил(а)', movie_added: 'добавил(а)', dream_added: 'добавил(а)', place_visited: 'посетил(а)', food_favourite: 'в избранном', movie_watched: 'посмотрел(а)', friend_added: 'подружился(ась) с' };
    
    body.innerHTML = '<div style="padding:12px">' + activities.map(function(a) {
        return '<div class="d-flex align-items-start gap-3 p-3 rounded-3 mb-2" style="background:var(--bg)">' +
            '<div class="rounded-circle d-flex align-items-center justify-content-center" style="width:40px;height:40px;background:linear-gradient(135deg,var(--primary),var(--primary-light));color:white;font-size:1.2rem;flex-shrink:0">' + (icons[a.type] || '📌') + '</div>' +
            '<div><strong>' + a.userName + '</strong> <span style="color:var(--text-secondary)">' + (actions[a.type] || '') + '</span> <strong>' + a.title + '</strong>' +
            '<div><small style="color:var(--text-muted)">' + window.timeAgo(a.createdAt) + '</small></div></div>' +
        '</div>';
    }).join('') + '</div>';
}

console.log('✅ feed.js v2 загружен');