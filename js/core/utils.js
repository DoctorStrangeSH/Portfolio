// ==================== utils.js ====================

window.timeAgo = function(ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    if (diff < 60000) return 'только что';
    var m = Math.floor(diff / 60000);
    if (m < 60) return m + ' мин. назад';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' ч. назад';
    var d = Math.floor(h / 24);
    if (d === 1) return 'вчера';
    if (d < 7) return d + ' дн. назад';
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

window.MOVIE_GENRES = {
    28: '🎬 Боевик', 12: '🗺️ Приключения', 16: '🐱 Анимация',
    35: '😂 Комедия', 80: '🔫 Криминал', 99: '📹 Документальный',
    18: '🎭 Драма', 10751: '👨‍👩‍👧‍👦 Семейный', 14: '🧙 Фэнтези',
    36: '📜 История', 27: '😱 Ужасы', 10402: '🎵 Музыка',
    9648: '🔍 Детектив', 10749: '💕 Мелодрама', 878: '👽 Фантастика',
    10770: '📺 ТВ фильм', 53: '😰 Триллер', 10752: '⚔️ Военный', 37: '🤠 Вестерн'
};

window.MOVIE_STATUSES = { want: '🔖 Хочу посмотреть', watched: '✅ Посмотрел', favourite: '⭐ Любимое', dislike: '👎 Не понравилось' };

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

// API ключи
window.TMDB_PROXY_URL = 'https://tmdb-proxy.sokrat3895.workers.dev';
window.OMDB_API_KEY = '958510fd';
window.KINOPOISK_API_KEY = 'XYBPJHC-NRHM8YM-HWBCEKH-WPRYVXQ';

// Лог активности
window.logActivity = async function(type, title, link) {
    if (!window.currentUser) return;
    try {
        await window.addDoc(window.collection(window.db, 'activity'), {
            userId: window.currentUser.uid,
            userName: window.currentUser.displayName || 'Пользователь',
            userPhoto: window.currentUser.photoURL || '',
            type: type,
            title: title,
            link: link || '',
            createdAt: Date.now()
        });
    } catch (e) {}
};

// ========== НИКИ ==========
window.checkNickname = async function(nickname) {
    var snap = await window.getDoc(window.doc(window.db, 'nicknames', nickname.toLowerCase().trim()));
    return !snap.exists();
};

window.saveNickname = async function(nickname) {
    var nick = nickname.toLowerCase().trim();
    if (!nick) return false;
    if (nick.length < 3) { alert('Ник должен быть минимум 3 символа'); return false; }
    if (!/^[a-zA-Z0-9_]+$/.test(nick)) { alert('Только латиница, цифры и _'); return false; }
    
    var exists = await window.getDoc(window.doc(window.db, 'nicknames', nick));
    if (exists.exists()) { alert('Этот ник уже занят!'); return false; }
    
    await window.setDoc(window.doc(window.db, 'nicknames', nick), {
        uid: window.currentUser.uid,
        name: window.currentUser.displayName || 'Пользователь',
        createdAt: Date.now()
    });
    
    await window.updateDoc(window.doc(window.db, 'users', window.currentUser.uid), { nickname: nick });
    return true;
};

window.findByNickname = async function(nickname) {
    var snap = await window.getDoc(window.doc(window.db, 'nicknames', nickname.toLowerCase().trim()));
    if (snap.exists()) return snap.data();
    return null;
};

console.log('✅ utils.js загружен');