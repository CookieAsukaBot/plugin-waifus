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
    if (hasMention) user = hasMention;

    let player = (await getUser(message.guild.id, user.id)).data;
    let harem = (await getHarem(message.guild.id, user.id, null)).data; // wip: solo muestra el author

    return {
        user,
        player,
        harem
    };
};

module.exports = {
    name: 'harem', // todo: enviar al dm?
    category: 'Waifu',
    description: 'Muestra tus artes y personajes reclamdos.',
    cooldown: 3,
    async execute (message, args, bot) {
        let page = 0;
        let { user, player, harem } = await userHarem(message);
        if (harem.length < 1) return message.reply('no hay ninguna waifu reclamada!'); // hacer un tutorial? todo: mensaje más claro

        let embed = new MessageEmbed()
            .setColor(player.harem.color)
            .setAuthor({
                name: player.harem.title,
                iconURL: getAvatarURL(user)
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
                text: `1/${harem.length}`
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
            }, ["DOUBLE_LEFT", "LEFT", "RIGHT", "DOUBLE_RIGHT"]);
        });
	}
};
