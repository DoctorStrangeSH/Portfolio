// ==================== places.js ====================
// Управление местами (карточки, галерея, форма)

window.places = [];

async function loadPlaces() {
    try {
        window.places = await window.API.getPlaces(window.currentList);
        renderAll();
    } catch (error) {
        console.error('Ошибка загрузки мест:', error);
    }
}

function renderAll() {
    const wishlist = window.places.filter(p => p.status === 'want');
    const visited = window.places.filter(p => p.status === 'visited');
    
    renderPlaces('wishlistContainer', wishlist, 'wishlistEmpty');
    renderPlaces('visitedContainer', visited, 'visitedEmpty');
}

function renderPlaces(containerId, placesArray, emptyId) {
    const container = document.getElementById(containerId);
    const emptyMsg = document.getElementById(emptyId);
    
    if (!container || !emptyMsg) {
        return;
    }
    
    container.innerHTML = '';
    
    if (placesArray.length === 0) {
        emptyMsg.classList.remove('d-none');
        return;
    }
    
    emptyMsg.classList.add('d-none');
    
    placesArray.forEach(place => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';
        
        // Приоритет
        let priorityClass = '';
        let priorityEmoji = '';
        
        if (place.priority === 'high') {
            priorityClass = 'priority-high';
            priorityEmoji = '🔥';
        } else if (place.priority === 'medium') {
            priorityClass = 'priority-medium';
            priorityEmoji = '🙂';
        } else {
            priorityClass = 'priority-low';
            priorityEmoji = '💭';
        }
        
        // Фото
        const photos = place.photos || [];
        const mainImg = photos.length > 0 
            ? photos[0] 
            : 'https://placehold.co/400x200/e2e8f0/64748b?text=Нет+фото';
        
        // Миниатюры
        let thumbsHTML = '';
        
        if (photos.length > 1) {
            thumbsHTML = '<div class="d-flex gap-1 mt-2 flex-wrap">';
            
            photos.forEach((photo, index) => {
                thumbsHTML += `<img src="${photo}" class="photo-thumb" 
                    onclick="event.stopPropagation(); openPhotoGallery(${JSON.stringify(photos).replace(/"/g, '&quot;')}, ${index})" 
                    title="Просмотреть фото">`;
            });
            
            thumbsHTML += '</div>';
        }
        
        // Альбом
        let albumHTML = '';
        
        if (place.album) {
            albumHTML = `<a href="${place.album}" target="_blank" class="btn btn-sm btn-outline-info mt-2 w-100">
                <i class="bi bi-images"></i> Смотреть все фото
            </a>`;
        }
        
        // Звёзды
        let starsHTML = '';
        
        if (place.status === 'visited') {
            const filledStars = '<i class="bi bi-star-fill active"></i>'.repeat(place.rating || 0);
            const emptyStars = '<i class="bi bi-star"></i>'.repeat(5 - (place.rating || 0));
            
            starsHTML = `
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <small class="text-muted">📅 ${place.date || ''}</small>
                    <span class="star-rating">${filledStars}${emptyStars}</span>
                </div>`;
        }
        
        // Автор (для совместных списков)
        let authorHTML = '';
        
        if (place.author && window.currentList !== 'my') {
            authorHTML = `<small class="text-muted">✍️ ${place.author}</small>`;
        }
        
        // Кнопка "Был здесь"
        let markButtonHTML = '';
        
        if (place.status === 'want') {
            markButtonHTML = `<button class="btn btn-sm btn-outline-success" 
                onclick="markAsVisited('${place.id}')">
                <i class="bi bi-check-lg"></i> Был здесь
            </button>`;
        }
        
        // Собираем карточку
        col.innerHTML = `
            <div class="card h-100 shadow-sm ${priorityClass}">
                <img src="${mainImg}" class="card-img-top" alt="${place.name}"
                    ${photos.length > 0 ? `onclick="openPhotoGallery(${JSON.stringify(photos).replace(/"/g, '&quot;')}, 0)" style="cursor:pointer"` : ''}>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${priorityEmoji} ${place.name}</h5>
                    ${authorHTML}
                    <p class="card-text text-muted small flex-grow-1">${place.description || ''}</p>
                    ${thumbsHTML}
                    ${starsHTML}
                    ${albumHTML}
                    <div class="mt-2 d-flex gap-1">
                        ${markButtonHTML}
                        <button class="btn btn-sm btn-outline-warning" onclick="editPlace('${place.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deletePlaceById('${place.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        
        container.appendChild(col);
    });
}

// Отметить как посещённое
async function markAsVisited(placeId) {
    const place = window.places.find(p => p.id === placeId);
    
    if (!place) {
        return;
    }
    
    const updatedData = {
        ...place,
        status: 'visited',
        date: new Date().toISOString().split('T')[0],
        rating: 0
    };
    
    try {
        await window.API.updatePlace(window.currentList, placeId, updatedData);
        await loadPlaces();
    } catch (error) {
        alert('Ошибка при обновлении');
    }
}

// Удалить место
async function deletePlaceById(placeId) {
    if (!confirm('Удалить это место?')) {
        return;
    }
    
    try {
        await window.API.deletePlace(window.currentList, placeId);
        await loadPlaces();
    } catch (error) {
        alert('Ошибка при удалении');
    }
}

