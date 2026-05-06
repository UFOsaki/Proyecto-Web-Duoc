/**
 * cards.js
 * --------
 * Responsabilidades:
 *  - Consumir la API externa para obtener id, title, genre e imageUrl.
 *  - Mezclar datos de la API con la configuración local (catalogConfig.js)
 *    para obtener price, synopsis y stock.
 *  - Renderizar las cards del catálogo.
 *  - Manejar el modal de detalle mostrando el precio fijo definido localmente.
 *  - Mostrar mensaje de error visual si la API falla.
 *
 * NO usa Math.random() para ningún valor.
 * El precio mostrado en card, modal y carrito es siempre el mismo.
 */

document.addEventListener('DOMContentLoaded', function () {

    // ──────────────────────────────────────────
    // CONSTANTES
    // ──────────────────────────────────────────
    // URL del proxy local de Spring Boot que reenvía las peticiones a la API externa.
    // Usar el mismo origen evita errores CORS por completo.
    const API_BASE_URL   = '/api/mangas';
    const cardsContainer = document.getElementById('cards-container');

    // ──────────────────────────────────────────
    // FUNCIONES AUXILIARES DE FORMATO
    // ──────────────────────────────────────────

    /**
     * Capitaliza la primera letra de cada palabra en un título.
     * @param {string} title
     * @returns {string}
     */
    function capitalizeTitle(title) {
        if (typeof title !== 'string' || title.trim() === '') {
            return 'Título No Disponible';
        }
        return title
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Formatea el género (array o string) para mostrarlo en la card/modal.
     * @param {string[]|string} genre
     * @returns {string}
     */
    function formatGenre(genre) {
        const capitalize = word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

        if (Array.isArray(genre)) {
            return genre.map(capitalize).join(', ');
        }
        if (typeof genre === 'string') {
            return genre
                .split(',')
                .map(w => capitalize(w.trim()))
                .join(', ');
        }
        return 'No disponible';
    }

    /**
     * Formatea un número como precio en pesos chilenos.
     * @param {number} price
     * @returns {string}  Ej: "12.990"
     */
    function formatPrice(price) {
        return Number(price).toLocaleString('es-CL');
    }

    // ──────────────────────────────────────────
    // RENDERIZADO DE CARDS
    // ──────────────────────────────────────────

    /**
     * Crea y retorna el elemento DOM de una card de manga.
     * Recibe un objeto manga ya enriquecido (buildMangaItem).
     * @param {Object} manga
     * @returns {HTMLElement}
     */
    function createCard(manga) {
        const wrapper = document.createElement('div');
        wrapper.className = 'col-6 col-sm-6 col-md-4 col-lg-3 mb-4';

        const title  = capitalizeTitle(manga.title);
        const genre  = formatGenre(manga.genre);
        const price  = formatPrice(manga.price);

        wrapper.innerHTML = `
            <div class="card h-100">
                <img
                    src="${manga.imageUrl}"
                    class="card-img-top img-fluid"
                    alt="Portada de ${title}"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/300x420?text=Sin+imagen'"
                >
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${title}</h5>
                    <p class="card-text text-muted mb-1"><small>${genre}</small></p>
                    <p class="card-text fw-bold mt-auto mb-2">$${price}</p>
                    <a href="#"
                       class="btn btn-primary details-button"
                       data-id="${manga.id}"
                       aria-label="Ver detalles de ${title}">
                        Ver más detalles
                    </a>
                </div>
            </div>
        `;

        return wrapper;
    }

    /**
     * Muestra un mensaje de error visual en el contenedor de cards.
     * @param {string} message
     */
    function showError(message) {
        cardsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger d-inline-block" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
                <p class="mt-2 text-muted">Por favor, intenta recargar la página.</p>
            </div>
        `;
    }

    /**
     * Muestra un indicador de carga mientras se obtienen los datos de la API.
     */
    function showLoadingState() {
        cardsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando catálogo...</span>
                </div>
                <p class="mt-2 text-muted">Cargando catálogo...</p>
            </div>
        `;
    }

    // ──────────────────────────────────────────
    // CARGA DEL CATÁLOGO DESDE LA API
    // ──────────────────────────────────────────

    async function loadMangas() {
        showLoadingState();

        try {
            const response = await fetch(`${API_BASE_URL}`);

            if (!response.ok) {
                throw new Error(`La API respondió con estado ${response.status}`);
            }

            const apiMangas = await response.json();

            // Limpiar el estado de carga antes de insertar las cards
            cardsContainer.innerHTML = '';

            if (!Array.isArray(apiMangas) || apiMangas.length === 0) {
                showError('No se encontraron mangas en el catálogo.');
                return;
            }

            apiMangas.forEach(apiManga => {
                // Mezcla de datos API + configuración local por manga.id
                const manga = buildMangaItem(apiManga, API_BASE_URL);
                const card  = createCard(manga);
                cardsContainer.appendChild(card);
            });

        } catch (error) {
            console.error('Error al cargar el catálogo desde la API:', error);
            cardsContainer.innerHTML = `
            <div class="alert alert-warning text-center">
            No se pudo cargar la API externa. Se recomienda usar respaldo local o verificar el servicio en Render.
            </div>
  `;    
}

    // ──────────────────────────────────────────
    // MODAL DE DETALLE
    // ──────────────────────────────────────────

    /**
     * Carga y muestra el modal de detalle para un manga por su ID.
     * El precio mostrado proviene de catalogConfig.js, nunca de Math.random().
     * @param {string} mangaId
     */
    async function showDetailsModal(mangaId) {
        try {
            const response = await fetch(`${API_BASE_URL}/${mangaId}`);

            if (!response.ok) {
                throw new Error(`La API respondió con estado ${response.status}`);
            }

            const apiManga = await response.json();

            // Enriquecer con datos locales (mismo precio que aparece en la card)
            const manga = buildMangaItem(apiManga, API_BASE_URL);

            document.getElementById('modal-title').textContent    = capitalizeTitle(manga.title);
            document.getElementById('modal-genres').textContent   = `Géneros: ${formatGenre(manga.genre)}`;
            document.getElementById('modal-synopsis').textContent = manga.synopsis;
            document.getElementById('modal-price').textContent    = formatPrice(manga.price);
            document.getElementById('modal-image').src            = manga.imageUrl;
            document.getElementById('modal-image').alt            = `Portada de ${capitalizeTitle(manga.title)}`;

            // Guardamos el precio fijo en el botón para que cart.js lo lea sin hacer otra llamada
            const addBtn = document.getElementById('add-to-cart-button');
            addBtn.setAttribute('data-id',    manga.id);
            addBtn.setAttribute('data-title', manga.title);
            addBtn.setAttribute('data-price', manga.price);

            const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
            detailsModal.show();

        } catch (error) {
            console.error('Error al cargar los detalles del manga:', error);
            alert('No se pudieron cargar los detalles. Intenta de nuevo.');
        }
    }

    // ──────────────────────────────────────────
    // EVENTOS
    // ──────────────────────────────────────────

    // Delegación de eventos para los botones "Ver más detalles"
    cardsContainer.addEventListener('click', function (e) {
        const btn = e.target.closest('.details-button');
        if (btn) {
            e.preventDefault();
            const mangaId = btn.getAttribute('data-id');
            showDetailsModal(mangaId);
        }
    });

    // ──────────────────────────────────────────
    // INICIALIZACIÓN
    // ──────────────────────────────────────────
    loadMangas()
};
})
