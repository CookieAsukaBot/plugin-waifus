const {EmbedBuilder} = require('discord.js');
const {getAvatarURL} = require('../utils/discord-utils');
const {getUser} = require('../controller/user.controller');
const {find} = require('../controller/wish.controller');
const {haremReactionController} = require('../controller/game.controller');
const {haremDescriptionType} = require('../utils/word-things');

module.exports = {
    name: 'wishlist',
    category: 'Waifu',
    description: 'Muestra tu lista de deseos',
    usage: 'Mira y/o remueve alguno de tus deseos.',
    aliases: ['wish', 'wl', 'deseo', 'deseos'],
    cooldown: 3,
    async execute (message, args, bot) {
        // Obtener lista
        let page = 0;
        let harem = await find(message.guild.id, message.author.id);

        if (harem.status == false) return message.channel.send(`¡**${message.author.globalName}**, ${harem.message}!`);

        // Obtener configuración del usuario
        let player = (await getUser(message.guild.id, message.author.id)).data;
        harem = harem.data;

        let embed = new EmbedBuilder()
            .setColor(player.harem.color)
            .setAuthor({
                name: `Lista de deseos de ${message.author.globalName}`,
                iconURL: getAvatarURL(message.author)
            })
            .setDescription(haremDescriptionType({
                id: harem[page].metadata.id,
                type: harem[page].metadata.type,
                domain: harem[page].metadata.domain,
                name: harem[page]?.character.name,
                media: harem[page]?.character.media.title,
                gender: harem[page]?.character.gender
            }))
            .setImage(harem[page].metadata.url)
            .setFooter({
                text: `${page + 1}/${harem.length}`
            })
            .setTimestamp(harem[page].createdAt);

        message.channel.send({
            embeds: [embed]
        }).then(async msg => {
            await haremReactionController({
                message,
                msg,
                embed,
                harem,
                page
            }, ["LEFT", "RIGHT", "WISH_REMOVE"]);
        });
	}
}
