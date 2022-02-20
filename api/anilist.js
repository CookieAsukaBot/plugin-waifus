const axios = require('axios');
const { getRandomNumber, getRandomNumbers } = require('../utils/random-things');

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

    if (characters.length == 0) return false;

    // Devolver
    let character = characters[getRandomNumber(1, parseInt(characters.length / 2))];
    return character;
};

// anilistAnimeCharacter
// anilistAnimeCharacters

module.exports = {
    anilistRandomCharacter
};
