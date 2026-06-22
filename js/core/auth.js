// ==================== auth.js (Email + Google) ====================
const auth = window.auth;
const db = window.db;

const { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updateProfile 
} = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

const googleProvider = new window.GoogleAuthProvider();

const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loadingScreen = document.getElementById('loadingScreen');

// ВСЕГДА начинаем с загрузки (енотик)
loadingScreen.classList.remove('d-none');
loginScreen.classList.add('d-none');
appScreen.classList.add('d-none');

// ========== ПЕРЕКЛЮЧЕНИЕ ФОРМ ==========
function showLoginForm() {
    document.getElementById('emailLoginForm').classList.remove('d-none');
    document.getElementById('registerForm').classList.add('d-none');
    document.getElementById('resetForm').classList.add('d-none');
}

function showRegisterForm() {
    document.getElementById('emailLoginForm').classList.add('d-none');
    document.getElementById('registerForm').classList.remove('d-none');
    document.getElementById('resetForm').classList.add('d-none');
}

function showResetForm() {
    document.getElementById('emailLoginForm').classList.add('d-none');
    document.getElementById('registerForm').classList.add('d-none');
    document.getElementById('resetForm').classList.remove('d-none');
}

document.getElementById('showRegister')?.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });
document.getElementById('showLogin')?.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
document.getElementById('showReset')?.addEventListener('click', (e) => { e.preventDefault(); showResetForm(); });
document.getElementById('showLoginFromReset')?.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });

// ========== ВХОД ПО ПОЧТЕ ==========
document.getElementById('emailLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    try {
        showLoading();
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showLogin();
        if (error.code === 'auth/user-not-found') { alert('Пользователь не найден. Создайте аккаунт.'); showRegisterForm(); }
        else if (error.code === 'auth/wrong-password') alert('Неверный пароль');
        else if (error.code === 'auth/invalid-email') alert('Некорректный email');
        else alert('Ошибка: ' + error.message);
    }
});

// ========== РЕГИСТРАЦИЯ ==========
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    if (password.length < 6) { alert('Пароль минимум 6 символов'); return; }
    try {
        showLoading();
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
    } catch (error) {
        showLogin();
        if (error.code === 'auth/email-already-in-use') { alert('Этот email уже зарегистрирован'); showLoginForm(); }
        else if (error.code === 'auth/weak-password') alert('Пароль слишком слабый');
        else alert('Ошибка: ' + error.message);
    }
});

// ========== СБРОС ПАРОЛЯ ==========
document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    try {
        await sendPasswordResetEmail(auth, email);
        alert('✅ Ссылка отправлена на ' + email);
        showLoginForm();
    } catch (error) { alert('Ошибка: ' + error.message); }
});

// ========== GOOGLE ==========
document.getElementById('loginGoogleBtn')?.addEventListener('click', () => socialLogin());
document.getElementById('loginBtn')?.addEventListener('click', () => socialLogin());

async function socialLogin() {
    try {
        showLoading();
        await window.signInWithPopup(auth, googleProvider);
    } catch (error) {
        showLogin();
        if (error.code === 'auth/popup-closed-by-user') return;
        alert('Не удалось войти через Google');
    }
}

// ========== ВЫХОД (только тут показываем вход) ==========
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await window.signOut(auth);
    // После выхода показываем экран входа
    showLogin();
});

// ========== ПОКАЗАТЬ ЗАГРУЗКУ (енотик) ==========
function showLoading() {
    loadingScreen.classList.remove('d-none');
    loginScreen.classList.add('d-none');
    appScreen.classList.add('d-none');
}

// ========== ПОКАЗАТЬ ВХОД ==========
function showLogin() {
    loadingScreen.classList.add('d-none');
    loginScreen.classList.remove('d-none');
    appScreen.classList.add('d-none');
}

// ========== ПОКАЗАТЬ ПРИЛОЖЕНИЕ ==========
function showApp() {
    loadingScreen.classList.add('d-none');
    loginScreen.classList.add('d-none');
    appScreen.classList.remove('d-none');
}

// ========== ОТСЛЕЖИВАНИЕ ==========
let authResolved = false;
let initStarted = false;

window.onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Пользователь авторизован (сессия жива или восстановлена)
        window.currentUser = user;
        
        // Всегда показываем загрузку пока инициализируемся
        showLoading();
        
        document.getElementById('userName').textContent = (user.displayName || user.email?.split('@')[0] || 'Пользователь').split(' ')[0];
        const myUserIdEl = document.getElementById('myUserId');
        if (myUserIdEl) myUserIdEl.textContent = user.uid;
        
        // Профиль
        try {
            const userRef = window.doc(db, 'users', user.uid);
            const userSnap = await window.getDoc(userRef);
            if (!userSnap.exists()) {
                await window.setDoc(userRef, {
                    name: user.displayName || user.email?.split('@')[0] || 'Пользователь',
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                    provider: user.providerData[0]?.providerId || 'password',
                    friends: [],
                    createdAt: Date.now()
                });
            }
        } catch (e) { console.error('Ошибка профиля:', e); }
        
        // Запускаем приложение один раз
        if (!initStarted) {
            initStarted = true;
            try {
                if (window.initApp) await window.initApp();
            } catch (e) {
                console.error('Ошибка initApp:', e);
            }
        }
        
        // Показываем приложение
        showApp();
        console.log('✅ Сайт загружен');
        
    } else {
        // Пользователь не авторизован
        window.currentUser = null;
        initStarted = false;
        
        // Показываем вход
        showLogin();
        console.log('🔐 Требуется вход');
    }
});