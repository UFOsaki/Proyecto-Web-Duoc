/**
 * session.js
 * ----------
 * Renderiza dinámicamente los botones de sesión y carrito
 * dentro de #navbar-session-actions (dentro del collapse responsive).
 *
 * - Si hay sesión: Carrito + Profile + Logout
 * - Si no hay sesión: Carrito + Login + Sign Up
 */
const checkSession = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const sessionActions = document.getElementById('navbar-session-actions');

    if (!sessionActions) {
        console.warn('session.js: no se encontró #navbar-session-actions');
        return;
    }

    // Limpiar contenido previo
    sessionActions.innerHTML = '';

    // Carrito — siempre visible
    const cartButton = document.createElement('a');
    cartButton.href = '#';
    cartButton.className = 'btn btn-outline-light';
    cartButton.role = 'button';
    cartButton.id = 'cart-button';
    cartButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Carrito';
    sessionActions.appendChild(cartButton);

    if (isLoggedIn) {
        console.log('Usuario logueado');

        const profileLink = document.createElement('a');
        profileLink.href = 'profile.html';
        profileLink.className = 'btn btn-outline-light';
        profileLink.role = 'button';
        profileLink.id = 'profile-link';
        profileLink.textContent = 'Profile';
        sessionActions.appendChild(profileLink);

        const logoutButton = document.createElement('a');
        logoutButton.href = '#';
        logoutButton.className = 'btn btn-outline-warning';
        logoutButton.role = 'button';
        logoutButton.id = 'logout-button';
        logoutButton.textContent = 'Logout';
        logoutButton.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('authToken');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
        sessionActions.appendChild(logoutButton);

    } else {
        console.log('Usuario no logueado');

        const loginButton = document.createElement('a');
        loginButton.href = 'login.html';
        loginButton.className = 'btn btn-outline-light';
        loginButton.role = 'button';
        loginButton.id = 'login-button';
        loginButton.textContent = 'Login';
        sessionActions.appendChild(loginButton);

        const signupButton = document.createElement('a');
        signupButton.href = 'signup.html';
        signupButton.className = 'btn btn-outline-light';
        signupButton.role = 'button';
        signupButton.id = 'signup-button';
        signupButton.textContent = 'Sign Up';
        sessionActions.appendChild(signupButton);
    }

    // Evento del carrito
    document.getElementById('cart-button').addEventListener('click', function (e) {
        e.preventDefault();
        const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        cartOffcanvas.show();
    });
};

document.addEventListener('DOMContentLoaded', checkSession);