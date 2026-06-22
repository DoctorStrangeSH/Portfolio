// ==================== stars.js ====================

window.setupStarRating = function(containerId, initial = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.cssText = 'display:flex;gap:4px;align-items:center;';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.value = initial;
    input.id = containerId + '_val';
    container.appendChild(input);
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.innerHTML = i <= initial ? '★' : '☆';
        star.style.cssText = `
            font-size: 2rem;
            cursor: pointer;
            color: ${i <= initial ? '#ffc107' : '#dee2e6'};
            transition: all 0.15s ease;
            user-select: none;
            line-height: 1;
            text-shadow: ${i <= initial ? '0 0 8px rgba(255,193,7,0.4)' : 'none'};
        `;
        star.dataset.value = i;
        star.title = `${i} из 5`;
        
        star.addEventListener('mouseenter', () => {
            container.querySelectorAll('span').forEach((s, idx) => {
                s.style.color = idx < i ? '#ffc107' : '#dee2e6';
                s.innerHTML = idx < i ? '★' : '☆';
                s.style.textShadow = idx < i ? '0 0 8px rgba(255,193,7,0.4)' : 'none';
                s.style.transform = idx < i ? 'scale(1.15)' : 'scale(1)';
            });
        });
        
        star.addEventListener('mouseleave', () => {
            const val = parseInt(input.value) || 0;
            container.querySelectorAll('span').forEach((s, idx) => {
                s.style.color = idx < val ? '#ffc107' : '#dee2e6';
                s.innerHTML = idx < val ? '★' : '☆';
                s.style.textShadow = idx < val ? '0 0 8px rgba(255,193,7,0.4)' : 'none';
                s.style.transform = 'scale(1)';
            });
        });
        
        star.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            input.value = i;
            container.querySelectorAll('span').forEach((s, idx) => {
                const active = idx < i;
                s.style.color = active ? '#ffc107' : '#dee2e6';
                s.innerHTML = active ? '★' : '☆';
                s.style.textShadow = active ? '0 0 8px rgba(255,193,7,0.4)' : 'none';
                s.style.transform = active ? 'scale(1.15)' : 'scale(1)';
                setTimeout(() => { s.style.transform = 'scale(1)'; }, 150);
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
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= r) {
            stars.push('<span style="color:#ffc107;font-size:1.3rem;text-shadow:0 0 4px rgba(255,193,7,0.3)">★</span>');
        } else {
            stars.push('<span style="color:#dee2e6;font-size:1.3rem">☆</span>');
        }
    }
    return stars.join('');
};

console.log('✅ stars.js загружен (крупные звёзды с анимацией)');