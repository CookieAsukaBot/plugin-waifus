const { MessageEmbed } = require('discord.js');
const { getAvatarURL } = require('../utils/discord-utils');
const { haremDescriptionType } = require('../utils/word-things');
const {
    getUser,
    getHarem
} = require('../controller/user.controller');
const { haremReactionController } = require('../controller/game.controller');

const userHarem = async (message) => {
    let player = (await getUser(message.guild.id, message.author.id)).data;
    let harem = (await getHarem(message.guild.id, message.author.id, null)).data;

    return {
        player,
        harem
    };
};

const userInputPosition = (page, haremSize) => {
    if (!page || isNaN(page) || page <= 0) {
        page = 0;
    } else {
        --page;
    };

    if (page >= haremSize) page = haremSize - 1;
    return page;
};

module.exports = {
    name: 'divorce',
    category: 'Waifu',
    description: 'Para divorciarte de tus artes y/o personajes.',
    aliases: ['divorcio', 'divorciar', 'divorciarse'],
    usage: '[opcional: página]',
    cooldown: 3,
    async execute (message, args) {
        let { player, harem } = await userHarem(message);
        if (harem.length < 1) return message.channel.send(`¡**${message.author.username}**, no hay ninguna waifu reclamada!`);
        let page = userInputPosition(parseInt(args), harem.length);

        let embed = new MessageEmbed()
            .setColor(player.harem.color)
            .setAuthor({
                name: player.harem.title,
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
            .setTimestamp(harem[page].user.claimedAt);

        message.channel.send({
            embeds: [embed]
        }).then(async msg => {
            await haremReactionController({
                message,
                msg,
                embed,
                harem,
                page
            }, ["DOUBLE_LEFT", "LEFT", "RIGHT", "DOUBLE_RIGHT", "DIVORCE"]);
        });
	}
};