// Редактировать место
function editPlace(placeId) {
    const place = window.places.find(p => p.id === placeId);
    
    if (!place) {
        return;
    }
    
    // Заполняем форму
    document.getElementById('editId').value = place.id;
    document.getElementById('nameInput').value = place.name;
    document.getElementById('photosInput').value = (place.photos || []).join(', ');
    document.getElementById('albumInput').value = place.album || '';
    document.getElementById('descInput').value = place.description || '';
    document.getElementById('priorityInput').value = place.priority;
    document.getElementById('statusInput').value = place.status;
    
    // Меняем заголовок
    document.getElementById('formTitle').textContent = '✏️ Редактировать место';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-check-lg"></i> Сохранить';
    document.getElementById('cancelEditBtn').classList.remove('d-none');
    
    // Поля для посещённых
    const visitedFields = document.getElementById('visitedFields');
    
    if (place.status === 'visited') {
        visitedFields.classList.remove('d-none');
        document.getElementById('dateInput').value = place.date || '';
        window.setupStarRating(place.rating || 0);
    } else {
        visitedFields.classList.add('d-none');
        window.setupStarRating(0);
    }
    
    // Переключаемся на вкладку добавления
    const addTabBtn = document.querySelector('#travelTabs button[data-bs-target="#addForm"]');
    
    if (addTabBtn) {
        new bootstrap.Tab(addTabBtn).show();
    }
}

// Галерея фото
function openPhotoGallery(photos, startIndex = 0) {
    if (!photos || !photos.length) {
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('photoModal'));
    const mainPhoto = document.getElementById('modalMainPhoto');
    const thumbnailsContainer = document.getElementById('modalThumbnails');
    
    let currentIndex = startIndex;
    
    function showPhoto(index) {
        currentIndex = index;
        mainPhoto.src = photos[index];
        
        thumbnailsContainer.querySelectorAll('img').forEach((thumb, i) => {
            thumb.classList.toggle('active-thumb', i === index);
        });
    }
    
    thumbnailsContainer.innerHTML = '';
    
    photos.forEach((photo, index) => {
        const thumb = document.createElement('img');
        thumb.src = photo;
        thumb.className = 'photo-thumb';
        
        if (index === startIndex) {
            thumb.classList.add('active-thumb');
        }
        
        thumb.addEventListener('click', () => showPhoto(index));
        thumbnailsContainer.appendChild(thumb);
    });
    
    showPhoto(startIndex);
    modal.show();
}

// Обработка формы
function setupForm() {
    const form = document.getElementById('placeForm');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const statusSelect = document.getElementById('statusInput');
    const visitedFields = document.getElementById('visitedFields');
    
    if (!form) {
        return;
    }
    
    // Статус: показать/скрыть дату и рейтинг
    statusSelect.addEventListener('change', function () {
        if (this.value === 'visited') {
            visitedFields.classList.remove('d-none');
            window.setupStarRating(parseInt(document.getElementById('ratingInput').value) || 0);
        } else {
            visitedFields.classList.add('d-none');
        }
    });
    
    // Отмена редактирования
    cancelBtn.addEventListener('click', resetForm);
    
    // Отправка формы
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const editId = document.getElementById('editId').value;
        const name = document.getElementById('nameInput').value.trim();
        
        if (!name) {
            alert('Введите название места!');
            return;
        }
        
        const photosRaw = document.getElementById('photosInput').value.trim();
        const photos = photosRaw 
            ? photosRaw.split(',').map(s => s.trim()).filter(s => s.length > 0) 
            : [];
        
        const status = document.getElementById('statusInput').value;
        
        const placeData = {
            name: name,
            photos: photos,
            album: document.getElementById('albumInput').value.trim() || '',
            description: document.getElementById('descInput').value.trim(),
            priority: document.getElementById('priorityInput').value,
            status: status,
            date: status === 'visited' ? document.getElementById('dateInput').value : '',
            rating: status === 'visited' 
                ? parseInt(document.getElementById('ratingInput').value) || 0 
                : 0
        };
        
        try {
            if (editId) {
                await window.API.updatePlace(window.currentList, editId, placeData);
            } else {
                await window.API.addPlace(window.currentList, placeData);
            }
            
            resetForm();
            await loadPlaces();
            
            // Переключаемся на "Хочу посетить"
            const wishlistTabBtn = document.querySelector('#travelTabs button[data-bs-target="#wishlist"]');
            
            if (wishlistTabBtn) {
                new bootstrap.Tab(wishlistTabBtn).show();
            }
            
            alert(editId ? '✅ Место обновлено!' : '✅ Место добавлено!');
        } catch (error) {
            alert('Ошибка при сохранении');
        }
    });
}

function resetForm() {
    document.getElementById('placeForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('formTitle').textContent = 'Новое место';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-circle"></i> Добавить место';
    document.getElementById('cancelEditBtn').classList.add('d-none');
    document.getElementById('visitedFields').classList.add('d-none');
    
    window.setupStarRating(0);
}

// Глобальные функции
window.loadPlaces = loadPlaces;
window.markAsVisited = markAsVisited;
window.deletePlaceById = deletePlaceById;
window.editPlace = editPlace;
window.openPhotoGallery = openPhotoGallery;
window.setupForm = setupForm;