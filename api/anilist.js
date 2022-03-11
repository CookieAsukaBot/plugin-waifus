const axios = require('axios');
const status = require('../helpers/status');
const { getRandomNumber, getRandomNumbers } = require('../utils/random-things');
const userCtrl = require('../controller/user.controller');

const url = 'https://graphql.anilist.co';

/**
 * Hace una petición a la API con números aleatorios y toma 1 objeto del array dividido a la mitad.
 * El array que devuelve la API está ordenado por popularidad, al dividirlo se obtiene solo "la mejor rareza".
 * 
 * @throws {Boolean} devuelve false si no encuentra nada.
 */
const anilistRandomCharacter = async () => {
    let query = `
    query ($ids : [Int]) {
        Page(page: 1, perPage: 25) {
            characters(id_in: $ids, sort:FAVOURITES_DESC) {
                id
                name {
                    full
                }
                image {
                    large
                }
                gender
                media (perPage: 1, sort:POPULARITY_DESC) {
                    edges {
                        id
                        node {
                            title {
                                romaji
                            }
                        }
                    }
                }
            }
        }
    }
    `;

    let variables = {
        ids: getRandomNumbers(12, 1, 246844)
    };

    let payload = {
        query,
        variables
    };

    // Petición
    let res = await axios.post(url, payload);
    let characters = res.data.data.Page.characters;

    if (characters.length == 0) return status.failed("NOT_FOUND");

    // Devolver
    let character = characters[getRandomNumber(1, parseInt(characters.length / 2))];
    return status.success("SUCCESS", character);
};

// anilistAnimeCharacter
// anilistAnimeCharacters

/**
 * @param {String} guild ID del servidor, para comprobar si hay una reclamación.
 */
const getRandomAnilist = async (guild) => {
    try {
        const character = await anilistRandomCharacter();

        // WIP: comprobar character
        // if (!character) return status.failed("NOT_FOUND");

        let model = {
            domain: "anilist.co",
            id: character.id,
            anime: character.media.edges[0].node.title.romaji,
            name: character.name.full,
            gender: character.gender || null,
            url: character.image.large,
            description: '',
            type: "CHARACTER",
            owner: false
        };

        model.description += `**${model.name}**`;
        model.description += `\n${model.anime}`;

        let isClaimed = await userCtrl.isClaimed(guild, model.domain, model.id);
        if (isClaimed.message == "FOUND") model.owner = isClaimed.data.user.id;

        return status.success("SUCCESS", model);
    } catch (error) {
        console.log(error);
        return status.failed("API_ERROR");
    };
};

module.exports = {
    anilistRandomCharacter,
    getRandomAnilist
};
