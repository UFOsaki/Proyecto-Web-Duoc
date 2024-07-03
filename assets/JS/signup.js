import { showStep, nextStep, prevStep, finalizeRegistration } from './formHelper.js';
import './dataHelper.js';

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("signup-form").addEventListener("submit", (e) => {
        e.preventDefault();
        finalizeRegistration();
    });

    document.getElementById("next-step-1").addEventListener("click", nextStep);
    document.getElementById("next-step-2").addEventListener("click", nextStep);
    document.getElementById("next-step-3").addEventListener("click", nextStep);
    document.getElementById("prev-step-2").addEventListener("click", prevStep);
    document.getElementById("prev-step-3").addEventListener("click", prevStep);
    document.getElementById("prev-step-4").addEventListener("click", prevStep);
});
