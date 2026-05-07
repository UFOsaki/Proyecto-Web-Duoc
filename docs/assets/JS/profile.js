/**
 * profile.js
 * ----------
 * Carga el perfil del usuario desde el backend usando el token JWT.
 * Si no hay token, redirige a login.
 */
console.log('profile.js cargado correctamente');

document.addEventListener('DOMContentLoaded', async function () {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const authToken = localStorage.getItem('authToken');

    if (!isLoggedIn || !authToken) {
        alert('Debes iniciar sesión para ver tu perfil.');
        window.location.href = 'login.html';
        return;
    }

    const baseUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.AUTH_API_BASE_URL)
        ? APP_CONFIG.AUTH_API_BASE_URL
        : 'http://localhost:8080/api/auth';

    try {
        const response = await fetch(`${baseUrl}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('authToken');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loggedInUser');
            alert('Tu sesión ha expirado. Inicia sesión de nuevo.');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const profile = await response.json();

        // Renderizar perfil
        const usernameEl = document.getElementById('profile-username');
        const emailEl = document.getElementById('profile-email');
        const phoneEl = document.getElementById('profile-phone');

        if (usernameEl) usernameEl.value = profile.username || '';
        if (emailEl) emailEl.value = profile.email || '';
        if (phoneEl) phoneEl.value = profile.phone || '';

        // Actualizar localStorage con datos frescos
        localStorage.setItem('loggedInUser', JSON.stringify({
            userId: profile.userId,
            username: profile.username,
            email: profile.email,
            role: profile.role
        }));

    } catch (error) {
        console.error('Error al cargar perfil:', error);

        // Fallback: mostrar datos de localStorage si el backend no responde
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedInUser) {
            const usernameEl = document.getElementById('profile-username');
            const emailEl = document.getElementById('profile-email');
            if (usernameEl) usernameEl.value = loggedInUser.username || '';
            if (emailEl) emailEl.value = loggedInUser.email || '';
            console.warn('Mostrando datos de caché local (backend no disponible).');
        }
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('authToken');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    }
});