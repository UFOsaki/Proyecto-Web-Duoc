import { showStep, nextStep, prevStep, finalizeRegistration } from './formHelpers.js';
import './dataHelpers.js';

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("signup-form").addEventListener("submit", (event) => {
        event.preventDefault();
        finalizeRegistration();
    });

    document.getElementById("next-step-1").addEventListener("click", nextStep);
    document.getElementById("next-step-2").addEventListener("click", nextStep);
    document.getElementById("next-step-3").addEventListener("click", nextStep);
    document.getElementById("prev-step-2").addEventListener("click", prevStep);
    document.getElementById("prev-step-3").addEventListener("click", prevStep);
    document.getElementById("prev-step-4").addEventListener("click", prevStep);
});
