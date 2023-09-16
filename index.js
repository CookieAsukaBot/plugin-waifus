const path = require('node:path');

module.exports = {
    name: 'Waifus',
    version: '0.3.2',
    cookiebot: '1.4.0',
    description: '¡Reclama y/o intercambia personajes & artes!',
    dependencies: ['booru', 'nanoid'],
    enabled: true,
    async plugin (bot) {
        // Cargar comandos
        require('../../events/commands')(bot, path.join(__dirname, 'commands'));
        // require('../../events/commands')(bot, path.join(__dirname, 'slash-commands'), true);

        // Actualización constante de usuarios
        bot.waifus_cooldown = {};
        require('./helpers/update-users').loadGuilds(bot);
        require('./events/guildCreate')(bot);
    }
};
