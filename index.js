const path = require('path');

module.exports = {
    name: 'Waifus',
    version: '2.0.0',
    cookiebot: '1.0.0',
    description: '¡Reclama y/o intercambia personajes & artes!',
    dependencies: ['booru', 'nanoid'],
    enabled: true,
    async plugin (bot) {
        // Cargar comandos
        const commandPath = path.join(__dirname, 'commands');
        require('../../events/commands')(bot, commandPath);
    }
};
