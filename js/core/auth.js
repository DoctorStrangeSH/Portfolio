// ==================== auth.js (Email + Google) ====================
const auth = window.auth;
const db = window.db;

// Импорты для Email/Password
const { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updateProfile 
} = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

// Google провайдер
const googleProvider = new window.GoogleAuthProvider();

// Экраны
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loadingScreen = document.getElementById('loadingScreen');

// Старт
loadingScreen.classList.remove('d-none');
loginScreen.classList.add('d-none');
appScreen.classList.add('d-none');

const wasLoggedIn = localStorage.getItem('wasLoggedIn') === 'true';
if (!wasLoggedIn) {
    loadingScreen.classList.add('d-none');
    loginScreen.classList.remove('d-none');
}

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

document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
});

document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

document.getElementById('showReset')?.addEventListener('click', (e) => {
    e.preventDefault();
    showResetForm();
});

document.getElementById('showLoginFromReset')?.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

// ========== ВХОД ПО ПОЧТЕ ==========
document.getElementById('emailLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    
    try {
        loadingScreen.classList.remove('d-none');
        loginScreen.classList.add('d-none');
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('wasLoggedIn', 'true');
    } catch (error) {
        loadingScreen.classList.add('d-none');
        loginScreen.classList.remove('d-none');
        
        switch (error.code) {
            case 'auth/user-not-found':
                alert('Пользователь не найден. Создайте аккаунт.');
                showRegisterForm();
                break;
            case 'auth/wrong-password':
                alert('Неверный пароль');
                break;
            case 'auth/invalid-email':
                alert('Некорректный email');
                break;
            default:
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
    
    if (password.length < 6) {
        alert('Пароль должен быть минимум 6 символов');
        return;
    }
    
    try {
        loadingScreen.classList.remove('d-none');
        loginScreen.classList.add('d-none');
        
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        
        localStorage.setItem('wasLoggedIn', 'true');
        console.log('✅ Регистрация успешна');
    } catch (error) {
        loadingScreen.classList.add('d-none');
        loginScreen.classList.remove('d-none');
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                alert('Этот email уже зарегистрирован. Войдите.');
                showLoginForm();
                break;
            case 'auth/weak-password':
                alert('Пароль слишком слабый. Минимум 6 символов.');
                break;
            case 'auth/invalid-email':
                alert('Некорректный email');
                break;
            default:
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
        alert('✅ Ссылка для сброса пароля отправлена на ' + email);
        showLoginForm();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
});

// ========== GOOGLE ==========
document.getElementById('loginGoogleBtn')?.addEventListener('click', () => socialLogin('Google'));
document.getElementById('loginBtn')?.addEventListener('click', () => socialLogin('Google'));

async function socialLogin(name) {
    try {
        loadingScreen.classList.remove('d-none');
        loginScreen.classList.add('d-none');
        await window.signInWithPopup(auth, googleProvider);
        localStorage.setItem('wasLoggedIn', 'true');
    } catch (error) {
        loadingScreen.classList.add('d-none');
        loginScreen.classList.remove('d-none');
        if (error.code === 'auth/popup-closed-by-user') return;
        alert(`Не удалось войти через ${name}: ${error.message}`);
    }
}

// ========== ВЫХОД ==========
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('wasLoggedIn');
    window.signOut(auth);
});

// ========== ОТСЛЕЖИВАНИЕ ==========
let authResolved = false;

window.onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.currentUser = user;
        localStorage.setItem('wasLoggedIn', 'true');
        
        loginScreen.classList.add('d-none');
        if (!authResolved) {
            loadingScreen.classList.remove('d-none');
            appScreen.classList.add('d-none');
        }
        
        const displayName = user.displayName || user.email?.split('@')[0] || 'Пользователь';
        document.getElementById('userName').textContent = displayName.split(' ')[0];
        
        const myUserIdEl = document.getElementById('myUserId');
        if (myUserIdEl) myUserIdEl.textContent = user.uid;
        
        // Профиль в Firestore
        try {
            const userRef = window.doc(db, 'users', user.uid);
            const userSnap = await window.getDoc(userRef);
            if (!userSnap.exists()) {
                await window.setDoc(userRef, {
                    name: displayName,
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                    provider: user.providerData[0]?.providerId || 'password',
                    friends: [],
                    createdAt: Date.now()
                });
            }
        } catch (e) {
            console.error('Ошибка профиля:', e);
        }
        
        if (!authResolved) {
            authResolved = true;
            if (window.initApp) await window.initApp();
        }
        
        loadingScreen.classList.add('d-none');
        appScreen.classList.remove('d-none');
        
        console.log(`✅ Вход выполнен (${user.providerData[0]?.providerId || 'email'})`);
    } else {
        window.currentUser = null;
        authResolved = false;
        appScreen.classList.add('d-none');
        
        if (wasLoggedIn) {
            loadingScreen.classList.remove('d-none');
            loginScreen.classList.add('d-none');
        } else {
            loadingScreen.classList.add('d-none');
            loginScreen.classList.remove('d-none');
        }
    }
});

console.log('✅ auth.js загружен (Email + Google)');