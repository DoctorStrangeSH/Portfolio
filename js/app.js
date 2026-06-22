// ==================== app.js ====================

window.currentSection = localStorage.getItem('currentSection') || 'travel';
window.currentSubTab = localStorage.getItem('currentSubTab') || 'wishlist';

window.initApp = async function() {
    await import('./travel/travelCards.js');
    await import('./travel/travelMap.js');
    await import('./travel/travelForm.js');
    await import('./travel/travelList.js');
    
    await import('./food/foodCards.js');
    await import('./food/foodForm.js');
    await import('./food/foodList.js');
    
    if (window.loadFriends) await window.loadFriends();
    if (window.listenFriends) window.listenFriends();
    
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
    
    document.querySelectorAll('#sectionMenu button[data-section]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === window.currentSection);
    });
    
    loadCurrentSection();
    
    // Слушаем переключение подвкладок
    document.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('button[data-bs-toggle="tab"]');
        if (tabBtn) {
            const target = tabBtn.dataset.bsTarget;
            if (target) {
                localStorage.setItem('currentSubTab', target.replace('#', ''));
            }
        }
    });
    
    console.log('✅ Все модули загружены (раздел: ' + window.currentSection + ')');
};

function loadCurrentSection() {
    const container = document.getElementById('sectionContainer');
    if (!container) return;
    
    switch (window.currentSection) {
        case 'travel':
            if (window.renderTravelSection) {
                window.renderTravelSection(container);
                // Восстанавливаем подвкладку
                setTimeout(() => {
                    restoreSubTab('travel');
                }, 600);
            }
            break;
        case 'food':
            if (window.renderFoodSection) {
                window.renderFoodSection(container);
                setTimeout(() => {
                    restoreSubTab('food');
                }, 600);
            }
            break;
        default:
            container.innerHTML = '<p class="text-center text-muted py-5">Скоро...</p>';
    }
}

function restoreSubTab(section) {
    const savedTab = localStorage.getItem('currentSubTab');
    if (!savedTab) return;
    
    // Для travel
    if (section === 'travel') {
        const tabMap = {
            'wishlist': '#travelWishlistTab',
            'visited': '#travelVisitedTab',
            'add': '#travelAddTab',
            'map': '#travelMapTab'
        };
        const selector = tabMap[savedTab] || tabMap['wishlist'];
        const tabBtn = document.querySelector(`#travelTabs button[data-bs-target="${selector}"]`);
        if (tabBtn) new bootstrap.Tab(tabBtn).show();
    }
    
    // Для food
    if (section === 'food') {
        // Сохраняем фильтр статуса как подвкладку
        if (['want', 'visited', 'favourite', 'dislike'].includes(savedTab)) {
            window.foodState.currentFilter = savedTab;
            if (window.renderFoodContent) window.renderFoodContent();
        }
    }
}

console.log('✅ app.js загружен');