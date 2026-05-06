const checkSession = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const navbarContainer = document.querySelector('.navbar .container-fluid');

    // Limpiar botones existentes incluyendo el carrito
    const existingButtons = document.querySelectorAll(
        '#login-button, #signup-button, #profile-link, #cart-button'
    );
    existingButtons.forEach(button => button.remove());

    // Carrito — siempre visible
    const cartButton = document.createElement('a');
    cartButton.href = '#';
    cartButton.className = 'btn btn-outline-light me-2';
    cartButton.role = 'button';
    cartButton.id = 'cart-button';
    cartButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Carrito';
    navbarContainer.appendChild(cartButton);

    if (isLoggedIn) {
        console.log('Usuario logueado');
        const profileLink = document.createElement('a');
        profileLink.href = 'profile.html';
        profileLink.className = 'btn btn-outline-light me-2';
        profileLink.role = 'button';
        profileLink.textContent = 'Profile';
        profileLink.id = 'profile-link';
        navbarContainer.appendChild(profileLink);

        const mobileProfileLink = document.createElement('li');
        mobileProfileLink.className = 'nav-item';
        mobileProfileLink.innerHTML = '<a class="nav-link" href="profile.html">Profile</a>';
        document.querySelector('ul.navbar-nav').appendChild(mobileProfileLink);

    } else {
        console.log('Usuario no logueado');
        const loginButton = document.createElement('a');
        loginButton.href = 'login.html';
        loginButton.className = 'btn btn-outline-light me-2';
        loginButton.role = 'button';
        loginButton.textContent = 'Login';
        loginButton.id = 'login-button';

        const signupButton = document.createElement('a');
        signupButton.href = 'signup.html';
        signupButton.className = 'btn btn-outline-light';
        signupButton.role = 'button';
        signupButton.textContent = 'Sign Up';
        signupButton.id = 'signup-button';

        navbarContainer.appendChild(loginButton);
        navbarContainer.appendChild(signupButton);

        const mobileNav = document.querySelector('ul.navbar-nav');

        mobileNav.appendChild(mobileLoginLink);
        mobileNav.appendChild(mobileSignupLink);
    }

    // Reasignar evento al carrito
    document.getElementById('cart-button').addEventListener('click', function(e) {
        e.preventDefault();
        const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        cartOffcanvas.show();
    });
};

document.addEventListener('DOMContentLoaded', checkSession);