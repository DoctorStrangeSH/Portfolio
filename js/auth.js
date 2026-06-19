// ==================== auth.js ====================
const auth = window.auth;
const db = window.db;

// Кнопка входа
document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
        const provider = new window.GoogleAuthProvider();
        await window.signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Не удалось войти. Проверьте соединение.');
    }
});

// Кнопка выхода
document.getElementById('logoutBtn').addEventListener('click', () => {
    window.signOut(auth);
});

// Отслеживание авторизации
window.onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('loginScreen');
    const appScreen = document.getElementById('appScreen');
    
    if (user) {
        // Сохраняем пользователя
        window.currentUser = user;
        
        // Переключаем экраны
        loginScreen.classList.add('d-none');
        appScreen.classList.remove('d-none');
        
        // Имя пользователя
        document.getElementById('userName').textContent = user.displayName.split(' ')[0];
        document.getElementById('myUserId').textContent = user.uid;
        
        // Создаём профиль в Firestore, если нет
        const userRef = window.doc(db, 'users', user.uid);
        const userSnap = await window.getDoc(userRef);
        if (!userSnap.exists()) {
            await window.setDoc(userRef, {
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                friends: [],
                createdAt: Date.now()
            });
        }
        
        // Запускаем приложение
        if (window.initApp) {
            window.initApp();
        }
    } else {
        // Пользователь вышел
        window.currentUser = null;
        loginScreen.classList.remove('d-none');
        appScreen.classList.add('d-none');
    }
});