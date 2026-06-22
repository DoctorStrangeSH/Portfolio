// ==================== stars.js ====================

// Создаёт звёзды в контейнере
window.setupStarRating = function(containerId, initial = 0, onChange = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаём скрытый инпут для хранения значения
    const input = document.createElement('input');
    input.type = 'hidden';
    input.value = initial;
    input.id = containerId + '_value';
    input.className = 'star-rating-value';
    container.appendChild(input);
    
    // Создаём 5 звёзд
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = i <= initial ? 'bi bi-star-fill active' : 'bi bi-star';
        star.dataset.value = i;
        star.style.cursor = 'pointer';
        star.style.fontSize = '1.3rem';
        
        // Наведение
        star.addEventListener('mouseenter', () => {
            container.querySelectorAll('i').forEach((s, idx) => {
                s.className = idx < i ? 'bi bi-star-fill active' : 'bi bi-star';
            });
        });
        
        // Уход курсора — возвращаем сохранённое значение
        star.addEventListener('mouseleave', () => {
            const val = parseInt(input.value) || 0;
            container.querySelectorAll('i').forEach((s, idx) => {
                s.className = idx < val ? 'bi bi-star-fill active' : 'bi bi-star';
            });
        });
        
        // Клик — сохраняем значение
        star.addEventListener('click', () => {
            input.value = i;
            container.querySelectorAll('i').forEach((s, idx) => {
                s.className = idx < i ? 'bi bi-star-fill active' : 'bi bi-star';
            });
            // Вызываем callback если есть
            if (onChange) onChange(i);
        });
        
        container.appendChild(star);
    }
    
    console.log('⭐ Звёзды созданы в', containerId, 'начальное значение:', initial);
};

// Получить значение звёзд
window.getStarRating = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return 0;
    
    // Ищем скрытый инпут внутри контейнера
    const input = container.querySelector('input[type="hidden"]');
    if (input) {
        return parseInt(input.value) || 0;
    }
    
    // Запасной вариант — считаем активные звёзды
    const activeStars = container.querySelectorAll('i.bi-star-fill.active').length;
    return activeStars;
};

// Отобразить звёзды (статичные, без интерактива)
window.renderStars = function(rating) {
    const filled = '<i class="bi bi-star-fill active"></i>'.repeat(rating || 0);
    const empty = '<i class="bi bi-star"></i>'.repeat(5 - (rating || 0));
    return `<span class="star-rating">${filled}${empty}</span>`;
};

console.log('✅ stars.js загружен');