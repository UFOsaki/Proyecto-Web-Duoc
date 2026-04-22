document.addEventListener('DOMContentLoaded', function() {
    const cartButton = document.createElement('a');
    cartButton.href = '#';
    cartButton.className = 'btn btn-outline-light me-3 d-none d-lg-inline';
    cartButton.role = 'button';
    cartButton.id = 'cart-button';
    cartButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Carrito';
    
    const navbarContainer = document.querySelector('.navbar .container-fluid');

    
    if (navbarContainer) {
        navbarContainer.appendChild(cartButton);
    }

    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');

    function loadCart() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartItemsContainer.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                ${item.title} - $${item.price} x ${item.quantity}
                <div>
                    <button class="btn btn-sm btn-success add-item" data-index="${index}">+</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="btn btn-sm btn-danger remove-item" data-index="${index}">-</button>
                </div>
            `;
            total += item.price * item.quantity;
            cartItemsContainer.appendChild(listItem);
        });

        cartTotalElement.textContent = total;
    }

    function addToCart(manga) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = cart.findIndex(item => item.title === manga.title);
        
        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            manga.quantity = 1;
            cart.push(manga);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    }

    function removeFromCart(index) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            cart.splice(index, 1);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    }

    
    cartButton.addEventListener('click', function(e) {
        e.preventDefault();
        const cartOffcanvasElement = document.getElementById('cartOffcanvas');
        const cartOffcanvas = new bootstrap.Offcanvas(cartOffcanvasElement);
        cartOffcanvas.show();
        loadCart();
    });

    cartItemsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-item')) {
            const index = e.target.getAttribute('data-index');
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            cart[index].quantity += 1;
            localStorage.setItem('cart', JSON.stringify(cart));
            loadCart();
        }

        if (e.target.classList.contains('remove-item')) {
            const index = e.target.getAttribute('data-index');
            removeFromCart(index);
        }
    });

    
    const addToCartBtn = document.getElementById('add-to-cart-button');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const mangaId = this.getAttribute('data-id');
            fetch(`https://api-rest-manga.onrender.com/images/${mangaId}`)
                .then(response => response.json())
                .then(manga => {
                    const mangaToAdd = {
                        title: manga.title,
                        price: Math.floor(Math.random() * (35000 - 2000 + 1)) + 2000
                    };
                    addToCart(mangaToAdd);
                    const detailsModalElement = document.getElementById('detailsModal');
                    const detailsModal = bootstrap.Modal.getInstance(detailsModalElement);
                    if (detailsModal) detailsModal.hide();
                })
                .catch(error => console.error('Error adding manga to cart:', error));
        });
    }

    document.getElementById('checkout-button').addEventListener('click', function() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            alert('El carrito está vacío');
            return;
        }
        alert('Compra realizada con éxito');
        localStorage.removeItem('cart');
        loadCart();
    });

    loadCart();
});
