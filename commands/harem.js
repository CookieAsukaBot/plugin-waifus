const { MessageEmbed } = require('discord.js');
const { getAvatarURL } = require('../utils/discord-utils');
const { haremDescriptionType } = require('../utils/word-things');
const {
    getUser,
    getHarem
} = require('../controller/user.controller');
const { haremReactionController } = require('../controller/game.controller');

const userHarem = async (message) => {
    let user = message.author;

    let hasMention = message.mentions.members.first();
    if (hasMention && !hasMention.user.bot) user = hasMention;

    let player = (await getUser(message.guild.id, user.id)).data;
    let harem = (await getHarem(message.guild.id, user.id, null)).data;

    return {
        user,
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
    name: 'harem', // todo: enviar al dm?
    category: 'Waifu',
    description: 'Muestra tus artes y personajes reclamdos.',
    usage: '[opcional: página] @mención', // página => posición?
    cooldown: 3,
    async execute (message, args, bot) {
        let { user, player, harem } = await userHarem(message);
        if (harem.length < 1) return message.reply('no hay ninguna waifu reclamada!'); // hacer un tutorial? todo: tutorial o mensaje más claro
        let page = userInputPosition(parseInt(args), harem.length);

        let embed = new MessageEmbed()
            .setColor(player.harem.color)
            .setAuthor({
                name: player.harem.title,
                iconURL: getAvatarURL(user) // has a bug: if you mention someone it will crash (mention has different values)
            })
            .setDescription(haremDescriptionType({
                id: harem[page].metadata.id,
                type: harem[page].metadata.type,
                domain: harem[page].metadata.domain,
                name: harem[page]?.character.name,
                anime: harem[page]?.character.anime,
                gender: harem[page]?.character.gender
            }))
            .setImage(harem[page].metadata.url)
            .setFooter({
                text: `${page + 1}/${harem.length}`
            })
            .setTimestamp(harem[page].updatedAt);

        message.channel.send({
            embeds: [embed]
        }).then(async msg => {
            await haremReactionController({
                message,
                msg,
                embed,
                harem,
                page
            }, ["DOUBLE_LEFT", "LEFT", "RIGHT", "DOUBLE_RIGHT"]);
        });
	}
};
