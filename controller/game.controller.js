const status = require('../helpers/status');
const User = require('../models/user');
const { getUser } = require('../controller/user.controller');
const { getRandomNumber } = require('../utils/random-things');

const anilist = require('../api/anilist');
const booru = require('../api/booru');

/**
 * Comprueba si el usuario existe y puede tirar.
 * Actualiza el usuario (su estadística y rolls disponibles).
 * También retorna un mensaje si al jugador le quedan 2 rolls disponibles.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario.
 */
const userCanRoll = async (guild, userID) => {
    let player = await getUser(guild, userID);
    if (player.status == false) return status.failed("Ocurrió un error al encontrar tu usuario.");
    player = player.data[0];
    
    try {
        if (player.fun.rolls < 1) return status.failed(`<@${userID}>, no tienes rolls disponibles!\nEl reinicio es [placeholder].`);

        await User.updateOne({
            guild,
            id: userID
        }, {
            $inc: {
                "fun.rolls": -1,
                "stats.rolls.count": 1
            }
        });

        let message = "";
        if (player.fun.rolls == 3) message = `⚠ quedan **2** rolls ⚠`;
        return status.success(message, null);
    } catch (error) {
        console.error(error);
        status.failed("DB_ERROR");
    };
};

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

        // ¿Comprobar si tiene dueño?

        // WIP: ¿comprobaciones de error?
        return status.success("SUCCESS", model.data);
    } catch (error) {
        console.error(error);
        status.failed("BOT_ERROR");
    };
};

module.exports = {
    userCanRoll,
    getRandomRoll,
};
