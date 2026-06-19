// ==================== server.js ====================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Инициализация Firebase (ключи из .env)
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
});

const db = admin.firestore();
const app = express();

// Разрешаем запросы с вашего сайта
app.use(cors({
    origin: ['https://ваш-ник.github.io', 'http://localhost:3001']
}));
app.use(express.json());

// ========== ПРОВЕРКА ТОКЕНА (промежуточный слой) ==========
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Нет токена' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Токен недействителен' });
    }
}

// ========== ПОЛЬЗОВАТЕЛИ ==========

// Создать/получить профиль
app.post('/api/user/profile', verifyToken, async (req, res) => {
    const { uid, name, email } = req.user;
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    
    if (!snap.exists) {
        await ref.set({ name, email, friends: [], createdAt: Date.now() });
    }
    
    const data = (await ref.get()).data();
    res.json({ uid, ...data });
});

// ========== ДРУЗЬЯ ==========

// Получить друзей
app.get('/api/friends', verifyToken, async (req, res) => {
    const ref = db.collection('users').doc(req.user.uid);
    const snap = await ref.get();
    const data = snap.data();
    res.json(data?.friends || []);
});

// Добавить друга
app.post('/api/friends', verifyToken, async (req, res) => {
    const { friendId } = req.body;
    const { uid, name } = req.user;
    
    if (!friendId || friendId === uid) {
        return res.status(400).json({ error: 'Некорректный ID' });
    }
    
    // Проверяем существование друга
    const friendRef = db.collection('users').doc(friendId);
    const friendSnap = await friendRef.get();
    
    if (!friendSnap.exists) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const friendName = friendSnap.data().name;
    const friendData = { uid: friendId, name: friendName, addedAt: Date.now() };
    const myData = { uid, name, addedAt: Date.now() };
    
    // Добавляем друга мне
    await db.collection('users').doc(uid).update({
        friends: admin.firestore.FieldValue.arrayUnion(friendData)
    });
    
    // Добавляем меня другу
    await friendRef.update({
        friends: admin.firestore.FieldValue.arrayUnion(myData)
    });
    
    res.json({ success: true, friend: friendData });
});

// Удалить друга
app.delete('/api/friends/:friendId', verifyToken, async (req, res) => {
    const { friendId } = req.params;
    const { uid } = req.user;
    
    const myRef = db.collection('users').doc(uid);
    const mySnap = await myRef.get();
    const myFriends = mySnap.data()?.friends || [];
    
    const friendToRemove = myFriends.find(f => f.uid === friendId);
    
    await myRef.update({
        friends: myFriends.filter(f => f.uid !== friendId)
    });
    
    // Удаляем меня у друга
    const friendRef = db.collection('users').doc(friendId);
    const friendSnap = await friendRef.get();
    if (friendSnap.exists) {
        const theirFriends = friendSnap.data()?.friends || [];
        await friendRef.update({
            friends: theirFriends.filter(f => f.uid !== uid)
        });
    }
    
    res.json({ success: true });
});

// ========== МЕСТА ==========

// Получить коллекцию
function getCollectionName(uid, list) {
    if (list === 'my') return `users/${uid}/places`;
    const friendId = list.replace('shared_', '');
    const ids = [uid, friendId].sort();
    return `shared/${ids[0]}_${ids[1]}/places`;
}

// Загрузить места
app.get('/api/places/:list', verifyToken, async (req, res) => {
    const { list } = req.params;
    const { uid } = req.user;
    
    const collName = getCollectionName(uid, list);
    const snapshot = await db.collection(collName).orderBy('createdAt', 'desc').get();
    
    const places = [];
    snapshot.forEach(doc => places.push({ id: doc.id, ...doc.data() }));
    
    res.json(places);
});

// Добавить место
app.post('/api/places/:list', verifyToken, async (req, res) => {
    const { list } = req.params;
    const { uid, name } = req.user;
    
    const collName = getCollectionName(uid, list);
    const data = {
        ...req.body,
        author: name,
        createdAt: Date.now()
    };
    
    const docRef = await db.collection(collName).add(data);
    res.json({ id: docRef.id, ...data });
});

// Обновить место
app.put('/api/places/:list/:placeId', verifyToken, async (req, res) => {
    const { list, placeId } = req.params;
    const { uid } = req.user;
    
    const collName = getCollectionName(uid, list);
    await db.collection(collName).doc(placeId).update(req.body);
    
    res.json({ success: true });
});

// Удалить место
app.delete('/api/places/:list/:placeId', verifyToken, async (req, res) => {
    const { list, placeId } = req.params;
    const { uid } = req.user;
    
    const collName = getCollectionName(uid, list);
    await db.collection(collName).doc(placeId).delete();
    
    res.json({ success: true });
});

// ========== ЗАПУСК СЕРВЕРА ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`🔒 Firebase ключи защищены`);
});