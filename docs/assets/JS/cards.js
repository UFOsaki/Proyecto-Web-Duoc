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
    const API_BASE_URL = 'https://api-rest-manga.onrender.com';
    const CORS_PROXY   = 'https://corsproxy.io/?url=';
    const cardsContainer = document.getElementById('cards-container');

    // Cache de mangas cargados para evitar re-fetch en el modal
    let loadedMangas = [];

    // ──────────────────────────────────────────
    // FUNCIONES AUXILIARES DE FORMATO
    // ──────────────────────────────────────────

    function capitalizeTitle(title) {
        if (typeof title !== 'string' || title.trim() === '') {
            return 'Título No Disponible';
        }
        return title
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

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

    function formatPrice(price) {
        return Number(price).toLocaleString('es-CL');
    }

    // ──────────────────────────────────────────
    // FETCH MULTI-ORIGEN CON RESILIENCIA (FALLBACK)
    // ──────────────────────────────────────────

    async function loadCatalogData() {
        let rawItems = [];
        let fetchedFromApi = false;

        const primarySources = [];
        if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.MANGA_API_BASE_URL) {
            primarySources.push(`${APP_CONFIG.MANGA_API_BASE_URL}/images`);
        }
        primarySources.push('/api/mangas/images');

        for (const url of primarySources) {
            try {
                console.log(`Intentando cargar catálogo desde: ${url}`);
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        rawItems = data.map(item => {
                            return { ...item, category: item.category || 'Manga' };
                        });
                        fetchedFromApi = true;
                        console.log(`Catálogo cargado exitosamente de la API/Proxy: ${url}`);
                        break;
                    }
                }
            } catch (err) {
                console.warn(`Fallo al cargar de la fuente ${url}:`, err.message);
            }
        }

        let fallbackItems = [];
        try {
            console.log('Cargando catálogo fallback local...');
            const response = await fetch('assets/data/catalogo-fallback.json');
            if (response.ok) {
                fallbackItems = await response.json();
                console.log(`Catálogo fallback cargado: ${fallbackItems.length} items.`);
            }
        } catch (err) {
            console.error('Error al cargar catalogo-fallback.json:', err);
        }

        if (!fetchedFromApi) {
            console.warn('No se pudo contactar ninguna API de mangas. Usando fallback local completo.');
            rawItems = fallbackItems;
        } else {
            const nonMangaItems = fallbackItems.filter(item => item.category !== 'Manga');
            const apiMangaIds = new Set(rawItems.map(item => String(item.id)));
            const uniqueNonMangaItems = nonMangaItems.filter(item => !apiMangaIds.has(String(item.id)));
            rawItems = [...rawItems, ...uniqueNonMangaItems];
        }

        return rawItems;
    }

    // ──────────────────────────────────────────
    // RENDERIZADO DE CARDS
    // ──────────────────────────────────────────

    function createCard(manga) {
        const wrapper = document.createElement('div');
        wrapper.className = 'col-6 col-sm-6 col-md-4 col-lg-3 mb-4';

        const title = capitalizeTitle(manga.title);
        const genre = formatGenre(manga.genre);
        const price = formatPrice(manga.price);
        const stock = manga.stock;
        const partNumber = manga.partNumber;

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
                    <p class="card-text fw-bold mt-auto mb-1">$${price}</p>
                    <p class="card-text mb-1">
                        <small class="text-muted">Código: ${partNumber}</small>
                    </p>
                    <p class="card-text mb-2">
                        <small class="${stock > 0 ? 'text-success' : 'text-danger'}">
                            ${stock > 0 ? `Stock disponible: ${stock}` : 'Sin stock'}
                        </small>
                    </p>
                    <a href="#"
                       class="btn btn-primary details-button"
                       data-id="${manga.id}"
                       data-partnumber="${partNumber}"
                       data-price="${manga.price}"
                       data-stock="${stock}"
                       aria-label="Ver detalles de ${title}">
                        Ver más detalles
                    </a>
                </div>
            </div>
        `;

        return wrapper;
    }

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
            const rawItems = await loadCatalogData();
            cardsContainer.innerHTML = '';

            // Determinar categoría por el nombre de archivo en la URL actual
            const pathname = window.location.pathname.toLowerCase();
            let activeCategory = null;
            if (pathname.includes('mangas.html')) {
                activeCategory = 'Manga';
            } else if (pathname.includes('dc.html')) {
                activeCategory = 'DC';
            } else if (pathname.includes('marvel.html')) {
                activeCategory = 'Marvel';
            }

            let filteredItems = rawItems;
            if (activeCategory) {
                filteredItems = rawItems.filter(item => {
                    const cat = item.category || 'Manga';
                    return cat.toLowerCase() === activeCategory.toLowerCase();
                });
            }

            if (filteredItems.length === 0) {
                showError('No se encontraron cómics o mangas en esta categoría.');
                return;
            }

            loadedMangas = [];
            filteredItems.forEach(apiItem => {
                const manga = buildMangaItem(apiItem, API_BASE_URL);
                loadedMangas.push(manga);
                const card = createCard(manga);
                cardsContainer.appendChild(card);
            });

            console.log(`Renderizados ${loadedMangas.length} productos para la categoría: ${activeCategory || 'Todos'}`);
        } catch (error) {
            console.error('Error al cargar el catálogo:', error);
            showError('No se pudo cargar el catálogo. Mostrando error del sistema.');
        }
    }

    // ──────────────────────────────────────────
    // MODAL DE DETALLE
    // ──────────────────────────────────────────

    /**
     * Muestra el modal usando datos cacheados (evita segundo fetch con CORS).
     * Si no hay cache, intenta fetch con proxy.
     */
    async function showDetailsModal(mangaId) {
        try {
            let manga = loadedMangas.find(m => String(m.id) === String(mangaId));

            if (!manga) {
                // Si no se encuentra en caché, intentar fetch desde local proxy o de fallback JSON
                try {
                    const response = await fetch(`/api/mangas/images/${mangaId}`);
                    if (response.ok) {
                        const apiManga = await response.json();
                        manga = buildMangaItem(apiManga, API_BASE_URL);
                    }
                } catch (_) {}

                if (!manga) {
                    const response = await fetch('assets/data/catalogo-fallback.json');
                    if (response.ok) {
                        const fallbackItems = await response.json();
                        const found = fallbackItems.find(m => String(m.id) === String(mangaId));
                        if (found) manga = buildMangaItem(found, API_BASE_URL);
                    }
                }
            }

            if (!manga) {
                alert('No se pudo encontrar el detalle de este producto.');
                return;
            }

            document.getElementById('modal-title').textContent = capitalizeTitle(manga.title);
            document.getElementById('modal-genres').innerHTML = `<strong>Géneros:</strong> ${formatGenre(manga.genre)} | <strong>Editorial:</strong> ${manga.editorial || 'No disponible'}`;
            document.getElementById('modal-synopsis').textContent = manga.synopsis;
            document.getElementById('modal-price').textContent = formatPrice(manga.price);
            document.getElementById('modal-image').src = manga.imageUrl;
            document.getElementById('modal-image').alt = `Portada de ${capitalizeTitle(manga.title)}`;

            const addBtn = document.getElementById('add-to-cart-button');

            if (addBtn) {
                addBtn.setAttribute('data-id', manga.id);
                addBtn.setAttribute('data-partnumber', manga.partNumber);
                addBtn.setAttribute('data-title', manga.title);
                addBtn.setAttribute('data-price', manga.price);
                addBtn.setAttribute('data-currency', manga.currency);
                addBtn.setAttribute('data-stock', manga.stock);
                addBtn.setAttribute('data-image', manga.imageUrl);
                addBtn.setAttribute('data-description', manga.description || manga.synopsis);
            }

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
    loadMangas();
});