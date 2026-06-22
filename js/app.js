// ==================== app.js ====================

// Восстанавливаем сохранённый раздел
window.currentSection = localStorage.getItem('currentSection') || 'travel';

window.initApp = async function() {
    // Загружаем модули разделов
    await import('./travel/travelCards.js');
    await import('./travel/travelMap.js');
    await import('./travel/travelForm.js');
    await import('./travel/travelList.js');
    
    await import('./food/foodCards.js');
    await import('./food/foodForm.js');
    await import('./food/foodList.js');
    
    // Загружаем друзей
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
    
    // Активируем нужную кнопку меню
    document.querySelectorAll('#sectionMenu button[data-section]').forEach(btn => {
        if (btn.dataset.section === window.currentSection) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Загружаем сохранённый раздел
    loadCurrentSection();
    
    console.log('✅ Все модули загружены (текущий раздел: ' + window.currentSection + ')');
};

function loadCurrentSection() {
    const container = document.getElementById('sectionContainer');
    if (!container) return;
    
    switch (window.currentSection) {
        case 'travel':
            if (window.renderTravelSection) {
                window.renderTravelSection(container);
            } else {
                container.innerHTML = '<p class="text-danger">Ошибка: travel модуль не загружен</p>';
            }
            break;
        case 'food':
            if (window.renderFoodSection) {
                window.renderFoodSection(container);
            } else {
                container.innerHTML = '<p class="text-danger">Ошибка: food модуль не загружен</p>';
            }
            break;
        default:
            container.innerHTML = '<p class="text-center text-muted py-5">Скоро...</p>';
    }
}

console.log('✅ app.js загружен');