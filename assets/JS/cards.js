// cards.js actualizado
document.addEventListener('DOMContentLoaded', function() {
    const baseUrl = 'https://api-rest-manga.onrender.com'; // Asegúrate de que esta URL sea correcta
    const cardsContainer = document.getElementById('cards-container');

    function capitalizeTitle(title) {
        if (typeof title !== 'string') {
            return 'Título No Disponible';
        }
        return title.split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    function formatGenre(genre) {
        if (Array.isArray(genre)) {
            return genre.map(word => {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(', ');
        } else if (typeof genre === 'string') {
            return genre.replace(/,/g, ', ').split(', ').map(word => {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(', ');
        } else {
            return 'Género No Disponible';
        }
    }

    function createCard(manga) {
        const card = document.createElement('div');
        card.className = 'col-6 col-sm-6 col-md-4 col-lg-3 mb-4';

        const title = capitalizeTitle(manga.title);
        const genre = formatGenre(manga.genre);
        const imageUrl = manga.url ? `${baseUrl}${manga.url}` : 'https://via.placeholder.com/150';

        card.innerHTML = `
            <div class="card h-100">
                <img src="${imageUrl}" class="card-img-top img-fluid" alt="Imagen de ${title}">
                <div class="card-body">
                    <h5 class="card-title">${title}</h5>
                    <p class="card-text">${genre}</p>
                    <a href="#" class="btn btn-primary mt-auto">Agregar al Carro</a>
                </div>
            </div>
        `;

        return card;
    }

    async function loadMangas() {
        try {
            const response = await fetch(`${baseUrl}/images`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const mangas = await response.json();
            mangas.forEach(manga => {
                const card = createCard(manga);
                cardsContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching data from API:', error);
        }
    }

    document.getElementById('cards-container').addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-primary')) {
            const card = e.target.closest('.card');
            const title = card.querySelector('.card-title').textContent;
            addToCart(title);
        }
    });

    function addToCart(title) {
        fetch('http://localhost:8000/api/carts/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title })
        }).then(response => {
            if (response.ok) {
                alert('Producto agregado al carrito');
            } else {
                alert('Error al agregar el producto al carrito');
            }
        });
    }

    loadMangas();
});
