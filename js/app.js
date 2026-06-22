// ==================== app.js ====================
window.currentSection = 'travel';

window.initApp = async function() {
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
            if (window.renderTravelSection) {
                window.renderTravelSection(container);
            }
            break;
        case 'food':
            if (window.renderFoodSection) {
                window.renderFoodSection(container);
            }
            break;
        default:
            container.innerHTML = '<p class="text-center text-muted py-5">Скоро...</p>';
    }
}

console.log('✅ app.js загружен');