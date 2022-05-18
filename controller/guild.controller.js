const Guild = require('../models/guild');

/**
 * Comprueba la existencia del servidor, si no se encuentra crea la guild.
 * 
 * @param {String} id del servidor.
 * @returns retorna guild model.
 */
const getGuild = async (id) => {
    try {
        let guild = await Guild.findOne(id);
        if (!guild) guild = await new Guild({ id });
        return guild;
    } catch (error) {
        console.log(error);
        return false;
    };
};

/**
 * Comproba la existencia del servidor (por seguridad), comprueba la válides de los campos y actualiza los datos.
 * 
 * @param {String} id del servidor.
 * @param {Object} newData datos nuevos con los valores a modificar.
 * @returns retorna true si hay éxito y viceversa.
 */
 const changeCooldowns = async (id, newData) => {
    let { claims, rolls, gifts } = newData;
    try {
        await getGuild(id);

        // 1440 son minutos y equivale a 24 horas.
        if (claims < 1 || claims > 1440) return false;
        if (rolls < 1 || rolls > 1440) return false;
        if (gifts < 1 || gifts > 1440) return false;

        await Guild.updateOne({ id }, {
            cooldowns: newData
        });

        return true;
    } catch (error) {
        console.log(error);
        return false;
    };
};

/**
 * Comproba la existencia del servidor (por seguridad), comprueba la válides de los campos y actualiza los datos.
 * 
 * @param {String} id del servidor.
 * @param {Object} newData datos nuevos con los valores a modificar.
 * @returns retorna true si hay éxito y viceversa.
 */
const changeLimits = async (id, newData) => {
    let { rolls, characters, arts } = newData;
    try {
        await getGuild(id);

        if (rolls < 1 || rolls > 15) return false;
        if (characters < 1 || characters > 5000) return false;
        if (arts < 1 || arts > 5000) return false;

        await Guild.updateOne({ id }, {
            limits: newData
        });

        return true;
    } catch (error) {
        console.log(error);
        return false;
    };
};

// banning

module.exports = {
    getGuild,
    changeCooldowns,
    changeLimits
};
