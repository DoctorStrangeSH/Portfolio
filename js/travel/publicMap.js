// ==================== publicMap.js (Яндекс.Карты) ====================

window.showPublicMap = function(userId) {
    if (!userId) userId = window.currentUser?.uid;
    if (!userId) return;
    
    var old = document.getElementById('publicMapModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="publicMapModal" tabindex="-1">' +
        '<div class="modal-dialog modal-fullscreen"><div class="modal-content">' +
        '<div class="modal-header bg-primary text-white"><h5 class="modal-title"><i class="bi bi-map me-2"></i>Карта путешествий</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body p-0"><div id="publicMapContainer" style="height:100%"></div></div>' +
        '</div></div></div>');
    
    var modal = new bootstrap.Modal(document.getElementById('publicMapModal'));
    modal.show();
    
    var script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=d8e59a70-957e-4901-8a97-d25b76148bb3';
    script.onload = function() {
        ymaps.ready(async function() {
            var map = new ymaps.Map('publicMapContainer', {
                center: [55.76, 37.62],
                zoom: 4
            });
            
            var snap = await window.getDocs(window.collection(window.db, 'users/' + userId + '/places'));
            
            snap.forEach(async function(d) {
                var p = d.data();
                if (p.location) {
                    try {
                        var result = await ymaps.geocode(p.location);
                        var coords = result.geoObjects.get(0).geometry.getCoordinates();
                        map.geoObjects.add(new ymaps.Placemark(coords, {
                            balloonContent: '<strong>' + p.name + '</strong><br>' + (p.description || '')
                        }));
                    } catch (e) {}
                }
            });
        });
    };
    document.head.appendChild(script);
};