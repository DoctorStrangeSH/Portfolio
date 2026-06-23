// ==================== publicMap.js ====================

window.showPublicMap = function(userId) {
    if (!userId) userId = window.currentUser?.uid;
    if (!userId) return;
    
    var old = document.getElementById('publicMapModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="publicMapModal" tabindex="-1">' +
        '<div class="modal-dialog modal-fullscreen">' +
        '<div class="modal-content"><div class="modal-header bg-primary text-white">' +
        '<h5 class="modal-title"><i class="bi bi-map me-2"></i>Карта путешествий</h5>' +
        '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>' +
        '</div><div class="modal-body p-0"><div id="publicMapContainer" style="height:100%"></div></div></div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('publicMapModal'));
    modal.show();
    
    setTimeout(async function() {
        var map = L.map('publicMapContainer').setView([55.76, 37.62], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
        
        var snap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/places'));
        var markers = [];
        
        snap.forEach(function(d) {
            var p = d.data();
            if (p.location) {
                fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(p.location) + '&limit=1')
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        if (data.length > 0) {
                            var marker = L.marker([parseFloat(data[0].lat), parseFloat(data[0].lon)])
                                .addTo(map)
                                .bindPopup('<strong>' + p.name + '</strong><br>' + (p.description || ''));
                            markers.push(marker);
                            if (markers.length > 0) {
                                var group = new L.featureGroup(markers);
                                map.fitBounds(group.getBounds().pad(0.1));
                            }
                        }
                    });
            }
        });
        
        setTimeout(function() { map.invalidateSize(); }, 300);
    }, 500);
};

console.log('✅ publicMap.js загружен');