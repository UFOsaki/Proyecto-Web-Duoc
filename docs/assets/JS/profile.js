/**
 * profile.js
 * ----------
 * Carga el perfil del usuario desde el backend Spring Boot.
 * Soporta autenticación local (JWT) y Clerk.
 *
 * Flujo:
 *  1. Si ClerkSessionManager está activo y tiene sesión → usar token Clerk.
 *  2. Fallback: JWT local de localStorage.
 *  3. Sin ningún token → redirigir a login.
 *
 * Seguridad:
 *  - No loguear tokens ni datos sensibles.
 *  - Logout usa ClerkSessionManager.signOut() para limpiar ambas sesiones.
 *
 * Campos que muestra del backend (ProfileResponse):
 *  userId, username, email, phone, role, authProvider, mfaEnabled
 */

document.addEventListener('DOMContentLoaded', async function () {
    // ─── Inicializar Clerk y resolver token ──────────────────────────────────
    let authToken = null;

    if (typeof ClerkSessionManager !== 'undefined') {
        await ClerkSessionManager.init();
        authToken = await ClerkSessionManager.getAuthToken();
    }

    // Fallback a JWT local
    if (!authToken || authToken === 'null' || authToken === 'undefined') {
        authToken = localStorage.getItem('authToken');
    }

    // Sin sesión → redirigir a login
    if (!authToken || authToken === 'null' || authToken === 'undefined') {
        alert('Debes iniciar sesión para ver tu perfil.');
        window.location.href = 'login.html';
        return;
    }

    const baseUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.AUTH_API_BASE_URL)
        ? APP_CONFIG.AUTH_API_BASE_URL
        : 'http://localhost:8080/api/auth';

    // ─── Cargar perfil desde backend ─────────────────────────────────────────
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
            if (typeof ClerkSessionManager !== 'undefined') {
                await ClerkSessionManager.signOut();
            } else {
                localStorage.removeItem('authToken');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('loggedInUser');
                window.location.href = 'login.html';
            }
            return;
        }

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const profile = await response.json();
        renderProfile(profile);

        // Actualizar localStorage con datos frescos del backend
        // Solo datos no sensibles — no guardar authProvider como fuente de verdad
        localStorage.setItem('loggedInUser', JSON.stringify({
            userId:   profile.userId,
            username: profile.username,
            email:    profile.email,
            role:     profile.role
        }));

    } catch (error) {
        // No loguear el error completo si puede contener datos sensibles
        console.error('[Profile] Error al cargar perfil desde backend.');

        // Fallback: mostrar datos de caché local
        try {
            const cached = JSON.parse(localStorage.getItem('loggedInUser'));
            if (cached) {
                renderProfileFromCache(cached);
                console.warn('[Profile] Mostrando datos en caché (backend no disponible).');
            }
        } catch (_) {/* ignorar */}
    }

    // ─── Guardar cambios ─────────────────────────────────────────────────────
    const saveBtn = document.getElementById('save-profile');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function () {
            const phone = document.getElementById('profile-phone')?.value || '';

            let token = null;
            if (typeof ClerkSessionManager !== 'undefined') {
                token = await ClerkSessionManager.getAuthToken();
            }
            if (!token || token === 'null' || token === 'undefined') token = localStorage.getItem('authToken');
            if (token === 'null' || token === 'undefined') token = null;

            try {
                const res = await fetch(`${baseUrl}/profile`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ phone })
                });

                if (res.ok) {
                    alert('Perfil actualizado correctamente.');
                } else {
                    alert('No se pudo guardar. Intenta de nuevo.');
                }
            } catch (_) {
                alert('Error de conexión al guardar.');
            }
        });
    }

    // ─── Logout ───────────────────────────────────────────────────────────────
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function () {
            if (typeof ClerkSessionManager !== 'undefined') {
                await ClerkSessionManager.signOut();
            } else {
                localStorage.removeItem('authToken');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('loggedInUser');
                window.location.href = (typeof ClerkSessionManager !== 'undefined') ? ClerkSessionManager.getHomeUrl() : 'index.html';
            }
        });
    }
});

// ─── Helpers de renderizado ───────────────────────────────────────────────────

/**
 * Renderiza el perfil completo con datos del backend.
 * Muestra authProvider y estado MFA.
 */
function renderProfile(profile) {
    // Campos del formulario
    setVal('profile-username', profile.username);
    setVal('profile-email',    profile.email);
    setVal('profile-phone',    profile.phone || '');
    setVal('profile-role',     profile.role);

    // Información de sesión (badge de provider + MFA)
    const sessionInfo = document.getElementById('session-info');
    if (sessionInfo) sessionInfo.style.display = 'block';

    const providerBadge = document.getElementById('auth-provider-badge');
    if (providerBadge) {
        const provider = (profile.authProvider || 'LOCAL').toUpperCase();
        providerBadge.textContent = provider;
        providerBadge.className = 'badge auth-badge ' + (
            provider === 'LOCAL'  ? 'bg-secondary' :
            provider === 'GOOGLE' ? 'bg-danger'    :
            /* CLERK */             'bg-primary'
        );
    }

    // Badge 2FA
    const mfaBadge = document.getElementById('mfa-badge');
    if (mfaBadge && profile.mfaEnabled) {
        mfaBadge.style.display = 'inline-block';
    }

    // Sección de información MFA (solo para usuarios Clerk)
    if (profile.authProvider && profile.authProvider !== 'LOCAL') {
        const mfaInfo = document.getElementById('mfa-info');
        if (mfaInfo) {
            mfaInfo.style.display = 'block';
            const mfaText = document.getElementById('mfa-text');
            if (mfaText) {
                mfaText.textContent = profile.mfaEnabled
                    ? '✅ Activo — tu cuenta está protegida con 2FA'
                    : '⚠️ No configurado — actívalo en tu portal Clerk';
            }
        }
    }
}

/** Renderiza datos básicos desde caché (sin authProvider ni mfaEnabled). */
function renderProfileFromCache(cached) {
    setVal('profile-username', cached.username);
    setVal('profile-email',    cached.email);
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}