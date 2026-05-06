import { loadUsersDataFromLocalStorage } from './storageHelper.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) {
        console.error('No se encontró el formulario con id="login-form"');
        return;
    }

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const input = document.getElementById('username').value.trim().toLowerCase();
        const password = document.getElementById('password').value;

        if (!input || !password) {
            alert('Debes ingresar usuario/correo y contraseña.');
            return;
        }

        const usersData = loadUsersDataFromLocalStorage();

        const user = usersData.find(user =>
            (user.username.toLowerCase() === input || user.email === input) &&
            user.password === password
        );

        if (!user) {
            alert('Correo, usuario o contraseña incorrectos.');
            return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loggedInUser', JSON.stringify(user));

        alert(`Bienvenido, ${user.username}`);
        window.location.href = 'index.html';
    });
});