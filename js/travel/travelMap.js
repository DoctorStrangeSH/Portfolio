// ==================== travelMap.js ====================
window.travelMap = null;
window.travelMarkers = [];

window.initTravelMap = function() {
    const container = document.getElementById('travelMapContainer');
    if (!container || window.travelMap) return;
    
    window.travelMap = L.map('travelMapContainer').setView([55.76, 37.62], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(window.travelMap);
    
    // Обновить карту при переключении вкладки
    document.querySelector('#travelTabs button[data-bs-target="#travelMapTab"]')?.addEventListener('shown.bs.tab', () => {
        setTimeout(() => {
            window.travelMap?.invalidateSize();
            renderTravelMarkers();
        }, 300);
    });
    
    renderTravelMarkers();
};

async function renderTravelMarkers() {
    if (!window.travelMap) return;
    window.travelMarkers.forEach(m => window.travelMap.removeLayer(m));
    window.travelMarkers = [];
    
    const places = window.travelState.places || [];
    for (const place of places) {
        if (place.location) {
            try {
                const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place.location)}&limit=1`);
                const data = await resp.json();
                if (data.length > 0) {
                    const marker = L.marker([parseFloat(data[0].lat), parseFloat(data[0].lon)])
                        .addTo(window.travelMap)
                        .bindPopup(`<strong>${place.name}</strong><br>${place.description || ''}`);
                    window.travelMarkers.push(marker);
                }
            } catch (e) {}
        }
    }
}

console.log('✅ travelMap.js загружен');