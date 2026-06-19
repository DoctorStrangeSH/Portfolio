// ==================== auth.js ====================
const auth = window.firebaseAuth;
const db = window.firebaseDb;

document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
        await window.signInWithPopup(auth, new window.GoogleAuthProvider());
    } catch (e) {
        alert('Ошибка входа: ' + e.message);
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => window.signOut(auth));

window.onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.currentUser = user;
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('appScreen').classList.remove('d-none');
        document.getElementById('userName').textContent = user.displayName.split(' ')[0];
        document.getElementById('myUserId').textContent = user.uid;
        
        const ref = window.firebaseDb.doc(db, 'users', user.uid);
        if (!(await window.getDoc(ref)).exists()) {
            await window.setDoc(ref, { name: user.displayName, email: user.email, friends: [], createdAt: Date.now() });
        }
        
        if (window.initApp) window.initApp();
    } else {
        window.currentUser = null;
        document.getElementById('loginScreen').classList.remove('d-none');
        document.getElementById('appScreen').classList.add('d-none');
    }
});