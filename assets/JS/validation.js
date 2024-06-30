export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePasswordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
};

export const validateNotEmpty = (value) => {
    return value.trim() !== "";
};

export const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name);
};

export const validatePhone = (phone) => {
    const phoneRegex = /^\d+$/;
    return phoneRegex.test(phone);
};

export const validateFormStep = (step) => {
    let valid = true;
    const inputs = step.querySelectorAll("input, textarea, select");

    inputs.forEach(input => {
        if (input.id !== 'apartment-number' && input.id !== 'comments' && !validateNotEmpty(input.value)) {
            input.setCustomValidity("Este campo es requerido.");
            input.reportValidity();
            valid = false;
        } else {
            input.setCustomValidity("");
        }
    });

    if (step.id === "step-1") {
        const email = document.getElementById("email").value;
        if (!validateEmail(email)) {
            document.getElementById("email").setCustomValidity("Por favor ingrese un correo válido.");
            document.getElementById("email").reportValidity();
            valid = false;
        }
        
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        if (!validatePasswordsMatch(password, confirmPassword)) {
            document.getElementById("confirm-password").setCustomValidity("Las contraseñas no coinciden.");
            document.getElementById("confirm-password").reportValidity();
            valid = false;
        }
    }

    if (step.id === "step-2") {
        const name = document.getElementById("name").value;
        if (!validateName(name)) {
            document.getElementById("name").setCustomValidity("El nombre solo puede contener letras.");
            document.getElementById("name").reportValidity();
            valid = false;
        }

        const lastname = document.getElementById("lastname").value;
        if (!validateName(lastname)) {
            document.getElementById("lastname").setCustomValidity("El apellido solo puede contener letras.");
            document.getElementById("lastname").reportValidity();
            valid = false;
        }

        const phone = document.getElementById("phone").value;
        if (!validatePhone(phone)) {
            document.getElementById("phone").setCustomValidity("El número de teléfono solo puede contener números.");
            document.getElementById("phone").reportValidity();
            valid = false;
        }
    }

    return valid;
};
