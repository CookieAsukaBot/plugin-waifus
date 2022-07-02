const { setupGuild } = require('../helpers/update-users');

module.exports = (bot) => {
    bot.on('guildCreate', async guild => {
        await setupGuild(guild, bot.readyAt);
    });
};
