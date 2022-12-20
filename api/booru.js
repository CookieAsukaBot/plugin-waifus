const Booru = require('booru');
const status = require('../helpers/status');
const {findClaim} = require('../controller/user.controller');
const {displayTags,queryTags} = require('../config.json').apis.booru;
const {getRandomArrayItem} = require('../utils/random-things');

/**
 * Obtiene una tag aleatoria desde el config.json complementando random:1
 * 
 * @returns {String} query
 */
const _getRandomTags = () => {
    let mainTags = "rating:sensitive random:1 ";
    let tags = queryTags;

    let getRandomTag = getRandomArrayItem(tags);
    let query = mainTags + getRandomTag

    return query;
}

/**
 * Se hace un query con filtros. Con el resultado se crea un módelo estándar con los datos que se usarán para el embed.
 * Después se comprueba si un usuario ya había reclamado el arte, si ya ha sido reclamado se agregará el usuario al módelo.
 * Al final se agregan tags y fuentes del arte.
 * 
 * @param {String} guild se requiere de la ID del servidor para comprobar si un usuario ya ha reclamado el arte.
 * @returns {Object} devuelve un objeto con la información para el embed del arte.
 */
const getRandomDanbooru = async (guild) => {
    try {
        let query = _getRandomTags();

        let res = await Booru.search('danbooru', [query], { showUnavailable: true });
        if (res.length != 1) return status.failed("NOT_FOUND");

        let model = {
            id: res.posts[0].id,
            domain: res.posts[0].booru.domain,
            url: res.posts[0].fileUrl,
            tags: res.posts[0].tags,
            description: '',
            rating: res.posts[0].rating,
            source: res.posts[0].source,
            createdAt: res.posts[0].createdAt,
            type: "ART",
            owner: false
        }

        let isClaimed = await findClaim(guild, model.domain, model.id);
        if (isClaimed.message == "FOUND") model.owner = isClaimed.data.user.id;

        // Campos extras
        if (model.tags != undefined) model.description += `${model.tags.slice(0, displayTags).join(' ')}`;

        if (Array.isArray(model.source) && model.source) {
            model.description += model.source.forEach((source, index) =>
                `\n[Fuente (${index + 1}/${image.source.length})](${source})`
            );
        }
        if (!Array.isArray(model.source) && model.source) {
            model.description += `\n[Fuente](${model.source})`;
        }

        return status.success("SUCCESS", model);
    } catch (error) {
        console.error(error);
        return status.failed("API_ERROR");
    }
}

/**
 * Encuentra un arte de Danbooru por ID.
 * 
 * @param {String} id del arte
 */
const getDanbooruByID = async (id) => {
    try {
        let harem = [];
        let query = `id:${id}`;

        let res = await Booru.search('danbooru', [query], { showUnavailable: true });
        if (res.length != 1) return status.failed("NOT_FOUND");

        let model = {
            metadata: {
                id: res.posts[0].id,
                type: "ART",
                domain: res.posts[0].booru.domain,
                url: res.posts[0].fileUrl,
            }
        }

        harem.push(model);

        return status.success("SUCCESS", harem);
    } catch (error) {
        console.error(error);
        return status.failed("API_ERROR");
    }
}

module.exports = {
    getRandomDanbooru,
    getDanbooruByID
}
