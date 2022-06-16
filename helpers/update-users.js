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

    let firstRun = moment(server.next.claims).set({ seconds: 0, milliseconds: 0 }).diff(readyAt, 'miliseconds');
    if (firstRun < 1) firstRun = 1;

    try {
        setTimeout(async () => {
            await User.updateMany({ guild: server.id }, { "fun.canClaim": true });
            await Guild.updateOne({ id: server.id }, {
                "next.claims": moment().add(server.cooldowns.claims, 'minutes').set({ seconds: 0, milliseconds: 0 })
            });

            setInterval(async () => {
                await User.updateMany({ guild: server.id }, {
                    "fun.canClaim": true
                });
                await Guild.updateOne({ id: server.id }, {
                    "next.claims": moment().add(server.cooldowns.claims, 'minutes').set({ seconds: 0, milliseconds: 0 })
                });
            }, time * 60 * 1000);
        }, firstRun);
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

    let firstRun = moment(server.next.rolls).set({ seconds: 0, milliseconds: 0 }).diff(readyAt, 'miliseconds');
    if (firstRun < 1) firstRun = 1;

    try {
        setTimeout(async () => {
            await User.updateMany({ guild: server.id }, { "fun.rolls": server.limits.rolls });
            await Guild.updateOne({ id: server.id }, {
                "next.rolls": moment().add(server.cooldowns.rolls, 'minutes').set({ seconds: 0, milliseconds: 0 })
            });

            setInterval(async () => {
                await User.updateMany({ guild: server.id }, {
                    "fun.rolls": server.limits.rolls
                });
                await Guild.updateOne({ id: server.id }, {
                    "next.rolls": moment().add(server.cooldowns.rolls, 'minutes').set({ seconds: 0, milliseconds: 0 })
                });
            }, time * 60 * 1000);
        }, firstRun);
    } catch (error) {
        console.error(error);
    };
};

/**
 * Inicia los timers para la guild.
 * 
 * @param {String} guild desde el bot.
 * @param {Date} readyAt fecha de cuándo el bot inició.
 * @returns 
 */
const setupGuild = async (guild, readyAt) => {
    if (!guild.available) return; // bug: si se cae la guild, no habrá contadores para esa guild al regresar online.
    let server = await getGuild(guild.id);

    if (server.status == false) return console.log({
        id: guild.id,
        status: server.status,
        message: 'GUILD_DB_ERROR'
    });

    resetClaims(server.data, readyAt);
    resetRolls(server.data, readyAt);
};

/**
 * Detecta las guilds al iniciar el bot e inicia los timers.
 */
const loadGuilds = (bot) => {
    bot.guilds.cache.forEach(async guild => {
        setupGuild(guild, bot.readyAt);
    });
};

module.exports = {
    loadGuilds,
    setupGuild
};
