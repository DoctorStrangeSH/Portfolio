// ==================== gallery.js ====================
window.openGallery = function(photos, start = 0) {
    if (!photos?.length) return;
    const modal = new bootstrap.Modal(document.getElementById('photoModal'));
    const mainPhoto = document.getElementById('modalMainPhoto');
    const thumbsContainer = document.getElementById('modalThumbnails');
    let index = start;
    
    function show(i) {
        index = i;
        mainPhoto.src = photos[i];
        thumbsContainer.querySelectorAll('img').forEach((t, j) => t.classList.toggle('active-thumb', j === i));
    }
    
    thumbsContainer.innerHTML = '';
    photos.forEach((p, i) => {
        const t = document.createElement('img');
        t.src = p; t.className = 'photo-thumb';
        if (i === start) t.classList.add('active-thumb');
        t.addEventListener('click', () => show(i));
        thumbsContainer.appendChild(t);
    });
    
    show(start);
    modal.show();
};

// Слайдер в карточке
window.initCardSlider = function(sliderId, photos) {
    if (!photos || photos.length <= 1) return;
    
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    
    let current = 0;
    const img = slider.querySelector('img');
    const dots = slider.querySelectorAll('.slider-dot');
    
    window[`slide_${sliderId}`] = function(dir) {
        current = (current + dir + photos.length) % photos.length;
        if (img) img.src = photos[current];
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
    };
    
    window[`slideTo_${sliderId}`] = function(idx) {
        current = idx;
        if (img) img.src = photos[current];
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
    };
};

console.log('✅ gallery.js загружен');