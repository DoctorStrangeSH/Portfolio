// ==================== stars.js ====================

window.setupStarRating = function(containerId, initial = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.value = initial;
    input.id = containerId + '_val';
    container.appendChild(input);
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.innerHTML = i <= initial ? '★' : '☆';
        star.style.cssText = `
            font-size: 1.8rem;
            cursor: pointer;
            color: ${i <= initial ? '#ffc107' : '#dee2e6'};
            transition: color 0.1s;
            user-select: none;
            line-height: 1;
        `;
        star.dataset.value = i;
        
        star.addEventListener('mouseenter', () => {
            container.querySelectorAll('span').forEach((s, idx) => {
                s.style.color = idx < i ? '#ffc107' : '#dee2e6';
                s.innerHTML = idx < i ? '★' : '☆';
            });
        });
        
        star.addEventListener('mouseleave', () => {
            const val = parseInt(input.value) || 0;
            container.querySelectorAll('span').forEach((s, idx) => {
                s.style.color = idx < val ? '#ffc107' : '#dee2e6';
                s.innerHTML = idx < val ? '★' : '☆';
            });
        });
        
        star.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            input.value = i;
            container.querySelectorAll('span').forEach((s, idx) => {
                s.style.color = idx < i ? '#ffc107' : '#dee2e6';
                s.innerHTML = idx < i ? '★' : '☆';
            });
        });
        
        container.appendChild(star);
    }
};

window.getStarRating = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return 0;
    const input = container.querySelector('input[type="hidden"]');
    return input ? parseInt(input.value) || 0 : 0;
};

window.renderStars = function(rating) {
    const r = rating || 0;
    return '<span style="color:#ffc107;font-size:1.2rem">' + '★'.repeat(r) + '☆'.repeat(5 - r) + '</span>';
};

console.log('✅ stars.js загружен');