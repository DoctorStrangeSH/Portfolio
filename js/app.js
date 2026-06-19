// ==================== app.js ====================

window.initApp = async function () {
    // Инициализируем звёздочки
    if (typeof window.setupStarRating === 'function') {
        window.setupStarRating(0);
    }
    
    // Загружаем друзей
    if (typeof window.loadFriends === 'function') {
        await window.loadFriends();
    }
    
    // Загружаем места
    if (typeof window.loadPlaces === 'function') {
        await window.loadPlaces();
    }
    
    // Слушаем изменения друзей
    if (typeof window.listenFriends === 'function') {
        window.listenFriends();
    }
    
    // Обработчики переключения вкладок
    document.querySelectorAll('#mainTabs button').forEach(btn => {
        btn.addEventListener('shown.bs.tab', () => {
            if (typeof window.renderAll === 'function') {
                window.renderAll();
            }
        });
    });
    
    console.log('✅ Приложение готово');
    console.log('👤 Пользователь:', window.currentUser?.displayName);
    console.log('📋 Текущий список:', window.currentList);
    console.log('👥 Друзей:', window.friends?.length || 0);
    console.log('📍 Мест:', window.places?.length || 0);
};