const status = require('../helpers/status');
const { getRandomNumber } = require('../utils/random-things');

const anilist = require('../api/anilist');
const booru = require('../api/booru');

/**
 * Genera un número aleatorio, después base al número se elige una función de una API.
 * 
 * @param {String} guild ID del servidor.
 * @returns retorna el módelo obtenido (ej.: arte o personaje)
 */
const getRandomRoll = async (guild) => {
    try {
        let Seed = getRandomNumber(1, 2);
        let model = null;

        switch (Seed) {
            case 1:
                model = await anilist.getRandomAnilist(guild);
                break;
            case 2:
                model = await booru.getRandomDanbooru(guild);
                break;
            default:
                break;
        };

        // WIP: ¿comprobaciones de error?
        return status.success("SUCCESS", model);
    } catch (error) {
        console.error(error);
        status.failed("BOT_ERROR");
    };
};

module.exports = {
    getRandomRoll
};
