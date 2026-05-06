/**
 * catalogConfig.js
 * -----------------
 * Configuración local del catálogo de mangas.
 *
 * Aquí se definen los datos de negocio por ID (price, synopsis, stock).
 * Los datos de la API (id, title, genre, url) se mezclan con estos valores
 * en cards.js mediante la función getMangaConfig().
 *
 * Para editar un precio, sinopsis o stock, basta con modificar este archivo.
 * Si un ID de la API no aparece aquí, se aplican los DEFAULTS al final del archivo.
 */

const mangaConfigs = {
    "001": {
        partNumber: "MNG-EVA-001",
        price: 1,
        currency: "CLP",
        stock: 10,
        synopsis: "Manga de ciencia ficción, mechas y drama psicológico."
    },
    "002": {
        partNumber: "MNG-ISE-002",
        price: 2,
        currency: "CLP",
        stock: 8,
        synopsis: "Manga de fantasía y aventura en otro mundo."
    },
    "003": {
        partNumber: "MNG-NAR-003",
        price: 3,
        currency: "CLP",
        stock: 12,
        synopsis: "Manga de acción ninja y aventura."
    },
    "004": {
        partNumber: "MNG-NAR-003",
        price: 4,
        currency: "CLP",
        stock: 12,
        synopsis: "Manga de acción ninja y aventura."
    },
    "005": {
        partNumber: "MNG-NAR-003",
        price: 5,
        currency: "CLP",
        stock: 12,
        synopsis: "Manga de acción ninja y aventura."
    },
    "006": {
        partNumber: "MNG-NAR-003",
        price: 6,
        currency: "CLP",
        stock: 12,
        synopsis: "Manga de acción ninja y aventura."
    },
    "006": {
        partNumber: "MNG-NAR-003",
        price: 6,
        currency: "CLP",
        stock: 12,
        synopsis: "Manga de acción ninja y aventura."
    },
    "007": {
        partNumber: "MNG-NAR-003",
        price: 7,
        currency: "CLP",
        stock: 12,
        synopsis: "Manga de acción ninja y aventura."
    },
    "008": {
        partNumber: "MNG-NAR-003",
        price: 8,
        currency: "CLP",
        stock: 12,
        synopsis: "Manga de acción ninja y aventura."
    },
    "009": {
        partNumber: "MNG-NAR-003",
        price: 9,
        currency: "CLP",
        stock: 12,
        synopsis: "Matias weco."
    },
    "010": {
        partNumber: "MNG-NAR-003",
        price: 9,
        currency: "CLP",
        stock: 12,
        synopsis: "Matias weco."
    }
};
function getMangaConfig(id) {
    const safeId = String(id).padStart(3, "0");

<<<<<<< HEAD:assets/JS/catalogConfig.js
    return mangaConfigs[safeId] || {
        partNumber: `MNG-GEN-${safeId}`,
        price: 12990,
        currency: "CLP",
        stock: 5,
        synopsis: "Sinopsis no disponible."
=======
/**
 * Valores por defecto aplicados cuando un ID no existe en CATALOG_CONFIG.
 * Edita estos valores para cambiar el comportamiento global del fallback.
 */
const CATALOG_DEFAULTS = {
    price: 9990,
    synopsis: "Sinopsis no disponible.",
    stock: 10
};

/**
 * Retorna la configuración local (price, synopsis, stock) para un manga por su ID.
 * Si el ID no existe en CATALOG_CONFIG, retorna los CATALOG_DEFAULTS.
 *
 * @param {string} mangaId - El id del manga proveniente de la API.
 * @returns {{ price: number, synopsis: string, stock: number }}
 */
function getMangaConfig(mangaId) {
    return CATALOG_CONFIG[mangaId] || { ...CATALOG_DEFAULTS };
}

/**
 * Combina los datos de la API con la configuración local para construir
 * un objeto unificado del catálogo listo para renderizar.
 *
 * @param {Object} apiManga - Objeto manga recibido de la API ({ id, title, genre, url }).
 * @param {string} baseUrl  - URL base de la API para construir la ruta de la imagen.
 * @returns {Object} Objeto manga enriquecido con price, synopsis y stock.
 */
function buildMangaItem(apiManga, baseUrl) {
    const config = getMangaConfig(apiManga.id);

    // Las imágenes se sirven a través del proxy local de Spring Boot.
    // Esto evita errores CORS ya que el navegador hace la petición
    // al mismo origen (localhost:8080) en lugar de al dominio externo.
    const imageUrl = apiManga.url
        ? `/api/images?path=${encodeURIComponent(apiManga.url)}`
        : 'https://api-rest-manga.onrender.com/';

    return {
        id:       apiManga.id,
        title:    apiManga.title,
        genre:    apiManga.genre,
        imageUrl: imageUrl,
        price:    config.price,
        synopsis: config.synopsis,
        stock:    config.stock
>>>>>>> c86be857d410e8e8a98b764d29e24e964c0efbeb:src/main/resources/static/assets/JS/catalogConfig.js
    };
}

function formatPriceCLP(price) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP"
    }).format(price);
}

function buildMangaItem(apiManga, baseUrl) {
    const config = getMangaConfig(apiManga.id);

    const rawImage = apiManga.imageUrl || apiManga.url || "";

    const finalImageUrl = rawImage.startsWith("http")
        ? rawImage
        : `${baseUrl}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`;

    return {
        id: apiManga.id,
        partNumber: config.partNumber,
        title: apiManga.title,
        genre: apiManga.genre,
        imageUrl: finalImageUrl,
        price: config.price,
        currency: config.currency,
        stock: config.stock,
        synopsis: config.synopsis
    };
}