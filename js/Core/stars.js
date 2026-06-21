// ==================== stars.js ====================
window.setupStarRating = function(containerId, initial = 0, onChange = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.value = initial;
    input.id = containerId + '_value';
    container.appendChild(input);
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = i <= initial ? 'bi bi-star-fill active' : 'bi bi-star';
        star.dataset.value = i;
        star.style.cursor = 'pointer';
        
        star.addEventListener('mouseenter', () => {
            container.querySelectorAll('i').forEach((s, idx) => {
                s.className = idx < i ? 'bi bi-star-fill active' : 'bi bi-star';
            });
        });
        
        star.addEventListener('mouseleave', () => {
            const val = parseInt(input.value) || 0;
            container.querySelectorAll('i').forEach((s, idx) => {
                s.className = idx < val ? 'bi bi-star-fill active' : 'bi bi-star';
            });
        });
        
        star.addEventListener('click', () => {
            input.value = i;
            container.querySelectorAll('i').forEach((s, idx) => {
                s.className = idx < i ? 'bi bi-star-fill active' : 'bi bi-star';
            });
            if (onChange) onChange(i);
        });
        
        container.appendChild(star);
    }
};

window.getStarRating = function(containerId) {
    const input = document.getElementById(containerId + '_value');
    return input ? parseInt(input.value) || 0 : 0;
};

window.renderStars = function(rating) {
    const f = '<i class="bi bi-star-fill active"></i>'.repeat(rating || 0);
    const e = '<i class="bi bi-star"></i>'.repeat(5 - (rating || 0));
    return `<span class="star-rating">${f}${e}</span>`;
};

console.log('✅ stars.js загружен');