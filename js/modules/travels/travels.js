import { TravelService } from '../../services/travel.service.js';
import { APP_CONFIG } from '../../config/constants.js';

export class TravelsModule {
    constructor() {
        this.travelService = new TravelService();
        this.currentFilter = { type: 'all', status: 'all' };
        this.currentView = 'grid';
    }

    async render(params = {}) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        const userId = window.app.currentUser?.uid;
        if (!userId) return;

        mainContent.innerHTML = window.app.ui.createLoader();

        const travels = await this.travelService.getTravels(userId, this.currentFilter);

        mainContent.innerHTML = this.getTemplate(travels);
        this.attachEventListeners(travels);
    }

    getTemplate(travels) {
        const activeStatusFilter = this.currentFilter.status || 'all';
        const activeTypeFilter = this.currentFilter.type || 'all';
        
        return `
            <div class="travels-page fade-in-up">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <div>
                        <h2 class="fw-bold mb-1">
                            <i class="bi bi-airplane text-primary me-2"></i>Путешествия
                        </h2>
                        <p class="text-muted mb-0">
                            ${travels.length} ${this.pluralize(travels.length, 'путешествие', 'путешествия', 'путешествий')}
                        </p>
                    </div>
                    <button class="btn btn-premium" id="addTravelBtn">
                        <i class="bi bi-plus-lg me-2"></i>Добавить путешествие
                    </button>
                </div>

                <div class="travel-filters mb-4">
                    <div class="row g-2">
                        <div class="col-12 col-md-7">
                            <div class="btn-group flex-wrap" role="group" id="statusFilters">
                                <button class="btn btn-outline-primary ${activeStatusFilter === 'all' ? 'active' : ''}" data-filter="all">
                                    <i class="bi bi-grid me-1"></i>Все
                                </button>
                                <button class="btn btn-outline-primary ${activeStatusFilter === 'planned' ? 'active' : ''}" data-filter="planned">
                                    <i class="bi bi-calendar-heart me-1"></i>Планирую
                                </button>
                                <button class="btn btn-outline-primary ${activeStatusFilter === 'visited' ? 'active' : ''}" data-filter="visited">
                                    <i class="bi bi-check-circle me-1"></i>Посетил
                                </button>
                            </div>
                        </div>
                        <div class="col-12 col-md-5">
                            <select class="form-select" id="typeFilter">
                                <option value="all" ${activeTypeFilter === 'all' ? 'selected' : ''}>Все типы</option>
                                ${APP_CONFIG.TRAVEL_TYPES.map(type => `
                                    <option value="${type.id}" ${activeTypeFilter === type.id ? 'selected' : ''}>${type.label}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div id="travelsGrid" class="row g-4">
                    ${travels.length === 0 ? this.getEmptyState() : this.renderTravelCards(travels)}
                </div>
            </div>
        `;
    }

    getEmptyState() {
        return `
            <div class="col-12">
                ${window.app.ui.createEmptyState({
                    icon: 'bi-airplane',
                    title: 'Нет путешествий',
                    description: 'Добавь своё первое путешествие и начни исследовать мир!',
                    action: ''
                })}
            </div>
        `;
    }

    renderTravelCards(travels) {
        return travels.map((travel, index) => this.createTravelCard(travel, index)).join('');
    }

    createTravelCard(travel, index) {
        const typeInfo = APP_CONFIG.TRAVEL_TYPES.find(t => t.id === travel.type) || 
                        { icon: 'bi-geo-alt', label: 'Другое' };
        
        const statusBadge = travel.status === 'visited' 
            ? '<span class="badge bg-success">Посетил</span>'
            : '<span class="badge bg-warning text-dark">Планирую</span>';

        const photos = travel.photos || [];
        const mainPhoto = photos[0] || null;

        return `
            <div class="col-12 col-md-6 col-lg-4 travel-card fade-in-up" style="animation-delay: ${index * 0.1}s">
                <div class="card-premium h-100">
                    <div class="travel-card-image" style="${mainPhoto ? `background-image: url('${mainPhoto}')` : ''}">
                        ${!mainPhoto ? `
                            <div class="travel-card-placeholder">
                                <i class="bi ${typeInfo.icon} display-4 text-white opacity-50"></i>
                            </div>
                        ` : ''}
                        <div class="travel-card-badges">
                            ${statusBadge}
                        </div>
                        <div class="travel-card-actions">
                            <button class="btn btn-light btn-sm rounded-circle me-1 edit-travel-btn" data-id="${travel.id}" title="Редактировать">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-light btn-sm rounded-circle delete-travel-btn" data-id="${travel.id}" title="Удалить">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="fw-bold mb-0">${travel.title || 'Без названия'}</h5>
                            <div class="rating-badge">
                                ${this.createStars(travel.rating || 0)}
                            </div>
                        </div>
                        
                        <div class="mb-2">
                            <i class="bi ${typeInfo.icon} text-primary me-1"></i>
                            <small class="text-muted">${typeInfo.label}</small>
                            ${travel.location ? `
                                <span class="mx-1">•</span>
                                <i class="bi bi-geo-alt text-danger me-1"></i>
                                <small class="text-muted">${travel.location}</small>
                            ` : ''}
                        </div>
                        
                        ${travel.description ? `
                            <p class="text-muted small mb-3">${this.truncate(travel.description, 100)}</p>
                        ` : ''}
                        
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="bi bi-wallet2 me-1"></i>
                                ${travel.budget?.planned || 0} ${travel.budget?.currency || 'RUB'}
                            </small>
                            <small class="text-muted">
                                ${this.formatDate(travel.createdAt)}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createStars(rating) {
        return Array.from({ length: 5 }, (_, i) => `
            <i class="bi ${i < rating ? 'bi-star-fill text-warning' : 'bi-star'} small"></i>
        `).join('');
    }

    attachEventListeners(travels) {
        // Кнопка добавления
        const addBtn = document.getElementById('addTravelBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showTravelModal(null));
        }

        // Кнопки редактирования
        document.querySelectorAll('.edit-travel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showTravelModal(btn.dataset.id);
            });
        });

        // Кнопки удаления
        document.querySelectorAll('.delete-travel-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Удалить это путешествие?')) {
                    const result = await this.travelService.deleteTravel(window.app.currentUser.uid, btn.dataset.id);
                    if (result.success) {
                        window.app.ui.showToast('Путешествие удалено', 'info');
                        await this.render();
                        window.app.refreshUserData();
                    } else {
                        window.app.ui.showToast('Ошибка удаления', 'error');
                    }
                }
            });
        });

        // Фильтры по статусу
        document.querySelectorAll('#statusFilters [data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter.status = e.target.dataset.filter;
                this.render();
            });
        });

        // Фильтр по типу
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilter.type = e.target.value;
                this.render();
            });
        }
    }

    async showTravelModal(travelId) {
        // Удаляем старую модалку
        const oldModal = document.getElementById('travelModal');
        if (oldModal) oldModal.remove();
        
        // Чистим бекдропы
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        const userId = window.app.currentUser.uid;
        const travel = travelId ? await this.travelService.getTravel(userId, travelId) : null;
        
        // Создаём модалку
        const modalContainer = document.createElement('div');
        modalContainer.id = 'travelModalContainer';
        document.body.appendChild(modalContainer);
        modalContainer.innerHTML = this.getModalTemplate(travel);
        
        const modalElement = document.getElementById('travelModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true
            });
            modal.show();
            
            modalElement.addEventListener('hidden.bs.modal', () => {
                modalContainer.remove();
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            });
            
            this.attachModalListeners(modal, travelId);
        }
    }

    getModalTemplate(travel = null) {
        const isEdit = !!travel;
        const rating = travel?.rating || 0;
        
        return `
            <div class="modal fade" id="travelModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title fw-bold">
                                <i class="bi ${isEdit ? 'bi-pencil' : 'bi-plus-circle'} text-primary me-2"></i>
                                ${isEdit ? 'Редактировать' : 'Новое путешествие'}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                        </div>
                        <div class="modal-body">
                            <form id="travelForm">
                                <div class="mb-3">
                                    <label class="form-label fw-semibold">Название *</label>
                                    <input type="text" class="form-control" name="title" 
                                           value="${travel?.title || ''}" 
                                           placeholder="Например: Париж, Франция" required>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <label class="form-label fw-semibold">Тип</label>
                                        <select class="form-select" name="type">
                                            ${APP_CONFIG.TRAVEL_TYPES.map(type => `
                                                <option value="${type.id}" ${travel?.type === type.id ? 'selected' : ''}>
                                                    ${type.label}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label fw-semibold">Статус</label>
                                        <select class="form-select" name="status">
                                            <option value="planned" ${travel?.status === 'planned' ? 'selected' : ''}>Планирую</option>
                                            <option value="visited" ${travel?.status === 'visited' ? 'selected' : ''}>Посетил</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label fw-semibold">Местоположение</label>
                                    <input type="text" class="form-control" name="location" 
                                           value="${travel?.location || ''}" 
                                           placeholder="Страна, город">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label fw-semibold">Описание</label>
                                    <textarea class="form-control" name="description" rows="3" 
                                              placeholder="Опиши свои впечатления или планы...">${travel?.description || ''}</textarea>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-4">
                                        <label class="form-label fw-semibold">План. бюджет</label>
                                        <input type="number" class="form-control" name="budgetPlanned" 
                                               value="${travel?.budget?.planned || ''}" placeholder="0">
                                    </div>
                                    <div class="col-4">
                                        <label class="form-label fw-semibold">Потрачено</label>
                                        <input type="number" class="form-control" name="budgetSpent" 
                                               value="${travel?.budget?.spent || ''}" placeholder="0">
                                    </div>
                                    <div class="col-4">
                                        <label class="form-label fw-semibold">Валюта</label>
                                        <select class="form-select" name="currency">
                                            <option value="RUB" ${travel?.budget?.currency === 'RUB' ? 'selected' : ''}>₽ RUB</option>
                                            <option value="USD">$ USD</option>
                                            <option value="EUR">€ EUR</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label fw-semibold">Оценка</label>
                                    <div class="star-rating" id="starRating">
                                        ${Array.from({ length: 5 }, (_, i) => `
                                            <i class="bi ${i < rating ? 'bi-star-fill text-warning' : 'bi-star'} fs-4" 
                                               data-rating="${i + 1}" style="cursor: pointer;"></i>
                                        `).join('')}
                                        <button type="button" class="btn btn-link btn-sm ms-2" id="clearRating" 
                                                style="display: ${rating > 0 ? 'inline' : 'none'};">
                                            Сбросить
                                        </button>
                                    </div>
                                    <input type="hidden" name="rating" value="${rating}">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label fw-semibold">
                                        <i class="bi bi-journal-text me-1"></i>Заметки / Дневник
                                    </label>
                                    <textarea class="form-control" name="notes" rows="3" 
                                              placeholder="Личные заметки...">${travel?.notes || ''}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                            <button type="button" class="btn btn-premium" id="saveTravelBtn">
                                <i class="bi bi-check-lg me-2"></i>
                                ${isEdit ? 'Сохранить' : 'Добавить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachModalListeners(modal, travelId) {
        const starRating = document.getElementById('starRating');
        const ratingInput = document.querySelector('input[name="rating"]');
        const clearBtn = document.getElementById('clearRating');
        
        if (starRating) {
            starRating.querySelectorAll('i').forEach(star => {
                star.addEventListener('click', (e) => {
                    const clickedRating = parseInt(e.target.dataset.rating);
                    const currentRating = parseInt(ratingInput?.value || 0);
                    
                    // Если кликнули на ту же звезду - сбрасываем
                    const newRating = clickedRating === currentRating ? 0 : clickedRating;
                    
                    if (ratingInput) ratingInput.value = newRating;
                    
                    // Обновляем звёзды
                    starRating.querySelectorAll('i').forEach((s, index) => {
                        s.className = index < newRating 
                            ? 'bi bi-star-fill text-warning fs-4' 
                            : 'bi bi-star fs-4';
                        s.style.cursor = 'pointer';
                    });
                    
                    // Показываем/прячем кнопку сброса
                    if (clearBtn) {
                        clearBtn.style.display = newRating > 0 ? 'inline' : 'none';
                    }
                });
            });
        }
        
        // Кнопка сброса рейтинга
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (ratingInput) ratingInput.value = '0';
                
                if (starRating) {
                    starRating.querySelectorAll('i').forEach(s => {
                        s.className = 'bi bi-star fs-4';
                        s.style.cursor = 'pointer';
                    });
                }
                
                clearBtn.style.display = 'none';
            });
        }

        // Сохранение
        const saveBtn = document.getElementById('saveTravelBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const form = document.getElementById('travelForm');
                if (!form) return;
                
                const formData = new FormData(form);
                
                const travelData = {
                    title: formData.get('title'),
                    type: formData.get('type'),
                    status: formData.get('status'),
                    location: formData.get('location'),
                    description: formData.get('description'),
                    budget: {
                        planned: parseInt(formData.get('budgetPlanned')) || 0,
                        spent: parseInt(formData.get('budgetSpent')) || 0,
                        currency: formData.get('currency')
                    },
                    rating: parseInt(formData.get('rating')) || 0,
                    notes: formData.get('notes'),
                    photos: []
                };

                if (!travelData.title) {
                    window.app.ui.showToast('Введите название путешествия', 'warning');
                    return;
                }

                // Блокируем кнопку на время сохранения
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Сохранение...';

                const userId = window.app.currentUser.uid;
                let result;

                if (travelId) {
                    result = await this.travelService.updateTravel(userId, travelId, travelData);
                } else {
                    result = await this.travelService.addTravel(userId, travelData);
                }

                if (result.success) {
                    modal.hide();
                    window.app.ui.showToast(
                        travelId ? 'Путешествие обновлено! ✈️' : 'Путешествие добавлено! 🎉', 
                        'success'
                    );
                    // Небольшая задержка для синхронизации с Firestore
                    setTimeout(async () => {
                        await this.render();
                        window.app.refreshUserData();
                    }, 300);
                } else {
                    window.app.ui.showToast('Ошибка сохранения', 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>' + (travelId ? 'Сохранить' : 'Добавить');
                }
            });
        }
    }

    pluralize(count, one, two, five) {
        if (count % 10 === 1 && count % 100 !== 11) return one;
        if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return two;
        return five;
    }

    truncate(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }
}