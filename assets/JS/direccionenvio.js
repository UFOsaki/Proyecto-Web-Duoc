document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("shipping-form").addEventListener("submit", function(e) {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const direccion = document.getElementById("direccion").value;

        if (nombre === "" || direccion === "") {
            alert("Por favor completa los campos obligatorios");
            return;
        }

        window.location.href = "pago.html";
    });
});