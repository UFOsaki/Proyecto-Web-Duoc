/**
 * session.js
 * ----------
 * Renderiza dinámicamente los botones de sesión y carrito en el navbar.
 * Funciona en modo híbrido: soporta sesión Clerk y sesión JWT local.
 *
 * Lógica:
 *  - Si ClerkSessionManager.isLoggedIn() → mostrar Profile + Logout.
 *  - Si no → mostrar Login + Sign Up.
 *  - El carrito es siempre visible.
 *
 * Dependencias (deben cargarse antes en el HTML):
 *  1. config.js   (APP_CONFIG)
 *  2. clerk-auth.js (ClerkSessionManager)
 *  3. session.js  (este archivo)
 */

/**
 * Renderiza los botones de sesión en #navbar-session-actions.
 * Se llama en DOMContentLoaded y también cuando Clerk emite 'clerk-ready'.
 */
const checkSession = () => {
    // Usar ClerkSessionManager si está disponible; fallback a localStorage
    const isLoggedIn = (typeof ClerkSessionManager !== 'undefined')
        ? ClerkSessionManager.isLoggedIn()
        : (localStorage.getItem('isLoggedIn') === 'true');

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
    cartButton.setAttribute('aria-label', 'Abrir carrito de compras');
    cartButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Carrito';
    sessionActions.appendChild(cartButton);

    if (isLoggedIn) {
        // Mostrar indicador de MFA si está activo
        const userInfo = (typeof ClerkSessionManager !== 'undefined')
            ? ClerkSessionManager.getCurrentUserInfo()
            : null;

        const profileLink = document.createElement('a');
        profileLink.href = 'profile.html';
        profileLink.className = 'btn btn-outline-light';
        profileLink.role = 'button';
        profileLink.id = 'profile-link';
        profileLink.title = userInfo?.hasMfa ? 'Perfil (2FA activo ✓)' : 'Perfil';

        // Indicador visual de MFA
        const mfaBadge = userInfo?.hasMfa
            ? ' <span class="badge bg-success" style="font-size:0.65em" title="2FA activo">2FA</span>'
            : '';
        profileLink.innerHTML = 'Profile' + mfaBadge;
        sessionActions.appendChild(profileLink);

        const logoutButton = document.createElement('a');
        logoutButton.href = '#';
        logoutButton.className = 'btn btn-outline-warning';
        logoutButton.role = 'button';
        logoutButton.id = 'logout-button';
        logoutButton.textContent = 'Logout';
        logoutButton.addEventListener('click', function (e) {
            e.preventDefault();

            // Usar ClerkSessionManager si está disponible (maneja Clerk + local)
            if (typeof ClerkSessionManager !== 'undefined') {
                ClerkSessionManager.signOut();
            } else {
                // Fallback manual (modo local)
                localStorage.removeItem('authToken');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('loggedInUser');
                localStorage.removeItem('lastPaymentPreference');
                window.location.href = (typeof ClerkSessionManager !== 'undefined') ? ClerkSessionManager.getHomeUrl() : 'index.html';
            }
        });
        sessionActions.appendChild(logoutButton);

    } else {
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

    // Evento del carrito — abrir offcanvas
    const cartBtn = document.getElementById('cart-button');
    if (cartBtn) {
        cartBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const cartOffcanvasEl = document.getElementById('cartOffcanvas');
            if (cartOffcanvasEl && typeof bootstrap !== 'undefined') {
                const cartOffcanvas = new bootstrap.Offcanvas(cartOffcanvasEl);
                cartOffcanvas.show();
            }
        });
    }
};

// ─── Inicialización ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Renderizado inicial (con estado actual)
    checkSession();

    // Re-renderizar cuando Clerk esté listo (puede cambiar el estado)
    document.addEventListener('clerk-ready', () => {
        checkSession();
    });
});