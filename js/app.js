// ==================== app.js v3 — Dream & Go ====================

window.currentSection = localStorage.getItem('currentSection') || 'travel';

window.initApp = async function() {
    try {
        // Загружаем модули разделов
        await import('./travel/travelCards.js');
        await import('./travel/travelMap.js');
        await import('./travel/travelForm.js');
        await import('./travel/travelList.js');
        
        await import('./food/foodCards.js');
        await import('./food/foodForm.js');
        await import('./food/foodList.js');
        
        await import('./movies/moviesCards.js');
        await import('./movies/moviesList.js');
        
        await import('./dreams/dreamsCards.js');
        await import('./dreams/dreamsList.js');
        
        // Загружаем друзей
        if (window.loadFriends) await window.loadFriends();
        if (window.listenFriends) window.listenFriends();
        if (window.listenUnreadMessages) window.listenUnreadMessages();
        
        // Анимируем меню разделов
        var menuItems = document.querySelectorAll('#sectionMenu button[data-section]');
        menuItems.forEach(function(btn, i) {
            btn.style.animationDelay = (i * 0.05) + 's';
            btn.classList.add('slide-in');
            
            btn.addEventListener('click', function() {
                if (btn.classList.contains('disabled')) return;
                
                // Анимация переключения
                var container = document.getElementById('sectionContainer');
                if (container) {
                    container.style.opacity = '0';
                    container.style.transform = 'translateY(10px)';
                }
                
                menuItems.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                
                window.currentSection = btn.dataset.section;
                localStorage.setItem('currentSection', window.currentSection);
                
                setTimeout(function() {
                    loadCurrentSection();
                    if (container) {
                        container.style.transition = 'all 0.3s ease';
                        container.style.opacity = '1';
                        container.style.transform = 'translateY(0)';
                    }
                }, 150);
            });
        });
        
        // Активируем нужную кнопку
        menuItems.forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.section === window.currentSection);
        });
        
        loadCurrentSection();
        
        console.log('✨ Dream & Go готов (раздел: ' + window.currentSection + ')');
    } catch (e) {
        console.error('❌ Ошибка:', e);
    }
};

function loadCurrentSection() {
    var container = document.getElementById('sectionContainer');
    if (!container) return;
    
    switch (window.currentSection) {
        case 'travel':
            if (window.renderTravelSection) window.renderTravelSection(container);
            break;
        case 'food':
            if (window.renderFoodSection) window.renderFoodSection(container);
            break;
        case 'movies':
            if (window.renderMoviesSection) window.renderMoviesSection(container);
            break;
        case 'dreams':
            if (window.renderDreamsSection) window.renderDreamsSection(container);
            break;
        case 'shared':
            if (window.renderSharedSection) window.renderSharedSection(container);
            break;
        default:
            container.innerHTML = '<div class="text-center py-5 fade-in"><i class="bi bi-hourglass-split text-muted" style="font-size:4rem"></i><p class="text-muted mt-3">Скоро...</p></div>';
    }
}

console.log('✅ app.js v3 загружен');