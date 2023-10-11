const moment = require('moment');
const status = require('../helpers/status');
const Guild = require('../models/guild');
const User = require('../models/user');
const { getCountdownTime } = require('../utils/time-things');

/**
 * Comprueba la existencia del servidor en la DB, si no se encuentra crea.
 * 
 * @param {String} id del servidor.
 * @returns retorna guild model.
 */
const getGuild = async (id) => {
    try {
        let guild = await Guild.findOne({ id });
        if (!guild) {
            guild = new Guild({ id });
            await guild.save();
        }
        return status.success("SUCCESS", guild);
    } catch (error) {
        console.log(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * Comprueba la válides de los campos y actualiza los datos.
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

        return status.success("SUCCESS");
    } catch (error) {
        console.log(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * Comprueba la válides de los campos y actualiza los datos.
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

        return status.success("SUCCESS");
    } catch (error) {
        console.log(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * Obtiene el tiempo (de manera leíble) de cuándo serán los siguientes reinicios.
 * 
 * @param {String} id del servidor.
 */
const getCooldowns = async (id) => {
    try {
        let guild = (await getGuild(id)).data;
        return status.success("SUCCESS", {
            claims: getCountdownTime(guild.next.claims),
            rolls: getCountdownTime(guild.next.rolls)
        });
    } catch (error) {
        console.log(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * Actualiza los claims a base del servidor y asigna el tiempo del siguiente reinicio
 * 
 * @param {Object} server 
 */
const updateClaims = async (server) => {
    await User.updateMany({
        guild: server.id,
        "fun.canClaim": false
    },{ "fun.canClaim": true });

    await Guild.updateOne({ id: server.id }, {
        "next.claims": moment().add(server.cooldowns.claims, 'minutes').set({ seconds: 0, milliseconds: 0 })
    })
}

/**
 * Actualiza los rolls a base del servidor y asigna el tiempo del siguiente reinicio
 * 
 * @param {Object} server 
 */
const updateRolls = async (server) => {
    await User.updateMany({
        guild: server.id,
        "fun.rolls": { $lt: server.limits.rolls }
    }, {
        "fun.rolls": server.limits.rolls
    });

    await Guild.updateOne({ id: server.id }, {
        "next.rolls": moment().add(server.cooldowns.rolls, 'minutes').set({ seconds: 0, milliseconds: 0 })
    })
}

// banning

module.exports = {
    getGuild,
    changeCooldowns,
    changeLimits,
    getCooldowns,
    updateClaims,
    updateRolls
}
