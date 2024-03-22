const {EmbedBuilder,ButtonStyle,ComponentType} = require('discord.js');
const {SlashCommandBuilder,ActionRowBuilder,ButtonBuilder} = require('@discordjs/builders');
const {getAvatarURL} = require('../utils/discord-utils');
const {haremDescriptionType} = require('../utils/word-things');
const {getRandomIndexObject} = require('../utils/random-things');
const {getUser,getHarem} = require('../controller/user.controller');
const {editControllerEmbed} = require('../controller/game.controller');
const {toDoubleArrow,jumpInDouble,duration} = require('../config.json').collector;

const userHarem = async (interaction) => {
    let user = interaction.user;

    let player = (await getUser(interaction.guildId, user.id)).data;
    let harem = (await getHarem(interaction.guildId, user.id, null)).data;

    return {
        user,
        player,
        harem
    }
}

const userInputPosition = (page, haremSize) => {
    if (!page || isNaN(page) || page <= 0) {
        page = 0;
    } else {
        --page;
    }

    if (page >= haremSize) page = haremSize - 1;
    return page;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('harem')
		.setDescription('Muestra tus reclamaciones.')
        .addStringOption(option =>
            option.setName('page')
                .setDescription("Ingresa el número al que quieres saltar.")
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Mostrar el harem de...'))
        .addBooleanOption(option =>
            option.setName('random')
                .setDescription("El harem tendrá un orden aleatorio.")
                .setRequired(false)
        ),
	async execute(interaction) {
        // Inputs
        let argsClaimIndex = parseInt(interaction.options.getString('page'));
        let random = interaction.options.getBoolean('random');
        let targetUser = interaction.options.getUser('user');
        if (targetUser) interaction.user = targetUser;
        // Search & Load
        let {user,player,harem} = await userHarem(interaction);
        let page = userInputPosition(parseInt(argsClaimIndex), harem.length);
        let haremSize = harem.length;

        if (haremSize < 1) return interaction.reply('No se encontró ninguna reclamación.'); // todo: añadir tutorial
        if (random) random = getRandomIndexObject(harem.length);

        // Embed
        let embed = new EmbedBuilder()
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
                media: harem[page]?.character.media.title,
                gender: harem[page]?.character.gender
            }))
            .setImage(harem[page].metadata.url)
            .setFooter({
                text: `${page + 1}/${haremSize}`
            })
            .setTimestamp(harem[page].user.claimedAt);

        // Buttons
        let row = new ActionRowBuilder();

        if (haremSize >= toDoubleArrow) row.addComponents(
            new ButtonBuilder({ style: ButtonStyle.Primary })
                .setCustomId('DOUBLE_LEFT')
                .setEmoji({ name: '⏪' })
        )
        if (haremSize > 1) {
            row.addComponents(
                new ButtonBuilder({ style: ButtonStyle.Primary })
                    .setCustomId('LEFT')
                    .setEmoji({ name: '⬅' })
            )
            row.addComponents(
                new ButtonBuilder({ style: ButtonStyle.Primary })
                    .setCustomId('RIGHT')
                    .setEmoji({ name: '➡' })
            );
        }
        if (haremSize >= toDoubleArrow) row.addComponents(
            new ButtonBuilder({ style: ButtonStyle.Primary })
                .setCustomId('DOUBLE_RIGHT')
                .setEmoji({ name: '⏩' })
        );

        // Responder
        const message = await interaction.reply({
            embeds: [embed],
            components: [row]
        });

        // Collectors
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: duration * 1000 // se multplica por 1 segundo
        });

        collector.on('collect', async i => {
            try {
                // if (i.user.id !== interaction.user.id) return; // only self user, maybe an user option?

                if (i.customId === 'LEFT') {
                    --page;
                    if (page <= -1) page = haremSize - 1;
                } else if (i.customId === 'RIGHT') {
                    ++page;
                    if (page > haremSize - 1) page = 0;
                } else if (i.customId === 'DOUBLE_LEFT') {
                    page = page - jumpInDouble;
                    if (page <= -1) page = haremSize - 1;
                } else if (i.customId === 'DOUBLE_RIGHT') {
                    page = page + jumpInDouble;
                    if (page > haremSize) page = 0;
                }
    
                await i.update({
                    embeds: [editControllerEmbed(embed, harem, haremSize, page, random)],
                    components: [row]
                })
            } catch (error) {}
        });

        collector.on('end', collected => {
            try {
                interaction.editReply({
                    embeds: [editControllerEmbed(embed, harem, haremSize, page)],
                    components: []
                });
            } catch (error) {}
        });
	},
}
