// ==================== travelMap.js (Яндекс.Карты) ====================

window.travelMap = null;
window.travelMarkers = [];

window.initTravelMap = function() {
    var container = document.getElementById('travelMapContainer');
    if (!container || window.travelMap) return;
    
    // Загружаем Яндекс.Карты
    var script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=ВАШ_ЯНДЕКС_КЛЮЧ';
    script.onload = function() {
        ymaps.ready(function() {
            window.travelMap = new ymaps.Map('travelMapContainer', {
                center: [55.76, 37.62],
                zoom: 4,
                controls: ['zoomControl', 'searchControl', 'typeSelector']
            });
            
            renderTravelMarkers();
        });
    };
    document.head.appendChild(script);
    
    // Обновить при переключении вкладки
    var tabBtn = document.querySelector('#travelTabs button[data-bs-target="#travelMapTab"]');
    if (tabBtn) {
        tabBtn.addEventListener('shown.bs.tab', function() {
            setTimeout(function() {
                if (window.travelMap) window.travelMap.container.fitToViewport();
                renderTravelMarkers();
            }, 300);
        });
    }
};

async function renderTravelMarkers() {
    if (!window.travelMap || !window.ymaps) return;
    
    // Очищаем старые
    window.travelMap.geoObjects.removeAll();
    
    var places = window.travelState.places || [];
    
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        if (place.location) {
            try {
                var result = await ymaps.geocode(place.location);
                var coords = result.geoObjects.get(0).geometry.getCoordinates();
                
                var placemark = new ymaps.Placemark(coords, {
                    balloonContent: '<strong>' + place.name + '</strong><br>' + (place.description || ''),
                    hintContent: place.name
                }, {
                    preset: 'islands#blueDotIcon'
                });
                
                window.travelMap.geoObjects.add(placemark);
            } catch (e) {}
        }
    }
    
    if (window.travelMap.geoObjects.getLength() > 0) {
        window.travelMap.setBounds(window.travelMap.geoObjects.getBounds(), { checkZoomRange: true });
    }
}

console.log('✅ travelMap.js загружен (Яндекс.Карты)');