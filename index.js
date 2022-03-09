const path = require('node:path');

module.exports = {
    name: 'Waifus',
    version: 'A.2.0', // Alpha 2.0
    cookiebot: '1.2.0',
    description: '¡Reclama y/o intercambia personajes & artes!',
    dependencies: ['booru', 'nanoid'],
    enabled: true,
    async plugin (bot) {
        // Cargar comandos
        require('../../events/commands')(bot, path.join(__dirname, 'slash-commands'), true);
        require('../../events/commands')(bot, path.join(__dirname, 'commands'));

    }
};
