console.log("signup.js cargado correctamente");

document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signup-form');

    signupForm.addEventListener('submit', function (e) {
        e.preventDefault();

        console.log("Formulario de registro enviado");
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        if (!username || !email || !password || !confirmPassword) {
            alert('Debes completar todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const usersData = JSON.parse(localStorage.getItem('usersData')) || [];

        const emailExists = usersData.some(user => user.email === email);

        if (emailExists) {
            alert('Ya existe una cuenta registrada con este correo.');
            return;
        }

        const newUser = {
            id: Date.now(),
            username: username,
            email: email,
            password: password,
            phone: '',
            profileImage: 'assets/img/logo.png',
            createdAt: new Date().toISOString()
        };

        usersData.push(newUser);

        localStorage.setItem('usersData', JSON.stringify(usersData));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loggedInUser', JSON.stringify(newUser));

        alert('Cuenta creada correctamente.');
        window.location.href = 'profile.html';
    });
});