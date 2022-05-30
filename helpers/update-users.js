const moment = require('moment');
// const Guild = require('../models/guild');
const User = require('../models/user');

const settings = {
    claimReset: 10, // minutos
    rollsReset: 5,  // minutos
    rollsPerReset: 7
};

const resetRolls = async (bot) => {
    const time = settings.rollsReset * 60 * 1000;

    // Time left
    // Esto funciona al iniciar el bot.
    let actualDate = moment();
    actualDate.add(settings.rollsReset, 'minutes');
    bot.waifus_cooldown.rolls.timeLeft = actualDate;

    try {
        // Esto funciona de manera indefinida
        setInterval(async () => {
            await User.updateMany({}, {
                "fun.rolls": settings.rollsPerReset
            });

            // Agregar tiempo a waifus_cooldown
            actualDate.add(settings.rollsReset, 'minutes');
            bot.waifus_cooldown.rolls.timeLeft = actualDate;

        }, time);
    } catch (error) {
        console.error(error);
    };
};

const resetClaims = async (bot) => {
    const time = settings.claimReset * 60 * 1000;

    // Time left
    let actualDate = moment();
    actualDate.add(settings.claimReset, 'minutes');
    bot.waifus_cooldown.claims.timeLeft = actualDate;

    try {
        setInterval(async () => {
            await User.updateMany({}, {
                "fun.canClaim": true
            });

            // Agregar tiempo a waifus_cooldown
            actualDate.add(settings.claimReset, 'minutes');
            bot.waifus_cooldown.claims.timeLeft = actualDate;
        }, time);
    } catch (error) {
        console.error(error)
    };
};

const updateUsers = async (bot) => {
    bot.waifus_cooldown.rolls = {};
    bot.waifus_cooldown.claims = {};

    resetRolls(bot);
    resetClaims(bot);
};

module.exports = {
    updateUsers,
};
