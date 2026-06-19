// ==================== app.js ====================
// Точка входа в приложение

window.initApp = async function () {
    // Настраиваем звёздочки
    window.setupStarRating(0);
    
    // Настраиваем форму
    window.setupForm();
    
    // Загружаем друзей
    await window.loadFriends();
    
    // Загружаем места
    await window.loadPlaces();
    
    // Обновление при переключении вкладок
    document.querySelectorAll('#travelTabs button').forEach(btn => {
        btn.addEventListener('shown.bs.tab', () => {
            window.renderAll();
        });
    });
};

// Функция renderAll должна быть доступна глобально
window.renderAll = function () {
    if (window.renderAllCallback) {
        window.renderAllCallback();
    }
};