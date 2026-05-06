document.addEventListener('DOMContentLoaded', () => {
    
    //cambio de  la foto de perfil 
    const profilePicInput = document.getElementById('profile-pic-input');
    const profileImgPreview = document.getElementById('profile-img-preview');

    if (profilePicInput && profileImgPreview) {
        profilePicInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImgPreview.src = e.target.result; //cambio de imagen 
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // guardado de cambios en el perfil  
    const saveProfileBtn = document.getElementById('save-profile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const newName = document.getElementById('profile-name').value;
            const newEmail = document.getElementById('profile-email').value;
            const newPhone = document.getElementById('profile-phone').value;

            if(newName.trim() !== "" && newEmail.trim() !== "") {
                alert(`Perfil actualizado:\nNombre: ${newName}\nCorreo: ${newEmail}\nTeléfono: ${newPhone}`);
                // se guardarán los datos en el LocalStorage 
            } else {
                alert('Por favor, ingresa al menos un nombre de usuario y correo.');
            }
        });
    }

    // cerrar sesión
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    }
});