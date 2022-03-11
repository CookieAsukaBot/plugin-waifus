const Booru = require('booru');
const userCtrl = require('../controller/user.controller');

// Config
const displayTags = 8;

/**
 * Se hace un query con filtros, con el resultado se crea un módelo estándar con los datos que se usarán para el embed.
 * Después se comprueba si un usuario ya había reclamado el arte, si ya ha sido reclamado se agregará el usuario al módelo. Al final se agregan tags y fuentes del arte.
 * 
 * @param {String} guild se requiere de la ID del servidor para comprobar si un usuario ya ha reclamado el arte.
 * @returns {Object} devuelve un objeto con la información para el embed del arte.
 */
const getRandomDanbooru = async (guild) => {
    try {
        let query = {
            limit: 1,
            showUnavailable: true
        };

        let res = await Booru.search('danbooru', ['rating:safe random:1 -animated'], query);

        let imageModel = {
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
        };

        let isClaimed = userCtrl.isClaimed(guild, imageModel.domain, imageModel.id);
        if (isClaimed.message == "FOUND") imageModel.owner = isClaimed.data.user.id;

        // Campos extras
        if (imageModel.tags != undefined) imageModel.description += `${imageModel.tags.slice(0, displayTags).join(' ')}`;

        if (Array.isArray(imageModel.source) && imageModel.source) {
            imageModel.description += imageModel.source.forEach((source, index) =>
                `\n[Fuente (${index + 1}/${image.source.length})](${source})`
            );
        };
        if (!Array.isArray(imageModel.source) && image.source) {
            image.description += `\n[Fuente](${imageModel.source})`;
        };

        return imageModel;
    } catch (error) {
        console.error(error);
        return false;
    };
};

module.exports = {
    getRandomDanbooru
};
