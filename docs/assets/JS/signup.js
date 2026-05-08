/**
 * signup.js
 * ---------
 * Registro de usuario contra el backend Spring Boot.
 * Envía POST /api/auth/register y guarda el token JWT.
 */
console.log('signup.js cargado correctamente');

document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signup-form');

    signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('Formulario de registro enviado');

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        // Validaciones locales
        if (!username || !email || !password || !confirmPassword) {
            alert('Debes completar todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        // Determinar URL del backend
        const baseUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.AUTH_API_BASE_URL)
            ? APP_CONFIG.AUTH_API_BASE_URL
            : 'http://localhost:8080/api/auth';

        try {
            const response = await fetch(`${baseUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Error al registrar usuario.');
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

            alert('Cuenta creada correctamente.');
            window.location.href = 'profile.html';

        } catch (error) {
            console.error('Error de red al registrar:', error);
            alert('No se pudo conectar con el servidor. ¿Está el backend corriendo?');
        }
    });
});