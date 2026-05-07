/**
 * login.js
 * --------
 * Login contra el backend Spring Boot.
 * Envía POST /api/auth/login y guarda el token JWT.
 */
console.log('login.js cargado correctamente');

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) {
        console.warn('login.js: no se encontró #login-form');
        return;
    }

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('Formulario de login enviado');

        const usernameOrEmail = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!usernameOrEmail || !password) {
            alert('Debes completar todos los campos.');
            return;
        }

        const baseUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.AUTH_API_BASE_URL)
            ? APP_CONFIG.AUTH_API_BASE_URL
            : 'http://localhost:8080/api/auth';

        try {
            const response = await fetch(`${baseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Usuario o contraseña incorrectos.');
                return;
            }

            // Guardar sesión
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('loggedInUser', JSON.stringify({
                userId: data.userId,
                username: data.username,
                email: data.email,
                role: data.role
            }));

            alert('Inicio de sesión exitoso.');
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Error de red al iniciar sesión:', error);
            alert('No se pudo conectar con el servidor. ¿Está el backend corriendo?');
        }
    });
});