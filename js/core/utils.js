// ==================== utils.js ====================
window.timeAgo = function(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'только что';
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} мин. назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч. назад`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'вчера';
    if (d < 7) return `${d} дн. назад`;
    return new Date(ts).toLocaleDateString();
};

window.formatBudget = function(amount) {
    if (!amount) return '';
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + ' млн ₽';
    if (amount >= 1000) return Math.round(amount / 1000) + ' тыс ₽';
    return amount + ' ₽';
};

window.formatPrice = function(level) {
    if (level === 1) return '₽';
    if (level === 2) return '₽₽';
    if (level === 3) return '₽₽₽';
    return '';
};

window.CUISINE_TYPES = {
    italian: '🍝 Итальянская',
    japanese: '🍣 Японская',
    russian: '🥟 Русская',
    georgian: '🍖 Грузинская',
    french: '🥐 Французская',
    chinese: '🥡 Китайская',
    mexican: '🌮 Мексиканская',
    korean: '🍜 Корейская',
    thai: '🍛 Тайская',
    american: '🍔 Американская',
    coffee: '☕ Кофейня',
    bakery: '🥨 Пекарня',
    bar: '🍸 Бар',
    other: '📌 Другое'
};

window.RESTAURANT_STATUSES = {
    want: 'Хочу посетить',
    visited: 'Посетил(а)',
    favourite: '⭐ Любимое',
    dislike: '👎 Не понравилось'
};

// TMDB прокси
window.TMDB_PROXY_URL = 'https://tmdb-proxy.sokrat3895.workers.dev/';

// Статусы фильмов
window.MOVIE_STATUSES = {
    want: '🔖 Хочу посмотреть',
    watched: '✅ Посмотрел',
    favourite: '⭐ Любимое',
    dislike: '👎 Не понравилось'
};

// Категории мечт
window.DREAM_CATEGORIES = {
    travel: { emoji: '✈️', name: 'Путешествие', color: '#0d6efd' },
    purchase: { emoji: '🛍️', name: 'Покупка', color: '#198754' },
    skill: { emoji: '🎯', name: 'Навык', color: '#ffc107' },
    career: { emoji: '💼', name: 'Карьера', color: '#6f42c1' },
    health: { emoji: '💪', name: 'Здоровье', color: '#dc3545' },
    event: { emoji: '🎉', name: 'Событие', color: '#fd7e14' },
    other: { emoji: '✨', name: 'Другое', color: '#6c757d' }
};

window.DREAM_STATUSES = {
    dreaming: { emoji: '💭', name: 'Мечтаю', color: '#6c757d' },
    planning: { emoji: '📋', name: 'Планирую', color: '#0d6efd' },
    doing: { emoji: '🚀', name: 'Делаю', color: '#fd7e14' },
    done: { emoji: '✅', name: 'Сделал!', color: '#198754' }
};

console.log('✅ utils.js загружен');