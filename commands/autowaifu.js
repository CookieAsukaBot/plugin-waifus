const {MessageEmbed} = require('discord.js');
const {getAvatarURL} = require('../utils/discord-utils');
const {getRandomHeart} = require('../utils/random-things');
const {formatedClaimType} = require('../utils/word-things');
const {getCountdownInSeconds,delay} = require('../utils/time-things');
const {
	userCanRoll,
	userUseRoll,
	getRandomRoll,
	getClaimOwner,
} = require('../controller/game.controller');
const {getUser,claim} = require('../controller/user.controller');
const {apis} = require('../config.json');

/**
 * Responde un embed con los metadatos del dueño.
 * 
 * @param {Object} data se requiere de embed, model, message y bot para funcionar.
 * @returns envía un mensaje al servidor con el embed y los metadatos del dueño.
 */
const replyWithAlreadyClaimed = async (data) => {
	let {
		embed,
		model,
		message,
		bot
	} = data;

	model.owner = await getClaimOwner(message.guild.id, bot, model.owner);
	embed.setAuthor({
		name: `${formatedClaimType(model.type, model.gender)} de ${model.owner.username}`,
		iconURL: model.owner.avatarURL
	});
	embed.setColor(model.owner.color);

	return message.channel.send({
		embeds: [embed]
	});
}

/**
 * Muestra el género correctamente en el embed al hacer claim.
 */
let claimedMessage = (type, gender) => {
	if (gender == "Male" || type == "ART") {
		return "reclamado";
	} else {
		return "reclamada";
	}
}

module.exports = {
    name: 'autowaifu',
    category: 'Waifu',
    description: 'Obtiene aleatoriamente personajes y/o artes.',
    aliases: ['aw', 'autoroll'],
    // cooldown: 1,
    async execute (message, args, bot) {        
        // Comprobar si puede tirar
		let canRoll = await userCanRoll(message.guild.id, message.author.id, message.author.username);
		if (canRoll.status == false) return message.channel.send(canRoll.message);

        // todo: probablemente esta comprobación iría mejor en una función que retorne true o false.
        // Seguridad (agregar al usuario en la blacklist)
        let uuid = message.guild.id + message.author.id;
        if (!bot.waifus) bot.waifus = {}
        if (!bot.waifus.blacklist) bot.waifus.blacklist = {}

		if (bot?.waifus?.blacklist[uuid]?.uuid == uuid) return message.channel.send(`¡**${message.author.username}**, __no__ puedes usar el comando __ahora mismo__!\nEspera a que terminen tus rolls.`);

        // agregar
        bot.waifus.blacklist[uuid] = {
            uuid,
            username: message.author.username
        }

        // Cantidad de rolls
        let getRolls = (await getUser(message.guild.id, message.author.id)).data;

        // Por cada roll disponible
        let rolls = getRolls.fun.rolls;
        let times = 0;
        let trys = 0;

        for (times; times < rolls; times++) {
            let model = await getRandomRoll(message.guild.id);
            if (model.message == "API_ERROR") {
                message.channel.send('Ocurrió un error con la API, espera al siguiente roll.');
                times--;
                // Evitar el spam a las APIs.
                trys++;
                if (trys > 6) {
                    times = rolls;
                    delete bot.waifus.blacklist[uuid];
                }
            } else {
                await userUseRoll(message.guild.id, message.author.id);
                model = model.data;
    
                if (canRoll.message.length > 0) model.description = `${model.description}\n\n${canRoll.message}`;
    
                let embed = new MessageEmbed()
                    .setDescription(model.description.toString() + `\nVence: <t:${getCountdownInSeconds(80)}:R>`)
                    .setImage(model.url)
                    .setFooter({
                        text: `${model.domain} | ${model.id}`
                    });
    
                // Comprobar si tiene dueño
                if (model.owner !== false) {
                    return await replyWithAlreadyClaimed({
                        embed,
                        model,
                        message,
                        bot
                    });
                } else {
                    embed.setColor(process.env.BOT_COLOR);
                    embed.setAuthor({
                        name: `Random ${formatedClaimType(model.type, model.gender, true)} para ${message.author.username} (${times + 1}/${rolls})`,
                        iconURL: getAvatarURL(message.author)
                    });
                }
    
                // Comprobar si es un deseo
                // todo: probablemente esta comprobación iría mejor en una función
                let sendContentMessage = {}
                if (model.wish) {
                    warning = "🎁 Apareció un **deseo** para: ";
                    model.wish.ids.forEach(ping =>
                        warning += `<@${ping}> `);

                    warning.trim();

                    sendContentMessage = {
                        content: warning,
                        embeds: [embed]
                    }
                } else {
                    sendContentMessage = {
                        embeds: [embed]
                    }
                }
    
                // Reacción + reclamación
                message.channel.send(sendContentMessage).then(async msg => {
                    await msg.react(getRandomHeart()); // todo: random heart (opcional)
    
                    let collector = await msg.createReactionCollector({
                        filter: (reaction, user) => user.id !== message.client.user.id,
                        time: 80 * 1000, // todo: tiempo a base de la configuración del servidor
                    });
    
                    collector.status = {
                        claimed: false,
                        user: null
                    }
    
                    collector.on('collect', async (reaction, user) => {
                        let tryClaim = await claim(message.guild.id, user.id, user.username, model);
                        if (tryClaim.status == false) {
                            return message.channel.send(tryClaim.message);
                        } else if (tryClaim.status == true) {
                            collector.status.claimed = true;
                            collector.status.user = user;
                            await collector.stop();
                        }
                    });
    
                    collector.on('end', async collected => {
                        if (collector.status.claimed == true) {
                            let claimedBy = await getClaimOwner(message.guild.id, bot, collector.status.user.id);
    
                            // Actualizar embed
                            embed.setColor(claimedBy.color);
                            embed.setAuthor({
                                name: `${formatedClaimType(model.type, model.gender)} ${claimedMessage(model.type, model.gender)} por ${claimedBy.username}`,
                                iconURL: claimedBy.avatarURL
                            });
                            embed.setDescription(model.description.toString());
    
                            await msg.edit({ embeds: [embed] });
                            await msg.reply({
                                content: `💖 ¡**${claimedBy.username}** reclamó su ${formatedClaimType(model.type, model.gender)}! 💖` // todo: ¿mensaje personalizable por el usuario?
                            });
                        }
                    });
                });
            }

            // Por cada ciclo esperar (ms)
            await delay(apis.autowaifu.cooldown);

            // Remover al usuario de la blacklist temporal
            if (times + 1 == rolls) {
                delete bot.waifus.blacklist[uuid];
            }
        }
	}
}
