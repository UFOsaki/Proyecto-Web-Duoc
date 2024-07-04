import { loadUsersDataFromLocalStorage } from './storageHelper.js';

const handleLogin = (event) => {
    event.preventDefault();
    
    const input = document.getElementById('username').value; 
    const password = document.getElementById('password').value;

    console.log('Ingresado:', { input, password });

    const usersData = loadUsersDataFromLocalStorage();
    console.log('Usuarios almacenados:', usersData);

    const user = usersData.find(user => (user.username === input || user.email === input) && user.password === password);

    if (user) {
        alert('Login exitoso!');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        window.location.href = 'index.html'; 
    } else {
        alert('Username, email o password incorrectos.');
    }
};

// Agregar evento de escucha al formulario de login
document.getElementById('login-form').addEventListener('submit', handleLogin);
