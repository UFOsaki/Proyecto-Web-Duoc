document.addEventListener("DOMContentLoaded", function() {
    const navbarNav = document.getElementById('navbarNav');
    const cartButton = document.getElementById('cart-button');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');

    function adjustNavItems() {
        if (window.innerWidth <= 992) { // Incluye tabletas y tamaños menores
            if (cartButton.parentElement.tagName !== 'LI') {
                let cartItem = document.createElement('li');
                cartItem.classList.add('nav-item');
                cartItem.innerHTML = `<a class="nav-link" href="#">Carrito</a>`;
                navbarNav.querySelector('ul').appendChild(cartItem);
                cartButton.style.display = 'none';
            }
            if (loginButton.parentElement.tagName !== 'LI') {
                let loginItem = document.createElement('li');
                loginItem.classList.add('nav-item');
                loginItem.innerHTML = `<a class="nav-link" href="#">Login</a>`;
                navbarNav.querySelector('ul').appendChild(loginItem);
                loginButton.style.display = 'none';
            }
            if (signupButton.parentElement.tagName !== 'LI') {
                let signupItem = document.createElement('li');
                signupItem.classList.add('nav-item');
                signupItem.innerHTML = `<a class="nav-link" href="#">Sign Up</a>`;
                navbarNav.querySelector('ul').appendChild(signupItem);
                signupButton.style.display = 'none';
            }
        } else {
            cartButton.style.display = 'inline';
            loginButton.style.display = 'inline';
            signupButton.style.display = 'inline';
            let items = navbarNav.querySelectorAll('ul .nav-item');
            items.forEach(item => {
                if (item.innerText === 'Carrito' || item.innerText === 'Login' || item.innerText === 'Sign Up') {
                    item.remove();
                }
            });
        }
    }

    window.addEventListener('resize', adjustNavItems);
    adjustNavItems();
});
