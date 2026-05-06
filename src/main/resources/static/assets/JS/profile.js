document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!isLoggedIn || !loggedInUser) {
        alert('Debes iniciar sesión para ver tu perfil.');
        window.location.href = 'login.html';
        return;
    }

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const saveProfileBtn = document.getElementById('save-profile');
    const logoutButton = document.getElementById('logout-button');

    if (nameInput) nameInput.value = loggedInUser.username || '';
    if (emailInput) emailInput.value = loggedInUser.email || '';
    if (phoneInput) phoneInput.value = loggedInUser.phone || '';

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const newName = nameInput.value.trim();
            const newEmail = emailInput.value.trim().toLowerCase();
            const newPhone = phoneInput.value.trim();

            if (!newName || !newEmail) {
                alert('El nombre y correo son obligatorios.');
                return;
            }

            const usersData = JSON.parse(localStorage.getItem('usersData')) || [];

            const updatedUsers = usersData.map(user => {
                if (user.id === loggedInUser.id) {
                    return {
                        ...user,
                        username: newName,
                        email: newEmail,
                        phone: newPhone
                    };
                }

                return user;
            });

            const updatedLoggedUser = {
                ...loggedInUser,
                username: newName,
                email: newEmail,
                phone: newPhone
            };

            localStorage.setItem('usersData', JSON.stringify(updatedUsers));
            localStorage.setItem('loggedInUser', JSON.stringify(updatedLoggedUser));

            alert('Perfil actualizado correctamente.');
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loggedInUser');

            alert('Sesión cerrada correctamente.');
            window.location.href = 'index.html';
        });
    }
});