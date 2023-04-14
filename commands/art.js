const {EmbedBuilder} = require('discord.js');
const {getAvatarURL} = require('../utils/discord-utils');
const {haremDescriptionType} = require('../utils/word-things');
const {getDanbooruByID} = require('../api/booru');
const {haremReactionController} = require('../controller/game.controller');

module.exports = {
    name: 'art',
    category: 'Waifu',
    description: 'Encuentra un arte por su ID; úsalo para tu lista de deseos.',
    usage: '<ID del arte>',
    aliases: ['arte'],
    cooldown: 5,
    async execute (message, args) {
        let page = 0;
        if (!args) return message.channel.send(`¡${message.author.username}, obten ayuda sobre el comando escribiendo \`${process.env.prefix}help ${this.name}\`!`);

        let search = args.join(" ");
        if (search.length <= 0) return message.channel.send(`¡**${message.author.username}**, se requiere de __al menos 1 caracter__ para realizar una búsqueda!`);
        if (search.length > 10) return message.channel.send(`¡**${message.author.username}**, sobrepasaste el __límite de caracteres__ (utiliza de 1 a 10)!`);

        let art = await getDanbooruByID(search.trim());
        if (art.status == false) {
            message.channel.send(`¡**${message.author.username}**, ${art.message}!`);
        }

        let harem = art.data;

        let embed = new EmbedBuilder()
            .setColor(process.env.BOT_COLOR)
            .setAuthor({
                name: `Búsqueda: ${search}`,
                iconURL: getAvatarURL(message.author)
            })
            .setDescription(haremDescriptionType({
                id: harem[page].metadata.id,
                type: harem[page].metadata.type,
                domain: harem[page].metadata.domain
            }))
            .setImage(harem[page].metadata.url)
            .setFooter({
                text: `${page + 1}/${harem.length}`
            });

        message.channel.send({
            embeds: [embed]
        }).then(async msg => {
            await haremReactionController({
                message,
                msg,
                embed,
                harem,
                page
            }, ["WISH"]);
        });
	}
}
