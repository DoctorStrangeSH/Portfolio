// ==================== stars.js v2 — Анимированные звёзды ====================

window.setupStarRating = function(containerId, initial) {
    initial = initial || 0;
    var container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.cssText = 'display:flex;gap:6px;align-items:center;';
    
    var input = document.createElement('input');
    input.type = 'hidden';
    input.value = initial;
    input.id = containerId + '_val';
    container.appendChild(input);
    
    for (var i = 1; i <= 5; i++) {
        var star = document.createElement('span');
        star.innerHTML = i <= initial ? '★' : '☆';
        star.style.cssText = [
            'font-size: 2.2rem',
            'cursor: pointer',
            'color: ' + (i <= initial ? '#ffc107' : '#dee2e6'),
            'transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            'user-select: none',
            'line-height: 1',
            'text-shadow: ' + (i <= initial ? '0 0 12px rgba(255,193,7,0.5)' : 'none')
        ].join(';');
        star.dataset.value = i;
        star.title = i + ' из 5';
        
        star.addEventListener('mouseenter', function() {
            container.querySelectorAll('span').forEach(function(s, idx) {
                var active = idx < i;
                s.style.color = active ? '#ffc107' : '#dee2e6';
                s.innerHTML = active ? '★' : '☆';
                s.style.textShadow = active ? '0 0 12px rgba(255,193,7,0.5)' : 'none';
                s.style.transform = active ? 'scale(1.2)' : 'scale(1)';
            });
        });
        
        star.addEventListener('mouseleave', function() {
            var val = parseInt(input.value) || 0;
            container.querySelectorAll('span').forEach(function(s, idx) {
                var active = idx < val;
                s.style.color = active ? '#ffc107' : '#dee2e6';
                s.innerHTML = active ? '★' : '☆';
                s.style.textShadow = active ? '0 0 12px rgba(255,193,7,0.5)' : 'none';
                s.style.transform = 'scale(1)';
            });
        });
        
        star.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            input.value = i;
            container.querySelectorAll('span').forEach(function(s, idx) {
                var active = idx < i;
                s.style.color = active ? '#ffc107' : '#dee2e6';
                s.innerHTML = active ? '★' : '☆';
                s.style.textShadow = active ? '0 0 12px rgba(255,193,7,0.5)' : 'none';
                s.style.transform = active ? 'scale(1.3)' : 'scale(1)';
                setTimeout(function() { s.style.transform = 'scale(1)'; }, 200);
            });
        });
        
        container.appendChild(star);
    }
};

window.getStarRating = function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return 0;
    var input = container.querySelector('input[type="hidden"]');
    return input ? parseInt(input.value) || 0 : 0;
};

window.renderStars = function(rating) {
    var r = rating || 0;
    var html = '';
    for (var i = 1; i <= 5; i++) {
        html += '<span style="color:' + (i <= r ? '#ffc107' : '#dee2e6') + ';font-size:1.4rem;text-shadow:' + (i <= r ? '0 0 6px rgba(255,193,7,0.4)' : 'none') + '">' + (i <= r ? '★' : '☆') + '</span>';
    }
    return html;
};

console.log('✅ stars.js v2 загружен');