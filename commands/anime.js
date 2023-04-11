const {EmbedBuilder} = require('discord.js');
const {getAvatarURL} = require('../utils/discord-utils');
const {haremDescriptionType} = require('../utils/word-things');
const {getAnimeCharacters} = require('../api/anilist');
const {haremReactionController} = require('../controller/game.controller');

module.exports = {
    name: 'anime',
    category: 'Waifu',
    description: 'Encuentra personajes de un anime; úsalo para tu lista de deseos.',
    usage: '<nombre del anime>',
    //aliases: [],
    cooldown: 5,
    async execute (message, args) {
        let page = 0;
        if (!args) return message.channel.send(`¡${message.author.username}, obten ayuda sobre el comando escribiendo \`${process.env.prefix}help ${this.name}\`!`);

        let search = args.join(" ");
        if (search.length <= 2) return message.channel.send(`¡**${message.author.username}**, se requiere de __al menos 3 caracteres__ para realizar una búsqueda!`);
        if (search.length > 16) return message.channel.send(`¡**${message.author.username}**, sobrepasaste el __límite de caracteres__ (utiliza de 3 a 16)!`);

        let characters = await getAnimeCharacters(search.trim());
        if (characters.status == false) {
            message.channel.send(`¡**${message.author.username}**, ${characters.message}!`);
        }

        let harem = characters.data;

        let embed = new EmbedBuilder()
            .setColor(process.env.BOT_COLOR)
            .setAuthor({
                name: `Búsqueda: ${search}`,
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
            .setTimestamp(Date.now);

        message.channel.send({
            embeds: [embed]
        }).then(async msg => {
            await haremReactionController({
                message,
                msg,
                embed,
                harem,
                page
            }, ["LEFT", "RIGHT", "WISH"]);
        });
	}
}
