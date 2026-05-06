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

// Avanzar al siguiente paso (sin validación)
export const nextStep = () => {
    saveStepData(currentStep);
    currentStep++;
    if (currentStep >= steps.length) {
        currentStep = steps.length - 1;
    }
    showStep(currentStep);
};

// Retroceder al paso anterior
export const prevStep = () => {
    currentStep--;
    if (currentStep < 0) {
        currentStep = 0;
    }
    showStep(currentStep);
};

// Guardar datos de los pasos en currentUserData
const saveStepData = (step) => {
    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };

    if (step === 0) {
        currentUserData.email    = getValue("email");
        currentUserData.password = getValue("password");
        currentUserData.username = getValue("username");
    }
    if (step === 1) {
        currentUserData.name       = getValue("name");
        currentUserData.lastname   = getValue("lastname");
        currentUserData.phone      = getValue("phone");
        currentUserData.regionCode = getValue("region-code");
    }
    if (step === 2) {
        currentUserData.country = getValue("country");
        currentUserData.region  = getValue("region");
        currentUserData.city    = getValue("city");
        currentUserData.commune = getValue("commune");
    }
    if (step === 3) {
        currentUserData.street          = getValue("street");
        currentUserData.streetNumber    = getValue("street-number");
        currentUserData.apartmentNumber = getValue("apartment-number");
        currentUserData.comments        = getValue("comments");
    }

    console.log('Datos actuales:', currentUserData);
};

// Finalizar el registro (sin validación, guarda directo)
export const finalizeRegistration = () => {
    saveStepData(currentStep);
    usersData.push(currentUserData);
    saveUsersDataToLocalStorage(usersData);
    console.log('Usuarios registrados:', usersData);
    alert("Registro completado");
    window.location.href = 'index.html';
};

// Mostrar el primer paso al cargar la página
showStep(currentStep);
