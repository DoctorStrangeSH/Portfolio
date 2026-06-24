// ==================== auth.js v3 ====================
var auth = window.auth;
var db = window.db;

var signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile;
var mod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
signInWithEmailAndPassword = mod.signInWithEmailAndPassword;
createUserWithEmailAndPassword = mod.createUserWithEmailAndPassword;
sendPasswordResetEmail = mod.sendPasswordResetEmail;
updateProfile = mod.updateProfile;

var googleProvider = new window.GoogleAuthProvider();

var loginScreen = document.getElementById('loginScreen');
var appScreen = document.getElementById('appScreen');
var loadingScreen = document.getElementById('loadingScreen');

loadingScreen.classList.remove('d-none');
loginScreen.classList.add('d-none');
appScreen.classList.add('d-none');

var wasLoggedIn = localStorage.getItem('wasLoggedIn') === 'true';
if (!wasLoggedIn) {
    loadingScreen.classList.add('d-none');
    loginScreen.classList.remove('d-none');
}

// Формы
document.getElementById('showRegister')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('emailLoginForm').classList.add('d-none');
    document.getElementById('registerForm').classList.remove('d-none');
    document.getElementById('resetForm').classList.add('d-none');
});

document.getElementById('showLogin')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('registerForm').classList.add('d-none');
    document.getElementById('emailLoginForm').classList.remove('d-none');
});

document.getElementById('showReset')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('emailLoginForm').classList.add('d-none');
    document.getElementById('resetForm').classList.remove('d-none');
});

document.getElementById('showLoginFromReset')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('resetForm').classList.add('d-none');
    document.getElementById('emailLoginForm').classList.remove('d-none');
});

// Вход по почте
document.getElementById('emailLoginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var email = document.getElementById('emailInput').value.trim();
    var password = document.getElementById('passwordInput').value;
    try {
        loadingScreen.classList.remove('d-none');
        loginScreen.classList.add('d-none');
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('wasLoggedIn', 'true');
    } catch (error) {
        loadingScreen.classList.add('d-none');
        loginScreen.classList.remove('d-none');
        if (error.code === 'auth/user-not-found') { alert('Не найден'); document.getElementById('emailLoginForm').classList.add('d-none'); document.getElementById('registerForm').classList.remove('d-none'); }
        else if (error.code === 'auth/wrong-password') alert('Неверный пароль');
        else alert('Ошибка: ' + error.message);
    }
});

// Регистрация
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('regName').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var password = document.getElementById('regPassword').value;
    if (password.length < 6) { alert('Минимум 6 символов'); return; }
    try {
        loadingScreen.classList.remove('d-none');
        loginScreen.classList.add('d-none');
        var result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        localStorage.setItem('wasLoggedIn', 'true');
    } catch (error) {
        loadingScreen.classList.add('d-none');
        loginScreen.classList.remove('d-none');
        if (error.code === 'auth/email-already-in-use') { alert('Занят'); document.getElementById('registerForm').classList.add('d-none'); document.getElementById('emailLoginForm').classList.remove('d-none'); }
        else alert('Ошибка: ' + error.message);
    }
});

// Сброс
document.getElementById('resetForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var email = document.getElementById('resetEmail').value.trim();
    try {
        await sendPasswordResetEmail(auth, email);
        alert('✅ Отправлено на ' + email);
        document.getElementById('resetForm').classList.add('d-none');
        document.getElementById('emailLoginForm').classList.remove('d-none');
    } catch (error) { alert('Ошибка: ' + error.message); }
});

// Google
document.getElementById('loginGoogleBtn')?.addEventListener('click', async function() {
    try {
        loadingScreen.classList.remove('d-none');
        loginScreen.classList.add('d-none');
        await window.signInWithPopup(auth, googleProvider);
        localStorage.setItem('wasLoggedIn', 'true');
    } catch (error) {
        loadingScreen.classList.add('d-none');
        loginScreen.classList.remove('d-none');
        if (error.code === 'auth/popup-closed-by-user') return;
        alert('Не удалось');
    }
});

document.getElementById('loginBtn')?.addEventListener('click', async function() {
    try {
        loadingScreen.classList.remove('d-none');
        loginScreen.classList.add('d-none');
        await window.signInWithPopup(auth, googleProvider);
        localStorage.setItem('wasLoggedIn', 'true');
    } catch (error) {
        loadingScreen.classList.add('d-none');
        loginScreen.classList.remove('d-none');
        if (error.code === 'auth/popup-closed-by-user') return;
        alert('Не удалось');
    }
});

// Выход
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('wasLoggedIn');
    window.signOut(auth);
});

var authResolved = false;

window.onAuthStateChanged(auth, async function(user) {
    if (user) {
        window.currentUser = user;
        localStorage.setItem('wasLoggedIn', 'true');
        
        loginScreen.classList.add('d-none');
        if (!authResolved) {
            loadingScreen.classList.remove('d-none');
            appScreen.classList.add('d-none');
        }
        
        document.getElementById('userName').textContent = (user.displayName || user.email?.split('@')[0] || 'Пользователь').split(' ')[0];
        var myUserIdEl = document.getElementById('myUserId');
        if (myUserIdEl) myUserIdEl.textContent = user.uid;
        
        try {
            var userRef = window.doc(db, 'users', user.uid);
            var userSnap = await window.getDoc(userRef);
            if (!userSnap.exists()) {
                await window.setDoc(userRef, {
                    name: user.displayName || user.email?.split('@')[0] || 'Пользователь',
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                    friends: [],
                    createdAt: Date.now()
                });
            }
        } catch (e) {}
        
        if (!authResolved) {
            authResolved = true;
            if (window.initApp) await window.initApp();
        }
        
        loadingScreen.classList.add('d-none');
        appScreen.classList.remove('d-none');
    } else {
        window.currentUser = null;
        authResolved = false;
        appScreen.classList.add('d-none');
        loadingScreen.classList.add('d-none');
        loginScreen.classList.remove('d-none');
    }
});

console.log('✅ auth.js v3 загружен');