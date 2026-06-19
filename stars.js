// ==================== stars.js ====================
// Компонент звёздочек рейтинга

function setupStarRating(initialRating = 0) {
    const container = document.getElementById('starRating');
    const ratingInput = document.getElementById('ratingInput');
    
    if (!container || !ratingInput) {
        return;
    }
    
    container.innerHTML = '';
    ratingInput.value = initialRating;
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = i <= initialRating ? 'bi bi-star-fill active' : 'bi bi-star';
        star.dataset.value = i;
        star.style.cursor = 'pointer';
        
        star.addEventListener('mouseenter', () => {
            updateStars(container, i);
        });
        
        star.addEventListener('mouseleave', () => {
            updateStars(container, parseInt(ratingInput.value) || 0);
        });
        
        star.addEventListener('click', () => {
            ratingInput.value = i;
            updateStars(container, i);
        });
        
        container.appendChild(star);
    }
}

function updateStars(container, count) {
    const stars = container.querySelectorAll('i');
    
    stars.forEach((star, index) => {
        if (index < count) {
            star.className = 'bi bi-star-fill active';
        } else {
            star.className = 'bi bi-star';
        }
    });
}

// Делаем функцию глобальной (для вызова из других модулей)
window.setupStarRating = setupStarRating;