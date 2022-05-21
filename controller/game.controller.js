const status = require('../helpers/status');
const User = require('../models/user');
const { MessageEmbed } = require('discord.js');
const { getUser, divorce } = require('../controller/user.controller');
const { fetchUserByID, getAvatarURL } = require('../utils/discord-utils');
const { getRandomNumber, getRandomArrayItem } = require('../utils/random-things');
const { haremDescriptionType } = require('../utils/word-things');

const anilist = require('../api/anilist');
const booru = require('../api/booru');

/**
 * Comprueba si el usuario existe y puede tirar.
 * También retorna un mensaje si al jugador le quedan 2 rolls disponibles.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario.
 */
const userCanRoll = async (guild, userID) => {
    let player = await getUser(guild, userID);
    if (player.status == false) return status.failed("Ocurrió un error al encontrar tu usuario.");
    player = player.data;

    try {
        let message = "";
        if (player.fun.rolls < 1) return status.failed(`<@${userID}>, no tienes rolls disponibles!\nEl reinicio es [placeholder].`);
        if (player.fun.rolls == 3) message = `⚠ quedan **2** rolls ⚠`;
        return status.success(message, null);
    } catch (error) {
        console.error(error);
        status.failed("DB_ERROR");
    };
};

/**
 * Actualiza el usuario (su estadística y rolls disponibles).
 * 
 * @param {String} guild ID del servidor.
 * @param {*} userID ID del usuario.
 */
const userUseRoll = async (guild, userID) => {
    try {
        await User.updateOne({
            guild,
            id: userID
        }, {
            $inc: {
                "fun.rolls": -1,
                "stats.rolls.count": 1
            }
        });
    } catch (error) {
        console.error(error);
        status.failed("DB_ERROR");
    };
};

/**
 * Genera un número aleatorio, después base al número se elige una función de una API.
 * 
 * @param {String} guild ID del servidor.
 * @returns retorna el módelo obtenido (ej.: arte o personaje)
 */
const getRandomRoll = async (guild) => {
    try {
        let Seed = getRandomNumber(1, 2);
        let model = null;

        switch (Seed) {
            case 1:
                model = await anilist.getRandomAnilist(guild);
                break;
            case 2:
                model = await booru.getRandomDanbooru(guild);
                break;
            default:
                break;
        };

        // workaround?: si no tiene id retorna un error. el usuario ocupará un feedback ("Ocurrió un error con la API. Vuelve a intentarlo").
        if (!model.data) return status.failed("API_ERROR");
        return status.success("SUCCESS", model.data);
    } catch (error) {
        console.error(error);
        status.failed("BOT_ERROR");
    };
};

/**
 * Datos para el embed.
 * wip: renombrar variable
 * 
 * @param {String} guild ID del servidor.
 * @param {Object} bot módelo del bot para obtener datos.
 * @param {String} id ID del dueño (usuario).
 * @returns retorna un Object con username, avatarURL y color del harem.
 */
const getClaimOwner = async (guild, bot, id) => {
    let player = (await getUser(guild, id)).data;
    let user = await fetchUserByID(bot, id);
    let avatar = getAvatarURL(user);
    return {
        username: user.username,
        avatarURL: avatar,
        color: player.harem.color
    };
};

/**
 * Genera un controlador para el harem.
 * 
 * @param {Object} data requiere de los siguientes campos: { message, msg, embed, harem }.
 * @param {Array} reactions se requiere de un array. Ej. de uso: ["LEFT", "RIGHT"]
 */
