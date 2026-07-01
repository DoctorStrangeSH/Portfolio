import { auth, db } from '../../config/firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class ProfileModule {
    constructor() {
        this.currentTab = 'overview'; // overview, settings, privacy
    }

    async render(params = {}) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        const userId = params.id || window.app.currentUser?.uid;
        const isOwnProfile = userId === window.app.currentUser?.uid;
        
        // Показываем загрузку
        mainContent.innerHTML = window.app.ui.createLoader();
        
        // Загружаем данные профиля
        const userData = await this.loadUserProfile(userId);
        
        if (!userData) {
            mainContent.innerHTML = window.app.ui.createEmptyState({
                icon: 'bi-person-x',
                title: 'Профиль не найден',
                description: 'Пользователь не существует или был удалён'
            });
            return;
        }
        
        // Рендерим профиль
        mainContent.innerHTML = this.getProfileTemplate(userData, isOwnProfile);
        
        // Инициализируем табы
        this.initTabs();
        
        // Загружаем контент активной вкладки
        await this.loadTabContent(this.currentTab, userData);
    }

    getProfileTemplate(userData, isOwnProfile) {
        const coverGradient = this.getRandomGradient();
        
        return `
            <div class="profile-page fade-in-up">
                <!-- Обложка -->
                <div class="profile-cover" style="background: ${coverGradient}">
                    <div class="profile-cover-overlay"></div>
                    ${isOwnProfile ? `
                        <button class="btn btn-light btn-sm profile-cover-edit">
                            <i class="bi bi-camera me-1"></i>Изменить обложку
                        </button>
                    ` : ''}
                </div>
                
                <div class="container">
                    <div class="profile-header">
                        <!-- Аватар -->
                        <div class="profile-avatar-wrapper">
                            <div class="profile-avatar">
                                ${userData.avatar ? 
                                    `<img src="${userData.avatar}" alt="Аватар">` :
                                    `<span class="profile-avatar-text">${userData.username?.[0]?.toUpperCase() || 'U'}</span>`
                                }
                            </div>
                            ${isOwnProfile ? `
                                <button class="profile-avatar-edit">
                                    <i class="bi bi-camera"></i>
                                </button>
                            ` : ''}
                        </div>
                        
                        <!-- Инфо -->
                        <div class="profile-info">
                            <div class="d-flex align-items-center gap-3 mb-2">
                                <h2 class="profile-username mb-0">@${userData.username || 'user'}</h2>
                                ${userData.displayName ? `
                                    <span class="profile-display-name">${userData.displayName}</span>
                                ` : ''}
                            </div>
                            
                            <p class="profile-bio text-muted mb-3">
                                ${userData.bio || 'Пока нет описания...'}
                            </p>
                            
                            <div class="profile-stats">
                                <div class="profile-stat">
                                    <strong>${userData.stats?.travels || 0}</strong>
                                    <span>путешествий</span>
                                </div>
                                <div class="profile-stat">
                                    <strong>${userData.stats?.movies || 0}</strong>
                                    <span>фильмов</span>
                                </div>
                                <div class="profile-stat">
                                    <strong>${userData.stats?.books || 0}</strong>
                                    <span>книг</span>
                                </div>
                                <div class="profile-stat">
                                    <strong>${userData.stats?.friends || 0}</strong>
                                    <span>друзей</span>
                                </div>
                            </div>
                            
                            ${!isOwnProfile ? `
                                <div class="mt-3">
                                    <button class="btn btn-premium btn-sm">
                                        <i class="bi bi-person-plus me-2"></i>Добавить в друзья
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Табы -->
                    <ul class="nav nav-tabs profile-tabs mt-4" role="tablist">
                        <li class="nav-item">
                            <button class="nav-link active" data-tab="overview">
                                <i class="bi bi-grid me-2"></i>Обзор
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-tab="travels">
                                <i class="bi bi-airplane me-2"></i>Путешествия
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-tab="movies">
                                <i class="bi bi-film me-2"></i>Кино
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-tab="books">
                                <i class="bi bi-book me-2"></i>Книги
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-tab="dreams">
                                <i class="bi bi-star me-2"></i>Мечты
                            </button>
                        </li>
                        ${isOwnProfile ? `
                            <li class="nav-item ms-auto">
                                <button class="nav-link" data-tab="settings">
                                    <i class="bi bi-gear me-2"></i>Настройки
                                </button>
                            </li>
                        ` : ''}
                    </ul>
                    
                    <!-- Контент табов -->
                    <div class="profile-tab-content mt-4" id="profileTabContent">
                        ${window.app.ui.createLoader()}
                    </div>
                </div>
            </div>
        `;
    }

    getRandomGradient() {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }

    initTabs() {
        document.querySelectorAll('.profile-tabs .nav-link').forEach(tab => {
            tab.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // Убираем активный класс у всех
                document.querySelectorAll('.profile-tabs .nav-link').forEach(t => t.classList.remove('active'));
                
                // Добавляем активный класс
                tab.classList.add('active');
                
                // Загружаем контент
                this.currentTab = tab.dataset.tab;
                const userData = await this.loadUserProfile(window.app.currentUser.uid);
                await this.loadTabContent(this.currentTab, userData);
            });
        });
    }

    async loadTabContent(tab, userData) {
        const container = document.getElementById('profileTabContent');
        if (!container) return;
        
        switch(tab) {
            case 'overview':
                container.innerHTML = this.getOverviewContent(userData);
                break;
            case 'travels':
                container.innerHTML = this.getPlaceholder('путешествий', 'airplane');
                break;
            case 'movies':
                container.innerHTML = this.getPlaceholder('фильмов', 'film');
                break;
            case 'books':
                container.innerHTML = this.getPlaceholder('книг', 'book');
                break;
            case 'dreams':
                container.innerHTML = this.getPlaceholder('мечт', 'star');
                break;
            case 'settings':
                container.innerHTML = this.getSettingsContent(userData);
                break;
        }
    }

    getOverviewContent(userData) {
        return `
            <div class="row g-4">
                <div class="col-12">
                    <div class="card-premium p-4">
                        <h5 class="fw-bold mb-3">
                            <i class="bi bi-trophy text-warning me-2"></i>Достижения
                        </h5>
                        <div class="row g-3">
                            ${this.getAchievements(userData)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAchievements(userData) {
        const achievements = userData.achievements || [];
        if (achievements.length === 0) {
            return `
                <div class="col-12 text-center py-4">
                    <i class="bi bi-trophy text-muted display-4"></i>
                    <p class="text-muted mt-2">Пока нет достижений</p>
                </div>
            `;
        }
        return achievements.map(a => `
            <div class="col-6 col-md-3">
                <div class="text-center">
                    <i class="bi ${a.icon} display-4 text-warning"></i>
                    <p class="small mt-2 mb-0">${a.title}</p>
                </div>
            </div>
        `).join('');
    }

    getPlaceholder(name, icon) {
        return window.app.ui.createEmptyState({
            icon: `bi-${icon}`,
            title: `Нет ${name}`,
            description: `Здесь будут отображаться ${name} пользователя`,
            action: `<button class="btn btn-premium btn-sm">
                <i class="bi bi-plus me-2"></i>Добавить
            </button>`
        });
    }

    getSettingsContent(userData) {
        return `
            <div class="row">
                <div class="col-lg-8">
                    <div class="card-premium p-4">
                        <h5 class="fw-bold mb-4">Настройки профиля</h5>
                        <!-- Здесь будет форма настроек -->
                        <p class="text-muted">Настройки в разработке...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async loadUserProfile(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            return null;
        }
    }
}