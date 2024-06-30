import { validateFormStep } from './validation.js';

const steps = document.querySelectorAll(".step");
let currentStep = 0;
let usersData = [];
let currentUserData = {};

export const showStep = (step) => {
    steps.forEach((stepElement, index) => {
        stepElement.style.display = index === step ? "block" : "none";
    });
};

export const nextStep = () => {
    if (validateFormStep(steps[currentStep])) {
        saveStepData(currentStep);
        currentStep++;
        if (currentStep >= steps.length) {
            currentStep = steps.length - 1;
        }
        showStep(currentStep);
    }
};

export const prevStep = () => {
    currentStep--;
    if (currentStep < 0) {
        currentStep = 0;
    }
    showStep(currentStep);
};

export const emailOrUsernameExists = (email, username) => {
    return usersData.some(user => user.email === email || user.username === username);
};

export const finalizeRegistration = () => {
    if (validateFormStep(steps[currentStep])) {
        saveStepData(currentStep);
        const email = currentUserData.email;
        const username = currentUserData.username;
        if (emailOrUsernameExists(email, username)) {
            alert("El correo electrónico o nombre de usuario ya existe.");
        } else {
            usersData.push(currentUserData);
            console.log(usersData); // For debugging purposes
            alert("Registro completado");
            window.location.href = "login.html";
        }
    }
};

const saveStepData = (step) => {
    if (step === 0) {
        currentUserData.email = document.getElementById("email").value;
        currentUserData.password = document.getElementById("password").value;
    }
    if (step === 1) {
        currentUserData.username = document.getElementById("username").value;
        currentUserData.name = document.getElementById("name").value;
        currentUserData.lastname = document.getElementById("lastname").value;
        currentUserData.phone = document.getElementById("phone").value;
        currentUserData.regionCode = document.getElementById("region-code").value;
    }
    if (step === 2) {
        currentUserData.country = document.getElementById("country").value;
        currentUserData.region = document.getElementById("region").value;
        currentUserData.city = document.getElementById("city").value;
        currentUserData.commune = document.getElementById("commune").value;
    }
    if (step === 3) {
        currentUserData.street = document.getElementById("street").value;
        currentUserData.streetNumber = document.getElementById("street-number").value;
        currentUserData.apartmentNumber = document.getElementById("apartment-number").value || '';
        currentUserData.comments = document.getElementById("comments").value || '';
    }
    console.log(currentUserData); // For debugging purposes
};

showStep(currentStep);
