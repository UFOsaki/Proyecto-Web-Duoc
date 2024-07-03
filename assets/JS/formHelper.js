import { validateFormStep } from './validation.js';
import { saveUsersDataToLocalStorage, loadUsersDataFromLocalStorage } from './storageHelper.js';

const steps = document.querySelectorAll(".step");
let currentStep = 0;
let usersData = loadUsersDataFromLocalStorage();
let currentUserData = {};

// Mostrar un paso específico
export const showStep = (step) => {
    steps.forEach((stepElement, index) => {
        stepElement.style.display = index === step ? "block" : "none";
    });
};

// Avanzar al siguiente paso
export const nextStep = () => {
    if (validateFormStep(steps[currentStep], usersData)) { // Pasar usersData a validateFormStep
        saveStepData(currentStep);
        currentStep++;
        if (currentStep >= steps.length) {
            currentStep = steps.length - 1;
        }
        showStep(currentStep);
    }
};

// Retroceder al paso anterior
export const prevStep = () => {
    currentStep--;
    if (currentStep < 0) {
        currentStep = 0;
    }
    showStep(currentStep);
};

// Verificar si el correo electrónico o nombre de usuario ya existe
export const emailOrUsernameExists = (email, username) => {
    return usersData.some(user => user.email === email || user.username === username);
};

// Guardar datos de los pasos en currentUserData
const saveStepData = (step) => {
    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    const usernameEl = document.getElementById("username");
    const nameEl = document.getElementById("name");
    const lastnameEl = document.getElementById("lastname");
    const phoneEl = document.getElementById("phone");
    const regionCodeEl = document.getElementById("region-code");
    const countryEl = document.getElementById("country");
    const regionEl = document.getElementById("region");
    const cityEl = document.getElementById("city");
    const communeEl = document.getElementById("commune");
    const streetEl = document.getElementById("street");
    const streetNumberEl = document.getElementById("street-number");
    const apartmentNumberEl = document.getElementById("apartment-number");
    const commentsEl = document.getElementById("comments");

    if (step === 0) {
        currentUserData.email = emailEl.value;
        currentUserData.password = passwordEl.value;
    }
    if (step === 1) {
        currentUserData.username = usernameEl.value;
        currentUserData.name = nameEl.value;
        currentUserData.lastname = lastnameEl.value;
        currentUserData.phone = phoneEl.value;
        currentUserData.regionCode = regionCodeEl.value;
    }
    if (step === 2) {
        currentUserData.country = countryEl.value;
        currentUserData.region = regionEl.value;
        currentUserData.city = cityEl.value;
        currentUserData.commune = communeEl.value;
    }
    if (step === 3) {
        currentUserData.street = streetEl.value;
        currentUserData.streetNumber = streetNumberEl.value;
        currentUserData.apartmentNumber = apartmentNumberEl.value || '';
        currentUserData.comments = commentsEl.value || '';
    }
    console.log(currentUserData);
};

// Finalizar el registro del usuario
export const finalizeRegistration = () => {
    if (validateFormStep(steps[currentStep], usersData)) { // Pasar usersData a validateFormStep
        saveStepData(currentStep);
        const email = currentUserData.email;
        const username = currentUserData.username;
        if (emailOrUsernameExists(email, username)) {
            alert("El correo electrónico o nombre de usuario ya existe.");
        } else {
            usersData.push(currentUserData);
            saveUsersDataToLocalStorage(usersData); // Guardar en localStorage
            console.log(usersData);
            alert("Registro completado");
            window.location.href = 'login.html';
        }
    }
};

// Mostrar el primer paso al cargar la página
showStep(currentStep);
