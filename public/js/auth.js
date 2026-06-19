// ==================== auth.js ====================
// Авторизация через Google

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginScreen = document.getElementById('loginScreen');
    const appScreen = document.getElementById('appScreen');
    const userName = document.getElementById('userName');
    const myUserId = document.getElementById('myUserId');
    
    const auth = window.firebaseAuth;
    
    // Вход
    loginBtn.addEventListener('click', async () => {
        try {
            const provider = new window.GoogleAuthProvider();
            await window.signInWithPopup(auth, provider);
        } catch (error) {
            alert('Ошибка входа: ' + error.message);
        }
    });
    
    // Выход
    logoutBtn.addEventListener('click', () => window.signOut(auth));
    
    // Отслеживание состояния
    window.onAuthStateChanged(auth, async (user) => {
        if (user) {
            window.currentUser = user;
            loginScreen.classList.add('d-none');
            appScreen.classList.remove('d-none');
            userName.textContent = user.displayName.split(' ')[0];
            
            if (myUserId) {
                myUserId.textContent = user.uid;
            }
            
            // Создаём профиль на сервере
            try {
                await window.API.createProfile();
            } catch (error) {
                console.error('Ошибка создания профиля:', error);
            }
            
            // Загружаем друзей и запускаем приложение
            if (window.initApp) {
                window.initApp();
            }
        } else {
            window.currentUser = null;
            loginScreen.classList.remove('d-none');
            appScreen.classList.add('d-none');
        }
    });
});