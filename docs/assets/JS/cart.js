/**
 * cart.js
 * -------
 * Responsabilidades:
 *  - Renderizar los ítems del carrito desde localStorage.
 *  - Agregar, incrementar y decrementar ítems.
 *  - Calcular y mostrar el total.
 *  - Manejar el checkout con Mercado Pago vía Spring Boot.
 *
 * El precio de cada manga lo obtiene directamente del data-price
 * que cards.js coloca en el botón "Agregar al Carrito".
 * De esta forma se garantiza consistencia total: card → modal → carrito.
 *
 * NO usa Math.random() ni llama nuevamente a la API para obtener precios.
 * Requiere APP_CONFIG definido en config.js (cargado antes que este script).
 */

document.addEventListener('DOMContentLoaded', function () {

    // ──────────────────────────────────────────
    // CONSTANTES
    // ──────────────────────────────────────────
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement   = document.getElementById('cart-total');

    // ──────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────

    /**
     * Lee el carrito desde localStorage.
     * @returns {Array<{productCode:string, title:string, unitPrice:number, quantity:number}>}
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
        try {
            return JSON.parse(localStorage.getItem('loggedInUser')) || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Construye el payload para POST /api/payments/create-preference
     * Valida: sesión activa, carrito no vacío, datos mínimos de cada ítem.
     */
    function buildCheckoutPayload() {
        const authToken  = localStorage.getItem('authToken');
        const loggedUser = getLoggedUser();
        const cart       = getCart();

        if (!authToken) {
            throw new Error('NO_SESSION');
        }

        if (!loggedUser || !loggedUser.email) {
            throw new Error('NO_USER');
        }

        if (!cart.length) {
            throw new Error('EMPTY_CART');
        }

        // Validar que cada ítem tenga los datos necesarios
        for (const item of cart) {
            if (!item.productCode) throw new Error('ITEM_MISSING_CODE');
            if (!item.title)       throw new Error('ITEM_MISSING_TITLE');
            const price = item.unitPrice ?? item.price;
            if (!price || price <= 0) throw new Error('ITEM_INVALID_PRICE');
            if (!item.quantity || item.quantity <= 0) throw new Error('ITEM_INVALID_QTY');
        }

        return {
            buyerEmail: loggedUser.email,
            items: cart.map(item => ({
                productCode: item.productCode,
                title:       item.title,
                description: item.description || 'Sin descripción',
                quantity:    item.quantity,
                unitPrice:   item.unitPrice ?? item.price
            }))
        };
    }

    /**
     * Traduce códigos de error internos a mensajes legibles para el usuario.
     */
    function getErrorMessage(errorCode) {
        const messages = {
            'NO_SESSION':          'Tu sesión ha expirado o no estás logueado. Por favor, inicia sesión.',
            'NO_USER':             'No se encontró información de tu cuenta. Por favor, inicia sesión nuevamente.',
            'EMPTY_CART':          'Tu carrito está vacío. Agrega productos antes de pagar.',
            'ITEM_MISSING_CODE':   'Uno de los productos no tiene código. Refresca la página e intenta de nuevo.',
            'ITEM_MISSING_TITLE':  'Uno de los productos no tiene título. Refresca la página e intenta de nuevo.',
            'ITEM_INVALID_PRICE':  'Uno de los productos tiene precio inválido. Refresca la página e intenta de nuevo.',
            'ITEM_INVALID_QTY':    'La cantidad de uno de los productos es inválida.',
        };
        return messages[errorCode] || errorCode;
    }

    // ──────────────────────────────────────────
    // RENDERIZADO DEL CARRITO
    // ──────────────────────────────────────────

    function loadCart() {
        if (!cartItemsContainer) return; // La página puede no tener el contenedor

        const cart  = getCart();
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    Tu carrito está vacío.
                </li>
            `;
            if (cartTotalElement) cartTotalElement.textContent = '0';
            return;
        }

        cart.forEach((item, index) => {
            const price    = item.unitPrice ?? item.price ?? 0;
            const subtotal = price * item.quantity;
            total += subtotal;

            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <span class="fw-semibold">${item.title}</span><br>
                        <small class="text-muted">$${formatPrice(price)} c/u</small>
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

        if (cartTotalElement) cartTotalElement.textContent = formatPrice(total);
    }

    // ──────────────────────────────────────────
    // MUTACIONES DEL CARRITO
    // ──────────────────────────────────────────

    /**
     * Agrega un manga al carrito. Si ya existe, incrementa su cantidad.
     * El precio proviene del objeto manga recibido (data-price del botón).
     * @param {{ id:string, productCode:string, title:string, unitPrice:number }} manga
     */
    function addToCart(manga) {
        const cart          = getCart();
        const existingIndex = cart.findIndex(item => item.productCode === manga.productCode);

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({
                id:          manga.id,
                productCode: manga.productCode,
                title:       manga.title,
                unitPrice:   manga.unitPrice,
                price:       manga.unitPrice, // alias para compatibilidad con vista_carrito
                quantity:    1,
                currency:    manga.currency || 'CLP',
                imageUrl:    manga.imageUrl,
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
    if (cartItemsContainer) {
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
    }

    /**
     * Evento del botón "Agregar al Carrito" dentro del modal.
     *
     * El precio (data-price) y el título (data-title) son colocados por cards.js
     * cuando abre el modal, garantizando que el precio sea el mismo que se vio
     * en la card y en el modal (proveniente de catalogConfig.js).
     */
    const addToCartBtn = document.getElementById('add-to-cart-button');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function () {
            const mangaId          = this.getAttribute('data-id');
            const mangaProductCode = this.getAttribute('data-partnumber');
            const mangaTitle       = this.getAttribute('data-title');
            const mangaPrice       = parseInt(this.getAttribute('data-price'), 10);
            const mangaCurrency    = this.getAttribute('data-currency') || 'CLP';
            const mangaImage       = this.getAttribute('data-image');
            const mangaDescription = this.getAttribute('data-description');

            if (!mangaId || !mangaProductCode || !mangaTitle || isNaN(mangaPrice) || mangaPrice <= 0) {
                console.error('cart.js: faltan datos obligatorios para agregar el producto al carrito.');
                return;
            }

            addToCart({
                id:          mangaId,
                productCode: mangaProductCode,
                title:       mangaTitle,
                unitPrice:   mangaPrice,
                currency:    mangaCurrency,
                imageUrl:    mangaImage,
                description: mangaDescription
            });

            const detailsModal = bootstrap.Modal.getInstance(document.getElementById('detailsModal'));
            if (detailsModal) {
                detailsModal.hide();
            }
        });
    }

    // ──────────────────────────────────────────
    // CHECKOUT — llama a Spring Boot → Mercado Pago
    // ──────────────────────────────────────────
    const checkoutBtn = document.getElementById('checkout-button');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async function () {
            const originalText = checkoutBtn.textContent;

            try {
                // 1. Construir y validar payload
                const checkoutPayload = buildCheckoutPayload();
                const authToken       = localStorage.getItem('authToken');

                // 2. Bloquear botón mientras se procesa
                checkoutBtn.textContent = 'Procesando...';
                checkoutBtn.disabled    = true;

                console.log('[Checkout] Enviando payload a backend:', checkoutPayload);

                // 3. POST al backend Spring Boot
                const response = await fetch(
                    `${APP_CONFIG.PAYMENT_API_BASE_URL}/api/payments/create-preference`,
                    {
                        method:  'POST',
                        headers: {
                            'Content-Type':  'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(checkoutPayload)
                    }
                );

                // 4. Manejar errores HTTP
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('loggedInUser');
                        throw new Error('Sesión inválida o expirada. Por favor inicia sesión nuevamente.');
                    }
                    let errorMsg = `Error del servidor (${response.status}).`;
                    try {
                        const errBody = await response.json();
                        errorMsg = errBody.error || errBody.message || errorMsg;
                    } catch (_) {
                        errorMsg = await response.text() || errorMsg;
                    }
                    throw new Error(errorMsg);
                }

                // 5. Parsear respuesta
                const paymentResponse = await response.json();
                console.log('[Checkout] Respuesta Mercado Pago:', paymentResponse);

                // 6. Guardar referencia del pago (no el carrito)
                localStorage.setItem('lastPaymentPreference', JSON.stringify(paymentResponse));

                // 7. Redirigir a Mercado Pago (sandbox primero, luego initPoint)
                const redirectUrl = paymentResponse.sandboxInitPoint || paymentResponse.initPoint;
                if (redirectUrl) {
                    // NO limpiar carrito aquí — se limpia en payment-success.html
                    window.location.href = redirectUrl;
                } else {
                    throw new Error('No se recibió URL de pago de Mercado Pago. Contacta soporte.');
                }

            } catch (error) {
                console.error('[Checkout] Error:', error);

                // Detectar error de red/CORS
                let displayMsg = error.message;
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    displayMsg = 'Error de conexión. Verifica que el servidor esté activo y no haya problemas de CORS.';
                } else {
                    displayMsg = getErrorMessage(error.message);
                }

                alert(displayMsg);

                // Restaurar botón
                checkoutBtn.textContent = originalText;
                checkoutBtn.disabled    = false;

                // Redirigir a login si no hay sesión
                if (error.message === 'NO_SESSION' || error.message === 'NO_USER') {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // ──────────────────────────────────────────
    // INICIALIZACIÓN
    // ──────────────────────────────────────────
    loadCart();
});
