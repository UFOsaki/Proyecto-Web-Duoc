document.addEventListener('DOMContentLoaded', function() {
    const baseUrl = 'https://api-rest-manga.onrender.com';
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
            return 'Géneros: ' + genre.map(word => {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(', ');
        } else if (typeof genre === 'string') {
            return 'Géneros: ' + genre.replace(/,/g, ', ').split(', ').map(word => {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(', ');
        } else {
            return 'Géneros: No Disponible';
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
                    <a href="#" class="btn btn-primary mt-auto details-button" data-id="${manga.id}">Ver más detalles</a>
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
        if (e.target.classList.contains('details-button')) {
            e.preventDefault();
            const mangaId = e.target.getAttribute('data-id');
            showDetailsModal(mangaId);
        }
    });

    async function showDetailsModal(mangaId) {
        try {
            const response = await fetch(`${baseUrl}/images/${mangaId}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const manga = await response.json();
            document.getElementById('modal-title').textContent = capitalizeTitle(manga.title);
            document.getElementById('modal-genres').textContent = formatGenre(manga.genre);
            document.getElementById('modal-synopsis').textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
            document.getElementById('modal-price').textContent = Math.floor(Math.random() * (35000 - 2000 + 1)) + 2000;
            document.getElementById('modal-image').src = manga.url ? `${baseUrl}${manga.url}` : 'https://via.placeholder.com/150';
            document.getElementById('add-to-cart-button').setAttribute('data-id', manga.id);
            const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
            detailsModal.show();
        } catch (error) {
            console.error('Error fetching details from API:', error);
        }
    }

    loadMangas();
});
