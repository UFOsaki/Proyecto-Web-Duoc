import {
    saveUsersDataToLocalStorage,
    loadUsersDataFromLocalStorage
} from './storageHelper.js';

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    if (!signupForm) {
        console.error('No se encontró el formulario con id="signup-form"');
        return;
    }

    signupForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!username || !email || !password || !confirmPassword) {
            alert('Debes completar todos los campos.');
            return;
        }

        if (!email.includes('@')) {
            alert('Debes ingresar un correo válido.');
            return;
        }

        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const usersData = loadUsersDataFromLocalStorage();

        const userAlreadyExists = usersData.some(user =>
            user.email === email || user.username === username
        );

        if (userAlreadyExists) {
            alert('Ya existe una cuenta con ese correo o nombre de usuario.');
            return;
        }

        const newUser = {
            id: crypto.randomUUID(),
            username,
            email,
            password,
            phone: '',
            createdAt: new Date().toISOString()
        };

        usersData.push(newUser);
        saveUsersDataToLocalStorage(usersData);

        alert('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
        window.location.href = 'login.html';
    });
});