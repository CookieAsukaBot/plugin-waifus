const axios = require('axios');
const { getRandomNumber, getRandomNumbers } = require('../utils/random-things');

const url = 'https://graphql.anilist.co';

// anilistRandomCharacter
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
