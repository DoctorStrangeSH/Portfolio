// ==================== auth.js ====================
const auth = window.auth;
const db = window.db;

// Сначала показываем загрузку, а не вход
document.getElementById('loginScreen').classList.add('d-none');
document.getElementById('appScreen').classList.add('d-none');
document.getElementById('loadingScreen').classList.remove('d-none');

// Проверяем localStorage — был ли вход раньше
const wasLoggedIn = localStorage.getItem('wasLoggedIn') === 'true';
if (!wasLoggedIn) {
    // Первый заход — показываем вход
    document.getElementById('loadingScreen').classList.add('d-none');
    document.getElementById('loginScreen').classList.remove('d-none');
}

// Кнопка входа
document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('loadingScreen').classList.remove('d-none');
        const provider = new window.GoogleAuthProvider();
        await window.signInWithPopup(auth, provider);
        localStorage.setItem('wasLoggedIn', 'true');
    } catch (error) {
        console.error('Ошибка входа:', error);
        document.getElementById('loadingScreen').classList.add('d-none');
        document.getElementById('loginScreen').classList.remove('d-none');
        alert('Не удалось войти. Проверьте соединение.');
    }
});

// Кнопка выхода
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('wasLoggedIn');
    window.signOut(auth);
});

let authResolved = false;

window.onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('loginScreen');
    const appScreen = document.getElementById('appScreen');
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (user) {
        // Пользователь авторизован
        window.currentUser = user;
        localStorage.setItem('wasLoggedIn', 'true');
        
        loginScreen.classList.add('d-none');
        
        if (!authResolved) {
            loadingScreen.classList.remove('d-none');
            appScreen.classList.add('d-none');
        }
        
        document.getElementById('userName').textContent = user.displayName.split(' ')[0];
        const myUserIdEl = document.getElementById('myUserId');
        if (myUserIdEl) myUserIdEl.textContent = user.uid;
        
        // Профиль
        try {
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
        } catch (error) {
            console.error('Ошибка профиля:', error);
        }
        
        // Запускаем приложение
        if (!authResolved) {
            authResolved = true;
            if (window.initApp) await window.initApp();
        }
        
        // Плавно показываем приложение
        loadingScreen.classList.add('d-none');
        appScreen.classList.remove('d-none');
        
    } else {
        // Пользователь не авторизован
        window.currentUser = null;
        authResolved = false;
        
        appScreen.classList.add('d-none');
        
        if (wasLoggedIn) {
            // Был вход — показываем спиннер (ждём авто-вход)
            loadingScreen.classList.remove('d-none');
            loginScreen.classList.add('d-none');
        } else {
            // Не было входа — показываем кнопку входа
            loadingScreen.classList.add('d-none');
            loginScreen.classList.remove('d-none');
        }
    }
});