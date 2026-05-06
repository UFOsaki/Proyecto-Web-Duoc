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

const CATALOG_CONFIG = {
    "001": {
        price: 12990,
        synopsis: "Shinji Ikari es reclutado por su padre para pilotar un robot gigante llamado Eva y salvar a la humanidad de criaturas conocidas como Ángeles.",
        stock: 15
    },
    "002": {
        price: 9990,
        synopsis: "Un joven es convocado a otro mundo donde deberá adaptarse a sus nuevas reglas mágicas y encontrar su propósito en esta nueva vida.",
        stock: 20
    },
    "003": {
        price: 14990,
        synopsis: "Naruto Uzumaki sueña con convertirse en Hokage, el ninja más poderoso de su aldea, mientras carga con el espíritu de un poderoso zorro dentro de él.",
        stock: 30
    },
    "004": {
        price: 8990,
        synopsis: "Una historia de amor tierna y algo torpe, protagonizada por dos jóvenes que descubren sus sentimientos a través de momentos cotidianos.",
        stock: 12
    },
    "005": {
        price: 11990,
        synopsis: "Usagi Tsukino descubre que es la guerrera mágica Sailor Moon y debe reunir a las otras Sailor Senshi para proteger la Tierra de las fuerzas del mal.",
        stock: 18
    },
    "006": {
        price: 10990,
        synopsis: "Ritsuka Uenoyama conoce a Mafuyu Sato y su guitarra rota. Juntos exploran la música y los sentimientos que nacen entre ellos.",
        stock: 10
    },
    "007": {
        price: 9490,
        synopsis: "Mei Sahara y Yuzu Yamada se encuentran en el club de café de su escuela y gradualmente desarrollan una relación especial llena de humor y ternura.",
        stock: 8
    },
    "008": {
        price: 11990,
        synopsis: "Continuación de las aventuras de Sailor Moon mientras nuevas amenazas surgen y el equipo de guerreras debe superar sus propios límites.",
        stock: 14
    },
    "009": {
        price: 8490,
        synopsis: "Kokoro Hanazono se enfrenta a las complejidades del amor en la secundaria cuando el popular Hananoi-kun le confiesa sus sentimientos de manera inesperada.",
        stock: 22
    },
    "010": {
        price: 15990,
        synopsis: "Tanjiro Kamado se convierte en cazador de demonios para salvar a su hermana Nezuko, transformada en demonio, y vengar a su familia masacrada.",
        stock: 35
    }
};

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
        : 'https://via.placeholder.com/300x420?text=Sin+imagen';

    return {
        id:       apiManga.id,
        title:    apiManga.title,
        genre:    apiManga.genre,
        imageUrl: imageUrl,
        price:    config.price,
        synopsis: config.synopsis,
        stock:    config.stock
    };
}
