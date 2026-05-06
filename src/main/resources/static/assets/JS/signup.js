import { showStep, nextStep, prevStep, finalizeRegistration } from './formHelper.js';

document.addEventListener("DOMContentLoaded", function () {

    // Botones de avance
    const btnNext1 = document.getElementById("next-step-1");
    const btnNext2 = document.getElementById("next-step-2");
    const btnNext3 = document.getElementById("next-step-3");

    // Botones de retroceso
    const btnPrev2 = document.getElementById("prev-step-2");
    const btnPrev3 = document.getElementById("prev-step-3");
    const btnPrev4 = document.getElementById("prev-step-4");

    // Asignar eventos solo si el elemento existe en el HTML
    if (btnNext1) btnNext1.addEventListener("click", nextStep);
    if (btnNext2) btnNext2.addEventListener("click", nextStep);
    if (btnNext3) btnNext3.addEventListener("click", nextStep);
    if (btnPrev2) btnPrev2.addEventListener("click", prevStep);
    if (btnPrev3) btnPrev3.addEventListener("click", prevStep);
    if (btnPrev4) btnPrev4.addEventListener("click", prevStep);

    // Submit final
    const form = document.getElementById("signup-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            finalizeRegistration();
        });
    }
});
