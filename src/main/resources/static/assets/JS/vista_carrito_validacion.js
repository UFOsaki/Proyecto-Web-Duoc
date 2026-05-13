document.addEventListener('DOMContentLoaded', () => {
    
    const cartListItemsContainer = document.getElementById('cart-list-items');
    const clearCartBtn = document.getElementById('clear-cart-button');

    function renderCartItems() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Elementos de resumen
        const summaryTotalItems = document.getElementById('summary-total-items');
        const summaryTotalPrice = document.getElementById('summary-total-price');
        let totalPrice = 0;

        cartListItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'list-group-item text-center text-muted py-5';
            emptyItem.innerHTML = `<i class="fas fa-shopping-cart fa-3x mb-3 d-block"></i>Tu carrito está vacío. <a href="index.html">¡Agrega algunos cómics!</a>`;
            cartListItemsContainer.appendChild(emptyItem);
            
            if (clearCartBtn) clearCartBtn.style.display = 'none';
            if (summaryTotalItems) summaryTotalItems.textContent = '$0';
            if (summaryTotalPrice) summaryTotalPrice.textContent = '$0';
            return;
        }

        if (clearCartBtn) clearCartBtn.style.display = 'block';

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;

            const listItem = document.createElement('li');
            listItem.className = 'list-group-item cart-item-row mb-2 border rounded';
            listItem.innerHTML = `
                <div class="row align-items-center">
                    <div class="col-1 text-center">
                        <div class="form-check d-inline-block">
                            <input class="form-check-input cart-item-checkbox" type="checkbox" checked>
                        </div>
                    </div>
                    <div class="col-2">
                        <img src="assets/img/logo.png" alt="Imagen de ${item.title}" class="img-fluid rounded border" style="max-height: 80px; object-fit: cover;">
                    </div>
                    <div class="col-6">
                        <div class="comic-details">
                            <h6 class="comic-title mb-1">${item.title}</h6>
                            <p class="comic-genres-options text-muted mb-1 small">Cantidad: ${item.quantity}</p>
                            <p class="comic-status text-success mb-0 small">Disponible</p>
                        </div>
                    </div>
                    <div class="col-3 text-end">
                        <div class="price-quantity-actions">
                            <div class="final-price fw-bold mb-2">
                                $${item.price} c/u
                            </div>
                            <button class="btn btn-outline-danger btn-sm remove-item-btn" data-index="${index}">
                                <i class="fas fa-trash-alt"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cartListItemsContainer.appendChild(listItem);
        });

        // Actualizar resumen de precios
        if (summaryTotalItems) summaryTotalItems.textContent = `$${totalPrice}`;
        if (summaryTotalPrice) summaryTotalPrice.textContent = `$${totalPrice}`;
    }

    renderCartItems();

    // vaciar carrito desde esta vista
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            localStorage.removeItem('cart');
            renderCartItems();
        });
    }

    //  eliminar un item específico desde esta vista
    cartListItemsContainer.addEventListener('click', function(e) {
        const removeBtn = e.target.closest('.remove-item-btn');
        if (removeBtn) {
            const index = removeBtn.getAttribute('data-index');
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCartItems();
        }
    });

    
});