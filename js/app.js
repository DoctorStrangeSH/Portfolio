// ==================== app.js ====================
window.currentSection = 'travel';

// Загруженные модули разделов
const sectionModules = {
    travel: null,
    food: null
};

window.initApp = async function() {
    // Загружаем модули разделов
    sectionModules.travel = await import('./travel/travelList.js');
    sectionModules.food = await import('./food/foodList.js');
    
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
            loadCurrentSection();
        });
    });
    
    // Загружаем раздел по умолчанию
    loadCurrentSection();
};

function loadCurrentSection() {
    const container = document.getElementById('sectionContainer');
    if (!container) return;
    
    switch (window.currentSection) {
        case 'travel':
            if (sectionModules.travel?.renderTravelSection) {
                sectionModules.travel.renderTravelSection(container);
            }
            break;
        case 'food':
            if (sectionModules.food?.renderFoodSection) {
                sectionModules.food.renderFoodSection(container);
            }
            break;
        default:
            container.innerHTML = '<p class="text-center text-muted py-5">Скоро...</p>';
    }
}

console.log('✅ app.js загружен');