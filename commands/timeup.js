const { MessageEmbed } = require('discord.js');
const { getUser } = require('../controller/user.controller');
const { getCooldowns } = require('../controller/guild.controller');

module.exports = {
    name: 'timeup',
    category: 'Waifu',
    description: 'Muestra cuándo son los siguientes reinicios.',
    aliases: ['tu', 'reinicios', 'rolls', 'roll'],
    cooldown: 3,
    async execute (message) {
        let player = (await getUser(message.guild.id, message.author.id)).data;
        let cooldowns = await getCooldowns(message.guild.id);
        if (cooldowns.status == false) return message.reply(cooldowns.message);

        let msg = `**Rolls**: ${cooldowns.data.rolls}. 🎲\n**Reclamación**: ${cooldowns.data.rolls}. 💖`;

        let embed = new MessageEmbed()
            .setColor(player.harem.color)
            .setAuthor({
                name: '♻️ Próximos reinicios'
            })
            .setDescription(msg);

        message.channel.send({
            embeds: [embed]
        });
	}
};
