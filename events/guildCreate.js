const { setupGuild } = require('../helpers/update-users');

module.exports = (bot) => {
    bot.on('guildCreate', async guild => {
        setupGuild(guild, bot.readyAt);
    });
};
