/**
 * cart.js
 * -------
 * Responsabilidades:
 *  - Renderizar los ítems del carrito desde localStorage.
 *  - Agregar, incrementar y decrementar ítems.
 *  - Calcular y mostrar el total.
 *  - Manejar el checkout.
 *
 * El precio de cada manga lo obtiene directamente del data-price
 * que cards.js coloca en el botón "Agregar al Carrito".
 * De esta forma se garantiza consistencia total: card → modal → carrito.
 *
 * NO usa Math.random() ni llama nuevamente a la API para obtener precios.
 */

document.addEventListener('DOMContentLoaded', function () {

    // ──────────────────────────────────────────
    // CONSTANTES
    // ──────────────────────────────────────────
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const PAYMENT_API_BASE_URL = 'https://ms-sharingan-comics-pay-mercado-pago.onrender.com/';

    // ──────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────

    /**
     * Lee el carrito desde localStorage.
     * @returns {Array<{id:string, title:string, price:number, quantity:number}>}
     */
    function getCart() {
        return JSON.parse(localStorage.getItem('cart')) || [];
    }

    /**
     * Persiste el carrito en localStorage.
     * @param {Array} cart
     */
    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    /**
     * Formatea un número como precio en pesos chilenos.
     * @param {number} price
     * @returns {string}  Ej: "12.990"
     */
    function formatPrice(price) {
        return Number(price).toLocaleString('es-CL');
    }

    function getLoggedUser() {
        return JSON.parse(localStorage.getItem('loggedInUser')) || null;
    }

    function buildCheckoutPayload() {
        const cart = getCart();
        const loggedUser = getLoggedUser();

        if (!loggedUser || !loggedUser.email) {
            throw new Error('Debes iniciar sesión antes de pagar.');
        }

        if (!cart.length) {
            throw new Error('El carrito está vacío.');
        }

        return {
            buyerEmail: loggedUser.email,
            items: cart.map(item => ({
                productCode: item.productCode,
                title: item.title,
                description: item.description || 'Sin descripción',
                quantity: item.quantity,
                unitPrice: item.unitPrice
            }))
        };
    }
    // ──────────────────────────────────────────
    // RENDERIZADO DEL CARRITO
    // ──────────────────────────────────────────

    function loadCart() {
        const cart = getCart();
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    Tu carrito está vacío.
                </li>
            `;
            cartTotalElement.textContent = '0';
            return;
        }

        cart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;

            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <span class="fw-semibold">${item.title}</span><br>
                        <small class="text-muted">$${formatPrice(item.price)} c/u</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-sm btn-outline-danger remove-item"
                                data-index="${index}"
                                aria-label="Quitar una unidad de ${item.title}">−</button>
                        <span class="fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-success add-item"
                                data-index="${index}"
                                aria-label="Agregar una unidad de ${item.title}">+</button>
                    </div>
                </div>
                <div class="text-end mt-1">
                    <small class="text-muted">Subtotal: $${formatPrice(subtotal)}</small>
                </div>
            `;

            cartItemsContainer.appendChild(listItem);
        });

        cartTotalElement.textContent = formatPrice(total);
    }

    // ──────────────────────────────────────────
    // MUTACIONES DEL CARRITO
    // ──────────────────────────────────────────

    /**
     * Agrega un manga al carrito. Si ya existe, incrementa su cantidad.
     * El precio proviene del objeto manga recibido (data-price del botón).
     * @param {{ id:string, title:string, price:number }} manga
     */
    function addToCart(manga) {
        const cart = getCart();
        const existingIndex = cart.findIndex(item => item.productCode === manga.productCode);

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({
                id: manga.id,
                productCode: manga.productCode,
                title: manga.title,
                unitPrice: manga.unitPrice,
                price: manga.unitPrice, // compatibilidad temporal con tu render actual
                quantity: 1,
                currency: manga.currency,
                imageUrl: manga.imageUrl,
                description: manga.description
            });
        }

        saveCart(cart);
        loadCart();
    }

    /**
     * Decrementa la cantidad de un ítem. Si llega a 0, lo elimina.
     * @param {number} index - Posición en el array del carrito.
     */
    function removeFromCart(index) {
        const cart = getCart();

        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            cart.splice(index, 1);
        }

        saveCart(cart);
        loadCart();
    }

    // ──────────────────────────────────────────
    // EVENTOS
    // ──────────────────────────────────────────

    // Incrementar / decrementar desde el carrito
    cartItemsContainer.addEventListener('click', function (e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const index = parseInt(btn.getAttribute('data-index'), 10);

        if (btn.classList.contains('add-item')) {
            const cart = getCart();
            cart[index].quantity += 1;
            saveCart(cart);
            loadCart();
        }

        if (btn.classList.contains('remove-item')) {
            removeFromCart(index);
        }
    });

    /**
     * Evento del botón "Agregar al Carrito" dentro del modal.
     *
     * El precio (data-price) y el título (data-title) son colocados por cards.js
     * cuando abre el modal, garantizando que el precio sea el mismo que se vio
     * en la card y en el modal (proveniente de catalogConfig.js).
     */
    document.getElementById('add-to-cart-button').addEventListener('click', function () {
        const mangaId = this.getAttribute('data-id');
        const mangaProductCode = this.getAttribute('data-partnumber');
        const mangaTitle = this.getAttribute('data-title');
        const mangaPrice = parseInt(this.getAttribute('data-price'), 10);
        const mangaCurrency = this.getAttribute('data-currency') || 'CLP';
        const mangaImage = this.getAttribute('data-image');
        const mangaDescription = this.getAttribute('data-description');

        if (!mangaId || !mangaProductCode || !mangaTitle || isNaN(mangaPrice) || mangaPrice <= 0) {
            console.error('cart.js: faltan datos obligatorios para agregar el producto al carrito.');
            return;
        }

        addToCart({
            id: mangaId,
            productCode: mangaProductCode,
            title: mangaTitle,
            unitPrice: mangaPrice,
            currency: mangaCurrency,
            imageUrl: mangaImage,
            description: mangaDescription
        });

        const detailsModal = bootstrap.Modal.getInstance(document.getElementById('detailsModal'));
        if (detailsModal) {
            detailsModal.hide();
        }
    });

    // Checkout
    document.getElementById('checkout-button').addEventListener('click', function () {
        try {
            const checkoutPayload = buildCheckoutPayload();

            console.log('Payload preparado para Mercado Pago:', checkoutPayload);

            alert('Payload de pago generado correctamente. Revisa la consola.');

            // Más adelante aquí haremos el fetch al backend Spring Boot.
            // Por ahora NO limpiamos el carrito todavía.

        } catch (error) {
            console.error('Error al preparar el checkout:', error);
            alert(error.message);
        }
    });

    // ──────────────────────────────────────────
    // INICIALIZACIÓN
    // ──────────────────────────────────────────
    loadCart();
});
