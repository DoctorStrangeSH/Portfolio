// ==================== foodForm.js ====================

window.renderFoodForm = function(editPlace = null) {
    const container = document.getElementById('foodFormWrapper');
    if (!container) return;
    
    const isEdit = !!editPlace;
    
    container.innerHTML = `
        <div class="row justify-content-center"><div class="col-lg-8">
            <div class="card shadow-sm border-0"><div class="card-body p-4">
                <h4>${isEdit ? '✏️ Редактировать' : '🍽️ Новый ресторан'}</h4>
                <form id="foodPlaceForm" autocomplete="off">
                    <input type="hidden" id="foodEditId" value="${isEdit ? editPlace._firestoreId : ''}">
                    
                    <div class="row g-3 mb-3">
                        <div class="col-md-6"><label class="form-label fw-medium">Название *</label><input type="text" class="form-control" id="foodName" required value="${isEdit ? editPlace.name : ''}" placeholder="Название ресторана"></div>
                        <div class="col-md-6"><label class="form-label fw-medium">Тип кухни</label><select class="form-select" id="foodCuisine">${Object.entries(window.CUISINE_TYPES).map(([k,v]) => `<option value="${k}" ${isEdit && editPlace.cuisine === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
                    </div>
                    
                    <div class="row g-3 mb-3">
                        <div class="col-md-4"><label class="form-label fw-medium">Чек</label><select class="form-select" id="foodPrice"><option value="1" ${isEdit && editPlace.price === 1 ? 'selected' : ''}>₽ Недорого</option><option value="2" ${isEdit && editPlace.price === 2 ? 'selected' : ''} selected>₽₽ Средне</option><option value="3" ${isEdit && editPlace.price === 3 ? 'selected' : ''}>₽₽₽ Дорого</option></select></div>
                        <div class="col-md-4"><label class="form-label fw-medium">Оценка</label><div class="star-rating d-flex gap-1 mt-1" id="foodStars"></div></div>
                        <div class="col-md-4"><label class="form-label fw-medium">Статус</label><select class="form-select" id="foodStatus"><option value="want" ${isEdit && editPlace.status === 'want' ? 'selected' : ''}>🔖 Хочу посетить</option><option value="visited" ${isEdit && (editPlace.status === 'visited' || !isEdit) ? 'selected' : ''}>✅ Посетил(а)</option><option value="favourite" ${isEdit && editPlace.status === 'favourite' ? 'selected' : ''}>⭐ Любимое</option><option value="dislike" ${isEdit && editPlace.status === 'dislike' ? 'selected' : ''}>👎 Не понравилось</option></select></div>
                    </div>
                    
                    <div class="mb-3"><label class="form-label fw-medium">Адрес</label><input type="text" class="form-control" id="foodAddress" value="${isEdit ? (editPlace.address || '') : ''}" placeholder="ул. Примерная, 123"></div>
                    
                    <div class="mb-3"><label class="form-label fw-medium">Фото блюд</label><textarea class="form-control" id="foodPhotos" rows="2" placeholder="Ссылки через запятую">${isEdit ? (editPlace.photos || []).join(', ') : ''}</textarea></div>
                    
                    <div class="mb-3"><label class="form-label fw-medium">Описание</label><textarea class="form-control" id="foodDesc" rows="2" placeholder="Атмосфера, интерьер...">${isEdit ? (editPlace.description || '') : ''}</textarea></div>
                    
                    <div class="row g-3 mb-3">
                        <div class="col-md-6"><label class="form-label fw-medium">Что заказать</label><input type="text" class="form-control" id="foodBestDish" value="${isEdit ? (editPlace.bestDish || '') : ''}" placeholder="Лучшее блюдо"></div>
                        <div class="col-md-6"><label class="form-label fw-medium">Дата посещения</label><input type="date" class="form-control" id="foodDate" value="${isEdit ? (editPlace.date || '') : ''}"></div>
                    </div>
                    
                    <div class="mb-3"><label class="form-label fw-medium">📝 Личные заметки</label><textarea class="form-control" id="foodNotes" rows="2" placeholder="Что понравилось, что нет...">${isEdit ? (editPlace.notes || '') : ''}</textarea></div>
                    
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-success flex-grow-1">${isEdit ? '💾 Сохранить' : '🍽️ Добавить ресторан'}</button>
                        <button type="button" class="btn btn-outline-secondary" id="foodFormCancel">Отмена</button>
                    </div>
                </form>
            </div></div>
        </div>`;
    
    window.setupStarRating('foodStars', isEdit ? (editPlace.rating || 0) : 0);
    
    document.getElementById('foodFormCancel').onclick = () => {
        container.classList.add('d-none');
        container.innerHTML = '';
    };
    
    document.getElementById('foodPlaceForm').onsubmit = async (e) => {
        e.preventDefault();
        const editId = document.getElementById('foodEditId').value;
        const name = document.getElementById('foodName').value.trim();
        if (!name) return alert('Введите название!');
        
        const photosRaw = document.getElementById('foodPhotos').value.trim();
        
        const data = {
            name,
            cuisine: document.getElementById('foodCuisine').value,
            price: parseInt(document.getElementById('foodPrice').value),
            rating: window.getStarRating('foodStars'),
            status: document.getElementById('foodStatus').value,
            address: document.getElementById('foodAddress').value.trim(),
            photos: photosRaw ? photosRaw.split(',').map(s => s.trim()).filter(s => s) : [],
            description: document.getElementById('foodDesc').value.trim(),
            bestDish: document.getElementById('foodBestDish').value.trim(),
            date: document.getElementById('foodDate').value || '',
            notes: document.getElementById('foodNotes').value.trim(),
            author: window.currentUser?.displayName?.split(' ')[0] || 'Я',
            updatedAt: Date.now()
        };
        
        try {
            if (editId) {
                await window.updateDoc(window.doc(window.db, window.getFoodCollection(), editId), data);
            } else {
                data.createdAt = Date.now();
                await window.addDoc(window.collection(window.db, window.getFoodCollection()), data);
            }
            container.classList.add('d-none');
            container.innerHTML = '';
            window.loadFoodPlaces();
            alert(editId ? '✅ Обновлено!' : '✅ Ресторан добавлен!');
        } catch (err) {
            console.error(err);
            alert('❌ Ошибка');
        }
    };
};

console.log('✅ foodForm.js загружен');