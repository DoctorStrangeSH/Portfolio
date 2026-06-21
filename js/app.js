// ==================== app.js ====================

window.initApp = async function () {
    if (typeof window.setupStarRating === 'function') {
        window.setupStarRating(0);
    }
    
    if (typeof window.loadFriends === 'function') {
        await window.loadFriends();
    }
    
    if (typeof window.loadPlaces === 'function') {
        await window.loadPlaces();
    }
    
    if (typeof window.listenFriends === 'function') {
        window.listenFriends();
    }
    
    // Инициализация карты
    if (typeof window.initMap === 'function') {
        window.initMap();
    }
    
    // Кнопка карты в навигации
    document.getElementById('mapViewBtn')?.addEventListener('click', () => {
        const mapTab = document.querySelector('#mainTabs button[data-bs-target="#mapTab"]');
        if (mapTab) {
            new bootstrap.Tab(mapTab).show();
            setTimeout(() => {
                if (window.map) window.map.invalidateSize();
            }, 300);
        }
    });
    
    document.querySelectorAll('#mainTabs button').forEach(btn => {
        btn.addEventListener('shown.bs.tab', (e) => {
            if (e.target.dataset.bsTarget === '#mapTab') {
                setTimeout(() => {
                    if (window.map) window.map.invalidateSize();
                    if (typeof window.renderMapMarkers === 'function') {
                        window.renderMapMarkers();
                    }
                }, 300);
            }
            if (typeof window.renderAll === 'function' && e.target.dataset.bsTarget !== '#mapTab') {
                window.renderAll();
            }
        });
    });
    
    console.log('✅ Приложение готово (карта, дневник, бюджет, слайдер)');
};