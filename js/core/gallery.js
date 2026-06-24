// ==================== gallery.js v2 — Галерея с анимацией ====================

window.openGallery = function(photos, start) {
    start = start || 0;
    if (!photos || !photos.length) return;
    
    var modal = new bootstrap.Modal(document.getElementById('photoModal'));
    var mainPhoto = document.getElementById('modalMainPhoto');
    var thumbsContainer = document.getElementById('modalThumbnails');
    var index = start;
    
    function show(i) {
        index = i;
        mainPhoto.style.opacity = '0';
        mainPhoto.style.transform = 'scale(0.95)';
        
        setTimeout(function() {
            mainPhoto.src = photos[i];
            mainPhoto.style.transition = 'all 0.4s ease';
            mainPhoto.style.opacity = '1';
            mainPhoto.style.transform = 'scale(1)';
        }, 200);
        
        thumbsContainer.querySelectorAll('img').forEach(function(t, j) {
            t.classList.toggle('active-thumb', j === i);
            t.style.transform = j === i ? 'scale(1.1)' : 'scale(1)';
        });
    }
    
    thumbsContainer.innerHTML = '';
    photos.forEach(function(p, i) {
        var t = document.createElement('img');
        t.src = p;
        t.className = 'photo-thumb';
        if (i === start) { t.classList.add('active-thumb'); t.style.transform = 'scale(1.1)'; }
        t.addEventListener('click', function() { show(i); });
        t.style.transition = 'all 0.3s ease';
        thumbsContainer.appendChild(t);
    });
    
    show(start);
    modal.show();
};

// Слайдер в карточке
window.initCardSlider = function(sliderId, photos) {
    if (!photos || photos.length <= 1) return;
    
    var slider = document.getElementById(sliderId);
    if (!slider) return;
    
    var current = 0;
    var img = slider.querySelector('img');
    var dots = slider.querySelectorAll('.slider-dot');
    
    window['slide_' + sliderId] = function(dir) {
        current = (current + dir + photos.length) % photos.length;
        if (img) {
            img.style.opacity = '0';
            setTimeout(function() {
                img.src = photos[current];
                img.style.opacity = '1';
            }, 150);
        }
        dots.forEach(function(d, i) { d.classList.toggle('active', i === current); });
    };
    
    window['slideTo_' + sliderId] = function(idx) {
        current = idx;
        if (img) {
            img.style.opacity = '0';
            setTimeout(function() {
                img.src = photos[current];
                img.style.opacity = '1';
            }, 150);
        }
        dots.forEach(function(d, i) { d.classList.toggle('active', i === current); });
    };
    
    img.style.transition = 'opacity 0.3s ease';
};

console.log('✅ gallery.js v2 загружен');