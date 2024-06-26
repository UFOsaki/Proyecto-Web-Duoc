document.addEventListener('DOMContentLoaded', function() {
    const baseUrl = 'https://api-rest-manga.onrender.com/images';
    const cardsContainer = document.getElementById('cards-container');

    // Función para convertir la primera letra de cada palabra a mayúscula
    function capitalizeWords(str) {
        return str.split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    // Función para asegurar que cada palabra del título empieza con mayúscula
    function capitalizeTitle(title) {
        if (typeof title !== 'string') {
            return 'Título No Disponible';
        }
        return title.split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    // Función para agregar un espacio después de cada coma
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

    // Función para crear una tarjeta
    function createCard(manga) {
        const card = document.createElement('div');
        card.className = 'col-6 col-sm-6 col-md-4 col-lg-3 mb-4';

        const title = capitalizeTitle(manga.title);
        const genre = formatGenre(manga.genre);
        const imageUrl = manga.url ? `https://api-rest-manga.onrender.com${manga.url}` : 'https://via.placeholder.com/150';

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

    // Función para obtener datos de la API y generar tarjetas
    async function loadMangas() {
        try {
            for (let id = 1; id <= 10; id++) {
                const response = await fetch(`${baseUrl}/${id.toString().padStart(3, '0')}`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                const manga = await response.json();
                const card = createCard(manga);
                cardsContainer.appendChild(card);
            }
        } catch (error) {
            console.error('Error fetching data from API:', error);
        }
    }

    loadMangas();
});
