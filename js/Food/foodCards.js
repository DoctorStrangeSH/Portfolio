// ==================== foodCards.js ====================

window.createFoodCard = function(place, index) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in-up';
    col.style.animationDelay = `${index * 0.04}s`;
    
    const cuisine = window.CUISINE_TYPES[place.cuisine] || window.CUISINE_TYPES.other;
    const priceStr = window.formatPrice(place.price);
    const priceClass = `price-${place.price || 1}`;
    
    const photos = place.photos || [];
    const mainPhoto = photos.length > 0 ? photos[0] : 'https://placehold.co/400x200/e2e8f0/64748b?text=Нет+фото';
    const photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');
    
    // Статусные бейджи
    let statusBadge = '';
    if (place.status === 'favourite') {
        statusBadge = '<span class="visit-again-badge">⭐ Любимое</span>';
    } else if (place.status === 'dislike') {
        statusBadge = '<span class="visit-again-badge" style="background:rgba(220,53,69,0.9)">👎 Не понравилось</span>';
    }
    
    // Кнопки быстрого действия
    let quickActions = '';
    if (place.status === 'want') {
        quickActions = `
            <button class="btn btn-sm btn-outline-success food-mark-btn" data-id="${place._firestoreId}" data-status="visited"><i class="bi bi-check-lg"></i> Был</button>
            <button class="btn btn-sm btn-outline-warning food-mark-btn" data-id="${place._firestoreId}" data-status="favourite"><i class="bi bi-star"></i> Любимое</button>
            <button class="btn btn-sm btn-outline-danger food-mark-btn" data-id="${place._firestoreId}" data-status="dislike"><i class="bi bi-hand-thumbs-down"></i></button>
        `;
    } else if (place.status === 'visited') {
        quickActions = `
            <button class="btn btn-sm btn-outline-warning food-mark-btn" data-id="${place._firestoreId}" data-status="favourite"><i class="bi bi-star"></i> В любимые</button>
            <button class="btn btn-sm btn-outline-danger food-mark-btn" data-id="${place._firestoreId}" data-status="dislike"><i class="bi bi-hand-thumbs-down"></i></button>
        `;
    } else if (place.status === 'favourite' || place.status === 'dislike') {
        quickActions = `
            <button class="btn btn-sm btn-outline-secondary food-mark-btn" data-id="${place._firestoreId}" data-status="visited"><i class="bi bi-arrow-repeat"></i> Переместить</button>
        `;
    }
    
    col.innerHTML = `
        <div class="card h-100 shadow-sm restaurant-card mb-3 position-relative">
            ${statusBadge}
            <span class="food-type-badge position-absolute" style="top:10px;right:10px;z-index:3">${cuisine}</span>
            <img src="${mainPhoto}" class="card-img-top" alt="${place.name}" ${photos.length>0?`onclick="window.openGallery(${photosJson},0)" style="cursor:pointer"`:''}>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${place.name}</h5>
                <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="price-badge ${priceClass}">${priceStr}</span>
                    ${window.renderStars(place.rating)}
                </div>
                <p class="card-text text-muted small flex-grow-1">${place.description || ''}</p>
                ${place.address ? `<small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${place.address}</small>` : ''}
                ${place.bestDish ? `<small class="text-muted d-block"><i class="bi bi-star me-1"></i>Что заказать: ${place.bestDish}</small>` : ''}
                ${place.date ? `<small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${place.date}</small>` : ''}
                <div class="mt-2 d-flex gap-1 flex-wrap">
                    ${quickActions}
                    <button class="btn btn-sm btn-outline-info food-detail-btn" data-id="${place._firestoreId}"><i class="bi bi-info-circle"></i></button>
                    <button class="btn btn-sm btn-outline-warning food-edit-btn" data-id="${place._firestoreId}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger food-del-btn" data-id="${place._firestoreId}"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>`;
    
    return col;
};

window.attachFoodHandlers = function() {
    // Быстрая смена статуса
    document.querySelectorAll('.food-mark-btn').forEach(b => {
        b.onclick = async () => {
            await window.updateDoc(window.doc(window.db, window.getFoodCollection(), b.dataset.id), {
                status: b.dataset.status,
                date: b.dataset.status === 'visited' ? new Date().toISOString().split('T')[0] : undefined
            });
            window.loadFoodPlaces();
        };
    });
    
    // Редактировать
    document.querySelectorAll('.food-edit-btn').forEach(b => {
        b.onclick = () => {
            const p = window.foodState.places.find(x => x._firestoreId === b.dataset.id);
            if (p) {
                const wrapper = document.getElementById('foodFormWrapper');
                wrapper.classList.remove('d-none');
                window.renderFoodForm(p);
            }
        };
    });
    
    // Удалить
    document.querySelectorAll('.food-del-btn').forEach(b => {
        b.onclick = async () => {
            const p = window.foodState.places.find(x => x._firestoreId === b.dataset.id);
            if (!confirm(`Удалить "${p?.name || 'ресторан'}"?`)) return;
            await window.deleteDoc(window.doc(window.db, window.getFoodCollection(), b.dataset.id));
            window.loadFoodPlaces();
        };
    });
    
    // Детали
    document.querySelectorAll('.food-detail-btn').forEach(b => {
        b.onclick = () => {
            const p = window.foodState.places.find(x => x._firestoreId === b.dataset.id);
            if (!p) return;
            document.getElementById('detailTitle').textContent = '🍽️ ' + p.name;
            document.getElementById('detailBody').innerHTML = `
                <p><strong>Кухня:</strong> ${window.CUISINE_TYPES[p.cuisine] || '—'}</p>
                <p><strong>Чек:</strong> ${window.formatPrice(p.price)}</p>
                <p><strong>Адрес:</strong> ${p.address || '—'}</p>
                <p><strong>Оценка:</strong> ${window.renderStars(p.rating)}</p>
                <p><strong>Описание:</strong> ${p.description || '—'}</p>
                <p><strong>Что заказать:</strong> ${p.bestDish || '—'}</p>
                <p><strong>Дата посещения:</strong> ${p.date || '—'}</p>
                ${p.notes ? `<hr><h6>📝 Заметки</h6><p>${p.notes}</p>` : ''}
            `;
            new bootstrap.Modal(document.getElementById('placeDetailModal')).show();
        };
    });
};

console.log('✅ foodCards.js загружен');