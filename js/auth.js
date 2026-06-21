// ==================== auth.js ====================
const auth = window.auth;
const db = window.db;

document.getElementById('loginScreen').classList.remove('d-none');
document.getElementById('appScreen').classList.add('d-none');
document.getElementById('loadingScreen').classList.add('d-none');

document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
        const provider = new window.GoogleAuthProvider();
        await window.signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Не удалось войти. Проверьте соединение.');
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => window.signOut(auth));

let authResolved = false;

window.onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('loginScreen');
    const appScreen = document.getElementById('appScreen');
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (user) {
        window.currentUser = user;
        loginScreen.classList.add('d-none');
        
        if (!authResolved) {
            loadingScreen.classList.remove('d-none');
        }
        
        document.getElementById('userName').textContent = user.displayName.split(' ')[0];
        const myUserIdEl = document.getElementById('myUserId');
        if (myUserIdEl) myUserIdEl.textContent = user.uid;
        
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
        
        if (!authResolved) {
            authResolved = true;
            if (window.initApp) await window.initApp();
            loadingScreen.classList.add('d-none');
            appScreen.classList.remove('d-none');
        }
    } else {
        window.currentUser = null;
        authResolved = false;
        loginScreen.classList.remove('d-none');
        appScreen.classList.add('d-none');
        loadingScreen.classList.add('d-none');
    }
});