// ==================== app.js ====================

window.currentSection = localStorage.getItem('currentSection') || 'travel';

window.initApp = async function() {
    try {
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
        
        if (window.loadFriends) await window.loadFriends();
        if (window.listenUnreadMessages) window.listenUnreadMessages();
        if (window.listenFriends) window.listenFriends();
        
        document.querySelectorAll('#sectionMenu button[data-section]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (btn.classList.contains('disabled')) return;
                document.querySelectorAll('#sectionMenu button').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                window.currentSection = btn.dataset.section;
                localStorage.setItem('currentSection', window.currentSection);
                loadCurrentSection();
            });
        });
        
        document.querySelectorAll('#sectionMenu button[data-section]').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.section === window.currentSection);
        });
        
        loadCurrentSection();
        
        console.log('✅ Приложение готово (раздел: ' + window.currentSection + ')');
    } catch (e) {
        console.error('❌ Ошибка инициализации:', e);
    }
};

function loadCurrentSection() {
    var container = document.getElementById('sectionContainer');
    if (!container) return;
    
    console.log('📂 Загружаем раздел:', window.currentSection);
    
    switch (window.currentSection) {
        case 'travel':
            if (window.renderTravelSection) window.renderTravelSection(container);
            else container.innerHTML = '<p class="text-center text-danger py-5">Ошибка загрузки путешествий</p>';
            break;
        case 'food':
            if (window.renderFoodSection) window.renderFoodSection(container);
            else container.innerHTML = '<p class="text-center text-danger py-5">Ошибка загрузки ресторанов</p>';
            break;
        case 'movies':
            if (window.renderMoviesSection) window.renderMoviesSection(container);
            else container.innerHTML = '<p class="text-center text-danger py-5">Ошибка загрузки кино</p>';
            break;
        case 'dreams':
            if (window.renderDreamsSection) window.renderDreamsSection(container);
            else container.innerHTML = '<p class="text-center text-danger py-5">Ошибка загрузки мечт</p>';
            break;
            case 'shared':
            if (window.renderSharedSection) window.renderSharedSection(container);
            break;
        default:
            container.innerHTML = '<p class="text-center text-muted py-5">Скоро...</p>';
    }
}

console.log('✅ app.js загружен');