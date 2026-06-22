// ==================== auth.js (упрощённый) ====================
const auth = window.auth;
const db = window.db;

// Импорты для email/password
const { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updateProfile 
} = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

const googleProvider = new window.GoogleAuthProvider();

// ========== ПОКАЗАТЬ ЗАГРУЗКУ ==========
function showLoading() {
    document.getElementById('loadingScreen').classList.remove('d-none');
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('appScreen').classList.add('d-none');
}

// ========== ПОКАЗАТЬ ВХОД ==========
function showLogin() {
    document.getElementById('loadingScreen').classList.add('d-none');
    document.getElementById('loginScreen').classList.remove('d-none');
    document.getElementById('appScreen').classList.add('d-none');
}

// ========== ПЕРЕКЛЮЧЕНИЕ ФОРМ ==========
document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('emailLoginForm').classList.add('d-none');
    document.getElementById('registerForm').classList.remove('d-none');
    document.getElementById('resetForm').classList.add('d-none');
});

document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').classList.add('d-none');
    document.getElementById('emailLoginForm').classList.remove('d-none');
    document.getElementById('resetForm').classList.add('d-none');
});

document.getElementById('showReset')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('emailLoginForm').classList.add('d-none');
    document.getElementById('resetForm').classList.remove('d-none');
    document.getElementById('registerForm').classList.add('d-none');
});

document.getElementById('showLoginFromReset')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('resetForm').classList.add('d-none');
    document.getElementById('emailLoginForm').classList.remove('d-none');
});

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
        if (error.code === 'auth/user-not-found') {
            alert('Пользователь не найден. Зарегистрируйтесь.');
            document.getElementById('emailLoginForm').classList.add('d-none');
            document.getElementById('registerForm').classList.remove('d-none');
        } else if (error.code === 'auth/wrong-password') {
            alert('Неверный пароль');
        } else {
            alert('Ошибка: ' + error.message);
        }
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
        if (error.code === 'auth/email-already-in-use') {
            alert('Этот email уже зарегистрирован.');
            document.getElementById('registerForm').classList.add('d-none');
            document.getElementById('emailLoginForm').classList.remove('d-none');
        } else {
            alert('Ошибка: ' + error.message);
        }
    }
});

// ========== СБРОС ПАРОЛЯ ==========
document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    try {
        await sendPasswordResetEmail(auth, email);
        alert('✅ Ссылка отправлена на ' + email);
        document.getElementById('resetForm').classList.add('d-none');
        document.getElementById('emailLoginForm').classList.remove('d-none');
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
});

// ========== GOOGLE ==========
document.getElementById('loginGoogleBtn')?.addEventListener('click', async () => {
    try {
        showLoading();
        await window.signInWithPopup(auth, googleProvider);
    } catch (error) {
        showLogin();
        if (error.code === 'auth/popup-closed-by-user') return;
        alert('Не удалось войти через Google');
    }
});

// Старая кнопка
document.getElementById('loginBtn')?.addEventListener('click', async () => {
    try {
        showLoading();
        await window.signInWithPopup(auth, googleProvider);
    } catch (error) {
        showLogin();
        if (error.code === 'auth/popup-closed-by-user') return;
        alert('Не удалось войти через Google');
    }
});

// ========== ВЫХОД ==========
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await window.signOut(auth);
    showLogin();
});

console.log('✅ auth.js загружен (упрощённый)');