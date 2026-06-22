// ==================== app.js ====================

window.currentSection = localStorage.getItem('currentSection') || 'travel';

window.initApp = async function() {
    try {
        // Загружаем модули
        await import('./travel/travelCards.js');
        await import('./travel/travelMap.js');
        await import('./travel/travelForm.js');
        await import('./travel/travelList.js');
        
        await import('./food/foodCards.js');
        await import('./food/foodForm.js');
        await import('./food/foodList.js');
        
        // Друзья
        if (window.loadFriends) await window.loadFriends();
        if (window.listenFriends) window.listenFriends();
        
        // Меню разделов
        document.querySelectorAll('#sectionMenu button[data-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                document.querySelectorAll('#sectionMenu button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.currentSection = btn.dataset.section;
                localStorage.setItem('currentSection', window.currentSection);
                loadCurrentSection();
            });
        });
        
        // Активируем нужную кнопку
        document.querySelectorAll('#sectionMenu button[data-section]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === window.currentSection);
        });
        
        // Загружаем раздел
        loadCurrentSection();
        
        console.log('✅ Приложение готово (раздел: ' + window.currentSection + ')');
    } catch (e) {
        console.error('❌ Ошибка инициализации:', e);
    }
};

function loadCurrentSection() {
    const container = document.getElementById('sectionContainer');
    if (!container) return;
    
    console.log('📂 Загружаем раздел:', window.currentSection);
    
    switch (window.currentSection) {
        case 'travel':
            if (window.renderTravelSection) {
                window.renderTravelSection(container);
            } else {
                container.innerHTML = '<p class="text-center text-danger py-5">Ошибка загрузки путешествий</p>';
            }
            break;
        case 'food':
            if (window.renderFoodSection) {
                window.renderFoodSection(container);
            } else {
                container.innerHTML = '<p class="text-center text-danger py-5">Ошибка загрузки ресторанов</p>';
            }
            break;
        default:
            container.innerHTML = '<p class="text-center text-muted py-5">Скоро...</p>';
    }
}

console.log('✅ app.js загружен');