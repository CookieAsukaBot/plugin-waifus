const {MessageEmbed} = require('discord.js');
const {getAvatarURL} = require('../utils/discord-utils');
const {getRandomHeart} = require('../utils/random-things');
const {formatedClaimType} = require('../utils/word-things');
const {getCountdownInSeconds} = require('../utils/time-things');
const {
	userCanRoll,
	userUseRoll,
	getRandomRoll,
	getClaimOwner,
} = require('../controller/game.controller');
const {claim} = require('../controller/user.controller');

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
    name: 'waifu',
    category: 'Waifu',
    description: 'Obtiene aleatoriamente un personaje o un arte.',
    aliases: ['w', 'waifus'],
    cooldown: 1,
    async execute (message, args, bot) {
		// Comprobar si puede tirar
		let canRoll = await userCanRoll(message.guild.id, message.author.id, message.author.username);
		if (canRoll.status == false) return message.channel.send(canRoll.message);

		// Autoroll: previene la duplicación de rolls en caso de que se utilicen ambos comandos
		let uuid = message.guild.id + message.author.id;
		if (bot?.waifus?.blacklist[uuid]?.uuid == uuid) return message.channel.send(`¡**${message.author.username}**, __no__ puedes usar el comando __ahora mismo__!\nEspera a que terminen tus rolls.`);

		// Generar roll
		let model = await getRandomRoll(message.guild.id);
		if (model.message == "API_ERROR") return message.channel.send('Ocurrió un error con la API, vuelve a intentarlo.');
		await userUseRoll(message.guild.id, message.author.id);
		model = model.data;

		if (canRoll.message.length > 0) model.description = `${model.description}\n\n${canRoll.message}`;

		let embed = new MessageEmbed()
			.setDescription(model.description.toString() + `\nVence: <t:${getCountdownInSeconds(60)}:R>`)
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
				name: `Random ${formatedClaimType(model.type, model.gender, true)} para ${message.author.username}`,
				iconURL: getAvatarURL(message.author)
			});
		}

		// Comprobar si es un deseo
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
			await msg.react(getRandomHeart()); // todo: random heart opcional? A base de configuración del usuario.

			let collector = await msg.createReactionCollector({
				filter: (reaction, user) => user.id !== message.client.user.id,
				time: 60 * 1000, // wip: se vence en el tiempo que tiene el servidor de configuración.
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
}
