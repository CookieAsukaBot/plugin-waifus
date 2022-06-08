const moment = require('moment');
const Guild = require('../models/guild');
const User = require('../models/user');
const { getGuild } = require('../controller/guild.controller');

/**
 * @param {Object} server módelo del guild.
 * @param {Date} readyAt fecha de cuándo el bot se inició.
 */
const resetClaims = (server, readyAt) => {
    let time = server.cooldowns.claims;
    readyAt = moment(readyAt);

    try {
        setTimeout(async () => {
            await User.updateMany({ guild: server.id }, { "fun.canClaim": true });
            await Guild.updateOne({ id: server.id }, { "next.claims": moment().add(server.cooldowns.claims, 'minutes') });

            setInterval(async () => {
                await User.updateMany({ guild: server.id }, {
                    "fun.canClaim": true
                });
                await Guild.updateOne({ id: server.id }, {
                    "next.claims": moment().add(server.cooldowns.claims, 'minutes')
                });
            }, time * 60 * 1000);
        }, readyAt.diff(server.next.claims, 'miliseconds'));
    } catch (error) {
        console.error(error);
    };
};

/**
 * @param {Object} server módelo del guild.
 * @param {Date} readyAt fecha de cuándo el bot se inició.
 */
const resetRolls = (server, readyAt) => {
    let time = server.cooldowns.rolls;
    readyAt = moment(readyAt);

    try {
        setTimeout(async () => {
            await User.updateMany({ guild: server.id }, { "fun.rolls": server.limits.rolls });
            await Guild.updateOne({ id: server.id }, { "next.rolls": moment().add(server.cooldowns.rolls, 'minutes') });

            setInterval(async () => {
                await User.updateMany({ guild: server.id }, {
                    "fun.rolls": server.limits.rolls
                });
                await Guild.updateOne({ id: server.id }, {
                    "next.rolls": moment().add(server.cooldowns.rolls, 'minutes')
                });
            }, time * 60 * 1000);
        }, readyAt.diff(server.next.rolls, 'miliseconds'));
    } catch (error) {
        console.error(error);
    };
};

/**
 * Detecta las guilds al iniciar el bot e inicia los timers.
 */
const loadGuilds = (bot) => {
    bot.guilds.cache.forEach(async guild => {
        if (!guild.available) return; // bug: si se cae la guild, no habrá contadores para esa guild al regresar online.
        let server = await getGuild(guild.id);

        if (server.status == false) return console.log({
            id: guild.id,
            status: server.status,
            message: 'GUILD_DB_ERROR'
        });

        resetClaims(server.data, bot.readyAt);
        resetRolls(server.data, bot.readyAt);
    });
};

const updateUsers = async (bot) => {
    loadGuilds(bot);
};

module.exports = {
    updateUsers,
};
