// ==================== api.js ====================


const API_URL = 'http://localhost:3000'; // Замените на ваш сервер

async function apiRequest(path, options = {}) {
    const token = await window.firebaseAuth.currentUser?.getIdToken();
    
    if (!token) {
        throw new Error('Не авторизован');
    }
    
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    
    if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
    }
    
    return response.json();
}

// Места
window.API = {
    getPlaces: (list) => apiRequest(`/api/places/${list}`),
    addPlace: (list, data) => apiRequest(`/api/places/${list}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updatePlace: (list, placeId, data) => apiRequest(`/api/places/${list}/${placeId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deletePlace: (list, placeId) => apiRequest(`/api/places/${list}/${placeId}`, {
        method: 'DELETE'
    }),
    
    // Друзья
    getFriends: () => apiRequest('/api/friends'),
    addFriend: (friendId) => apiRequest('/api/friends', {
        method: 'POST',
        body: JSON.stringify({ friendId })
    }),
    removeFriend: (friendId) => apiRequest(`/api/friends/${friendId}`, {
        method: 'DELETE'
    }),
    
    // Профиль
    createProfile: () => apiRequest('/api/user/profile', { method: 'POST' })
};