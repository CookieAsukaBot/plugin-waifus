const { MessageEmbed } = require('discord.js');
const { getAvatarURL } = require('../utils/discord-utils');
const { getUser, getHaremCount } = require('../controller/user.controller');
const { getCooldowns } = require('../controller/guild.controller');

const userInfo = (player) => {
    let canClaim = player.fun.canClaim ? `Puedes reclamar: **Sí** ✅` : `Puedes reclamar: **No** ❌`;
    return `Rolls restantes: **${player.fun.rolls}** 🎲\n${canClaim}`
};

const haremInfo = (harem) => { // todo: mostrar por género?
    return `Waifus: **${harem.characters}** 💞\nArtes: **${harem.arts}** 🎨`;
};

const guildInfo = (cooldowns) => {
    return `Siguientes: ⏰\n**Rolls**: ${cooldowns.data.rolls}. 🎲\n**Reclamación**: ${cooldowns.data.claims}. 💖`;
};

module.exports = {
    name: 'timeup',
    category: 'Waifu',
    description: 'Muestra cuándo son los siguientes reinicios.',
    aliases: ['tu', 'reinicios', 'rolls', 'roll'],
    cooldown: 3,
    async execute (message) {
        let player = (await getUser(message.guild.id, message.author.id)).data;
        let harem = (await getHaremCount(message.guild.id, message.author.id)).data;
        let cooldowns = await getCooldowns(message.guild.id);
        if (cooldowns.status == false) return message.reply(cooldowns.message);

        let msg = `${userInfo(player)}\n\n${haremInfo(harem)}\n\n${guildInfo(cooldowns)}`;

        let embed = new MessageEmbed()
            .setColor(player.harem.color)
            .setAuthor({
                name: `Estado de ${message.author.username}`,
                iconURL: getAvatarURL(message.author)
            })
            .setDescription(msg);

        message.channel.send({
            embeds: [embed]
        });
	}
};
