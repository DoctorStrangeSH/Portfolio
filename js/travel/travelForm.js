// ==================== travelForm.js ====================

window._travelDiary = [];

window.renderTravelForm = function(editPlace = null) {
    const container = document.getElementById('travelFormContainer');
    if (!container) return;
    
    const isEdit = !!editPlace;
    
    container.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card shadow-sm border-0">
                    <div class="card-body p-4">
                        <h4 id="travelFormTitle">
                            <i class="bi ${isEdit ? 'bi-pencil' : 'bi-plus-circle'} me-2"></i>
                            ${isEdit ? 'Редактировать место' : 'Новое место'}
                        </h4>
                        
                        <form id="travelPlaceForm" autocomplete="off">
                            <input type="hidden" id="travelEditId" value="${isEdit ? editPlace._firestoreId : ''}">
                            
                            <!-- Название + Местоположение -->
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Название *</label>
                                    <input type="text" class="form-control" id="travelName" required 
                                           value="${isEdit ? editPlace.name : ''}" 
                                           placeholder="Мурманск, Териберка...">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Местоположение</label>
                                    <input type="text" class="form-control" id="travelLocation" 
                                           value="${isEdit ? (editPlace.location || '') : ''}" 
                                           placeholder="Адрес или координаты">
                                </div>
                            </div>
                            
                            <!-- Категория + Приоритет + Бюджет -->
                            <div class="row g-3 mb-3">
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Категория</label>
                                    <select class="form-select" id="travelCategory">
                                        ${Object.entries(window.TRAVEL_CATEGORIES).map(([k, v]) => 
                                            `<option value="${k}" ${isEdit && editPlace.category === k ? 'selected' : ''}>
                                                ${v.emoji} ${v.name}
                                            </option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Приоритет</label>
                                    <select class="form-select" id="travelPriority">
                                        <option value="high" ${isEdit && editPlace.priority === 'high' ? 'selected' : ''}>
                                            🔥 Очень хочу
                                        </option>
                                        <option value="medium" ${isEdit && editPlace.priority === 'medium' ? 'selected' : ''} selected>
                                            🙂 Было бы круто
                                        </option>
                                        <option value="low" ${isEdit && editPlace.priority === 'low' ? 'selected' : ''}>
                                            💭 Когда-нибудь
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Бюджет (₽)</label>
                                    <input type="number" class="form-control" id="travelBudget" 
                                           value="${isEdit ? (editPlace.budget || '') : ''}" 
                                           placeholder="50000">
                                </div>
                            </div>
                            
                            <!-- Фотографии -->
                            <div class="mb-3">
                                <label class="form-label fw-medium">📸 Фотографии</label>
                                <textarea class="form-control" id="travelPhotos" rows="2" 
                                          placeholder="https://i.ibb.co/photo1.jpg, https://i.ibb.co/photo2.jpg">${isEdit ? (editPlace.photos || []).join(', ') : ''}</textarea>
                                <div class="form-text">
                                    <i class="bi bi-info-circle me-1"></i>
                                    Ссылки через запятую. Используйте 
                                    <a href="https://imgbb.com" target="_blank">ImgBB</a> или Flickr
                                </div>
                            </div>
                            
                            <!-- Альбом Flickr -->
                            <div class="mb-3">
                                <label class="form-label fw-medium">🔗 Альбом Flickr</label>
                                <input type="url" class="form-control" id="travelAlbum" 
                                       value="${isEdit ? (editPlace.album || '') : ''}" 
                                       placeholder="https://flickr.com/photos/.../albums/...">
                            </div>
                            
                            <!-- Описание -->
                            <div class="mb-3">
                                <label class="form-label fw-medium">📝 Описание</label>
                                <textarea class="form-control" id="travelDesc" rows="2" 
                                          placeholder="Северное сияние, олени, Баренцево море...">${isEdit ? (editPlace.description || '') : ''}</textarea>
                            </div>
                            
                            <!-- Теги -->
                            <div class="mb-3">
                                <label class="form-label fw-medium">🏷️ Теги (через запятую)</label>
                                <input type="text" class="form-control" id="travelTags" 
                                       value="${isEdit ? (editPlace.tags || []).join(', ') : ''}" 
                                       placeholder="романтика, экстрим, бюджетно, семья...">
                                <div class="form-text">Например: #романтика #бюджетно #экстрим</div>
                            </div>
                            
                            <!-- Дневник -->
                            <div class="mb-3">
                                <label class="form-label fw-medium">📔 Дневник путешествия</label>
                                <div id="travelDiaryEntries"></div>
                                <button type="button" class="btn btn-sm btn-outline-secondary mt-2" id="travelAddDiary">
                                    <i class="bi bi-plus-lg me-1"></i>Добавить запись
                                </button>
                            </div>
                            
                            <!-- Статус -->
                            <div class="mb-3">
                                <label class="form-label fw-medium">📌 Статус</label>
                                <select class="form-select" id="travelStatus">
                                    <option value="want" ${isEdit && editPlace.status === 'want' ? 'selected' : ''} selected>
                                        🌍 Хочу посетить
                                    </option>
                                    <option value="visited" ${isEdit && editPlace.status === 'visited' ? 'selected' : ''}>
                                        ✅ Уже посетил(а)
                                    </option>
                                </select>
                            </div>
                            
                            <!-- Поля для посещённых -->
                            <div id="travelVisitedFields" class="${isEdit && editPlace.status === 'visited' ? '' : 'd-none'}">
                                <div class="row g-3 mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label fw-medium">📅 Дата поездки</label>
                                        <input type="date" class="form-control" id="travelDate" 
                                               value="${isEdit ? (editPlace.date || '') : ''}">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-medium">⭐ Оценка</label>
                                        <div class="star-rating d-flex gap-1 mt-1" id="travelStars"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Кнопки -->
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-success flex-grow-1" id="travelSubmit">
                                    <i class="bi ${isEdit ? 'bi-check-lg' : 'bi-plus-circle'} me-1"></i>
                                    ${isEdit ? 'Сохранить изменения' : 'Добавить место'}
                                </button>
                                <button type="button" class="btn btn-outline-secondary ${isEdit ? '' : 'd-none'}" id="travelCancel">
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>`;
    
    // Инициализация дневника
    window._travelDiary = isEdit ? (editPlace.diary || []).slice() : [];
    renderTravelDiaryFields();
    
    // Звёздочки
    window.setupStarRating('travelStars', isEdit ? (editPlace.rating || 0) : 0);
    
    // Кнопка добавления записи в дневник
    document.getElementById('travelAddDiary').onclick = () => {
        window._travelDiary.push({ 
            date: new Date().toISOString().split('T')[0], 
            text: '', 
            photo: '' 
        });
        renderTravelDiaryFields();
    };
    
    // Переключение статуса
    document.getElementById('travelStatus').onchange = function() {
        const vf = document.getElementById('travelVisitedFields');
        if (this.value === 'visited') {
            vf.classList.remove('d-none');
            window.setupStarRating('travelStars', window.getStarRating('travelStars'));
        } else {
            vf.classList.add('d-none');
        }
    };
    
    // Кнопка Отмена
    document.getElementById('travelCancel').onclick = () => {
        resetTravelForm();
        // Переключаем на вкладку "Хочу посетить"
        const wishTab = document.querySelector('#travelTabs button[data-bs-target="#travelWishlistTab"]');
        if (wishTab) new bootstrap.Tab(wishTab).show();
    };
    
    // Отправка формы
    document.getElementById('travelPlaceForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const editId = document.getElementById('travelEditId').value;
        const name = document.getElementById('travelName').value.trim();
        
        if (!name) {
            alert('⚠️ Введите название места!');
            return;
        }
        
        const status = document.getElementById('travelStatus').value;
        const photosRaw = document.getElementById('travelPhotos').value.trim();
        const tagsRaw = document.getElementById('travelTags').value.trim();
        
        const data = {
            name: name,
            location: document.getElementById('travelLocation').value.trim(),
            category: document.getElementById('travelCategory').value,
            priority: document.getElementById('travelPriority').value,
            budget: parseInt(document.getElementById('travelBudget').value) || 0,
            photos: photosRaw ? photosRaw.split(',').map(s => s.trim()).filter(s => s) : [],
            album: document.getElementById('travelAlbum').value.trim(),
            description: document.getElementById('travelDesc').value.trim(),
            tags: tagsRaw ? tagsRaw.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [],
            diary: window._travelDiary || [],
            status: status,
            date: status === 'visited' ? document.getElementById('travelDate').value : '',
            rating: status === 'visited' ? window.getStarRating('travelStars') : 0,
            author: window.currentUser?.displayName?.split(' ')[0] || 'Я',
            updatedAt: Date.now()
        };
        
        console.log('📤 Отправка:', data);
        
        try {
            if (editId) {
                await window.updateDoc(
                    window.doc(window.db, window.getTravelCollection(), editId), 
                    data
                );
                console.log('✅ Обновлено:', editId);
            } else {
                data.createdAt = Date.now();
                data.views = 0;
                data.reactions = {};
                const docRef = await window.addDoc(
                    window.collection(window.db, window.getTravelCollection()), 
                    data
                );
                console.log('✅ Добавлено, ID:', docRef.id);
            }
            
            resetTravelForm();
            await window.loadTravelPlaces();
            
            // Переключаем на "Хочу посетить"
            const wishTab = document.querySelector('#travelTabs button[data-bs-target="#travelWishlistTab"]');
            if (wishTab) new bootstrap.Tab(wishTab).show();
            
            alert(editId ? '✅ Место обновлено!' : '✅ Место добавлено!');
            
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            alert('❌ Ошибка: ' + (error.message || 'Не удалось сохранить. Проверьте консоль.'));
        }
    };
    
    // Прокрутка к форме
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Отрисовка полей дневника
function renderTravelDiaryFields() {
    const container = document.getElementById('travelDiaryEntries');
    if (!container) return;
    
    if (!window._travelDiary || window._travelDiary.length === 0) {
        container.innerHTML = '<p class="text-muted small">Нет записей. Добавьте первую запись о путешествии.</p>';
        return;
    }
    
    container.innerHTML = window._travelDiary.map((entry, index) => `
        <div class="diary-entry d-flex gap-2 align-items-start mb-2">
            <div class="flex-grow-1">
                <div class="row g-1">
                    <div class="col-md-4">
                        <input type="date" class="form-control form-control-sm diary-date-input" 
                               value="${entry.date || ''}" data-index="${index}"
                               onchange="window._travelDiary[${index}].date = this.value">
                    </div>
                    <div class="col-md-8">
                        <input type="text" class="form-control form-control-sm diary-text-input" 
                               value="${entry.text || ''}" data-index="${index}"
                               placeholder="Что произошло в этот день?"
                               onchange="window._travelDiary[${index}].text = this.value">
                    </div>
                </div>
                <input type="text" class="form-control form-control-sm mt-1" 
                       value="${entry.photo || ''}" 
                       placeholder="Ссылка на фото (необязательно)"
                       onchange="window._travelDiary[${index}].photo = this.value">
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" 
                    onclick="window._travelDiary.splice(${index}, 1); renderTravelDiaryFields()"
                    title="Удалить запись">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');
}

// Сброс формы
function resetTravelForm() {
    const form = document.getElementById('travelPlaceForm');
    if (form) form.reset();
    
    const editId = document.getElementById('travelEditId');
    if (editId) editId.value = '';
    
    const title = document.getElementById('travelFormTitle');
    if (title) title.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Новое место';
    
    const submitBtn = document.getElementById('travelSubmit');
    if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i>Добавить место';
    
    const cancelBtn = document.getElementById('travelCancel');
    if (cancelBtn) cancelBtn.classList.add('d-none');
    
    const visitedFields = document.getElementById('travelVisitedFields');
    if (visitedFields) visitedFields.classList.add('d-none');
    
    window._travelDiary = [];
    renderTravelDiaryFields();
    window.setupStarRating('travelStars', 0);
}

// Заполнение формы при редактировании (вызывается из карточек)
window.fillTravelForm = function(place) {
    // Заполняем скрытое поле
    document.getElementById('travelEditId').value = place._firestoreId;
    document.getElementById('travelName').value = place.name || '';
    document.getElementById('travelLocation').value = place.location || '';
    document.getElementById('travelCategory').value = place.category || 'other';
    document.getElementById('travelPriority').value = place.priority || 'medium';
    document.getElementById('travelBudget').value = place.budget || '';
    document.getElementById('travelPhotos').value = (place.photos || []).join(', ');
    document.getElementById('travelAlbum').value = place.album || '';
    document.getElementById('travelDesc').value = place.description || '';
    document.getElementById('travelTags').value = (place.tags || []).join(', ');
    document.getElementById('travelStatus').value = place.status || 'want';
    
    // Дневник
    window._travelDiary = (place.diary || []).slice();
    renderTravelDiaryFields();
    
    // Заголовок и кнопки
    document.getElementById('travelFormTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Редактировать место';
    document.getElementById('travelSubmit').innerHTML = '<i class="bi bi-check-lg me-1"></i>Сохранить изменения';
    document.getElementById('travelCancel').classList.remove('d-none');
    
    // Поля для посещённых
    const visitedFields = document.getElementById('travelVisitedFields');
    if (place.status === 'visited') {
        visitedFields.classList.remove('d-none');
        document.getElementById('travelDate').value = place.date || '';
        window.setupStarRating('travelStars', place.rating || 0);
    } else {
        visitedFields.classList.add('d-none');
        window.setupStarRating('travelStars', 0);
    }
    
    // Переключиться на вкладку добавления
    const addTab = document.querySelector('#travelTabs button[data-bs-target="#travelAddTab"]');
    if (addTab) {
        new bootstrap.Tab(addTab).show();
        // Прокрутка к форме
        setTimeout(() => {
            document.getElementById('travelFormContainer')?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
    }
};

// Экспортируем renderTravelDiaryFields для внешнего использования
window.renderTravelDiaryFields = renderTravelDiaryFields;

console.log('✅ travelForm.js загружен (поля: теги, дневник, местоположение, бюджет)');