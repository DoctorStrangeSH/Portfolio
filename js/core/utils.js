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

// OMDb API
window.OMDB_API_KEY = '958510fd';

// Статусы фильмов
window.MOVIE_STATUSES = {
    want: '🔖 Хочу посмотреть',
    watched: '✅ Посмотрел',
    favourite: '⭐ Любимое',
    dislike: '👎 Не понравилось'
};

console.log('✅ utils.js загружен');