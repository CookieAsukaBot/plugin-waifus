const axios = require('axios');
const status = require('../helpers/status');
const {getRandomNumber,getRandomNumbers} = require('../utils/random-things');
const {findClaim} = require('../controller/user.controller');

const url = 'https://graphql.anilist.co';

/**
 * Nota:
 * 
 * Las funciones que hacen peticiones directas a la API de prefijo empiezan con anilist,
 * mientras que las que tienen el prefijo get son llamadas interntas para el BOT.
 * 
 * 
 * posibles todo:
 * - Se podría agregar "module.exports = función" para diferenciar más rápido y fácil.
 * - Nombres más claros para las funciones.
 */

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
                favourites
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
    }

    // Petición
    let res = await axios.post(url, payload);
    let characters = res.data.data.Page.characters;

    if (characters.length == 0) return status.failed("NOT_FOUND");

    // Devolver
    let character = characters[getRandomNumber(0, parseInt(characters.length / getRandomNumber(2, 3)))];

    return status.success("SUCCESS", character);
}

/**
 * Busca personajes y devuelve la lista con los más populares.
 * 
 * @param {String} search se requiere de un texto para buscar.
 * @returns 
 */
const anilistFindCharacter = async (search) => {
    let query = `
    query ($page:Int = 1 $id:Int $search:String $sort:[CharacterSort]=[FAVOURITES_DESC]) {
        Page (page:$page, perPage:10) {
            pageInfo {
            perPage
        }
        characters (id:$id search:$search sort:$sort) {
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
        page: 1,
        search: search,
        sort: "SEARCH_MATCH"
    }

    let payload = {
        query,
        variables
    }

    // Petición
    let res = await axios.post(url, payload);
    let characters = res.data.data.Page.characters;

    if (characters.length == 0) return status.failed("NOT_FOUND");

    return status.success("SUCCESS", characters);
}

/**
 * Busca un anime y devuelve la lista de los personajes más populares con el anime más popular.
 * 
 * @param {String} search se requiere de un texto para buscar.
 * @returns 
 */
const anilistAnimeCharacters = async (search) => {
    let query = `
    query ($page:Int $id:Int $search:String) {
        Page (page:$page, perPage:15) {
            pageInfo {
            perPage
        }
        media (id:$id search:$search sort:POPULARITY_DESC) {
          id
          title {
            romaji
          }
          characters (sort:FAVOURITES_DESC) {
            edges {
              node {
                favourites
                id
                image {
                  large
                }
                name {
                    full
                }
                gender
              }
            }
          }
        }
      }
    }
`;

    let variables = {
        "page": 1,
        "search": search
    }

    let payload = {
        query,
        variables
    }

    // Petición
    let res = await axios.post(url, payload);
    let anime = res.data.data.Page.media[0];
    let characters = res.data.data.Page.media[0].characters.edges;

    if (characters.length == 0) return status.failed("NOT_FOUND");

    return status.success("SUCCESS", {
        anime,
        characters
    });
}

/**
 * Obtiene un personaje aleatorio.
 * 
 * @param {String} guild ID del servidor, para comprobar si hay una reclamación.
 */
const getRandomAnilist = async (guild) => {
    try {
        let res = await anilistRandomCharacter();
        let character = res.data;

        // WIP: comprobar character
        // Se necesita una manera de comprobar que la API ha dado un error, no ha encontrado el personaje o no está disponible.
        // if (res.status == false) return status.failed("API_ERROR");

        let model = {
            domain: "anilist.co",
            id: character.id,
            media: {
                id: character.media.edges[0].id,
                title: character.media.edges[0].node.title.romaji
            },
            name: character.name.full,
            gender: character.gender,
            url: character.image.large,
            description: '',
            type: "CHARACTER",
            owner: false
        }

        model.description += `**${model.name}**`;
        model.description += `\n${model.media.title}`;

        let isClaimed = await findClaim(guild, model.domain, model.id);
        if (isClaimed.message == "FOUND") model.owner = isClaimed.data.user.id;

        return status.success("SUCCESS", model);
    } catch (error) {
        console.error(error);
        return status.failed("API_ERROR");
    }
}

// todo: const getRandomWish ? | anilistFindCharacter(wish.character.name)[0] o wish.metadata.id[0]

/**
 * Obtiene una lista de personajes a base de una búsqueda por nombres de personajes.
 * 
 * @param {String} search nombre del personaje
 * @returns harem
 */
const getCharacter = async (search) => {
    try {
        let find = await anilistFindCharacter(search);

        if (find.status == false) {
            return status.failed("no se encontró ningún personaje");
        }

        let characters = find.data;
        let asHarem = [];

        characters.forEach(character => {
            let asModel = {
                metadata: {
                    id: character.id,
                    type: "CHARACTER",
                    domain: "anilist.co",
                    url: character.image.large
                },
                character: {
                    name: character.name.full,
                    gender: character.gender, // todo: gender
                    media: {
                        id: character.media.edges[0].id,
                        title: character.media.edges[0].node.title.romaji
                    }
                }
            }

            asHarem.push(asModel);
        });

        return status.success("SUCCESS", asHarem);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Obtiene una lista de personajes a base de la búsqueda por nombre de un anime.
 * 
 * @param {String} search nombre del anime
 * @returns harem
 */
const getAnimeCharacters = async (search) => {
    try {
        let find = await anilistAnimeCharacters(search);

        if (find.status == false) {
            return status.failed("no se encontró ningún anime");
        }

        let anime = find.data.anime; // todo: en esta variable también guarda .characters, es redundante
        let characters = find.data.characters;
        let asHarem = [];

        characters.forEach(character => {
            character = character.node

            let asModel = {
                metadata: {
                    id: character.id,
                    type: "CHARACTER",
                    domain: "anilist.co",
                    url: character.image.large
                },
                character: {
                    name: character.name.full,
                    gender: character.gender, // todo: gender
                    media: {
                        id: character.id,
                        title: anime.title.romaji
                    }
                }
            }

            asHarem.push(asModel);
        });

        return status.success("SUCCESS", asHarem);
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    anilistRandomCharacter,
    getRandomAnilist,
    getCharacter,
    getAnimeCharacters,
}