const haremReactionController = async (data, reactions) => {
    let {
        message,
        msg,
        embed,
        harem,
        page
    } = data;

    // wip: Esta función debería ser más general
    let settings = {
        collectorDuration: 240, // (segundos) 4 minutos
        toDoubleArrow: 30, // Necesita un harem de 30 para agregar flechas dobles
        jumpInDouble: 10
    };

    let actions = {
        "LEFT": {
            emoji: '⬅',
            requirement: harem.length > 1 // default is: true
        },
        "RIGHT": {
            emoji: '➡',
            requirement: harem.length > 1
        },
        "DOUBLE_LEFT": {
            emoji: '⏪',
            requirement: harem.length >= settings.toDoubleArrow
        },
        "DOUBLE_RIGHT": {
            emoji: '⏩',
            requirement: harem.length >= settings.toDoubleArrow
        },
        "DIVORCE": {
            emoji: '🗑',
            requirement: harem.length > 1
        },
        "GIFT": {
            emoji: '🎁',
            requirement: harem.length > 1
        },
    };
    let cache = {};
    let haremSize = harem.length;

    // Agregar reacciones
    reactions.map(async reaction => {
        if (actions[reaction] && actions[reaction].requirement) {
            cache[`${actions[reaction].emoji}`] = actions[reaction];
            await msg.react(actions[reaction].emoji);
        };
    });

    const readReaction = reaction => {
        let emoji = cache[reaction]?.emoji;
        if (emoji === undefined) return;
        return cache[reaction].emoji;
    };

    // Collector
    let collector = await msg.createReactionCollector({
        filter: (reaction, user) => readReaction(reaction.emoji.name) && user.id !== message.client.user.id,
        idle: settings.collectorDuration * 1000, // se multiplica por 1 segundo
    });

    collector.on('collect', async (reaction, user) => {
        switch (reaction.emoji.name) {
            case '⬅':
                --page;
                if (page <= -1) page = haremSize - 1;
                break;
            case '➡':
                ++page;
                if (page > haremSize - 1) page = 0;
                break;
            case '⏪':
                page = page - settings.jumpInDouble;
                if (page <= -1) page = haremSize;
                break;
            case '⏩':
                page = page + settings.jumpInDouble;
                if (page > haremSize) page = 0;
                break;
            case '🗑':
                if (user.id === message.author.id) {
                    await divorceReactionController({
                        message,
                        settings, // globalizarlo
                        guild: message.guild.id,
                        userID: message.author.id,
                        claim: harem[page],
                    });
                    await collector.stop();
                } else {
                    return;
                };
                break;
            case '🎁':
                if (user.id === message.author.id) {
                    await giftReactionController();
                    await collector.stop();
                } else {
                    return;
                };
                break;
            case '❌':
                // La marca podría funcionar como elegir multiples claims para divorciar/regalar
                break;
        };

        // Editar embed
        embed.setDescription(haremDescriptionType({
            id: harem[page].metadata.id,
            type: harem[page].metadata.type,
            domain: harem[page].metadata.domain,
            name: harem[page]?.character.name,
            anime: harem[page]?.character.anime,
            gender: harem[page]?.character.gender
        }));
        embed.setImage(harem[page].metadata.url);
        embed.setFooter({
            text: `${harem[page].user.position}/${haremSize}`
        });

        msg.edit({
            embeds: [embed]
        });
    });
    collector.on('end', async () => await msg.reactions.removeAll());
};

/**
 * Genera un controlador para el divorcio.
 * 
 * @param {Object} data 
 */
const divorceReactionController = async (data) => {
    let {
        message,
        settings,
        guild,
        userID,
        claim
    } = data;

    let messages = [ // todo: seprar esto en un settings/config.json
        "¿Estás segura de querer el **divorcio**?",
        "¿Estás seguro de querer el **divorcio**?",
        "¿Quieres **divorciarte**?",
        "¿Aceptas el **divorcio**?"
    ];

    let successGifs = [
        'https://c.tenor.com/KuqLqBEfs6AAAAAC/huevos-a-huevo.gif',
    ];

    let embed = new MessageEmbed()
        .setColor('GREEN')
        .setAuthor({
            name: `Felicidades, ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setDescription(`Te has divorciado\n${claim.metadata.domain} | ${claim.metadata.id}`)
        .setThumbnail(`${claim.metadata.url}`)
        .setImage(getRandomArrayItem(successGifs))
        .setFooter({
            text: `❗ Utiliza ${process.env.BOT_PREFIX}harem para volver a mirar tu lista` // mostrar otra información
        });

    message.reply(getRandomArrayItem(messages))
        .then(async msg => {
            await msg.react('✅');
            await msg.react('❌');

            let collector = await msg.createReactionCollector({
                filter: (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id,
                idle: settings.duration * 1000
            });

            collector.on('collect', async (reaction) => {
                switch (reaction.emoji.name) {
                    case '✅':
                        message.channel.send({ embeds: [embed] });
                        await divorce(guild, userID, claim.id);
                        break;
                    case '❌':
                        msg.edit(`~~${msg.content}~~`);
                        await collector.stop();
                        break;
                };
            });
        });
};

/**
 * Genera un controlador para el regalo.
 * 
 * @param {Object} data 
 */
const giftReactionController = async (data) => {
    console.log('Regalo a ${data.mention.username}');
};

module.exports = {
    userCanRoll,
    userUseRoll,
    getRandomRoll,
    getClaimOwner,
    haremReactionController,
    divorceReactionController,
    giftReactionController,
};
