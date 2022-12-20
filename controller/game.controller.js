const status = require('../helpers/status');
const {MessageEmbed} = require('discord.js');
const User = require('../models/user');
const {getUser,gift,divorce} = require('../controller/user.controller');
const {getCooldowns} = require('../controller/guild.controller');
const Wish = require('../controller/wish.controller');
const {fetchUserByID,getAvatarURL} = require('../utils/discord-utils');
const {getRandomNumber,getRandomArrayItem} = require('../utils/random-things');
const {haremDescriptionType} = require('../utils/word-things');
const settings = require('../config.json');

const anilist = require('../api/anilist');
const booru = require('../api/booru');

/**
 * Comprueba si el usuario existe y puede tirar.
 * También retorna un mensaje si al jugador le quedan 2 rolls disponibles.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario.
 * @param {String} username nombre del usuario.
 */
const userCanRoll = async (guild, userID, username) => {
    let player = await getUser(guild, userID);
    if (player.status == false) return status.failed("Ocurrió un error al encontrar tu usuario.");
    player = player.data;

    try {
        let message = "";

        if (player.fun.rolls < 1) {
            let cooldowns = (await getCooldowns(guild)).data;
            return status.failed(`¡**${username}**, no tienes rolls disponibles!\nEl reinicio es **__${cooldowns.rolls.replaceAll("*", "")}__**.`);
        };
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
        let Seed = getRandomNumber(1, 1000);
        let model = null;
        Seed = 1

        if (Seed >= 1 && Seed <= 5) {
            model = await Wish.getRandomWish(guild); // 0.5%
        } else if (Seed >= 6 && Seed <= 151) {
            model = await anilist.getRandomAnilist(guild); // 15.5%
        } else if (Seed >= 152) {
            model = await booru.getRandomDanbooru(guild); // 84%
        }

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
 * @param {Object} data requiere de los siguientes campos: { message, msg, embed, harem, page }.
 * @param {Array} reactions se requiere de un array. Ej. de uso: ["LEFT", "RIGHT"]
 */
const haremReactionController = async (data, reactions) => {
    let {
        message,
        msg,
        embed,
        harem,
        page,
        random
    } = data;

    let actions = {
        "LEFT": {
            emoji: '⬅',
            requirement: harem.length > 1 // boolean
        },
        "RIGHT": {
            emoji: '➡',
            requirement: harem.length > 1
        },
        "DOUBLE_LEFT": {
            emoji: '⏪',
            requirement: harem.length >= settings.collector.toDoubleArrow
        },
        "DOUBLE_RIGHT": {
            emoji: '⏩',
            requirement: harem.length >= settings.collector.toDoubleArrow
        },
        "DIVORCE": {
            emoji: '🗑',
            requirement: harem.length > 1
        },
        "GIFT": {
            emoji: '🎁',
            requirement: harem.length > 1
        },
        "SELECT": {
            emoji: '❌',
            requirement: harem.length > 1
        },
        "WISH": {
            emoji: '💌',
            requirement: harem.length > 0
        },
        "WISH_REMOVE": {
            emoji: '⭕',
            requirement: harem.length > 0
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
        idle: settings.collector.duration * 1000, // se multiplica por 1 segundo
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
                page = page - settings.collector.jumpInDouble;
                if (page <= -1) page = haremSize - 1;
                break;
            case '⏩':
                page = page + settings.collector.jumpInDouble;
                if (page > haremSize) page = 0;
                break;
            case '🗑':
                if (user.id === message.author.id) {
                    divorceReactionController({
                        message,
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
                    giftReactionController({
                        message,
                        guild: message.guild.id,
                        userID: message.author.id,
                        mention: message.mentions.members.first(),
                        claim: harem[page],
                    });
                    await collector.stop();
                } else {
                    return;
                };
                break;
            case '❌':
                // La marca podría funcionar para elegir multiples claims a divorciar o regalar
                break;
            case '💌':
                // todo: crear un cooldown para evitar el spam de reacciones
                // Agregar
                let wish = await Wish.add(
                    message.guild.id,
                    user.id,
                    harem[page]
                );

                // Responder
                if (wish.status) {
                    return message.channel.send(`💌 ¡**${user.username}**, se agregó **${harem[page]?.character?.name ? harem[page]?.character.name : harem[page].metadata.id}** a tu lista de deseos!`);
                } else {
                    return message.channel.send(`❗ ¡**${user.username}**, ${wish.message}!`);
                }
                break;
            case '⭕':
                // todo: necesita un cooldown por el spam de reacciones
                if (user.id === message.author.id) {
                    let wishRemove = await Wish.remove(
                        message.guild.id,
                        user.id,
                        harem[page].id,
                    );

                    if (wishRemove.status) {
                        return message.channel.send(`⭕ ¡**${message.author.username}**, ${wishRemove.message}!`); // todo: agregar el nombre?
                    } else {
                        return message.channel.send(`❗ ¡**${message.author.username}**, ${wishRemove.message}!`);
                    }
                } else {
                    return;
                }
                break;
        };

        await msg.edit({
            embeds: [editControllerEmbed(embed, harem, haremSize, page, random)]
        });
    });
    collector.on('end', async () => {try{
        await msg.reactions.removeAll();
    }catch(error){}});
};

/**
 * Edita el embed del mensaje.
 * 
 * @param {*} embed 
 * @param {Object} harem 
 * @param {Int} page 
 * @returns retorna el embed editado.
 */
const editControllerEmbed = (embed, harem, haremSize, page, random) => {
    if (random) page = random[page];

    embed.setDescription(haremDescriptionType({
        id: harem[page].metadata.id,
        type: harem[page].metadata.type,
        domain: harem[page].metadata.domain,
        name: harem[page]?.character.name,
        media: harem[page]?.character.media.title,
        gender: harem[page]?.character.gender
    }));
    embed.setImage(harem[page].metadata.url);
    embed.setFooter({
        text: `${page + 1}/${haremSize}`
    })
    embed.setTimestamp(harem[page]?.user?.claimedAt || harem[page]?.createdAt || Date.now);

    return embed;
};

/**
 * Genera un controlador para el divorcio.
 * 
 * @param {Object} data 
 */
const divorceReactionController = (data) => {
    let {
        message,
        guild,
        userID,
        claim
    } = data;

    let embed = new MessageEmbed()
        .setColor('GREEN')
        .setAuthor({
            name: `Felicidades, ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setDescription(`Te has divorciado\n${claim.metadata.domain} | ${claim.metadata.id}`)
        .setThumbnail(`${claim.metadata.url}`)
        .setImage(getRandomArrayItem(settings.divorce.SUCCESS_GIFS))
        .setFooter({
            text: `❗ Utiliza ${process.env.BOT_PREFIX}harem para volver a mirar tu lista`
        });

    message.reply(getRandomArrayItem(settings.divorce.CONFIRM_MESSAGES))
        .then(async msg => {
            let actionTaken = false;
            await msg.react('✅');
            await msg.react('❌');

            let collector = await msg.createReactionCollector({
                filter: (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id,
                idle: settings.collector.duration * 1000
            });

            collector.on('collect', async (reaction) => {
                switch (reaction.emoji.name) {
                    case '✅':
                        await divorce(guild, userID, claim.id);
                        message.channel.send({ embeds: [embed] });
                        actionTaken = true;
                        break;
                    case '❌':
                        msg.edit(`~~${msg.content}~~`);
                        actionTaken = true;
                        await collector.stop();
                        break;
                };
            });

            collector.on('end', () => { try {
                if (!actionTaken) msg.edit(`~~${msg.content}~~\nEl tiempo se agotó.`);
                } catch (error) {};
            });
        });
};

/**
 * Genera un controlador para el regalo.
 * 
 * @param {Object} data 
 */
const giftReactionController = (data) => {
    let {
        message,
        guild,
        userID,
        mention,
        claim
    } = data;

    let embed = new MessageEmbed()
        .setColor('PURPLE')
        .setAuthor({
            name: `Has regalado, ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setDescription(`Tu regalo se entregó a **${mention.user.username}**\n${claim.metadata.domain} | ${claim.metadata.id}`)
        .setThumbnail(`${claim.metadata.url}`)
        .setImage(getRandomArrayItem(settings.gift.SUCCESS_GIFS))
        .setFooter({
            text: `❗ Utiliza ${process.env.BOT_PREFIX}harem para volver a mirar tu lista`
        });
    
    message.reply(`¿Quieres **regalar** a ${mention.user.tag}?\nSe requiere de que **ambos confirmen** el regalo.`)
        .then(async msg => {
            let actionTaken = false;
            await msg.react('✅');
            await msg.react('❌');

            let collector = await msg.createReactionCollector({
                filter: (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id !== message.client.user.id,
                idle: settings.collector.duration * 1000
            });

            let userConfirmations = [];

            collector.on('collect', async (reaction, user) => {
                userConfirmations.push(user.id);

                switch (reaction.emoji.name) {
                    case '✅':
                        if (userConfirmations.includes(userID) && userConfirmations.includes(mention.id)) {
                            await gift(guild, userID, claim.id, mention.id);
                            message.channel.send({ embeds: [embed] });
                            actionTaken = true;
                        };
                        break;
                    case '❌':
                        if (userConfirmations.includes(userID) || userConfirmations.includes(mention.id)) {
                            msg.edit(`~~*${msg.content}*~~\n**Cancelaron** el regalo.`);
                            actionTaken = true;
                            await collector.stop();
                        };
                        break;
                };
            });

            collector.on('end', () => { try {
                if (!actionTaken) msg.edit(`~~${msg.content}~~\nEl tiempo se agotó.`);
                } catch (error) {};
            });
        });

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
